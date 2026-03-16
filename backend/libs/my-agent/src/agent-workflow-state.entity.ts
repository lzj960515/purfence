import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';

@Index(['workflowId', 'status'])
@Index(['workflowId', 'createdAt'])
@Entity()
export class AgentWorkflowState extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 128 })
  workflowId: string;

  @Column({ type: 'varchar', length: 256, default: '' })
  workflowName: string;

  @Index()
  @Column({ type: 'varchar', length: 16 })
  status: 'running' | 'suspended' | 'completed' | 'cancelled' | 'error';

  @Column({ ...IDColumnOpts, nullable: true })
  userId?: string;

  @Column({ ...IDColumnOpts, nullable: true })
  conversationId?: string;

  @Column({ type: 'simple-json', nullable: true })
  input?: unknown;

  @Column({ type: 'simple-json', nullable: true })
  context?: Array<[string, unknown]>;

  @Column({ type: 'simple-json', nullable: true })
  workflowState?: Record<string, unknown>;

  @Column({ type: 'simple-json', nullable: true })
  suspension?: unknown;

  @Column({ type: 'simple-json', nullable: true })
  events?: unknown;

  @Column({ type: 'simple-json', nullable: true })
  output?: unknown;

  @Column({ type: 'simple-json', nullable: true })
  cancellation?: unknown;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown>;
}
