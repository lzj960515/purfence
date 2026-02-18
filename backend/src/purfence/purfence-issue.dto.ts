import { BaseDto } from '@app/shared';
import { Field, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import { PurfenceStatus } from './purfence-status.enum';

@ObjectType('PurfenceIssue')
export class PurfenceIssueDto extends BaseDto {
  @FilterableField()
  projectId: string;

  @FilterableField()
  title: string;

  @Field()
  description: string;

  @FilterableField(() => PurfenceStatus)
  status: PurfenceStatus;

  @FilterableField({ nullable: true })
  latestExecutionId?: string;

  @Field({ nullable: true })
  workdir?: string;
}
