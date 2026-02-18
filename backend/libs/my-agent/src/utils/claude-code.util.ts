import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getAgentPrompt } from './agent-loader.util';

// ============ 环境变量配置 ============
// 这些环境变量会覆盖 ~/.claude/settings.json 中的配置
// 默认不注入固定值，按调用方传入。

const CLAUDE_CODE_ENV = {};

// ============ 类型定义 ============

export interface ClaudeResultEvent {
  type: 'result';
  subtype: 'success' | 'error';
  is_error?: boolean;
  duration_ms: number;
  result?: string;
  error?: string;
  total_cost_usd?: number;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
  };
}

export interface ClaudeAssistantEvent {
  type: 'assistant';
  message: {
    content: Array<
      | { type: 'tool_use'; name: string; input: unknown }
      | { type: 'text'; text: string }
    >;
  };
}

export interface ClaudeUserEvent {
  type: 'user';
  message?: {
    content: Array<
      { type: 'tool_result'; content?: string } | { type: 'text'; text: string }
    >;
  };
}

export interface ClaudeSystemEvent {
  type: 'system';
  subtype?: 'init';
  model?: string;
}

export type StreamEvent =
  | ClaudeSystemEvent
  | ClaudeAssistantEvent
  | ClaudeUserEvent
  | ClaudeResultEvent;

// ============ 返回值类型 ============

export interface ClaudeCodeResult {
  success: boolean;
  content: string;
  sessionId: string;
  durationMs: number;
  costUsd?: number;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
  };
}

// ============ 配置类型 ============

export interface ClaudeCodeExecuteOptions {
  /** 任务描述 */
  task: string;
  /** 工作目录，默认为 process.cwd() */
  workdir?: string;
  /** 会话 ID，默认自动生成 */
  sessionId?: string;
  /** 是否续写 */
  resume?: boolean;
  /** 使用的 agent，如 "PM leader" */
  agent?: string;
  /** 超时时间（毫秒），默认 60 分钟 */
  timeout?: number;
  /** 进度回调 */
  onProgress?: (message: string) => void;
  /** 日志实例 */
  logger?: Logger;
  /** 额外注入的环境变量 */
  env?: Record<string, string>;
}

/**
 * 执行 Claude Code CLI
 * @param options 执行选项
 * @returns 执行结果
 */
export async function executeClaudeCode(
  options: ClaudeCodeExecuteOptions,
): Promise<ClaudeCodeResult> {
  const {
    task,
    workdir = process.cwd(),
    sessionId,
    resume,
    agent,
    timeout = 3600000,
    onProgress,
    logger = new Logger('ClaudeCode'),
    env,
  } = options;

  const startTime = Date.now();

  const cmdArgs: string[] = [
    '-p',
    '--output-format',
    'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
  ];

  if (resume) {
    cmdArgs.push('--resume', sessionId);
  } else {
    cmdArgs.push('--session-id', sessionId);
  }

  // 动态导入 execa
  const { execa } = (await eval(`import('execa')`)) as typeof import('execa');

  // 如果指定了 agent，读取 agent 文件并使用 --system-prompt
  if (agent) {
    const systemPrompt = getAgentPrompt(agent);
    if (!systemPrompt) {
      throw new Error(`Agent not found: ${agent}`);
    }
    cmdArgs.push('--system-prompt', systemPrompt);
  }

  cmdArgs.push(task);

  // 启动子进程
  const proc = execa('claude', cmdArgs, {
    cwd: workdir,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
    buffer: false,
    env: {
      ...process.env,
      ...CLAUDE_CODE_ENV,
      ...(env ?? {}),
    },
  });

  // 解析流式输出
  const resultEvent = await parseStream(proc, {
    onProgress,
    logger,
  });

  const durationMs = Date.now() - startTime;

  // 打印结果摘要
  handleResultSummary(resultEvent, durationMs, logger);

  // 判断成功状态
  const success =
    resultEvent?.subtype === 'success' && resultEvent.is_error !== true;

  return {
    success,
    content: resultEvent?.result ?? '',
    sessionId,
    durationMs,
    costUsd: resultEvent?.total_cost_usd,
    usage: resultEvent?.usage && {
      inputTokens: resultEvent.usage.input_tokens,
      outputTokens: resultEvent.usage.output_tokens,
      cacheReadTokens: resultEvent.usage.cache_read_input_tokens,
    },
  };
}

/** 解析流式输出的内部上下文 */
interface ParseStreamContext {
  onProgress?: (message: string) => void;
  logger: Logger;
}

/** 解析流式输出 */
async function parseStream(
  proc: ReturnType<(typeof import('execa'))['execa']>,
  context: ParseStreamContext,
): Promise<ClaudeResultEvent | null> {
  let resultEvent: ClaudeResultEvent | null = null;
  let buffer = '';

  // stdout 处理
  proc.stdout?.on('data', (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line) as StreamEvent;
        resultEvent = handleEvent(event, resultEvent, context) ?? resultEvent;
      } catch {
        context.logger.debug(`[Parse error] ${line.slice(0, 80)}...`);
      }
    }
  });

  proc.stdout?.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code !== 'EPIPE')
      context.logger.warn(`[stdout error] ${err.message}`);
  });

  proc.stderr?.on('data', (data: Buffer) => {
    context.logger.warn(`[stderr] ${data.toString().slice(0, 200)}`);
  });

  await proc;

  // 处理剩余 buffer
  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer) as StreamEvent;
      resultEvent = handleEvent(event, resultEvent, context) ?? resultEvent;
    } catch {
      context.logger.debug(`[Remaining buffer] ${buffer.slice(0, 100)}`);
    }
  }

  return resultEvent;
}

/** 处理单个事件 */
function handleEvent(
  event: StreamEvent,
  current: ClaudeResultEvent | null,
  context: ParseStreamContext,
): ClaudeResultEvent | null {
  context.logger.debug(`[Claude Code] event=${JSON.stringify(event.type)}`);
  switch (event.type) {
    case 'system':
      const msg = `[Claude Code] started model="${event.model ?? 'unknown'}"`;
      context.logger.verbose(JSON.stringify(event));
      context.onProgress?.(msg);
      break;

    case 'assistant':
      handleAssistant(event, context);
      break;

    case 'user':
      handleUser(event, context);
      break;

    case 'result':
      return event;
  }
  return current;
}

/** 处理 assistant 事件 */
function handleAssistant(
  event: ClaudeAssistantEvent,
  context: ParseStreamContext,
): void {
  for (const content of event.message?.content ?? []) {
    if (content.type === 'tool_use') {
      const msg = `[Tool use] ${content.name} input=${JSON.stringify(content.input).slice(0, 100)}`;
      context.logger.debug(msg);
      context.onProgress?.(msg);
    } else if (content.type === 'text') {
      const msg = `[Assistant text] ${content.text.slice(0, 100)}...`;
      context.logger.debug(msg);
      context.onProgress?.(msg);
    }
  }
}

/** 处理 user 事件 */
function handleUser(event: ClaudeUserEvent, context: ParseStreamContext): void {
  for (const content of event.message?.content ?? []) {
    if (content.type === 'tool_result') {
      const msg = `[Tool result] ${content.content?.slice(0, 100) ?? '(empty)'}`;
      context.logger.debug(msg);
      context.onProgress?.(msg);
    }
  }
}

/** 处理结果摘要 */
function handleResultSummary(
  event: ClaudeResultEvent | null,
  durationMs: number,
  logger: Logger,
): void {
  if (!event) {
    logger.warn('[Claude Code] no result event');
    return;
  }

  const { subtype, is_error, usage, total_cost_usd } = event;

  if (subtype === 'success' && is_error !== true) {
    logger.log(
      `[Claude Code] success ${durationMs}ms input=${usage?.input_tokens ?? 0} output=${usage?.output_tokens ?? 0} cache=${usage?.cache_read_input_tokens ?? 0} cost=$${total_cost_usd?.toFixed(4) ?? '0'}`,
    );
  } else {
    logger.error(
      `[Claude Code] failed ${event.result ?? event.error ?? 'unknown error'}`,
    );
  }
}
