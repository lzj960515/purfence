import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { WorkflowMode } from '../entities/workflow-config.entity';

@InputType('WorkflowConfigInput')
export class WorkflowConfigInput {
  @IsEnum(WorkflowMode)
  @Field(() => WorkflowMode)
  mode: WorkflowMode;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  autoCreateIssue?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  autoMerge?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  autoPush?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  requireManualApproval?: boolean;
}

@InputType('UpdateWorkflowConfigInput')
export class UpdateWorkflowConfigInput {
  @IsOptional()
  @IsEnum(WorkflowMode)
  @Field(() => WorkflowMode, { nullable: true })
  mode?: WorkflowMode;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  autoCreateIssue?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  autoMerge?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  autoPush?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  requireManualApproval?: boolean;
}

@InputType('ConfigureWorkflowArgs')
export class ConfigureWorkflowArgs {
  @Field(() => ID)
  projectId: string;

  @Field(() => WorkflowConfigInput)
  config: WorkflowConfigInput;
}
