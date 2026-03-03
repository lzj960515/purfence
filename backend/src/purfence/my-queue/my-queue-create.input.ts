import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class MyQueueCreateInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @Field(() => Int, { defaultValue: 3 })
  @IsInt()
  @Min(1)
  maxConcurrency: number;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  attempts: number;

  @Field({ defaultValue: false })
  @IsBoolean()
  isPaused: boolean;
}
