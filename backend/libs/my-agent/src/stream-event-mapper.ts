import { Injectable } from '@nestjs/common';
import type { ToolSet } from 'ai';

// ============================================================================
// 流事件类型定义（替代 VoltAgentTextStreamPart）
// ============================================================================

export type StreamEventType =
  | 'text-delta'
  | 'reasoning-delta'
  | 'tool-call'
  | 'tool-result'
  | 'error'
  | 'finish';

export interface TextDeltaPart {
  type: 'text-delta';
  textDelta: string;
  id: string;
}

export interface ReasoningDeltaPart {
  type: 'reasoning-delta';
  textDelta: string;
  id: string;
}

export interface ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: unknown;
}

export interface ToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result: unknown;
}

export interface ErrorPart {
  type: 'error';
  error: Error;
}

export interface FinishPart {
  type: 'finish';
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type StreamPart =
  | TextDeltaPart
  | ReasoningDeltaPart
  | ToolCallPart
  | ToolResultPart
  | ErrorPart
  | FinishPart;

// ============================================================================
// 内部流事件格式（与前端兼容）
// ============================================================================

export interface StreamEvent {
  role: 'ai';
  id: string;
  type: 'thinking' | 'text' | 'tool_text' | 'tool_result' | 'interrupt';
  content?: string;
  toolName?: string;
  toolCallId?: string;
  artifact?: any;
  status?: 'error';
}

// ============================================================================
// StreamEventMapper - 将 AI SDK 流事件转换为内部格式
// ============================================================================

@Injectable()
export class StreamEventMapper {
  private toolCallBuffer: Map<string, ToolCallPart> = new Map();

  /**
   * 将 AI SDK 流事件转换为内部 StreamEvent
   */
  async* mapAIStreamToInternal(
    aiStream: AsyncIterable<{
      type: string;
      [key: string]: any;
    }>,
  ): AsyncIterable<StreamEvent> {
    for await (const chunk of aiStream) {
      yield* this.mapChunkToStreamEvents(chunk);
    }
  }

  /**
   * 映射单个 AI SDK chunk 为内部事件
   */
  private async* mapChunkToStreamEvents(
    chunk: any,
  ): AsyncIterable<StreamEvent> {
    switch (chunk.type) {
      case 'text-delta': {
        yield {
          role: 'ai',
          id: this.generateId(),
          type: 'text',
          content: chunk.textDelta,
        };
        break;
      }

      case 'reasoning-delta': {
        yield {
          role: 'ai',
          id: this.generateId(),
          type: 'thinking',
          content: chunk.textDelta,
        };
        break;
      }

      case 'tool-call': {
        // 缓存工具调用信息
        const toolCall: ToolCallPart = {
          type: 'tool-call',
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          args: chunk.args,
        };
        this.toolCallBuffer.set(chunk.toolCallId, toolCall);

        yield {
          role: 'ai',
          id: chunk.toolCallId,
          type: 'tool_text',
          content: chunk.toolName,
          toolName: chunk.toolName,
          toolCallId: chunk.toolCallId,
        };
        break;
      }

      case 'tool-result': {
        const toolCall = this.toolCallBuffer.get(chunk.toolCallId);

        yield {
          role: 'ai',
          id: chunk.toolCallId,
          type: 'tool_result',
          toolName: toolCall?.toolName || 'unknown',
          toolCallId: chunk.toolCallId,
          content: chunk.result ? JSON.stringify(chunk.result) : undefined,
        };

        this.toolCallBuffer.delete(chunk.toolCallId);
        break;
      }

      case 'finish': {
        // 完成事件不输出到流，由 onStepFinish 处理
        break;
      }

      case 'error': {
        // 错误事件转换为 error part 抛出
        const error =
          chunk.error instanceof Error
            ? chunk.error
            : new Error(String(chunk.error));
        throw error;
      }

      default: {
        // 忽略未识别的事件类型
        break;
      }
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建错误抛出流包装器
   * 将 AI SDK 流中的 error 事件转换为抛出的错误
   */
  createErrorThrowingStream<T extends { type: string; error?: any }>(
    baseStream: AsyncIterable<T>,
  ): AsyncIterable<T> {
    return (async function* () {
      for await (const chunk of baseStream) {
        if (chunk.type === 'error' && chunk.error) {
          const error =
            chunk.error instanceof Error
              ? chunk.error
              : new Error(String(chunk.error));
          throw error;
        }
        yield chunk;
      }
    })();
  }
}
