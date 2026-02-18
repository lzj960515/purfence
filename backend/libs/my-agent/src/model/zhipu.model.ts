import { AnthropicProviderOptions, createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModelV3 } from '@ai-sdk/provider';
import { ModelOptions } from '../types';
import { MyModel } from './my.model';
export class ZhipuModel extends MyModel {
  constructor(modelOptions: ModelOptions = {}) {
    super(modelOptions);
  }

  protected providerModel(): LanguageModelV3 {
    const anthropic = createAnthropic({
      apiKey: this.modelOptions.apiKey,
      baseURL: this.modelOptions.baseUrl,
    });
    return anthropic('GLM-5');
  }

  tokenLimit() {
    return 20_0000;
  }

  providerOptions() {
    const thinking = this.modelOptions.thinking ?? true;
    return {
      anthropic: {
        thinking: {
          type: thinking ? 'enabled' : 'disabled',
          budgetTokens: 3200,
        },
      } as AnthropicProviderOptions,
    };
  }
}
