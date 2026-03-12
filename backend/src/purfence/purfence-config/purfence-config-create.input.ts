import { Field, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class PurfenceConfigCreateInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  value?: unknown;
}
