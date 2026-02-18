import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV3 } from '@ai-sdk/provider';
import { fetch as undiciFetch, ProxyAgent } from 'undici';
import { ModelOptions } from '../types';
import { MyModel } from './my.model';

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
  constructor(modelOptions: ModelOptions = {}) {
    super(modelOptions);
  }

  protected providerModel(): LanguageModelV3 {
    const provider = createOpenAI({
      apiKey: this.modelOptions.apiKey,
      baseURL: this.modelOptions.baseUrl,
      fetch: createProxyFetch(this.modelOptions.proxyUrl),
    });

    switch (this.modelOptions.model) {
      case 'gpt-5-mini':
        return provider('gpt-5-mini');
      case 'openai':
      case 'gpt-5':
      default:
        return provider('gpt-5');
    }
  }

  tokenLimit() {
    const baseToken = 80_000;
    return 400_000 - baseToken;
  }

  providerOptions() {
    return {
      openai: {
        reasoningSummary: 'auto',
        store: false,
        include: ['reasoning.encrypted_content'],
      } satisfies OpenAIResponsesProviderOptions,
    };
  }
}
