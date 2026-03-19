import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity } from 'typeorm';

@Entity('agent_conversation')
export class AgentConversation extends BaseEntity {
  @Column({ ...IDColumnOpts, nullable: true })
  userId?: string;

  @Column({ ...IDColumnOpts, nullable: true })
  agentId?: string;

  @Column({ ...IDColumnOpts, nullable: true })
  parentConversationId?: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  title?: string;
}
