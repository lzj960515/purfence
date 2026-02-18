import { Log } from '@nest-mods/log';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CommonService {
  @Log() private logger: Logger;

  private static emitter: EventEmitter2;

  constructor(eventEmitter: EventEmitter2) {
    CommonService.emitter = eventEmitter;
  }

  static emit(event: string, ...values: any[]) {
    if (this.emitter) {
      Logger.debug(`emit event ${event}`, 'CommonService.emit');
      return this.emitter.emit(event, ...values);
    }
  }

  static async emitAsync(event: string, ...values: any[]) {
    if (this.emitter) {
      Logger.debug(`emit event ${event}`, 'CommonService.emitAsync');
      return this.emitter.emitAsync(event, ...values);
    }
  }
}
