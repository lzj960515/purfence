import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';

@Entity()
export class AgentConversationSession extends BaseEntity {
  @Column({ ...IDColumnOpts, nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  title?: string;
}
