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
