import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';

@Index(['userId', 'conversationId'])
@Index(['userId', 'conversationId', 'createdAt'])
@Entity()
export class AgentMemoryMessage extends BaseEntity {
  @Index()
  @Column({ ...IDColumnOpts })
  userId: string;

  @Index()
  @Column({ ...IDColumnOpts })
  conversationId: string;

  @Column({ type: 'varchar', length: 16 })
  role: 'system' | 'user' | 'assistant';

  @Column({ type: 'simple-json' })
  parts: unknown[];

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown>;
}
