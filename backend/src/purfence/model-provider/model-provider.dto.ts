import { BaseDto } from '@app/shared';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import { Field, ObjectType } from '@nestjs/graphql';
import { ProviderType } from '../types/provider-type.enum';

@ObjectType('ModelProvider')
export class ModelProviderDto extends BaseDto {
  @FilterableField(() => ProviderType)
  provider: ProviderType;

  @FilterableField()
  name: string;

  @Field({ nullable: true })
  baseUrl?: string;

  @FilterableField()
  isActive: boolean;
}
