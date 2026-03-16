import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';

@Entity()
export class AgentConversationSession extends BaseEntity {
  @Column({ ...IDColumnOpts, nullable: true })
  userId: string;

  @Index()
  @Column({ ...IDColumnOpts })
  conversationId: string;

  @Column({ type: 'boolean', default: true })
  isCurrent: boolean;

  @Column({ default: 0 })
  inputTokens: number;

  @Column({ default: 0 })
  outputTokens: number;

  @Column({ default: 0 })
  totalTokens: number;

  @Column({ default: 0 })
  reasoningTokens: number;

  @Column({ default: 0 })
  cachedInputTokens: number;
}
