import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ImportRemoteIssueInput {
  @Field(() => String)
  projectId: string;

  @Field(() => String)
  remoteIssueId: string;
}
