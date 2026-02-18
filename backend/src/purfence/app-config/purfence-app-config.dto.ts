import { BaseDto } from '@app/shared';
import { Field, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { AppConfigType } from '../types/app-config-type.enum';

@ObjectType('PurfenceAppConfig')
export class PurfenceAppConfigDto extends BaseDto {
  @FilterableField()
  name: string;

  @FilterableField(() => AppConfigType)
  type: AppConfigType;

  @Field()
  enabled: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  config?: Record<string, unknown>;
}
