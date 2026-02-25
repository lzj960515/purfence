import { Log } from '@nest-mods/log';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PurfenceExecutionService } from './purfence-execution.service';
import { PurfenceProjectService } from './purfence-project.service';
import { PurfenceIssueService } from './purfence-issue.service';
import { PurfenceIssue } from './purfence-issue.entity';
import { IssueOrigin, PurfenceStatus } from './purfence-status.enum';
import { IssueQueueService } from './issue-queue/issue-queue.service';

/**
 * Event listener service for Purfence module.
 * Handles all events emitted by EntitySubscriber and services.
 *
 * Uses liteque-based IssueQueueService for issue processing.
 */
@Injectable()
export class PurfenceEventListenerService {
  @Log() logger: Logger;

  constructor(
    private readonly executionService: PurfenceExecutionService,
    private readonly projectService: PurfenceProjectService,
    private readonly issueService: PurfenceIssueService,
    private readonly issueQueueService: IssueQueueService,
  ) {}

  /**
   * Handle purfence.issue.created event
   * Triggered by: PurfenceIssueSubscriber.afterInsert
   * Delay: 1000ms
   *
   * 将 Issue 加入 liteque 队列，由 Runner 自动调度执行
   */
  @OnEvent('purfence.issue.created')
  async handleIssueCreated(payload: { issueId: string }) {
    try {
      const { issueId } = payload;

      const issue = await PurfenceIssue.findOneOrFail({
        where: { id: issueId },
      });

      // AI 发起的 Issue 直接标记为 needs_user，不入队
      if (issue.origin === IssueOrigin.ai) {
        if (issue.status !== PurfenceStatus.needs_user) {
          issue.status = PurfenceStatus.needs_user;
          await issue.save();
        }
        this.logger.log(
          `Skipping queue for AI-originated issue: ${issueId}`,
        );
        return;
      }

      this.logger.log(
        `Enqueueing issue ${issueId} for processing`,
      );

      // 将 Issue 加入队列，延迟 1 秒后由 Runner 调度执行
      await this.issueQueueService.enqueue(issueId, {
        projectId: issue.projectId,
        title: issue.title,
        description: issue.description,
        origin: issue.origin,
      }, {
        delayMs: 1000,  // 延迟 1 秒入队
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle purfence.issue.created for issue ${payload.issueId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle purfence.project.created event
   * Triggered by: PurfenceProjectSubscriber.afterInsert
   * Delay: 1000ms
   */
  @OnEvent('purfence.project.created')
  async handleProjectCreated(payload: { projectId: string }) {
    try {
      const { projectId } = payload;

      this.logger.log(
        `Handling purfence.project.created for project: ${projectId}`,
      );

      const project =
        await this.projectService.initProjectFilesystem(projectId);

      if (project.externalPath) {
        // Import project: analyze existing code
        await this.executionService.analyzeImportedProject(projectId);
      } else {
        // New project: create default issue
        await this.issueService.createIssue({
          projectId: project.id,
          title: project.name!,
          slug: project.slug!,
          description: project.description || project.name!,
        });
      }

      return project;
    } catch (error) {
      this.logger.error(
        `Failed to handle purfence.project.created for project ${payload.projectId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle purfence.execution.execute event
   * Triggered by: PurfenceExecutionSubscriber.afterInsert, PurfenceExecutionService.continueExecution
   * Delay: 500ms
   */
  @OnEvent('purfence.execution.execute')
  async handleExecutionExecute(payload: { executionId: string }) {
    try {
      const { executionId } = payload;

      this.logger.log(
        `Handling purfence.execution.execute for execution: ${executionId}`,
      );

      return this.executionService.execute(executionId);
    } catch (error) {
      this.logger.error(
        `Failed to handle purfence.execution.execute for execution ${payload.executionId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle purfence.execution.evaluate event
   * Triggered by: MyAgentHooks.onEnd
   * Delay: 0ms (immediate)
   */
  @OnEvent('purfence.execution.evaluate')
  async handleExecutionEvaluate(payload: { executionId: string }) {
    try {
      const { executionId } = payload;

      this.logger.log(
        `Handling purfence.execution.evaluate for execution: ${executionId}`,
      );

      return this.executionService.evaluateAndScheduleNextStep(executionId);
    } catch (error) {
      this.logger.error(
        `Failed to handle purfence.execution.evaluate for execution ${payload.executionId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
