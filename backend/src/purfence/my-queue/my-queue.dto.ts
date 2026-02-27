import { BaseDto } from '@app/shared';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';

@ObjectType('MyQueue')
export class MyQueueDto extends BaseDto {
  @FilterableField()
  name: string;

  @FilterableField(() => Int)
  maxConcurrency: number;

  @FilterableField(() => Int)
  attempts: number;

  @FilterableField()
  isPaused: boolean;
}
