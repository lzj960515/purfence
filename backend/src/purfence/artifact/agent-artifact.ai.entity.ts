import { BaseEntity, IDColumnOpts } from '@app/shared';
import type { ToolExecuteOptions } from '@voltagent/core';
import { Column, Entity, Index } from 'typeorm';
import {
  AgentArtifactContent,
  AgentArtifactType,
} from './agent-artifact-content.dto';

@Index(['conversationId'])
@Index(['toolCallId'])
@Entity()
export class AgentArtifact extends BaseEntity {

  @Column({ ...IDColumnOpts, nullable: true })
  conversationId: string;

  @Column({ ...IDColumnOpts, length: 64 })
  toolName: string;

  @Column({ ...IDColumnOpts, nullable: true })
  toolCallId: string;

  @Column({ type: 'json', nullable: true })
  content: AgentArtifactContent;

  @Column({ type: 'varchar', nullable: true })
  type: AgentArtifactType;

  static createWithContext(
    options: ToolExecuteOptions,
    content: AgentArtifactContent,
  ) {
    const { callId, name } = options.toolContext;
  
    return this.create({
      toolCallId: callId,
      content,
      conversationId: options.conversationId,
      toolName: name,
      type: content.type,
    });
  }
}
