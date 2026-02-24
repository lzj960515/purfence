import { BaseDto } from '@app/shared';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import { WorkflowMode } from '../entities/workflow-config.entity';

registerEnumType(WorkflowMode, {
  name: 'WorkflowMode',
  description: 'Workflow mode: standalone or collaborative',
});

@ObjectType('WorkflowConfig')
export class WorkflowConfigDto extends BaseDto {
  @FilterableField()
  projectId: string;

  @FilterableField(() => WorkflowMode)
  mode: WorkflowMode;

  @Field()
  autoCreateIssue: boolean;

  @Field()
  autoMerge: boolean;

  @Field()
  autoPush: boolean;

  @Field()
  requireManualApproval: boolean;
}
