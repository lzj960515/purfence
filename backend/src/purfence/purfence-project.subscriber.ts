import { Log } from '@nest-mods/log';
import { Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { CommonService } from '../common/common.service';
import { PurfenceProject } from './purfence-project.entity';

@EventSubscriber()
export class PurfenceProjectSubscriber implements EntitySubscriberInterface<PurfenceProject> {
  @Log() logger: Logger;

  constructor(ds: DataSource) {
    ds.subscribers.push(this);
  }

  listenTo() {
    return PurfenceProject;
  }

  async afterInsert(event: InsertEvent<PurfenceProject>) {
    const projectId = event.entity.id;
    this.logger.log(`Project created: ${projectId}, emitting purfence.project.created`);

    // Add 1000ms delay using setTimeout to mimic BullMQ behavior
    setTimeout(() => {
      CommonService.emit('purfence.project.created', { projectId });
    }, 1000);
  }
}
