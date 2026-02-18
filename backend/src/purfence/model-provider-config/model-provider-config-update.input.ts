import { InputType, PartialType } from '@nestjs/graphql';
import { ModelProviderConfigCreateInput } from './model-provider-config-create.input';

@InputType()
export class ModelProviderConfigUpdateInput extends PartialType(
  ModelProviderConfigCreateInput,
) {}
