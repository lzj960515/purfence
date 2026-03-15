import { BaseDto } from '@app/shared';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { ModelConfig } from '../type';

@ObjectType('AgentHistory')
export class AgentHistoryDto extends BaseDto {
  @FilterableField()
  agentId: string;

  @FilterableField(() => Int)
  version: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  instructions?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  changeDescription?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => [String], { nullable: true })
  tools?: string[];

  @Field(() => [String], { nullable: true })
  skills?: string[];

  @Field(() => GraphQLJSON, { nullable: true })
  modelConfig?: ModelConfig;
}
