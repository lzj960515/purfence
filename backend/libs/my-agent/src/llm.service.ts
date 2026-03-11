import { Injectable } from '@nestjs/common';
import {
  MyModel,
  OpenAIModel,
  AnthropicModel,
  OpenAICompatibleModel,
} from './model';
import { AgentModelOptions, ModelOptions } from './types';

@Injectable()
export class LlmService {
  constructor() {}

  get(modelOptions: ModelOptions): MyModel {
    switch (modelOptions.provider) {
      case 'openai':
        return new OpenAIModel(modelOptions);
      case 'anthropic':
        return new AnthropicModel(modelOptions);
      case 'openai-compatible':
        return new OpenAICompatibleModel(modelOptions);
    }
  }
}
