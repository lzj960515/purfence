import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class DeleteOnePurfenceIssueInput {
  @Field(() => ID)
  id: string;
}
