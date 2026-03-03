import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkflowConfig,
  WorkflowMode,
} from './entities/workflow-config.entity';
import {
  WorkflowConfigInput,
  UpdateWorkflowConfigInput,
} from './dto/workflow-config.input';
import { PurfenceIssue } from '../purfence/purfence-issue.entity';
import { PurfenceStatus } from '../purfence/purfence-status.enum';
import { PurfenceIssueService } from '../purfence/purfence-issue.service';
import { CompletionStrategyFactory } from './strategies/strategy.factory';
import { CompletionResult } from './strategies/completion-strategy.interface';
import {
  IssueStateMachine,
  TransitionContext,
} from './state-machine/issue-state-machine';

export const DEFAULT_WORKFLOW_CONFIG: Partial<WorkflowConfig> = {
  mode: WorkflowMode.STANDALONE,
  autoCreateIssue: true,
  autoMerge: true,
  autoPush: true,
  requireManualApproval: false,
};

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectRepository(WorkflowConfig)
    private readonly workflowConfigRepository: Repository<WorkflowConfig>,
    private readonly strategyFactory: CompletionStrategyFactory,
    private readonly stateMachine: IssueStateMachine,
    private readonly issueService: PurfenceIssueService,
  ) {}

  /**
   * Get workflow config by project ID
   */
  async findByProjectId(projectId: string): Promise<WorkflowConfig | null> {
    return this.workflowConfigRepository.findOne({
      where: { projectId },
    });
  }

  /**
   * Get or create default workflow config for a project
   */
  async getOrCreateConfig(projectId: string): Promise<WorkflowConfig> {
    let config = await this.findByProjectId(projectId);

    if (!config) {
      this.logger.log(
        `Creating default workflow config for project ${projectId}`,
      );
      config = this.workflowConfigRepository.create({
        projectId,
        ...DEFAULT_WORKFLOW_CONFIG,
      });
      await this.workflowConfigRepository.save(config);
    }

    return config;
  }

  /**
   * Configure workflow for a project
   */
  async configure(
    projectId: string,
    input: WorkflowConfigInput,
  ): Promise<WorkflowConfig> {
    let config = await this.findByProjectId(projectId);

    if (config) {
      // Update existing config
      Object.assign(config, input);
      this.logger.log(`Updated workflow config for project ${projectId}`);
    } else {
      // Create new config
      config = this.workflowConfigRepository.create({
        projectId,
        ...input,
      });
      this.logger.log(`Created workflow config for project ${projectId}`);
    }

    return this.workflowConfigRepository.save(config);
  }

  /**
   * Update workflow config
   */
  async update(
    projectId: string,
    input: UpdateWorkflowConfigInput,
  ): Promise<WorkflowConfig> {
    const config = await this.findByProjectId(projectId);

    if (!config) {
      throw new NotFoundException(
        `Workflow config not found for project ${projectId}`,
      );
    }

    Object.assign(config, input);
    this.logger.log(`Updated workflow config for project ${projectId}`);

    return this.workflowConfigRepository.save(config);
  }

  /**
   * Delete workflow config
   */
  async delete(projectId: string): Promise<boolean> {
    const result = await this.workflowConfigRepository.delete({ projectId });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Check if project is in collaborative mode
   */
  async isCollaborativeMode(projectId: string): Promise<boolean> {
    const config = await this.getOrCreateConfig(projectId);
    return config.mode === WorkflowMode.COLLABORATIVE;
  }

  /**
   * Check if project is in standalone mode
   */
  async isStandaloneMode(projectId: string): Promise<boolean> {
    const config = await this.getOrCreateConfig(projectId);
    return config.mode === WorkflowMode.STANDALONE;
  }

  /**
   * 完成 issue（根据工作流模式执行不同策略）
   */
  async completeIssue(issue: PurfenceIssue): Promise<CompletionResult> {
    this.logger.log(`Completing issue ${issue.id}`);

    // 1. 获取工作流配置
    const config = await this.getOrCreateConfig(issue.projectId);

    // 2. 获取对应策略
    const strategy = this.strategyFactory.getStrategy(config.mode);

    // 3. 检查是否可以完成
    const canComplete = await strategy.canComplete(issue);
    if (!canComplete) {
      const message = `Issue ${issue.id} cannot be completed: status is ${issue.status}`;
      this.logger.warn(message);
      throw new Error(message);
    }

    // 4. 执行完成策略
    const result = await strategy.complete(issue);

    // 5. 如果策略成功，使用状态机更新状态
    if (result.success) {
      const context: TransitionContext = { issue, workflowConfig: config };
      const nextState = result.nextState as PurfenceStatus;

      try {
        await this.stateMachine.transition(issue, nextState, context);
        await issue.save();
        this.logger.log(
          `Issue ${issue.id} state updated to ${nextState} via state machine`,
        );
      } catch (error) {
        // 状态机转换失败，但策略执行成功
        // 更新 issue 状态为策略返回的状态
        issue.status = nextState;
        await issue.save();
        this.logger.warn(
          `State machine transition failed for issue ${issue.id}, but status updated to ${nextState}`,
        );
      }
    }

    return result;
  }

  /**
   * 手动合并 issue（协作模式）
   */
  async manualMergeIssue(issueId: string): Promise<PurfenceIssue> {
    this.logger.log(`Manual merge requested for issue ${issueId}`);

    // 1. 获取 issue
    const issue = await PurfenceIssue.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException(`Issue ${issueId} not found`);
    }

    // 2. 检查状态是否为 needs_approval 或 running
    if (
      issue.status !== PurfenceStatus.needs_approval &&
      issue.status !== PurfenceStatus.running
    ) {
      throw new Error(
        `Issue ${issueId} cannot be merged: status is ${issue.status}, expected ${PurfenceStatus.needs_approval} or ${PurfenceStatus.running}`,
      );
    }

    // 3. 执行 git merge
    const mergeResult = await this.issueService.mergeBranch(issueId);

    if (!mergeResult.success) {
      const message = mergeResult.conflict
        ? `Merge conflict: ${mergeResult.conflict.message}`
        : 'Merge failed';
      throw new Error(message);
    }

    // 4. 使用状态机流转到 done
    const config = await this.getOrCreateConfig(issue.projectId);
    const context: TransitionContext = { issue, workflowConfig: config };

    try {
      await this.stateMachine.transition(issue, PurfenceStatus.done, context);
    } catch (error) {
      // 如果状态机不允许转换，直接设置状态
      this.logger.warn(
        `State machine transition failed for issue ${issueId}, setting status directly`,
      );
      issue.status = PurfenceStatus.done;
    }

    await issue.save();

    this.logger.log(`Issue ${issueId} manually merged and marked as done`);

    // 5. 返回 issue
    return issue;
  }

  /**
   * 手动推送 issue（协作模式）
   */
  async manualPushIssue(issueId: string): Promise<PurfenceIssue> {
    this.logger.log(`Manual push requested for issue ${issueId}`);

    // 1. 获取 issue
    const issue = await PurfenceIssue.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException(`Issue ${issueId} not found`);
    }

    // 2. 检查状态
    if (
      issue.status !== PurfenceStatus.needs_approval &&
      issue.status !== PurfenceStatus.running
    ) {
      throw new Error(
        `Issue ${issueId} cannot be pushed: status is ${issue.status}`,
      );
    }

    // 3. 获取项目信息
    const { PurfenceProject } =
      await import('../purfence/purfence-project.entity');
    const project = await PurfenceProject.findOne({
      where: { id: issue.projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project ${issue.projectId} not found`);
    }

    // 4. 执行 git push
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execFileAsync = promisify(execFile);

    const projectsRoot =
      process.env.PURFENCE_PROJECTS_ROOT || '/tmp/purfence-projects';
    const projectRootPath =
      project.localRootPath || `${projectsRoot}/${project.slug || project.id}`;
    const repoPath = `${projectRootPath}/repo`;

    const branchName = issue.branchSuffix
      ? `issue/${issue.id}-${issue.branchSuffix}`
      : `issue/${issue.id}`;

    try {
      await execFileAsync('git', ['push', 'origin', branchName], {
        cwd: repoPath,
      });
      this.logger.log(`Pushed branch ${branchName} for issue ${issueId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to push branch: ${errorMessage}`);
    }

    // 5. 返回 issue
    return issue;
  }

  /**
   * 检查 issue 是否可以转换到指定状态
   */
  async canTransitionTo(
    issue: PurfenceIssue,
    toState: PurfenceStatus,
  ): Promise<boolean> {
    const config = await this.getOrCreateConfig(issue.projectId);
    const context: TransitionContext = { issue, workflowConfig: config };
    return this.stateMachine.canTransition(issue.status, toState, context);
  }

  /**
   * 获取 issue 可以转移到的所有状态
   */
  async getAvailableTransitions(
    issue: PurfenceIssue,
  ): Promise<PurfenceStatus[]> {
    const config = await this.getOrCreateConfig(issue.projectId);
    const context: TransitionContext = { issue, workflowConfig: config };
    return this.stateMachine.getAvailableTransitions(issue.status, context);
  }
}
