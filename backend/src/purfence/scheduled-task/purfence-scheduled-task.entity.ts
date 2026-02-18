import { BaseEntity } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';
import {
  PurfenceScheduledTaskKind,
  PurfenceScheduledTaskLastStatus,
} from './purfence-scheduled-task.enum';

@Index(['enabled'])
@Index(['kind'])
@Entity()
export class PurfenceScheduledTask extends BaseEntity {
  @Column({ type: 'varchar', length: 256 })
  name: string;

  @Column({ type: 'text' })
  prompt: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: PurfenceScheduledTaskKind.recurring,
  })
  kind: PurfenceScheduledTaskKind;

  @Column({ type: 'varchar', length: 128, nullable: true })
  cronExpr?: string;

  @Column({ type: 'datetime', nullable: true })
  runAt?: Date;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastRunAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  nextRunAt?: Date;

  @Column({ type: 'varchar', length: 32, nullable: true })
  lastStatus?: PurfenceScheduledTaskLastStatus;

  @Column({ type: 'text', nullable: true })
  lastError?: string;

  @Column({ type: 'int', default: 0 })
  runCount: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  slackAppConfigId?: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  slackChannelId?: string;
}
