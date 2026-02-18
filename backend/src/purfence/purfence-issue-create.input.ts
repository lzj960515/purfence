import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { IssueOrigin } from './purfence-status.enum';

@InputType('PurfenceIssueCreateInput')
export class PurfenceIssueCreateInput {
  @IsNotEmpty()
  @Field(() => ID)
  projectId: string;

  @IsNotEmpty()
  @MaxLength(256)
  @Field()
  title: string;

  @IsNotEmpty()
  @Field()
  description: string;

  @IsNotEmpty()
  @MaxLength(48)
  @Field()
  slug: string;

  @IsOptional()
  @Field(() => ID, { nullable: true })
  dependsOnIssueId?: string;

  @IsOptional()
  @Field(() => IssueOrigin, { nullable: true })
  origin?: IssueOrigin;
}
