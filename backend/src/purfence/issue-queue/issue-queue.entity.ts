import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';

export enum IssueQueueStatus {
  pending = 'pending',
  processing = 'processing',
  completed = 'completed',
  failed = 'failed',
}

@Entity()
@Index(['status', 'priority', 'createdAt']) // 复合索引用于 dequeue 查询
@Index(['status']) // 用于统计查询
@Index(['issueId'], { unique: true }) // 唯一索引
export class IssueQueue extends BaseEntity {
  @Column({ ...IDColumnOpts })
  issueId: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: IssueQueueStatus.pending,
  })
  status: IssueQueueStatus;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'datetime', nullable: true })
  startedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'json', nullable: true })
  payload?: {
    projectId: string;
    title: string;
    description: string;
    origin: string;
    [key: string]: unknown;
  };
}
