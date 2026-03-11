import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV3 } from '@ai-sdk/provider';
import { fetch as undiciFetch, ProxyAgent } from 'undici';
import { ModelOptions } from '../types';
import { MyModel } from './my.model';
import _ from 'lodash';

function createProxyFetch(proxyUrl?: string): typeof fetch | undefined {
  if (!proxyUrl) {
    return undefined;
  }

  const proxyAgent = new ProxyAgent(proxyUrl);
  return (input, init) =>
    undiciFetch(input, {
      ...init,
      dispatcher: proxyAgent,
    }) as unknown as ReturnType<typeof fetch>;
}

export class OpenAIModel extends MyModel {
  constructor(modelOptions: ModelOptions) {
    super(modelOptions);
  }

  model(): LanguageModelV3 {
    const openai = createOpenAI({
      apiKey: this.modelOptions.apiKey,
      baseURL: this.modelOptions.baseUrl,
      fetch: createProxyFetch(this.modelOptions.proxyUrl),
    });

    return openai(this.modelOptions.model);
  }

  tokenLimit() {
    const baseToken = 20_000;
    return 100_0000 - baseToken;
  }

  providerOptions() {
    const variants = _.defaults(this.modelOptions.variants, {
      reasoningSummary: 'auto',
      reasoningEffort: 'medium',
      store: false,
    });
    return {
      openai: {
        ...variants,
      } satisfies OpenAIResponsesProviderOptions,
    };
  }
}
