import { CommonService } from '@src/common/common.service';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { LessThanOrEqual } from 'typeorm';
import {
  MyQueueAckResult,
  MyQueueAddJobOptions,
  MyQueueJobId,
  MyQueueNackInput,
} from './my-queue.contract';
import { MyQueueJob } from './my-queue-job.entity';
import { MyQueueJobStatus } from './my-queue-job-status.enum';
import { MyQueue } from './my-queue.entity';

@Injectable()
export class MyQueueService implements OnModuleInit, OnModuleDestroy {
  private static readonly DEFAULT_MAX_CONCURRENCY = 3;
  private static readonly DEFAULT_ATTEMPTS = 1;
  private static readonly DISPATCH_INTERVAL_MS = 1000;
  private static readonly STALE_CHECK_INTERVAL_MS = 60_000;
  private static readonly RUNNING_TIMEOUT_MS = 60 * 60 * 1000;

  private readonly logger = new Logger(MyQueueService.name);
  private dispatchTimer?: NodeJS.Timeout;
  private staleCheckTimer?: NodeJS.Timeout;
  private isDispatching = false;
  private isCheckingStale = false;

  async onModuleInit(): Promise<void> {
    this.dispatchTimer = setInterval(() => {
      void this.dispatch();
    }, MyQueueService.DISPATCH_INTERVAL_MS);
    this.dispatchTimer.unref();

    this.staleCheckTimer = setInterval(() => {
      void this.checkStaleRunningJobs();
    }, MyQueueService.STALE_CHECK_INTERVAL_MS);
    this.staleCheckTimer.unref();

    await this.dispatch();
    await this.checkStaleRunningJobs();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.dispatchTimer) {
      clearInterval(this.dispatchTimer);
      this.dispatchTimer = undefined;
    }
    if (this.staleCheckTimer) {
      clearInterval(this.staleCheckTimer);
      this.staleCheckTimer = undefined;
    }
  }

  async addJob(
    queueName: string,
    data: unknown,
    options: MyQueueAddJobOptions = {},
  ): Promise<MyQueueJobId> {
    const queue = await this.resolveQueue(queueName, options);
    const job = MyQueueJob.create({
      queueId: queue.id,
      queueName: queue.name,
      data,
      status: MyQueueJobStatus.pending,
      availableAt: this.resolveAvailableAt(options),
      attempts: queue.attempts,
      runCount: 0,
    });
    const saved = await job.save();
    return saved.id;
  }

  async ack(jobId: MyQueueJobId): Promise<MyQueueAckResult> {
    await MyQueueJob.update(
      {
        id: jobId,
        status: MyQueueJobStatus.running,
      },
      {
        status: MyQueueJobStatus.succeeded,
        completedAt: new Date(),
      },
    );

    return {
      jobId,
      status: MyQueueJobStatus.succeeded,
    };
  }

  async nack(input: MyQueueNackInput): Promise<MyQueueAckResult> {
    await MyQueueJob.update(
      {
        id: input.jobId,
        status: MyQueueJobStatus.running,
      },
      {
        status: MyQueueJobStatus.failed,
        errorMessage: input.reason,
        completedAt: new Date(),
      },
    );

    return {
      jobId: input.jobId,
      status: MyQueueJobStatus.failed,
    };
  }

  private async resolveQueue(
    queueName: string,
    options: MyQueueAddJobOptions,
  ): Promise<MyQueue> {
    const existingQueue = await MyQueue.findOne({ where: { name: queueName } });
    if (!existingQueue) {
      const createdQueue = MyQueue.create({
        name: queueName,
        maxConcurrency: this.normalizePositiveInt(
          options.maxConcurrency,
          MyQueueService.DEFAULT_MAX_CONCURRENCY,
        ),
        attempts: this.normalizePositiveInt(
          options.attempts,
          MyQueueService.DEFAULT_ATTEMPTS,
        ),
        isPaused: options.isPaused ?? false,
      });
      return createdQueue.save();
    }

    let changed = false;

    if (options.maxConcurrency !== undefined) {
      const nextMaxConcurrency = this.normalizePositiveInt(
        options.maxConcurrency,
        existingQueue.maxConcurrency,
      );
      if (existingQueue.maxConcurrency !== nextMaxConcurrency) {
        existingQueue.maxConcurrency = nextMaxConcurrency;
        changed = true;
      }
    }

    if (options.attempts !== undefined) {
      const nextAttempts = this.normalizePositiveInt(
        options.attempts,
        existingQueue.attempts,
      );
      if (existingQueue.attempts !== nextAttempts) {
        existingQueue.attempts = nextAttempts;
        changed = true;
      }
    }

    if (
      options.isPaused !== undefined &&
      existingQueue.isPaused !== options.isPaused
    ) {
      existingQueue.isPaused = options.isPaused;
      changed = true;
    }

    if (changed) {
      await existingQueue.save();
    }

    return existingQueue;
  }

  private resolveAvailableAt(options: MyQueueAddJobOptions): Date {
    if (options.availableAt) {
      return options.availableAt;
    }

    const delayMs = Math.max(0, Math.floor(options.delayMs ?? 0));
    if (delayMs <= 0) {
      return new Date();
    }

    return new Date(Date.now() + delayMs);
  }

  private normalizePositiveInt(
    value: number | undefined,
    fallback: number,
  ): number {
    if (value === undefined || !Number.isFinite(value)) {
      return fallback;
    }

    return Math.max(1, Math.floor(value));
  }

  private async dispatch(): Promise<void> {
    if (this.isDispatching) {
      return;
    }

    this.isDispatching = true;
    try {
      const queues = await MyQueue.find({
        where: { isPaused: false },
        order: { createdAt: 'ASC', id: 'ASC' },
      });

      for (const queue of queues) {
        await this.dispatchQueue(queue);
      }
    } catch (error) {
      this.logger.error(
        `Queue dispatch loop failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isDispatching = false;
    }
  }

  private async dispatchQueue(queue: MyQueue): Promise<void> {
    const runningCount = await MyQueueJob.count({
      where: {
        queueId: queue.id,
        status: MyQueueJobStatus.running,
      },
    });
    const availableSlots = Math.max(0, queue.maxConcurrency - runningCount);
    if (availableSlots <= 0) {
      return;
    }

    const jobs = await MyQueueJob.find({
      where: {
        queueId: queue.id,
        status: MyQueueJobStatus.pending,
        availableAt: LessThanOrEqual(new Date()),
      },
      order: {
        availableAt: 'ASC',
        createdAt: 'ASC',
        id: 'ASC',
      },
      take: availableSlots,
    });

    for (const job of jobs) {
      const claimed = await MyQueueJob.update(
        {
          id: job.id,
          status: MyQueueJobStatus.pending,
        },
        {
          status: MyQueueJobStatus.running,
          runCount: job.runCount + 1,
          runningAt: new Date(),
        },
      );
      if (claimed.affected !== 1) {
        continue;
      }

      try {
        await CommonService.emitAsync(queue.name, job.id, job.data);
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : `dispatch error: ${String(error)}`;
        await MyQueueJob.update(
          {
            id: job.id,
            status: MyQueueJobStatus.running,
          },
          {
            status: MyQueueJobStatus.failed,
            errorMessage: reason,
            completedAt: new Date(),
          },
        );
      }
    }
  }

  private async checkStaleRunningJobs(): Promise<void> {
    if (this.isCheckingStale) {
      return;
    }

    this.isCheckingStale = true;
    try {
      const threshold = new Date(
        Date.now() - MyQueueService.RUNNING_TIMEOUT_MS,
      );
      const staleJobs = await MyQueueJob.find({
        where: {
          status: MyQueueJobStatus.running,
          updatedAt: LessThanOrEqual(threshold),
        },
      });

      for (const job of staleJobs) {
        await MyQueueJob.update(
          { id: job.id, status: MyQueueJobStatus.running },
          {
            status: MyQueueJobStatus.failed,
            errorMessage: 'running timeout: exceeded 1 hour',
            completedAt: new Date(),
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `Stale running job check failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isCheckingStale = false;
    }
  }
}
