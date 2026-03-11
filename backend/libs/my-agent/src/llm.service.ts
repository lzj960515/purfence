import { openai } from '@ai-sdk/openai';
import { Injectable } from '@nestjs/common';
import { CodexModel, KimiModel, MyModel, OpenAIModel } from './model';
import { ZhipuModel } from './model/zhipu.model';
import { ModelOptions, Providers } from './types';

@Injectable()
export class LlmService {
  private normalizeModelOptions(
    modelOptions?: ModelOptions | ModelOptions['model'],
  ): ModelOptions {
    if (modelOptions == null) return {};
    if (typeof modelOptions === 'string') return { model: modelOptions };
    return modelOptions;
  }

  get(modelOptions?: ModelOptions | ModelOptions['model']): MyModel {
    const normalized = this.normalizeModelOptions(modelOptions);

    let instance: MyModel;
    switch (normalized.model) {
      case 'codex':
        instance = new CodexModel(normalized);
        break;
      case 'openai':
      case 'gpt-5':
      case 'gpt-5-mini':
        instance = new OpenAIModel(normalized);
        break;
      case 'kimi':
        instance = new KimiModel(normalized);
        break;
      case 'claude-sonnet-4-5':
      default:
        instance = new ZhipuModel(normalized);
        break;
    }
    return instance;
  }

  getModel(modelOptions?: ModelOptions | ModelOptions['model']) {
    return this.get(modelOptions).model();
  }

  getProviderByModel(model?: string): Providers {
    switch (model) {
      case 'codex':
      case 'openai':
      case 'gpt-5-mini':
      case 'gpt-5':
        return 'openai';
      case 'gemini':
      case 'gemini-3-pro-preview':
        return 'gemini';
      case 'claude-sonnet-4-5':
      default:
        return 'anthropic';
    }
  }

  getTokenLimit(modelOptions?: ModelOptions | ModelOptions['model']): number {
    return this.get(modelOptions).tokenLimit();
  }

  getHeaders(
    modelOptions?: ModelOptions | ModelOptions['model'],
  ): Record<string, string> {
    return this.get(modelOptions).headers();
  }
}
