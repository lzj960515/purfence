import { registerEnumType } from '@nestjs/graphql';

export enum ScheduledTaskKind {
  recurring = 'recurring',
  one_time = 'one_time',
}

registerEnumType(ScheduledTaskKind, {
  name: 'ScheduledTaskKind',
});

export enum ScheduledTaskLastStatus {
  success = 'success',
  failed = 'failed',
}

registerEnumType(ScheduledTaskLastStatus, {
  name: 'ScheduledTaskLastStatus',
});
