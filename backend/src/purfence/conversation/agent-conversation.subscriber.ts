import { Log } from '@nest-mods/log';
import { Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  RemoveEvent,
} from 'typeorm';
import _ from 'lodash';
import { In } from 'typeorm';
import { AgentConversationSession as InternalAgentConversationSession } from '@app/my-agent/agent-conversation-sessions.entity';
import { AgentMemoryConversation } from '@app/my-agent/agent-memory-conversation.entity';
import { AgentMemoryMessage } from '@app/my-agent/agent-memory-message.entity';
import { AgentWorkingMemory } from '@app/my-agent/agent-working-memory.entity';
import { AgentArtifact } from '../artifact/agent-artifact.ai.entity';
import { AgentConversationSession } from './agent-conversation.entity';

@EventSubscriber()
export class AgentConversationSubscriber implements EntitySubscriberInterface<AgentConversationSession> {
  @Log() logger: Logger;

  constructor(ds: DataSource) {
    ds.subscribers.push(this);
  }

  listenTo() {
    return AgentConversationSession;
  }

  async afterRemove(event: RemoveEvent<AgentConversationSession>) {
    const conversationId = event.entityId
      ? String(event.entityId)
      : event.entity?.id;

    if (!conversationId) {
      return;
    }

    const sessions = await InternalAgentConversationSession.find({
      where: { conversationId },
    });
    const scopedConversationIds = _.uniq([
      conversationId,
      ...sessions.map((session) => session.id),
    ]);

    await AgentArtifact.delete({ conversationId });
    await AgentMemoryConversation.delete({ id: In(scopedConversationIds) });
    await AgentMemoryMessage.delete({
      conversationId: In(scopedConversationIds),
    });
    await AgentWorkingMemory.delete({
      conversationId: In(scopedConversationIds),
    });
    await InternalAgentConversationSession.delete({ conversationId });

    this.logger.log(`Conversation deleted and cleaned up: ${conversationId}`);
  }
}
