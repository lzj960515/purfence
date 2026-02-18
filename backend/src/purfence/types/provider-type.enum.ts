import { registerEnumType } from '@nestjs/graphql';

export enum ProviderType {
  OPENAI = 'openai',
  KIMI = 'kimi',
  ZHIPU = 'zhipu',
  CODEX = 'codex',
}

registerEnumType(ProviderType, {
  name: 'ProviderType',
  description: 'AI model provider type',
});
