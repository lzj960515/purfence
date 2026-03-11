import {
  Agent,
  type GenerateTextOptions,
  type GenerateTextResultWithContext,
  type OutputSpec,
} from '@voltagent/core';
import { ToolSet } from 'ai';
import type { MyAgentService } from './my-agent.service';
import type { ChatOptions } from './types';

export class MyAgent {
  constructor(
    private agent: Agent,
    private service: MyAgentService,
  ) {}

  getAgent() {
    return this.agent;
  }

  async generateText<OUTPUT extends OutputSpec = OutputSpec>(
    message: Parameters<Agent['generateText']>[0],
    options?: GenerateTextOptions<OUTPUT>,
  ): Promise<GenerateTextResultWithContext<ToolSet, OUTPUT>> {
    return this.agent.generateText(message, options);
  }

  async streamText(
    message: Parameters<Agent['streamText']>[0],
    options?: Parameters<Agent['streamText']>[1],
  ): ReturnType<Agent['streamText']> {
    return this.agent.streamText(message, options);
  }

  // 统一入口：流式，外部只传 ChatOptions
  async stream(chatOptions: ChatOptions) {
    return this.service.stream(this, chatOptions);
  }
}
