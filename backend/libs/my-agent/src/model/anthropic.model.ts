import { AnthropicProviderOptions, createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModelV3 } from '@ai-sdk/provider';
import { ModelOptions } from '../types';
import { MyModel } from './my.model';
import _ from 'lodash';
export class AnthropicModel extends MyModel {
  constructor(modelOptions: ModelOptions) {
    super(modelOptions);
  }

  model(): LanguageModelV3 {
    const anthropic = createAnthropic({
      apiKey: this.modelOptions.apiKey,
      baseURL: this.modelOptions.baseUrl,
    });
    return anthropic(this.modelOptions.model);
  }

  tokenLimit() {
    return 20_0000;
  }

  providerOptions() {
    const variants = _.defaults(this.modelOptions.variants, {
      thinking: {
        type: 'enabled',
        budgetTokens: 3200,
      },
    });
    return {
      anthropic: {
        ...variants,
      } as AnthropicProviderOptions,
    };
  }
}
