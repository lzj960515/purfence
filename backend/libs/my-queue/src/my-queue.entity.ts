import { BaseEntity } from '@app/shared';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { MyQueueJob } from './my-queue-job.entity';

@Entity()
@Index(['name'], { unique: true })
export class MyQueue extends BaseEntity {
  @Column({ type: 'varchar', length: 128, update: false })
  name: string;

  @Column({ type: 'int', default: 3 })
  maxConcurrency: number;

  @Column({ type: 'int', default: 1 })
  attempts: number;

  @Column({ type: 'boolean', default: false })
  isPaused: boolean;

  @OneToMany(() => MyQueueJob, (job) => job.queue)
  jobs: MyQueueJob[];
}
