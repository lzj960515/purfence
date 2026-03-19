import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ScheduledTaskKind } from './scheduled-task.enum';

@InputType()
export class ScheduledTaskCreateInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  prompt: string;

  @Field(() => ScheduledTaskKind)
  kind: ScheduledTaskKind;

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
