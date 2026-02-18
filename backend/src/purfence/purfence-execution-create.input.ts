import { Field, InputType } from '@nestjs/graphql';

@InputType('PurfenceExecutionCreateInput')
export class PurfenceExecutionCreateInput {
  @Field({ nullable: true })
  goal?: string;

  @Field({ nullable: true })
  parentExecutionId?: string;
}
