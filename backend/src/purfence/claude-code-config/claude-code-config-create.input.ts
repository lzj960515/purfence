import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

@InputType()
export class ClaudeCodeEnvItemInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  key: string;

  @Field()
  @IsString()
  value: string;
}

@InputType()
export class ClaudeCodeConfigCreateInput {
  @Field({ defaultValue: true })
  @IsBoolean()
  useDefaultConfig: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  modelProviderId?: string;

  @Field(() => [ClaudeCodeEnvItemInput], { nullable: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaudeCodeEnvItemInput)
  @IsOptional()
  env?: ClaudeCodeEnvItemInput[];
}
