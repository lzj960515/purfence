import { Field, InputType } from '@nestjs/graphql';
import { MaxLength } from 'class-validator';
import { PurfenceStatus } from './purfence-status.enum';

@InputType('PurfenceIssueUpdateInput')
export class PurfenceIssueUpdateInput {
  @MaxLength(256)
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => PurfenceStatus, { nullable: true })
  status?: PurfenceStatus;
}
