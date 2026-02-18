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

/**
 * Claude Agent SDK Service
 * 封装 @anthropic-ai/claude-agent-sdk，提供 NestJS 集成
 */
@Injectable()
export class ClaudeAgentSdkService {
  private readonly logger = new Logger(ClaudeAgentSdkService.name);

  /**
   * 执行 Claude Agent 任务，返回 SDK 原始结果
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
  }: {
    prompt: string;
    resume: boolean;
    threadId: string;
    sessionId: string;
    callId: string;
    cwd?: string;
    systemPrompt?: string;
    env?: Record<string, string>;
  }): Promise<SDKResultMessage> {
    // 动态加载 SDK
    const { query } = await loadSDK();
    this.logger.verbose(`executeClaudeAgent: ${sessionId}`);
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
      stderr: (data: string) => this.logger.error(`[claude-agent-sdk] ${data}`),
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

    return finalResult;
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
