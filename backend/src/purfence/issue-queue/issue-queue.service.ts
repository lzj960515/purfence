import { Injectable, Logger } from '@nestjs/common';
import { IssueQueue, IssueQueueStatus } from './issue-queue.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class IssueQueueService {
  private readonly logger = new Logger(IssueQueueService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * 将 Issue 加入队列
   * 使用 try-catch 处理唯一约束冲突
   */
  async enqueue(
    issueId: string,
    payload: IssueQueue['payload'],
    priority = 0,
  ): Promise<IssueQueue> {
    try {
      const queueItem = IssueQueue.create({
        issueId,
        status: IssueQueueStatus.pending,
        priority,
        payload,
      });

      await queueItem.save();
      this.logger.log(`Issue ${issueId} enqueued with priority ${priority}`);

      return queueItem;
    } catch (error: any) {
      // 处理唯一约束冲突 (SQLite: SQLITE_CONSTRAINT_UNIQUE, MySQL: ER_DUP_ENTRY, PostgreSQL: 23505)
      if (
        error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        error.code === 'ER_DUP_ENTRY' ||
        error.code === '23505' ||
        error.message?.includes('UNIQUE constraint failed')
      ) {
        this.logger.warn(
          `Issue ${issueId} is already in queue, skipping enqueue`,
        );
        const existing = await IssueQueue.findOne({ where: { issueId } });
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  /**
   * 从队列中取出一个待处理的 Issue
   * 使用 SELECT FOR UPDATE (悲观锁) 确保并发安全
   */
  async dequeue(): Promise<IssueQueue | null> {
    return this.dataSource.transaction(async (manager) => {
      // 使用 query builder 获取行锁 (SELECT FOR UPDATE)
      const pendingItem = await manager
        .createQueryBuilder(IssueQueue, 'queue')
        .setLock('pessimistic_write')
        .where('queue.status = :status', { status: IssueQueueStatus.pending })
        .orderBy('queue.priority', 'DESC')
        .addOrderBy('queue.createdAt', 'ASC')
        .getOne();

      if (!pendingItem) {
        return null;
      }

      // 更新状态为处理中
      pendingItem.status = IssueQueueStatus.processing;
      pendingItem.startedAt = new Date();
      await manager.save(pendingItem);

      return pendingItem;
    });
  }

  /**
   * 标记 Issue 为处理中
   * 只允许从 pending 状态转换
   */
  async markAsProcessing(issueId: string): Promise<void> {
    const result = await IssueQueue.update(
      { issueId, status: IssueQueueStatus.pending },
      {
        status: IssueQueueStatus.processing,
        startedAt: new Date(),
      },
    );

    if (result.affected === 0) {
      this.logger.warn(
        `Failed to mark issue ${issueId} as processing: not in pending state or not found`,
      );
    } else {
      this.logger.log(`Issue ${issueId} marked as processing`);
    }
  }

  /**
   * 标记 Issue 为已完成
   */
  async markAsCompleted(issueId: string): Promise<void> {
    await IssueQueue.update(
      { issueId },
      {
        status: IssueQueueStatus.completed,
        completedAt: new Date(),
      },
    );
    this.logger.log(`Issue ${issueId} marked as completed`);
  }

  /**
   * 标记 Issue 为失败
   */
  async markAsFailed(issueId: string, errorMessage: string): Promise<void> {
    await IssueQueue.update(
      { issueId },
      {
        status: IssueQueueStatus.failed,
        completedAt: new Date(),
        errorMessage,
      },
    );
    this.logger.log(`Issue ${issueId} marked as failed: ${errorMessage}`);
  }

  /**
   * 重置 Issue 为待处理状态（用于重试）
   */
  async markAsPending(issueId: string): Promise<void> {
    const result = await IssueQueue.update(
      { issueId },
      {
        status: IssueQueueStatus.pending,
        startedAt: undefined,
        errorMessage: undefined,
      },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(`Issue ${issueId} reset to pending state`);
    }
  }

  /**
   * 获取当前处理中的 Issue 数量
   */
  async getProcessingCount(): Promise<number> {
    return IssueQueue.count({
      where: { status: IssueQueueStatus.processing },
    });
  }

  /**
   * 获取队列长度（待处理数量）
   */
  async getPendingCount(): Promise<number> {
    return IssueQueue.count({
      where: { status: IssueQueueStatus.pending },
    });
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const [pending, processing, completed, failed] = await Promise.all([
      IssueQueue.count({ where: { status: IssueQueueStatus.pending } }),
      IssueQueue.count({ where: { status: IssueQueueStatus.processing } }),
      IssueQueue.count({ where: { status: IssueQueueStatus.completed } }),
      IssueQueue.count({ where: { status: IssueQueueStatus.failed } }),
    ]);

    return { pending, processing, completed, failed };
  }

  /**
   * 从队列中移除指定 Issue
   */
  async removeFromQueue(issueId: string): Promise<void> {
    await IssueQueue.delete({ issueId });
    this.logger.log(`Issue ${issueId} removed from queue`);
  }

  /**
   * 获取指定 Issue 的队列状态
   */
  async getQueueItem(issueId: string): Promise<IssueQueue | null> {
    return IssueQueue.findOne({ where: { issueId } });
  }
}
