import {
  Controller,
  Get,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { IssueQueueService, type JobStatus } from './issue-queue.service';

/**
 * IssueQueueController - REST API for queue management
 *
 * Provides endpoints to monitor and manage the issue processing queue.
 */
@Controller('queue')
export class IssueQueueController {
  constructor(private readonly queueService: IssueQueueService) {}

  /**
   * GET /api/queue/stats
   * Get queue statistics and status
   */
  @Get('stats')
  async getStats() {
    return this.queueService.getStatus();
  }

  /**
   * GET /api/queue/jobs
   * Get list of jobs with optional filtering
   * @param status Filter by status (pending, running, pending_retry, failed)
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 20)
   */
  @Get('jobs')
  async getJobs(
    @Query('status') status?: JobStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page ?? '1', 10) || 1;
    const limitNum = Math.min(parseInt(limit ?? '20', 10) || 20, 100);

    return this.queueService.getJobs(status, pageNum, limitNum);
  }

  /**
   * POST /api/queue/jobs/:jobId/retry
   * Retry a failed job
   */
  @Post('jobs/:jobId/retry')
  @HttpCode(HttpStatus.OK)
  async retryJob(@Param('jobId', ParseIntPipe) jobId: number) {
    await this.queueService.retryJob(jobId);
    return { success: true, message: 'Job retry scheduled' };
  }

  /**
   * DELETE /api/queue/jobs/:jobId
   * Delete a job (non-running only)
   */
  @Delete('jobs/:jobId')
  @HttpCode(HttpStatus.OK)
  async deleteJob(@Param('jobId', ParseIntPipe) jobId: number) {
    await this.queueService.deleteJob(jobId);
    return { success: true, message: 'Job deleted' };
  }

  /**
   * POST /api/queue/pause
   * Pause the queue (stop processing new jobs)
   */
  @Post('pause')
  @HttpCode(HttpStatus.OK)
  async pause() {
    await this.queueService.pause();
    return { message: 'Queue paused successfully' };
  }

  /**
   * POST /api/queue/resume
   * Resume the queue (start processing jobs again)
   */
  @Post('resume')
  @HttpCode(HttpStatus.OK)
  async resume() {
    await this.queueService.resume();
    return { message: 'Queue resumed successfully' };
  }

  /**
   * DELETE /api/queue/clear
   * Clear all non-running jobs from the queue
   */
  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  async clear() {
    const count = await this.queueService.clear();
    return { message: `Cleared ${count} jobs from queue`, count };
  }
}
