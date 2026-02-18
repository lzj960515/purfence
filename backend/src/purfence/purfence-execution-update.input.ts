import { Field, InputType } from '@nestjs/graphql';
import { PurfenceStatus } from './purfence-status.enum';

@InputType('PurfenceExecutionUpdateInput')
export class PurfenceExecutionUpdateInput {
  @Field({ nullable: true })
  goal?: string;

  @Field(() => PurfenceStatus, { nullable: true })
  status?: PurfenceStatus;

  @Field({ nullable: true })
  error?: string;
}
