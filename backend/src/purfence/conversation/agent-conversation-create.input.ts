import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class AgentConversationCreateInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  userId?: string;

  @Field({ nullable: true })
  @IsString()
  @MaxLength(256)
  @IsOptional()
  title?: string;
}
