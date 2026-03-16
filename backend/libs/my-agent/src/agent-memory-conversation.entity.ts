import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';

@Entity()
export class AgentMemoryConversation extends BaseEntity {
  @Index()
  @Column({ ...IDColumnOpts })
  resourceId: string;

  @Index()
  @Column({ ...IDColumnOpts })
  userId: string;

  @Index()
  @Column({ type: 'varchar', length: 256, default: '' })
  title: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown>;
}
