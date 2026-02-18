import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import _ from 'lodash';
import { ModelOptions } from '@app/my-agent/types';

export class SseSocketArgs {
  @IsNotEmpty()
  @IsString()
  threadId?: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  resume?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  model?: ModelOptions['model'];

  @IsOptional()
  @IsString()
  configurationName?: string;

  @Transform(({ value }) => {
    if (_.isNil(value)) return;
    if (_.isString(value)) return [value];
    return value;
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalToolkits?: string[];
}

export class SseAllInOneArgs extends SseSocketArgs {
  @IsNotEmpty()
  @IsString()
  agent: string;

  @Transform(({ value }) => {
    if (_.isNil(value)) return;
    if (_.isString(value)) return [value];
    return value;
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];
}

export class ChatAnyArgs {
  @IsString()
  threadId: string;

  @IsOptional()
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  resume: string;

  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsString()
  imageUrl: string;
}
