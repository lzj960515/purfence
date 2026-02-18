import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV3 } from '@ai-sdk/provider';
import { fetch as undiciFetch, ProxyAgent } from 'undici';
import { ModelOptions } from '../types';
import { MyModel } from './my.model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeCodexInput(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }

  if (typeof input === 'string') {
    return [
      {
        role: 'user',
        content: [{ type: 'input_text', text: input }],
      },
    ];
  }

  if (isRecord(input)) {
    return [input];
  }

  return [
    {
      role: 'user',
      content: [{ type: 'input_text', text: String(input ?? '') }],
    },
  ];
}

function createCodexFetch(proxyUrl?: string): typeof fetch {
  const proxyAgent = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
  return (input, init) => {
    let requestBody = init?.body;
    // Codex endpoint has stricter payload requirements than OpenAI Responses.
    if (typeof requestBody === 'string') {
      try {
        const parsed = JSON.parse(requestBody) as unknown;
        if (isRecord(parsed)) {
          const normalized: Record<string, unknown> = {
            ...parsed,
            input: normalizeCodexInput(parsed.input),
            stream: true,
          };

          if (
            typeof normalized.instructions !== 'string' ||
            normalized.instructions.trim() === ''
          ) {
            normalized.instructions = 'You are a helpful assistant.';
          }

          if (normalized.store === undefined) {
            normalized.store = false;
          }

          requestBody = JSON.stringify(normalized);
        }
      } catch {
        // Keep original body if it is not JSON.
      }
    }
    return undiciFetch(input, {
      ...init,
      body: requestBody,
      dispatcher: proxyAgent,
    }) as unknown as ReturnType<typeof fetch>;
  };
}

export class CodexModel extends MyModel {
  constructor(modelOptions: ModelOptions = {}) {
    super(modelOptions);
  }

  protected providerModel(): LanguageModelV3 {
    const accessToken = this.modelOptions.accessToken;
    const accountId = this.modelOptions.accountId;

    if (!accessToken || !accountId) {
      throw new Error(
        'Codex model requires accessToken and accountId from provider configuration',
      );
    }

    const codexProvider = createOpenAI({
      // @ai-sdk/openai requires apiKey/OPENAI_API_KEY even when Authorization is overridden.
      apiKey: 'oauth-placeholder',
      baseURL:
        this.modelOptions.baseUrl || 'https://chatgpt.com/backend-api/codex',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'chatgpt-account-id': accountId,
      },
      fetch: createCodexFetch(this.modelOptions.proxyUrl),
    });

    return codexProvider('gpt-5.2');
  }

  tokenLimit() {
    const baseToken = 80_000;
    return 400_000 - baseToken;
  }

  providerOptions() {
    return {
      openai: {
        reasoningSummary: 'detailed',
        store: false,
        include: ['reasoning.encrypted_content'],
      } satisfies OpenAIResponsesProviderOptions,
    };
  }
}
