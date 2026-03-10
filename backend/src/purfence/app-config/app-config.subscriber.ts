import { Log } from '@nest-mods/log';
import { Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { CommonService } from '../../common/common.service';
import { PurfenceAppConfig } from './app-config.entity';

@EventSubscriber()
export class PurfenceAppConfigSubscriber implements EntitySubscriberInterface<PurfenceAppConfig> {
  @Log() logger: Logger;

  constructor(ds: DataSource) {
    ds.subscribers.push(this);
  }

  listenTo() {
    return PurfenceAppConfig;
  }

  async afterInsert(event: InsertEvent<PurfenceAppConfig>) {
    this.emitChanged(event.entity?.type);
  }

  async afterUpdate(event: UpdateEvent<PurfenceAppConfig>) {
    const nextType =
      event.entity && 'type' in event.entity
        ? String(event.entity.type)
        : undefined;
    this.emitChanged(nextType);
  }

  async afterRemove(event: RemoveEvent<PurfenceAppConfig>) {
    this.emitChanged(event.entity?.type);
  }

  private emitChanged(type?: unknown) {
    this.logger.log(`App config changed: ${String(type || 'unknown')}`);
    CommonService.emit('purfence.app-config.changed');
  }
}
