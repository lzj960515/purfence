import { registerEnumType } from '@nestjs/graphql';

export enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OPENAI_COMPATIBLE = 'openai-compatible',
}

registerEnumType(ProviderType, {
  name: 'ProviderType',
  description: 'AI model provider type',
});
