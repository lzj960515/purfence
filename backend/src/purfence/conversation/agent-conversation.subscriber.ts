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
import { AgentMemoryConversation } from '@app/my-agent/agent-memory-conversation.entity';
import { AgentMemoryMessage } from '@app/my-agent/agent-memory-message.entity';
import { AgentWorkingMemory } from '@app/my-agent/agent-working-memory.entity';
import { AgentArtifact } from '../artifact/agent-artifact.ai.entity';
import { AgentConversation } from './agent-conversation.entity';
import { AgentConversationSession, MessageService } from '@app/my-agent';

@EventSubscriber()
export class AgentConversationSubscriber implements EntitySubscriberInterface<AgentConversation> {
  @Log() logger: Logger;

  constructor(
    ds: DataSource,
    private messageService: MessageService,
  ) {
    ds.subscribers.push(this);
  }

  listenTo() {
    return AgentConversation;
  }

  async afterRemove(event: RemoveEvent<AgentConversation>) {
    const conversationId =
      event.entity?.id || event.databaseEntity?.id || event.entityId;
    if (!conversationId) {
      return;
    }

    await AgentConversationSession.delete({ conversationId });

    await AgentArtifact.delete({ conversationId });

    await this.messageService.deleteConversation(conversationId);

    this.logger.log(`Conversation deleted and cleaned up: ${conversationId}`);
  }
}
