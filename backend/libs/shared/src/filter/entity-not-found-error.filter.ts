import { Log } from '@nest-mods/log';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlContextType, GqlExceptionFilter } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { EntityNotFoundError } from 'typeorm';

@Catch(EntityNotFoundError)
export class EntityNotFoundErrorFilter
  implements GqlExceptionFilter, ExceptionFilter
{
  @Log('shared') private logger: Logger;

  catch(exception: EntityNotFoundError, host: ArgumentsHost) {
    this.logger.error(
      `${host.getType()}: ${exception.message}`,
      exception.stack,
    );

    switch (host.getType<GqlContextType>()) {
      case 'http': {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        return response.status(HttpStatus.BAD_REQUEST).json({
          message: exception.message,
          timestamp: new Date(),
          path: request.url,
        });
      }
      default:
        return exception;
    }
  }
}
