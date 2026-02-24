import {
  LanguageModelV3,
  LanguageModelV3Middleware,
} from '@ai-sdk/provider';
import { wrapLanguageModel } from 'ai';
import { ModelOptions } from '../types';
import {
  formatAgentsList,
  loadPrimaryAgents,
} from '../utils/agent-loader.util';

// ============================================================================
// 生成选项类型（替代 @voltagent/core 的 BaseGenerationOptions）
// ============================================================================

export type ProviderOptions = Record<string, any>;

// ============================================================================
// MyModel - 抽象基类，用于所有模型实现
// ============================================================================

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

  abstract providerOptions(): ProviderOptions;

  headers(): Record<string, string> {
    return {};
  }

  async countTokens(
    prompt: any,
    tools: any[],
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
