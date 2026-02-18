import { Log } from '@nest-mods/log';
import { Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { CommonService } from '../common/common.service';
import { PurfenceExecution } from './purfence-execution.entity';

@EventSubscriber()
export class PurfenceExecutionSubscriber
  implements EntitySubscriberInterface<PurfenceExecution>
{
  @Log() logger: Logger;

  constructor(ds: DataSource) {
    ds.subscribers.push(this);
  }

  listenTo() {
    return PurfenceExecution;
  }

  async afterInsert(event: InsertEvent<PurfenceExecution>) {
    const executionId = event.entity.id;
    this.logger.log(
      `Execution created: ${executionId}, emitting purfence.execution.execute`,
    );

    // Add 500ms delay using setTimeout to mimic BullMQ behavior
    setTimeout(() => {
      CommonService.emit('purfence.execution.execute', { executionId });
    }, 500);
  }
}
