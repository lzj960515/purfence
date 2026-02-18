import { BaseDto } from '@app/shared';
import { Field, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import { PurfenceStatus } from './purfence-status.enum';

@ObjectType('PurfenceExecution')
export class PurfenceExecutionDto extends BaseDto {
  @FilterableField()
  projectId: string;

  @FilterableField()
  issueId: string;

  @Field({ nullable: true })
  goal?: string;

  @FilterableField()
  conversationId: string;

  @Field({ nullable: true })
  parentExecutionId?: string;

  @FilterableField(() => PurfenceStatus)
  status: PurfenceStatus;

  @Field({ nullable: true })
  branchName?: string;

  @Field({ nullable: true })
  worktreePath?: string;

  @Field({ nullable: true })
  executionDir?: string;

  @Field({ nullable: true })
  error?: string;

  @Field({ nullable: true })
  jobQueryUrl?: string;
}
