import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RemoteIssueDto {
  @Field(() => String)
  remoteIssueId: string;

  @Field(() => Int)
  remoteIssueNumber: number;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String)
  state: string;

  @Field(() => [String])
  labels: string[];

  @Field(() => [String])
  assignees: string[];

  @Field(() => String)
  remoteUrl: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
