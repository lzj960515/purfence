import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { WorkflowConfigDto } from './dto/workflow-config.dto';
import {
  ConfigureWorkflowArgs,
  UpdateWorkflowConfigInput,
  WorkflowConfigInput,
} from './dto/workflow-config.input';
import { WorkflowService } from './workflow.service';
import { PurfenceIssue } from '../purfence/purfence-issue.entity';
import { PurfenceIssueDto } from '../purfence/purfence-issue.dto';
import { PurfenceStatus } from '../purfence/purfence-status.enum';

@Resolver(() => WorkflowConfigDto)
export class WorkflowResolver {
  constructor(private readonly workflowService: WorkflowService) {}

  @Query(() => WorkflowConfigDto, { nullable: true })
  async workflowConfig(
    @Args('projectId') projectId: string,
  ): Promise<WorkflowConfigDto | null> {
    const config = await this.workflowService.findByProjectId(projectId);
    return config as WorkflowConfigDto | null;
  }

  @Query(() => WorkflowConfigDto)
  async workflowConfigOrDefault(
    @Args('projectId') projectId: string,
  ): Promise<WorkflowConfigDto> {
    const config = await this.workflowService.getOrCreateConfig(projectId);
    return config as WorkflowConfigDto;
  }

  @Mutation(() => WorkflowConfigDto)
  async configureWorkflow(
    @Args('input') args: ConfigureWorkflowArgs,
  ): Promise<WorkflowConfigDto> {
    const config = await this.workflowService.configure(
      args.projectId,
      args.config,
    );
    return config as WorkflowConfigDto;
  }

  @Mutation(() => WorkflowConfigDto)
  async updateWorkflowConfig(
    @Args('projectId') projectId: string,
    @Args('input') input: UpdateWorkflowConfigInput,
  ): Promise<WorkflowConfigDto> {
    const config = await this.workflowService.update(projectId, input);
    return config as WorkflowConfigDto;
  }

  @Mutation(() => Boolean)
  async deleteWorkflowConfig(
    @Args('projectId') projectId: string,
  ): Promise<boolean> {
    return this.workflowService.delete(projectId);
  }

  /**
   * 完成 issue（根据工作流模式执行不同策略）
   */
  @Mutation(() => PurfenceIssueDto)
  async completeIssue(
    @Args('issueId', { type: () => ID }) issueId: string,
  ): Promise<PurfenceIssueDto> {
    const issue = await PurfenceIssue.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException(`Issue ${issueId} not found`);
    }

    await this.workflowService.completeIssue(issue);
    return issue as PurfenceIssueDto;
  }

  /**
   * 手动合并 issue（协作模式）
   */
  @Mutation(() => PurfenceIssueDto)
  async manualMergeIssue(
    @Args('issueId', { type: () => ID }) issueId: string,
  ): Promise<PurfenceIssueDto> {
    const issue = await this.workflowService.manualMergeIssue(issueId);
    return issue as PurfenceIssueDto;
  }

  /**
   * 手动推送 issue（协作模式）
   */
  @Mutation(() => PurfenceIssueDto)
  async manualPushIssue(
    @Args('issueId', { type: () => ID }) issueId: string,
  ): Promise<PurfenceIssueDto> {
    const issue = await this.workflowService.manualPushIssue(issueId);
    return issue as PurfenceIssueDto;
  }

  /**
   * 检查 issue 是否可以完成
   */
  @Query(() => Boolean)
  async canCompleteIssue(
    @Args('issueId', { type: () => ID }) issueId: string,
  ): Promise<boolean> {
    const issue = await PurfenceIssue.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException(`Issue ${issueId} not found`);
    }

    return this.workflowService.canTransitionTo(issue, PurfenceStatus.done);
  }

  /**
   * 获取 issue 可以转移到的所有状态
   */
  @Query(() => [PurfenceStatus])
  async getAvailableIssueTransitions(
    @Args('issueId', { type: () => ID }) issueId: string,
  ): Promise<PurfenceStatus[]> {
    const issue = await PurfenceIssue.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException(`Issue ${issueId} not found`);
    }

    return this.workflowService.getAvailableTransitions(issue);
  }
}
