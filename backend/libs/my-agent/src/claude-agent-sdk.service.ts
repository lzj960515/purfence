import { Injectable, Logger } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SocketService } from './socket.service';
import type {
  Options,
  SDKResultMessage,
  Query,
  SDKMessage,
  SDKSystemMessage,
  SDKAssistantMessage,
  SDKUserMessage,
} from '@anthropic-ai/claude-agent-sdk';

/**
 * 执行错误信息
 */
export interface ExecutionErrorInfo {
  /** 错误消息 */
  message: string;
  /** 错误类型 */
  type: 'conversation_not_found' | 'unknown';
  /** 是否进行了重试 */
  retried: boolean;
  /** 重试是否成功 */
  retrySuccess: boolean;
  /** 原始 sessionId */
  originalSessionId: string;
  /** 新的 sessionId（如果重试了） */
  newSessionId?: string;
}

/**
 * 增强的执行结果
 */
export interface EnhancedExecutionResult {
  /** SDK 原始结果 */
  result: SDKResultMessage;
  /** 错误信息（如果有） */
  error?: ExecutionErrorInfo;
}

/**
 * 回调函数类型：用于更新 execution 的 sessionId
 */
export type UpdateSessionIdCallback = (newSessionId: string) => Promise<void>;

// 动态加载 SDK（ESM only）
async function loadSDK() {
  const candidates = resolveSdkEntries();

  for (const candidate of candidates) {
    if (!candidate || !fs.existsSync(candidate)) continue;
    const moduleUrl = pathToFileURL(candidate).href;
    const mod = await eval(`import(${JSON.stringify(moduleUrl)})`);
    if (mod?.query) {
      return { query: mod.query };
    }
  }

  const { query } = await eval(`import('@anthropic-ai/claude-agent-sdk')`);
  return { query };
}

function resolveSdkEntries(): string[] {
  const envEntry = process.env.PURFENCE_CLAUDE_AGENT_SDK_ENTRY?.trim();
  const envDir = process.env.PURFENCE_CLAUDE_AGENT_SDK_DIR?.trim();
  const execDir = path.dirname(process.execPath);
  const cwd = process.cwd();

  return [
    envEntry,
    envDir ? path.join(envDir, 'sdk.mjs') : undefined,
    path.join(execDir, 'claude-agent-sdk', 'sdk.mjs'),
    path.resolve(execDir, '..', 'Resources', 'binaries', 'claude-agent-sdk', 'sdk.mjs'),
    path.resolve(execDir, '..', 'resources', 'binaries', 'claude-agent-sdk', 'sdk.mjs'),
    path.resolve(cwd, 'src-tauri', 'binaries', 'claude-agent-sdk', 'sdk.mjs'),
  ].filter((value): value is string => Boolean(value));
}

/** "No conversation found" 错误的匹配模式 */
const CONVERSATION_NOT_FOUND_PATTERN =
  /No conversation found with session ID:/i;

/**
 * Claude Agent SDK Service
 * 封装 @anthropic-ai/claude-agent-sdk，提供 NestJS 集成
 */
@Injectable()
export class ClaudeAgentSdkService {
  private readonly logger = new Logger(ClaudeAgentSdkService.name);

  /**
   * 执行 Claude Agent 任务，返回增强结果（包含错误信息和重试状态）
   */
  async executeClaudeAgent({
    prompt,
    resume,
    threadId,
    sessionId,
    callId,
    cwd,
    systemPrompt,
    env,
    onSessionIdUpdate,
  }: {
    prompt: string;
    resume: boolean;
    threadId: string;
    sessionId: string;
    callId: string;
    cwd?: string;
    systemPrompt?: string;
    env?: Record<string, string>;
    /** 当 sessionId 更新时的回调（用于更新 execution） */
    onSessionIdUpdate?: UpdateSessionIdCallback;
  }): Promise<EnhancedExecutionResult> {
    // 记录原始 sessionId
    const originalSessionId = sessionId;

    // 第一次执行
    const { result, conversationNotFoundError } =
      await this.executeClaudeAgentInternal({
        prompt,
        resume,
        threadId,
        sessionId,
        callId,
        cwd,
        systemPrompt,
        env,
      });

    // 如果没有 "conversation not found" 错误，直接返回结果
    if (!conversationNotFoundError) {
      return { result };
    }

    this.logger.warn(
      `Conversation not found with session ID: ${sessionId}, will retry with new session`,
    );

    // 生成新的 sessionId 并重试
    const newSessionId = crypto.randomUUID();
    this.logger.log(
      `Retrying with new sessionId: ${newSessionId} (original: ${originalSessionId})`,
    );

    // 调用回调更新 execution 的 sessionId
    if (onSessionIdUpdate) {
      try {
        await onSessionIdUpdate(newSessionId);
        this.logger.log(`Updated execution sessionId to: ${newSessionId}`);
      } catch (err) {
        this.logger.error(`Failed to update execution sessionId: ${err}`);
        // 即使更新失败也继续重试，因为主要目标是完成任务
      }
    }

    // 使用新 sessionId 重试（resume=false，因为是新会话）
    const retryResult = await this.executeClaudeAgentInternal({
      prompt,
      resume: false, // 新会话不需要 resume
      threadId,
      sessionId: newSessionId,
      callId,
      cwd,
      systemPrompt,
      env,
    });

    // 如果重试后仍然有 conversation not found 错误，说明有其他问题
    if (retryResult.conversationNotFoundError) {
      this.logger.error(
        `Retry failed: Conversation still not found with new sessionId: ${newSessionId}`,
      );

      return {
        result: retryResult.result,
        error: {
          message: `Conversation not found error persisted after retry`,
          type: 'conversation_not_found',
          retried: true,
          retrySuccess: false,
          originalSessionId,
          newSessionId,
        },
      };
    }

    this.logger.log(
      `Retry successful with new sessionId: ${newSessionId}`,
    );

    return {
      result: retryResult.result,
      error: {
        message: conversationNotFoundError,
        type: 'conversation_not_found',
        retried: true,
        retrySuccess: true,
        originalSessionId,
        newSessionId,
      },
    };
  }

  /**
   * 内部执行方法
   */
  private async executeClaudeAgentInternal({
    prompt,
    resume,
    threadId,
    sessionId,
    callId,
    cwd,
    systemPrompt,
    env,
  }: {
    prompt: string;
    resume: boolean;
    threadId: string;
    sessionId: string;
    callId: string;
    cwd?: string;
    systemPrompt?: string;
    env?: Record<string, string>;
  }): Promise<{
    result: SDKResultMessage;
    conversationNotFoundError: string | null;
  }> {
    // 动态加载 SDK
    const { query } = await loadSDK();
    this.logger.verbose(`executeClaudeAgent: ${sessionId}`);

    // 用于捕获 "No conversation found" 错误
    let conversationNotFoundError: string | null = null;

    // 默认配置
    const defaultOptions: Omit<Options, 'prompt' | 'resume'> = {
      // 全部工具（默认 preset）
      tools: { type: 'preset', preset: 'claude_code' },
      // 全部权限（跳过权限检查）
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      settingSources: ['user'],
      // JSON 输出格式
      outputFormat: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            result: { type: 'string' },
          },
        },
      },
    };
    const sdkOptions: Options = {
      ...defaultOptions,
      resume: resume ? sessionId : undefined,
      extraArgs: resume ? undefined : { 'session-id': sessionId },
      cwd,
      systemPrompt,
      env: {
        ...process.env,
        ...(env ?? {}),
      },
      stderr: (data: string) => {
        this.logger.error(`[claude-agent-sdk] ${data}`);
        // 检测 "No conversation found" 错误
        if (CONVERSATION_NOT_FOUND_PATTERN.test(data)) {
          conversationNotFoundError = data;
        }
      },
    };

    // 创建查询
    const queryResult = (await query({ prompt, options: sdkOptions })) as Query;

    let finalResult: SDKResultMessage | null = null;

    // 处理流式响应
    for await (const message of queryResult) {
      // 广播原始消息
      const content = this.handleEvent(message);
      if (content) {
        this.logger.verbose(`${content}`);

        SocketService.broadcast(threadId, 'message', {
          role: 'ai',
          id: callId,
          type: 'tool_progress',
          content,
        });
      }
      // 记录结果消息
      if (message.type === 'result') {
        finalResult = message as SDKResultMessage;
      }
    }

    if (!finalResult) {
      throw new Error('No result received');
    }

    return { result: finalResult, conversationNotFoundError };
  }

  private handleEvent(message: SDKMessage) {
    if (message.type === 'system') {
      return `[${message.type}] model=${(message as SDKSystemMessage).model}`;
    }
    if (message.type === 'assistant') {
      const contents = [];
      for (const content of (message as SDKAssistantMessage).message?.content ??
        []) {
        if (content.type === 'tool_use') {
          contents.push(
            `[${content.type}] ${content.name}(${JSON.stringify(content.input).slice(0, 50)}...)`,
          );
        }
      }
      return contents.join('\n');
    }
    // 其他的先不处理
  }
}
