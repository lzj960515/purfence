import { BaseDto } from '@app/shared';
import { Field, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';

@ObjectType('PurfenceProject')
export class PurfenceProjectDto extends BaseDto {
  @FilterableField({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @FilterableField()
  localRootPath: string;

  @Field({ nullable: true })
  externalPath?: string;

  @FilterableField()
  defaultBranch: string;

  @FilterableField({ nullable: true })
  slackAppConfigId?: string;

  @FilterableField({ nullable: true })
  slackChannelId?: string;
}
