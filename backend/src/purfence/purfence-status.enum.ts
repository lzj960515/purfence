import { registerEnumType } from '@nestjs/graphql';

export enum PurfenceStatus {
  open = 'open',
  running = 'running',
  needs_user = 'needs_user',
  needs_approval = 'needs_approval',
  done = 'done',
  failed = 'failed',
  budget_exhausted = 'budget_exhausted',
}

registerEnumType(PurfenceStatus, { name: 'PurfenceStatus' });

export enum IssueOrigin {
  user = 'user',
  ai = 'ai',
  remote = 'remote',
}

registerEnumType(IssueOrigin, { name: 'IssueOrigin' });

/**
 * Execution 执行阶段
 * - tianji: 天机阶段（调度、分配任务）
 * - tianfu: 天府阶段（评估、规划下一步）
 */
export enum ExecutionStage {
  tianji = 'tianji',
  tianfu = 'tianfu',
}

registerEnumType(ExecutionStage, { name: 'ExecutionStage' });
