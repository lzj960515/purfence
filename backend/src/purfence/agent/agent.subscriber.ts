import { Log } from '@nest-mods/log';
import { Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { CommonService } from '@src/common/common.service';
import { Agent } from './agent.entity';

@EventSubscriber()
export class AgentSubscriber implements EntitySubscriberInterface<Agent> {
  @Log() logger: Logger;

  constructor(ds: DataSource) {
    ds.subscribers.push(this);
  }

  listenTo() {
    return Agent;
  }

  afterInsert(event: InsertEvent<Agent>) {
    const agentId = event.entity.id;

    setTimeout(() => {
      CommonService.emit('agent.created', { agentId });
    }, 1000);
  }

  afterUpdate(event: UpdateEvent<Agent>) {
    const agentId = event.entity?.id || event.databaseEntity?.id;
    if (!agentId) {
      return;
    }

    setTimeout(() => {
      CommonService.emit('agent.updated', { agentId });
    }, 1000);
  }
}
