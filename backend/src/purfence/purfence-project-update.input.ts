import { Field, InputType } from '@nestjs/graphql';
import { MaxLength } from 'class-validator';

@InputType('PurfenceProjectUpdateInput')
export class PurfenceProjectUpdateInput {
  @MaxLength(128)
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @MaxLength(64)
  @Field({ nullable: true })
  slackAppConfigId?: string;

  @MaxLength(128)
  @Field({ nullable: true })
  slackChannelId?: string;
}
