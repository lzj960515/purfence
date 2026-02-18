import {
  Agent,
  type GenerateTextOptions,
  type GenerateTextResultWithContext,
  type OutputSpec,
} from '@voltagent/core';
import { ToolSet } from 'ai';
import z from 'zod';
import { MyModel } from './model';
import type { MyAgentService } from './my-agent.service';
import type { ChatOptions, GenerateTextOutputOptions } from './types';

export class MyAgent {
  constructor(
    private agent: Agent,
    private service: MyAgentService,
    private myModel: MyModel,
  ) {}

  getAgent() {
    return this.agent;
  }

  getMyModel() {
    return this.myModel;
  }

  async generateText<OUTPUT extends OutputSpec = OutputSpec>(
    message: Parameters<Agent['generateText']>[0],
    options?: GenerateTextOptions<OUTPUT>,
  ): Promise<GenerateTextResultWithContext<ToolSet, OUTPUT>> {
    await this.populateUserContext(options);
    return this.agent.generateText(message, options);
  }

  async streamText(
    message: Parameters<Agent['streamText']>[0],
    options?: Parameters<Agent['streamText']>[1],
  ): ReturnType<Agent['streamText']> {
    await this.populateUserContext(options);
    return this.agent.streamText(message, options);
  }

  // 统一入口：流式，外部只传 ChatOptions
  async stream(chatOptions: ChatOptions) {
    await this.populateUserContext(chatOptions);
    return this.service.stream(this, chatOptions);
  }

  async invoke(options: { chatOptions: ChatOptions }): Promise<string>;
  async invoke<T extends z.ZodType>(options: {
    chatOptions: ChatOptions;
    generateTextOutputOptions?: GenerateTextOutputOptions<T>;
  }): Promise<z.infer<T>>;
  async invoke<T extends z.ZodType>(options: {
    chatOptions: ChatOptions;
    generateTextOutputOptions?: GenerateTextOutputOptions<T>;
  }) {
    const { chatOptions, generateTextOutputOptions } = options;
    await this.populateUserContext(chatOptions);
    return this.service.invoke(this, {
      chatOptions,
      generateTextOutputOptions,
    });
  }

  private async populateUserContext(options?: {
    userId?: string;
    context?: Map<string | symbol, unknown> | Record<string | symbol, unknown>;
  }) {
    if (!options) return;
    const userId = options.userId;
    if (!userId) return;

    try {
      const store = {
        title: 'test',
        v1PlanType: 'free',
        avatarUrl: 'https://example.com/avatar.png',
      };
      const userMetadata = {
        plan: store.v1PlanType,
      } as const;

      if (options.context instanceof Map) {
        options.context.set('user.name', store.title);
        options.context.set('user.avatar', store.avatarUrl);
        options.context.set('user.metadata', userMetadata);
      } else {
        const base = options.context || {};
        options.context = {
          ...base,
          'user.name': store.title,
          'user.avatar': store.avatarUrl,
          'user.metadata': userMetadata,
        };
      }
    } catch {
      // 静默失败，不影响主流程
    }
  }
}
