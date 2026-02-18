import { registerEnumType } from '@nestjs/graphql';

export enum PurfenceScheduledTaskKind {
  recurring = 'recurring',
  one_time = 'one_time',
}

registerEnumType(PurfenceScheduledTaskKind, {
  name: 'PurfenceScheduledTaskKind',
});

export enum PurfenceScheduledTaskLastStatus {
  success = 'success',
  failed = 'failed',
}

registerEnumType(PurfenceScheduledTaskLastStatus, {
  name: 'PurfenceScheduledTaskLastStatus',
});
