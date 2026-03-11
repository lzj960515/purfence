import { AnthropicProviderOptions, createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModelV3 } from '@ai-sdk/provider';
import { ModelOptions } from '../types';
import { MyModel } from './my.model';
import {
  createOpenAICompatible,
  OpenAICompatibleProviderOptions,
} from '@ai-sdk/openai-compatible';

export class OpenAICompatibleModel extends MyModel {
  constructor(modelOptions: ModelOptions) {
    super(modelOptions);
  }

  model(): LanguageModelV3 {
    const openaiCompatible = createOpenAICompatible({
      name: 'openai-compatible',
      apiKey: this.modelOptions.apiKey,
      baseURL: this.modelOptions.baseUrl,
    });
    return openaiCompatible(this.modelOptions.model);
  }

  tokenLimit() {
    return 20_0000;
  }

  providerOptions() {
    return {
      openai: {
        ...this.modelOptions.variants,
      } satisfies OpenAICompatibleProviderOptions,
    };
  }
}
