import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsObject, IsString, MaxLength, Min } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class MyQueueJobCreateInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  queueName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  queueId: string;

  @Field(() => GraphQLJSON)
  @IsObject()
  data: Record<string, unknown>;

  @Field()
  availableAt: Date;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  attempts: number;
}
