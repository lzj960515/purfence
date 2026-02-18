import ecsFormat from '@elastic/ecs-pino-format';
import { Global, Logger, Module } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';
import { Logger as PinoLoggerService, LoggerModule } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: { ...ecsFormat(), autoLogging: false } }),
  ],
})
export class SetupPinoLoggerModule {
  constructor(pinoLoggerService: PinoLoggerService) {
    Logger.overrideLogger(pinoLoggerService);
  }

  static forRoot() {
    return ConditionalModule.registerWhen(this, (env) =>
      ['production', 'next'].includes(env.APP_ENV),
    );
  }
}
