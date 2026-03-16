import { LanguageModelV3, LanguageModelV3Prompt } from '@ai-sdk/provider';
import { BaseGenerationOptions, Tool } from '@voltagent/core';
import { ModelOptions, Providers } from '../types';

export abstract class MyModel {
  constructor(protected readonly modelOptions: ModelOptions) {}

  getModelOptions(): ModelOptions {
    return this.modelOptions;
  }

  provider(): Providers {
    return this.modelOptions.provider;
  }

  modelName(): string {
    return this.modelOptions.model;
  }

  abstract model(): LanguageModelV3;

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
}
