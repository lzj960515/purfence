import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class MyQueueUpdateInput {
  @Field({ nullable: true })
  name?: string;

  @Field(() => Int, { nullable: true })
  maxConcurrency?: number;

  @Field(() => Int, { nullable: true })
  attempts?: number;

  @Field({ nullable: true })
  isPaused?: boolean;
}
