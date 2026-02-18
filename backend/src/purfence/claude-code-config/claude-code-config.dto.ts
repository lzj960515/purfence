import { BaseDto } from '@app/shared';
import { Field, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';

@ObjectType('ClaudeCodeEnvItem')
export class ClaudeCodeEnvItemDto {
  @Field()
  key: string;

  @Field()
  value: string;
}

@ObjectType('ClaudeCodeConfig')
export class ClaudeCodeConfigDto extends BaseDto {
  @Field()
  useDefaultConfig: boolean;

  @FilterableField({ nullable: true })
  modelProviderId?: string;

  @Field(() => [ClaudeCodeEnvItemDto], { nullable: true })
  env?: ClaudeCodeEnvItemDto[];
}
