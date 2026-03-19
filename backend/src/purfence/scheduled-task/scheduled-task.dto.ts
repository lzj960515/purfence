import { BaseDto } from '@app/shared';
import { Field, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import {
  ScheduledTaskKind,
  ScheduledTaskLastStatus,
} from './scheduled-task.enum';

@ObjectType('ScheduledTask')
export class ScheduledTaskDto extends BaseDto {
  @FilterableField()
  name: string;

  @Field()
  prompt: string;

  @FilterableField(() => ScheduledTaskKind)
  kind: ScheduledTaskKind;

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

  @Field(() => ScheduledTaskLastStatus, { nullable: true })
  lastStatus?: ScheduledTaskLastStatus;

  @Field({ nullable: true })
  lastError?: string;

  @Field()
  runCount: number;

  @Field({ nullable: true })
  slackAppConfigId?: string;

  @Field({ nullable: true })
  slackChannelId?: string;
}
