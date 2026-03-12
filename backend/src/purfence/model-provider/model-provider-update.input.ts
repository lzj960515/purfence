import { InputType, PartialType } from '@nestjs/graphql';
import { ModelProviderCreateInput } from './model-provider-create.input';

@InputType()
export class ModelProviderUpdateInput extends PartialType(
  ModelProviderCreateInput,
) {}
