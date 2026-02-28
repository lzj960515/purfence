import { BaseDto } from '@app/shared';
import { MyQueueJobStatus } from '@app/my-queue';
import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import { GraphQLJSON } from 'graphql-scalars';

registerEnumType(MyQueueJobStatus, {
  name: 'MyQueueJobStatus',
});

@ObjectType('MyQueueJob')
export class MyQueueJobDto extends BaseDto {
  @FilterableField()
  queueName: string;

  @FilterableField()
  queueId: string;

  @Field(() => GraphQLJSON)
  data: unknown;

  @FilterableField(() => MyQueueJobStatus)
  status: MyQueueJobStatus;

  @Field()
  availableAt: Date;

  @Field({ nullable: true })
  runningAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field(() => Int)
  attempts: number;

  @Field(() => Int)
  runCount: number;

  @Field({ nullable: true })
  errorMessage?: string;
}
