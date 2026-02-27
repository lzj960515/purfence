import { MyQueueService } from '@app/my-queue';
import { Log } from '@nest-mods/log';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PurfenceExecutionService } from './purfence-execution.service';
import { PurfenceProjectService } from './purfence-project.service';
import { PurfenceIssueService } from './purfence-issue.service';
import { PurfenceExecution } from './purfence-execution.entity';
import { IssueOrigin, PurfenceStatus } from './purfence-status.enum';
import { PurfenceIssue } from './purfence-issue.entity';

@Injectable()
export class PurfenceEventListenerService {
  @Log() logger: Logger;

  constructor(
    private readonly executionService: PurfenceExecutionService,
    private readonly projectService: PurfenceProjectService,
    private readonly issueService: PurfenceIssueService,
    private readonly myQueueService: MyQueueService,
  ) {}

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
        this.logger.log(`Skipping queue for AI-originated issue: ${issueId}`);
        return;
      }

      this.logger.log(`Enqueueing issue ${issueId} for processing`);

      await this.issueService.startIssue(issueId);
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

      return await this.executionService.execute(executionId);
    } catch (error) {
      await this.nackByExecutionId(payload.executionId, error);
      await PurfenceExecution.update(payload.executionId, {
        status: PurfenceStatus.failed,
        error: error instanceof Error ? error.message : String(error),
      });
      this.logger.error(
        `Failed to handle purfence.execution.execute for execution ${payload.executionId}: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('execution-queue')
  async handleExecutionQueueDispatch(queueJobId: string, payload: unknown) {
    const executionId = this.resolveExecutionId(payload);
    if (!executionId) {
      await this.myQueueService.nack({
        jobId: queueJobId,
        reason: 'execution-queue payload is missing executionId',
      });
      return;
    }

    try {
      const execution = await PurfenceExecution.findOne({
        where: { id: executionId },
      });
      if (!execution) {
        await this.myQueueService.nack({
          jobId: queueJobId,
          reason: `execution not found: ${executionId}`,
        });
        return;
      }

      if (!execution.queueJobId || execution.queueJobId !== queueJobId) {
        execution.queueJobId = queueJobId;
        await execution.save();
      }

      await this.executionService.execute(executionId);
    } catch (error) {
      await this.myQueueService.nack({
        jobId: queueJobId,
        reason: error instanceof Error ? error.message : String(error),
      });
      await PurfenceExecution.update(executionId, {
        status: PurfenceStatus.failed,
        error: error instanceof Error ? error.message : String(error),
      });
      this.logger.error(
        `Failed to execute queue job ${queueJobId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent('purfence.agent.on-end.success')
  async handleAgentOnEndSuccess(payload: {
    conversationId: string;
    context: Record<string, unknown>;
  }) {
    const eventName = this.contextString(payload.context, 'event');
    if (eventName !== 'purfence.evaluation.stream-ended') {
      return;
    }

    const queueJobId = await this.resolveQueueJobId(payload);
    if (!queueJobId) {
      return;
    }

    await this.myQueueService.ack(queueJobId);
  }

  @OnEvent('purfence.agent.on-end.failure')
  async handleAgentOnEndFailure(payload: {
    conversationId: string;
    context: Record<string, unknown>;
    error?: unknown;
  }) {
    const queueJobId = await this.resolveQueueJobId(payload);
    if (!queueJobId) {
      return;
    }

    await this.myQueueService.nack({
      jobId: queueJobId,
      reason: this.failureReason(payload.error),
    });
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

      return await this.executionService.evaluateAndScheduleNextStep(
        executionId,
      );
    } catch (error) {
      await this.nackByExecutionId(payload.executionId, error);
      this.logger.error(
        `Failed to handle purfence.execution.evaluate for execution ${payload.executionId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private resolveExecutionId(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }
    const executionId = (payload as { executionId?: unknown }).executionId;
    return typeof executionId === 'string' && executionId.trim()
      ? executionId
      : undefined;
  }

  private async resolveQueueJobId(payload: {
    conversationId: string;
    context: Record<string, unknown>;
  }): Promise<string | undefined> {
    const executionId =
      this.contextString(payload.context, 'executionId') ??
      payload.conversationId;
    if (!executionId) {
      return undefined;
    }

    const execution = await PurfenceExecution.findOne({
      where: { id: executionId },
    });
    if (execution?.status !== PurfenceStatus.done) {
      return undefined;
    }
    return execution?.queueJobId?.trim() || undefined;
  }

  private async nackByExecutionId(
    executionId: string,
    error: unknown,
  ): Promise<void> {
    const execution = await PurfenceExecution.findOne({
      where: { id: executionId },
    });
    const queueJobId = execution?.queueJobId?.trim();
    if (!queueJobId) {
      return;
    }

    await this.myQueueService.nack({
      jobId: queueJobId,
      reason: this.failureReason(error),
    });
  }

  private contextString(
    context: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value = context[key];
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private failureReason(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    return 'agent onEnd failed';
  }
}
