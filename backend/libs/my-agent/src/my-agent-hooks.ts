import { Log } from '@nest-mods/log';
import { Injectable, Logger } from '@nestjs/common';
import {
  AgentHooks,
  Agent,
  createHooks,
  OnEndHookArgs,
  OperationContext,
  Memory,
  messageHelpers,
} from '@voltagent/core';
import _ from 'lodash';
import { AgentConversationSession } from './agent-conversation-sessions.ai.entity';
import { LlmService } from './llm.service';
import { Providers } from './types';
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
      onEnd: async ({ agent, output, context, error }) => {
        if (!context?.conversationId) {
          return;
        }

        if (error) return;
        if (context.context.get('provider') === ProviderType.CODEX) {
          const title = this.messageService.extractRawText(
            context.input as UIMessage[],
          );

          await this.messageService.updateConversationTitle(
            context.conversationId,
            title,
          );
        }

        const model = agent.getModelName();
        const provider = this.llmService.getProviderByModel(model);
        await this.updateSessionUsage({ output, context, provider });

        await this.handleEvent({ agent, context });
      },
    });
  }

  private async handleEvent({
    agent,
    context,
  }: {
    agent: Agent;
    context: OperationContext;
  }) {
    const event = context.context.get('event') as string;
    if (!event) return;

    const contextPayload = Object.fromEntries(context.context.entries());
    CommonService.emit(event, {
      ...contextPayload,
      conversationId: context.conversationId,
    });
  }

  private async updateSessionUsage({
    output,
    context,
    provider,
  }: {
    output: OnEndHookArgs['output'];
    context: OperationContext;
    provider: Providers;
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
