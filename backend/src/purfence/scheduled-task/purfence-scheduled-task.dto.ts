import { BaseDto } from '@app/shared';
import { Field, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import {
  PurfenceScheduledTaskKind,
  PurfenceScheduledTaskLastStatus,
} from './purfence-scheduled-task.enum';

@ObjectType('PurfenceScheduledTask')
export class PurfenceScheduledTaskDto extends BaseDto {
  @FilterableField()
  name: string;

  @Field()
  prompt: string;

  @FilterableField(() => PurfenceScheduledTaskKind)
  kind: PurfenceScheduledTaskKind;

  @Field({ nullable: true })
  cronExpr?: string;

  @Field({ nullable: true })
  runAt?: Date;

  @FilterableField()
  enabled: boolean;

  @Field({ nullable: true })
  lastRunAt?: Date;

  @Field({ nullable: true })
  nextRunAt?: Date;

  @Field(() => PurfenceScheduledTaskLastStatus, { nullable: true })
  lastStatus?: PurfenceScheduledTaskLastStatus;

  @Field({ nullable: true })
  lastError?: string;

  @Field()
  runCount: number;

  @Field({ nullable: true })
  slackAppConfigId?: string;

  @Field({ nullable: true })
  slackChannelId?: string;
}
