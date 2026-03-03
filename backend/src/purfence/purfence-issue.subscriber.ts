import { Log } from '@nest-mods/log';
import { Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { CommonService } from '../common/common.service';
import { PurfenceIssue } from './purfence-issue.entity';

@EventSubscriber()
export class PurfenceIssueSubscriber implements EntitySubscriberInterface<PurfenceIssue> {
  @Log() logger: Logger;

  constructor(ds: DataSource) {
    ds.subscribers.push(this);
  }

  listenTo() {
    return PurfenceIssue;
  }

  async afterInsert(event: InsertEvent<PurfenceIssue>) {
    const issueId = event.entity.id;
    this.logger.log(
      `Issue created: ${issueId}, emitting purfence.issue.created`,
    );

    // Add 1000ms delay using setTimeout to mimic BullMQ behavior
    setTimeout(() => {
      CommonService.emit('purfence.issue.created', { issueId });
    }, 1000);
  }
}
