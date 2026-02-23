import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentConversationSession } from './agent-conversation-sessions.ai.entity';
import { MessageService } from './message.service';
import { ProviderType } from '@src/purfence/types/provider-type.enum';
import { CommonService } from '@src/common';
import { LlmService } from './llm.service';
import { Log } from '@nest-mods/log';

// ============================================================================
// Agent 生命周期事件类型
// ============================================================================

export interface AgentLifecycleEvent {
  agentName: string;
  conversationId?: string;
  userId?: string;
  input?: any;
  output?: {
    text?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      reasoningTokens?: number;
      cachedInputTokens?: number;
    };
  };
  error?: Error;
  context?: Map<string, unknown>;
}

export interface OnStartEvent extends AgentLifecycleEvent {
  type: 'start';
}

export interface OnEndEvent extends AgentLifecycleEvent {
  type: 'end';
}

// ============================================================================
// AgentLifecycleService - 替代 voltagent 的 createHooks
// ============================================================================

@Injectable()
export class AgentLifecycleService {
  @Log() private logger: Logger;

  constructor(
    private eventEmitter: EventEmitter2,
    private messageService: MessageService,
    private llmService: LlmService,
  ) {}

  /**
   * 触发 Agent 开始事件
   */
  emitStart(event: Omit<AgentLifecycleEvent, 'output'>): void {
    const fullEvent: OnStartEvent = {
      ...event,
      type: 'start',
    };
    this.eventEmitter.emit('agent.start', fullEvent);
    this.logger.debug(`Agent ${event.agentName} started`);
  }

  /**
   * 触发 Agent 结束事件
   */
  emitEnd(event: AgentLifecycleEvent): void {
    const fullEvent: OnEndEvent = {
      ...event,
      type: 'end',
    };
    this.eventEmitter.emit('agent.end', fullEvent);
    this.handleOnEnd(event);
  }

  /**
   * 创建 AI SDK 的 onStepFinish 回调
   * 用于在流式调用结束时触发生命周期事件
   */
  createStepFinishCallback(
    agentName: string,
    conversationId: string,
    userId: string,
    context: Map<string, unknown> | Record<string, unknown>,
  ) {
    return async (step: any) => {
      const normalizedContext =
        context instanceof Map
          ? context
          : new Map(Object.entries(context || {}));

      const event: AgentLifecycleEvent = {
        agentName,
        conversationId,
        userId,
        context: normalizedContext,
        output: {
          text: step.text,
          usage: step.usage
            ? {
                promptTokens: step.usage.promptTokens,
                completionTokens: step.usage.completionTokens,
                totalTokens: step.usage.totalTokens,
              }
            : undefined,
        },
      };

      this.emitEnd(event);
    };
  }

  /**
   * 处理 onEnd 事件
   * 包括：更新会话标题、更新 Token 使用量、触发自定义事件
   */
  private async handleOnEnd(event: AgentLifecycleEvent): Promise<void> {
    if (!event.conversationId || event.error) return;

    try {
      // 1. 更新会话标题（CODEX provider）
      await this.updateConversationTitle(event);

      // 2. 更新 Token 使用量
      await this.updateSessionUsage(event);

      // 3. 触发自定义事件
      await this.handleCustomEvent(event);
    } catch (error) {
      this.logger.error(`Error in handleOnEnd: ${error.message}`, error.stack);
    }
  }

  /**
   * 更新会话标题
   * 仅在 CODEX provider 且是第一轮对话时更新
   */
  private async updateConversationTitle(
    event: AgentLifecycleEvent,
  ): Promise<void> {
    const provider = event.context?.get('provider') as ProviderType;
    if (provider !== ProviderType.CODEX) return;

    // 检查是否是第一轮对话（简化逻辑）
    const messages = await this.messageService.getMessages(
      event.userId!,
      event.conversationId!,
      { limit: 3 },
    );
    if (messages.length > 2) return; // 不是第一轮

    // 提取标题
    const title = this.extractTitleFromInput(event.input);
    if (title) {
      await this.messageService.updateConversationTitle(
        event.conversationId,
        title,
      );
      this.logger.debug(`Updated conversation title: ${title}`);
    }
  }

  /**
   * 从输入中提取标题
   */
  private extractTitleFromInput(input: any): string | null {
    if (!input) return null;

    // 如果是消息数组，取第一条用户消息
    if (Array.isArray(input)) {
      const firstUserMessage = input.find((m) => m.role === 'user');
      if (firstUserMessage?.parts?.[0]?.text) {
        return this.truncateTitle(firstUserMessage.parts[0].text);
      }
    }

    // 如果是字符串
    if (typeof input === 'string') {
      return this.truncateTitle(input);
    }

    return null;
  }

  /**
   * 截断标题到合适长度
   */
  private truncateTitle(text: string, maxLength: number = 50): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * 更新会话 Token 使用量
   */
  private async updateSessionUsage(event: AgentLifecycleEvent): Promise<void> {
    const usage = event.output?.usage;
    if (!usage || !event.conversationId) return;

    try {
      await AgentConversationSession.update(
        { id: event.conversationId },
        {
          inputTokens: usage.promptTokens || 0,
          outputTokens: usage.completionTokens || 0,
          totalTokens: usage.totalTokens || 0,
          reasoningTokens: usage.reasoningTokens || 0,
          cachedInputTokens: usage.cachedInputTokens || 0,
        },
      );
      this.logger.verbose(
        `Updated session usage: ${JSON.stringify(usage)}`,
      );
    } catch (error) {
      this.logger.error(`Failed to update session usage: ${error.message}`);
    }
  }

  /**
   * 处理自定义事件
   * 从 context 中读取 event 字段并触发对应事件
   */
  private async handleCustomEvent(event: AgentLifecycleEvent): Promise<void> {
    const customEvent = event.context?.get('event') as string;
    if (!customEvent) return;

    const contextPayload =
      event.context instanceof Map
        ? Object.fromEntries(event.context.entries())
        : event.context || {};

    CommonService.emit(customEvent, {
      ...contextPayload,
      conversationId: event.conversationId,
    });

    this.logger.debug(`Emitted custom event: ${customEvent}`);
  }

  /**
   * 监听 Agent 开始事件
   */
  onStart(
    callback: (event: OnStartEvent) => void | Promise<void>,
  ): () => void {
    this.eventEmitter.on('agent.start', callback);
    return () => this.eventEmitter.off('agent.start', callback);
  }

  /**
   * 监听 Agent 结束事件
   */
  onEnd(callback: (event: OnEndEvent) => void | Promise<void>): () => void {
    this.eventEmitter.on('agent.end', callback);
    return () => this.eventEmitter.off('agent.end', callback);
  }
}
