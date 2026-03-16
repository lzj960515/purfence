import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';

@Index(['scope', 'userId', 'conversationId'], { unique: true })
@Entity()
export class AgentWorkingMemory extends BaseEntity {
  @Column({ type: 'varchar', length: 16 })
  scope: 'conversation' | 'user';

  @Index()
  @Column({ ...IDColumnOpts, nullable: true })
  userId?: string;

  @Index()
  @Column({ ...IDColumnOpts, nullable: true })
  conversationId?: string;

  @Column({ type: 'text' })
  content: string;
}
