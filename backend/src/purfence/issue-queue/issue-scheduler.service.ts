import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { IssueQueueService } from './issue-queue.service';
import { PurfenceIssueService } from '../purfence-issue.service';
import { PurfenceConfigService } from '../purfence-config/purfence-config.service';
import { IssueQueue, IssueQueueStatus } from './issue-queue.entity';
import { PurfenceIssue } from '../purfence-issue.entity';
import { IssueOrigin, PurfenceStatus } from '../purfence-status.enum';
import { DataSource } from 'typeorm';

@Injectable()
export class IssueSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IssueSchedulerService.name);
  private readonly processingIssueIds = new Set<string>();
  private isShuttingDown = false;
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly issueQueueService: IssueQueueService,
    private readonly issueService: PurfenceIssueService,
    private readonly configService: PurfenceConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    this.logger.log('IssueSchedulerService initialized');
    this.logger.debug('Scheduler interval: 5000ms');
    // 启动时恢复处理中的任务（上次重启前未完成的）
    await this.recoverProcessingIssues();

    // 使用 setInterval 替代 @Interval 装饰器
    this.schedulerInterval = setInterval(() => {
      this.processQueue().catch(err => {
        this.logger.error('Failed to process queue: ' + err?.message);
      });
    }, 5000);

    this.logger.log('✅ Scheduler interval started (5000ms)');
    // 立即执行一次
    await this.processQueue();
  }

  async onModuleDestroy() {
    this.logger.log('IssueSchedulerService shutting down...');
    this.isShuttingDown = true;

    // 清理定时器
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      this.logger.debug('Scheduler interval cleared');
    }

    // 等待正在处理的任务完成（最多等待 30 秒）
    const maxWaitTime = 30000;
    const startTime = Date.now();

    while (this.processingIssueIds.size > 0) {
      if (Date.now() - startTime > maxWaitTime) {
        this.logger.warn(
          `Timeout waiting for ${this.processingIssueIds.size} issues to complete`,
        );
        break;
      }
      this.logger.log(
        `Waiting for ${this.processingIssueIds.size} issues to complete...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.logger.log('IssueSchedulerService shutdown complete');
  }

  /**
   * 定时检查并处理队列中的 Issue
   * 每 5 秒执行一次
   */
  async processQueue() {
    this.logger.debug('🔍 processQueue triggered');

    if (this.isShuttingDown) {
      this.logger.debug('⏸️  Skipping: shutting down');
      return;
    }

    try {
      const maxConcurrency = await this.configService.getMaxIssueConcurrency();
      const processingCount = this.processingIssueIds.size;
      this.logger.debug(`📊 Concurrency: ${processingCount}/${maxConcurrency}`);

      // 如果已达到最大并发数，跳过
      if (processingCount >= maxConcurrency) {
        this.logger.debug('🛑 Max concurrency reached, skip');
        return;
      }

      // 计算可处理的槽位数
      const availableSlots = maxConcurrency - processingCount;

      // 并行处理多个槽位
      const tasks: Promise<boolean>[] = [];
      for (let i = 0; i < availableSlots; i++) {
        tasks.push(this.processNextIssue());
      }

      const results = await Promise.all(tasks);
      this.logger.debug(`🎯 Queue round done, results: ${JSON.stringify(results)}`);
    } catch (error) {
      this.logger.error(
        `❌ Error processing queue: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 处理队列中的下一个 Issue
   */
  private async processNextIssue(): Promise<boolean> {
    // 传入当前正在处理的 issue IDs，防止重复取出同一个 issue
    const queueItem = await this.issueQueueService.dequeue(
      Array.from(this.processingIssueIds)
    );

    if (!queueItem) {
      this.logger.debug('ℹ️ No pending item to process');
      return false;
    }

    this.logger.debug(`🚀 Starting processing issueId=${queueItem.issueId}`);

    // 开始异步处理，使用 .catch 确保错误被处理
    this.executeIssue(queueItem).catch((error) => {
      this.logger.error(
        `Unhandled error in executeIssue for ${queueItem.issueId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    });

    return true;
  }

  /**
   * 执行 Issue
   */
  private async executeIssue(queueItem: IssueQueue): Promise<void> {
    const { issueId } = queueItem;

    // 检查是否已经在处理中（防止重复）
    if (this.processingIssueIds.has(issueId)) {
      this.logger.warn(`Issue ${issueId} is already being processed`);
      // 将队列项重新放回 pending 状态，让其他工作进程处理
      await this.issueQueueService.markAsPending(issueId);
      return;
    }

    this.processingIssueIds.add(issueId);

    try {
      this.logger.log(`Starting execution of issue ${issueId}`);

      // 获取 Issue 信息
      const issue = await PurfenceIssue.findOne({ where: { id: issueId } });

      if (!issue) {
        throw new Error(`Issue ${issueId} not found`);
      }

      // 跳过 AI 发起的 Issue（需要用户确认）
      if (issue.origin === IssueOrigin.ai) {
        if (issue.status !== PurfenceStatus.needs_user) {
          issue.status = PurfenceStatus.needs_user;
          await issue.save();
        }
        await this.issueQueueService.markAsCompleted(issueId);
        this.logger.log(`AI-originated issue ${issueId} marked as needs_user`);
        return;
      }

      // 执行 Issue
      await this.issueService.startIssue(issueId);

      // 标记为完成
      await this.issueQueueService.markAsCompleted(issueId);
      this.logger.log(`Issue ${issueId} execution completed`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to execute issue ${issueId}: ${errorMessage}`);

      // 如果是因为已经在运行，不要标记为失败，而是重置为 pending
      if (
        errorMessage.includes('already running') ||
        errorMessage.includes('正在运行')
      ) {
        this.logger.warn(
          `Issue ${issueId} is already running in another process, resetting to pending`,
        );
        await this.issueQueueService.markAsPending(issueId);
      } else {
        // 标记为失败
        await this.issueQueueService.markAsFailed(issueId, errorMessage);
      }
    } finally {
      this.processingIssueIds.delete(issueId);
    }
  }

  /**
   * 恢复处理中的 Issue（系统重启后）
   * 将上次重启前处于 processing 状态的任务重置为 pending
   */
  private async recoverProcessingIssues(): Promise<void> {
    try {
      // 使用批量更新，而不是逐个更新
      const result = await this.dataSource
        .createQueryBuilder()
        .update(IssueQueue)
        .set({
          status: IssueQueueStatus.pending,
          startedAt: undefined as unknown as Date,
        })
        .where('status = :status', { status: IssueQueueStatus.processing })
        .execute();

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Recovered ${result.affected} processing issues from previous session`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to recover processing issues: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 获取当前处理中的 Issue 数量
   */
  getProcessingCount(): number {
    return this.processingIssueIds.size;
  }

  /**
   * 获取当前正在处理的 Issue ID 列表
   */
  getProcessingIssueIds(): string[] {
    return Array.from(this.processingIssueIds);
  }
}
