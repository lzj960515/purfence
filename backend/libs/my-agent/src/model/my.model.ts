import { AgentOptions, BaseGenerationOptions, Tool } from '@voltagent/core';
import {
  LanguageModelV3,
  LanguageModelV3Middleware,
  LanguageModelV3Prompt,
} from '@ai-sdk/provider';
import { wrapLanguageModel } from 'ai';
import { ModelOptions } from '../types';
import {
  formatAgentsList,
  loadPrimaryAgents,
} from '../utils/agent-loader.util';

export abstract class MyModel {
  constructor(protected readonly modelOptions: ModelOptions = {}) {}

  model(): LanguageModelV3 {
    return wrapLanguageModel({
      model: this.providerModel(),
      middleware: [this.delegateTaskMiddleware()],
    });
  }

  protected abstract providerModel(): LanguageModelV3;

  abstract tokenLimit(): number;

  abstract providerOptions(): BaseGenerationOptions['providerOptions'];

  headers(): Record<string, string> {
    return {};
  }

  async countTokens(
    prompt: LanguageModelV3Prompt,
    tools: Tool[],
  ): Promise<number> {
    return Promise.resolve(-1);
  }

  protected delegateTaskMiddleware(): LanguageModelV3Middleware {
    return {
      specificationVersion: 'v3',
      transformParams: async ({ params }) => {
        const tools = params.tools ?? [];
        for (let i = tools.length - 1; i >= 0; i--) {
          const tool = tools[i];
          if (tool.name !== 'delegateTask' && tool.name !== 'Task') {
            continue;
          }

          if ('description' in tool) {
            tool.description = tool.description.replace(
              '{{AGENTS}}',
              formatAgentsList(loadPrimaryAgents()),
            );
          }
          break;
        }

        return params;
      },
    };
  }
}
