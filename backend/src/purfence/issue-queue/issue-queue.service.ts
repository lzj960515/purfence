import { Injectable, Logger } from '@nestjs/common';
import { IssueQueue, IssueQueueStatus } from './issue-queue.entity';

@Injectable()
export class IssueQueueService {
  private readonly logger = new Logger(IssueQueueService.name);

  constructor() {}

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
   * 使用普通查询（SQLite 不支持悲观锁）
   * @param excludeIds 需要排除的 issue ID 列表（已在处理中的）
   */
  async dequeue(excludeIds: string[] = []): Promise<IssueQueue | null> {
    // 构建查询条件
    const whereCondition: any = {
      status: IssueQueueStatus.pending,
    };

    // 如果需要排除某些 ID，添加 NOT IN 条件
    if (excludeIds.length > 0) {
      whereCondition.id = { $nin: excludeIds };
    }

    // 使用普通的 TypeORM 查询，不使用锁
    const pendingItem = await IssueQueue.findOne({
      where: whereCondition,
      order: {
        priority: 'DESC',
        createdAt: 'ASC',
      },
    });

    if (!pendingItem) {
      return null;
    }

    // 更新状态为处理中
    pendingItem.status = IssueQueueStatus.processing;
    pendingItem.startedAt = new Date();
    await pendingItem.save();

    return pendingItem;
  }

  /**
   * 批量从队列中取出待处理的 Issue
   * 一次性取出多个，减少数据库查询次数
   * @param limit 取出的最大数量
   */
  async dequeueBatch(limit: number): Promise<IssueQueue[]> {
    if (limit <= 0) return [];

    const items = await IssueQueue.find({
      where: { status: IssueQueueStatus.pending },
      order: { priority: 'DESC', createdAt: 'ASC' },
      take: limit,
    });

    if (items.length === 0) return [];

    // 批量更新状态
    const now = new Date();
    for (const item of items) {
      item.status = IssueQueueStatus.processing;
      item.startedAt = now;
    }
    await IssueQueue.save(items);

    this.logger.debug(`Dequeued ${items.length} issues in batch`);
    return items;
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
