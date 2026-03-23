import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';
import { ModelConfig } from '../type';

@InputType()
export class AgentHistoryCreateInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @Field(() => Int)
  @IsInt()
  version: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  instructions?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  changeDescription?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  parentId?: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  global: boolean;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tools?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @Field(() => GraphQLJSON, { nullable: true })
  @IsObject()
  @IsOptional()
  modelConfig?: ModelConfig;
}
