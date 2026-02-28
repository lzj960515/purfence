import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { MyQueueJobStatus } from './my-queue-job-status.enum';
import { MyQueue } from './my-queue.entity';

@Index('idx_my_queue_fifo_dispatch', [
  'queueId',
  'status',
  'availableAt',
  'createdAt',
  'id',
])
@Index('idx_my_queue_status', ['queueId', 'status'])
@Entity()
export class MyQueueJob extends BaseEntity {
  @Column({ type: 'varchar', length: 128 })
  queueName: string;

  @Column({ ...IDColumnOpts })
  queueId: string;

  @ManyToOne(() => MyQueue, { nullable: false })
  @JoinColumn({ name: 'queueId' })
  queue: MyQueue;

  @Column({ type: 'simple-json' })
  data: unknown;

  @Column({
    type: 'varchar',
    length: 16,
    default: MyQueueJobStatus.pending,
  })
  status: MyQueueJobStatus;

  @Column({ type: 'datetime' })
  availableAt: Date;

  @Column({ type: 'datetime', nullable: true })
  runningAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', default: 1 })
  attempts: number;

  @Column({ type: 'int', default: 0 })
  runCount: number;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;
}
