import { MyQueueJobStatus } from './my-queue-job-status.enum';

export type MyQueueJobId = string;

export interface MyQueueAddJobOptions {
  maxConcurrency?: number;
  attempts?: number;
  isPaused?: boolean;
  delayMs?: number;
  availableAt?: Date;
}

export interface MyQueueNackInput {
  jobId: MyQueueJobId;
  reason?: string;
}

export interface MyQueueAckResult {
  jobId: MyQueueJobId;
  status: MyQueueJobStatus;
}
