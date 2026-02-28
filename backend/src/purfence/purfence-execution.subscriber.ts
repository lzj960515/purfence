import { Log } from '@nest-mods/log';
import { Logger } from '@nestjs/common';
import { MyQueueService } from '@app/my-queue';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { PurfenceExecution } from './purfence-execution.entity';

@EventSubscriber()
export class PurfenceExecutionSubscriber
  implements EntitySubscriberInterface<PurfenceExecution>
{
  @Log() logger: Logger;

  constructor(
    ds: DataSource,
    private readonly myQueueService: MyQueueService,
  ) {
    ds.subscribers.push(this);
  }

  listenTo() {
    return PurfenceExecution;
  }

  async afterInsert(event: InsertEvent<PurfenceExecution>) {
    const executionId = event.entity.id;
    this.logger.log(`Execution created: ${executionId}, enqueueing execution-queue`);
    await this.myQueueService.addJob(
      'execution-queue',
      { executionId },
      { delayMs: 500 },
    );
  }
}
