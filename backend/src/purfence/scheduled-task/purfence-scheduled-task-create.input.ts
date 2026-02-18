import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PurfenceScheduledTaskKind } from './purfence-scheduled-task.enum';

@InputType()
export class PurfenceScheduledTaskCreateInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  prompt: string;

  @Field(() => PurfenceScheduledTaskKind)
  kind: PurfenceScheduledTaskKind;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  cronExpr?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  runAt?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slackAppConfigId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slackChannelId?: string;
}
