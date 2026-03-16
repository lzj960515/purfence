import { Log } from '@nest-mods/log';
import { Injectable, Logger } from '@nestjs/common';
import {
  AgentHooks,
  createHooks,
  OnEndHookArgs,
  OperationContext,
} from '@voltagent/core';
import { AgentConversationSession } from './agent-conversation-sessions.entity';
import { LlmService } from './llm.service';
import { CommonService } from '@src/common';
import { UIMessage } from 'ai';
import { MessageService } from './message.service';
import { ProviderType } from '@src/purfence/types/provider-type.enum';

@Injectable()
export class MyAgentHooks {
  @Log() private logger: Logger;
  private readonly hooks: AgentHooks;
  constructor(
    private llmService: LlmService,
    private messageService: MessageService,
  ) {
    this.hooks = createHooks({
      onEnd: async ({ output, context, error }) => {
        if (!context?.conversationId) {
          return;
        }

        await this.updateSessionUsage({ output, context });

        this.handleEvent({ context, error });
      },
    });
  }

  private handleEvent({
    context,
    error,
  }: {
    context: OperationContext;
    error?: unknown;
  }) {
    const event = context.context.get('event') as string;
    const contextPayload = Object.fromEntries(context.context.entries());

    if (event) {
      CommonService.emit(event, {
        ...contextPayload,
        conversationId: context.conversationId,
      });
    }

    CommonService.emit(
      error ? 'purfence.agent.on-end.failure' : 'purfence.agent.on-end.success',
      {
        context: contextPayload,
        error,
        event,
        conversationId: context.conversationId,
      },
    );
  }

  private async updateSessionUsage({
    output,
    context,
  }: {
    output: OnEndHookArgs['output'];
    context: OperationContext;
  }) {
    await AgentConversationSession.update(
      { id: context.conversationId },
      {
        inputTokens: output?.usage?.promptTokens || 0,
        outputTokens: output?.usage?.completionTokens || 0,
        totalTokens: output?.usage?.totalTokens || 0,
        reasoningTokens: output?.usage?.reasoningTokens || 0,
        cachedInputTokens: output?.usage?.cachedInputTokens || 0,
      },
    );
  }

  getHooks() {
    return this.hooks;
  }
}
