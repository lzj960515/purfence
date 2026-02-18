import { BaseDto } from '@app/shared';
import { Field, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import { ProviderType } from '../types/provider-type.enum';

/**
 * ModelProviderConfig DTO
 *
 * GraphQL output type for ModelProviderConfig.
 * Excludes sensitive data (apiKey, refreshToken) for security.
 */
@ObjectType('ModelProviderConfig')
export class ModelProviderConfigDto extends BaseDto {
  @FilterableField(() => ProviderType)
  provider: ProviderType;

  @FilterableField()
  name: string;

  // 不暴露 apiKey / refreshToken / oauthInfo 到 GraphQL

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  baseUrl?: string;

  @Field()
  isActive: boolean;

  @Field()
  isDefault: boolean;

  @Field({ nullable: true })
  deletedAt?: Date;
}
