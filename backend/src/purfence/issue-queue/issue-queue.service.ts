import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { buildDBClient, Runner, SqliteQueue } from 'liteque';
import { z } from 'zod';
import { PurfenceIssueService } from '../purfence-issue.service';
import { PurfenceConfigService } from '../purfence-config/purfence-config.service';
import * as path from 'node:path';
import * as os from 'node:os';
import Database from 'better-sqlite3';

/**
 * Zod schema for Issue job data
 */
const IssueJobSchema = z.object({
  issueId: z.string(),
  projectId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  origin: z.string().optional(),
});

type IssueJobData = z.infer<typeof IssueJobSchema>;

/**
 * Job status type from liteque
 */
export type JobStatus = 'pending' | 'running' | 'pending_retry' | 'failed';

/**
 * Queue statistics
 */
export interface QueueStats {
  pending: number;
  pending_retry: number;
  running: number;
  failed: number;
}

/**
 * Raw job from database
 */
interface RawJob {
  id: number;
  queue: string;
  payload: string;
  createdAt: number;
  availableAt: number | null;
  status: JobStatus;
  expireAt: number | null;
  allocationId: string;
  numRunsLeft: number;
  maxNumRuns: number;
  idempotencyKey: string | null;
  priority: number;
}

/**
 * Job info for API responses
 */
export interface JobInfo {
  id: number;
  issueId: string;
  status: JobStatus;
  priority: number;
  createdAt: Date;
  availableAt?: Date;
  numRunsLeft: number;
  maxNumRuns: number;
}

/**
 * Jobs list response
 */
export interface JobsListResponse {
  jobs: JobInfo[];
  total: number;
  page: number;
  limit: number;
}

/**
 * IssueQueueService - Manages the issue processing queue using liteque
 *
 * This service replaces the old TypeORM-based queue implementation with
 * a mature SQLite-based job queue (liteque).
 */
@Injectable()
export class IssueQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IssueQueueService.name);
  private queue!: SqliteQueue<IssueJobData>;
  private runner!: Runner<IssueJobData>;
  private sqliteDb!: Database.Database;
  private dbPath: string;

  constructor(
    private readonly issueService: PurfenceIssueService,
    private readonly configService: PurfenceConfigService,
  ) {
    // Store the SQLite database in the OS temp directory
    this.dbPath = path.join(os.tmpdir(), 'purfence-issue-queue.db');
    this.logger.log(`Queue database path: ${this.dbPath}`);
  }

  async onModuleInit() {
    this.logger.log('Initializing IssueQueueService with liteque...');

    // Build the database client for liteque
    const db = buildDBClient(this.dbPath, {
      runMigrations: true,
      walEnabled: true,
    });

    // Also create a direct SQLite connection for queries
    this.sqliteDb = new Database(this.dbPath);

    // Get concurrency from config
    const concurrency = await this.configService.getMaxIssueConcurrency();
    this.logger.log(`Queue concurrency: ${concurrency}`);

    // Initialize the queue
    this.queue = new SqliteQueue<IssueJobData>('issue-queue', db, {
      defaultJobArgs: {
        numRetries: 3,
      },
      keepFailedJobs: true, // Keep failed jobs for debugging
    });

    // Initialize the runner
    this.runner = new Runner<IssueJobData>(
      this.queue,
      {
        run: async (job) => {
          const { issueId } = job.data;
          this.logger.log(`Processing issue: ${issueId}`);

          try {
            await this.issueService.startIssue(issueId);
            this.logger.log(`Issue ${issueId} completed successfully`);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to process issue ${issueId}: ${errorMessage}`);
            throw error;
          }
        },
        onComplete: async (job) => {
          this.logger.debug(`Job ${job.id} completed for issue ${job.data.issueId}`);
        },
        onError: async (job) => {
          this.logger.error(
            `Job ${job.id} failed for issue ${job.data.issueId}: ${job.error.message}`,
            job.error.stack,
          );
        },
      },
      {
        concurrency,
        pollIntervalMs: 2000, // Poll every 2 seconds
        timeoutSecs: 600, // 10 minutes timeout per job
        validator: IssueJobSchema,
      },
    );

    // Start the runner
    this.runner.run();
    this.logger.log('IssueQueueService initialized and runner started');
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down IssueQueueService...');
    if (this.runner) {
      this.runner.stop();
    }
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }
    this.logger.log('IssueQueueService shutdown complete');
  }

  /**
   * Enqueue an issue for processing
   * @param issueId The issue ID to process
   * @param payload Optional metadata about the issue
   * @param options Optional enqueue options (priority, delay, etc.)
   */
  async enqueue(
    issueId: string,
    payload?: {
      projectId?: string;
      title?: string;
      description?: string;
      origin?: string;
    },
    options?: {
      priority?: number;
      delayMs?: number;
    },
  ): Promise<void> {
    const jobData: IssueJobData = {
      issueId,
      ...payload,
    };

    try {
      const job = await this.queue.enqueue(jobData, {
        idempotencyKey: issueId, // Use issueId as idempotency key to prevent duplicates
        priority: options?.priority ?? 0,
        delayMs: options?.delayMs,
        numRetries: 3,
      });

      if (job) {
        this.logger.log(`Issue ${issueId} enqueued with job id ${job.id}`);
      } else {
        this.logger.warn(
          `Issue ${issueId} already in queue (idempotency key exists)`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to enqueue issue ${issueId}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    return this.queue.stats();
  }

  /**
   * Get the current queue status (simplified view)
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    concurrency: number;
    stats: QueueStats;
  }> {
    const stats = await this.getStats();
    const concurrency = await this.configService.getMaxIssueConcurrency();

    return {
      isRunning: !this.runner.stopping,
      concurrency,
      stats,
    };
  }

  /**
   * Pause the queue (stop accepting new jobs)
   * Note: This stops the runner completely
   */
  async pause(): Promise<void> {
    this.logger.log('Pausing queue...');
    this.runner.stop();
    this.logger.log('Queue paused');
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    this.logger.log('Resuming queue...');
    if (this.runner.stopping) {
      this.runner.run();
    }
    this.logger.log('Queue resumed');
  }

  /**
   * Clear all non-running jobs from the queue
   * @returns Number of jobs cleared
   */
  async clear(): Promise<number> {
    const count = await this.queue.cancelAllNonRunning();
    this.logger.log(`Cleared ${count} non-running jobs from queue`);
    return count;
  }

  /**
   * Get list of jobs with optional filtering and pagination
   * @param status Filter by status (optional)
   * @param page Page number (1-based)
   * @param limit Items per page
   */
  async getJobs(
    status?: JobStatus,
    page: number = 1,
    limit: number = 20,
  ): Promise<JobsListResponse> {
    const offset = (page - 1) * limit;

    // Build SQL query for count
    let countSql = 'SELECT COUNT(*) as count FROM tasks WHERE queue = ?';
    const countParams: (string | number)[] = ['issue-queue'];

    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }

    const countRow = this.sqliteDb.prepare(countSql).get(...countParams) as {
      count: number;
    };
    const total = countRow?.count ?? 0;

    // Build SQL query for jobs
    let jobsSql = `
      SELECT id, queue, payload, createdAt, availableAt, status,
             expireAt, allocationId, numRunsLeft, maxNumRuns,
             idempotencyKey, priority
      FROM tasks
      WHERE queue = ?
    `;
    const jobsParams: (string | number)[] = ['issue-queue'];

    if (status) {
      jobsSql += ' AND status = ?';
      jobsParams.push(status);
    }

    jobsSql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    jobsParams.push(limit, offset);

    const jobs = this.sqliteDb.prepare(jobsSql).all(...jobsParams) as RawJob[];

    // Transform to JobInfo
    const jobInfos: JobInfo[] = jobs.map((job) => {
      // Parse payload to extract issueId
      let issueId = '';
      try {
        const payload = JSON.parse(job.payload) as IssueJobData;
        issueId = payload.issueId;
      } catch {
        // If parsing fails, use idempotencyKey as fallback
        issueId = job.idempotencyKey ?? '';
      }

      return {
        id: job.id,
        issueId,
        status: job.status,
        priority: job.priority,
        createdAt: new Date(job.createdAt),
        availableAt: job.availableAt ? new Date(job.availableAt) : undefined,
        numRunsLeft: job.numRunsLeft,
        maxNumRuns: job.maxNumRuns,
      };
    });

    return {
      jobs: jobInfos,
      total,
      page,
      limit,
    };
  }

  /**
   * Retry a failed job
   * @param jobId The job ID to retry
   */
  async retryJob(jobId: number): Promise<void> {
    // Get the job
    const job = this.sqliteDb
      .prepare(
        'SELECT * FROM tasks WHERE id = ? AND queue = ?',
      )
      .get(jobId, 'issue-queue') as RawJob | undefined;

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    // Only allow retrying failed jobs
    if (job.status !== 'failed') {
      throw new BadRequestException(
        `Cannot retry job with status "${job.status}". Only failed jobs can be retried.`,
      );
    }

    // Parse the original payload
    let payload: IssueJobData;
    try {
      payload = JSON.parse(job.payload) as IssueJobData;
    } catch {
      throw new BadRequestException('Failed to parse job payload');
    }

    // Delete the old job first
    this.sqliteDb.prepare('DELETE FROM tasks WHERE id = ?').run(jobId);

    // Re-enqueue the job
    await this.queue.enqueue(payload, {
      idempotencyKey: payload.issueId,
      priority: job.priority,
      numRetries: job.maxNumRuns,
    });

    this.logger.log(`Job ${jobId} retried successfully`);
  }

  /**
   * Delete a job
   * @param jobId The job ID to delete
   */
  async deleteJob(jobId: number): Promise<void> {
    // Get the job
    const job = this.sqliteDb
      .prepare('SELECT * FROM tasks WHERE id = ? AND queue = ?')
      .get(jobId, 'issue-queue') as RawJob | undefined;

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    // Prevent deleting running jobs
    if (job.status === 'running') {
      throw new BadRequestException('Cannot delete a running job');
    }

    // Delete the job
    this.sqliteDb.prepare('DELETE FROM tasks WHERE id = ?').run(jobId);

    this.logger.log(`Job ${jobId} deleted successfully`);
  }
}
