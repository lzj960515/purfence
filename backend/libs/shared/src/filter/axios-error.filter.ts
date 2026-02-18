import { Log } from '@nest-mods/log';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlContextType, GqlExceptionFilter } from '@nestjs/graphql';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import _ from 'lodash';

@Catch(AxiosError)
export class AxiosErrorFilter implements GqlExceptionFilter, ExceptionFilter {
  @Log('shared') private logger: Logger;

  catch(exception: AxiosError, host: ArgumentsHost) {
    this.logger.error(
      `${host.getType()}: ${JSON.stringify(_.omit(exception.toJSON(), 'config.headers'))} resp: ${JSON.stringify(exception.response?.data)}`,
    );

    switch (host.getType<GqlContextType>()) {
      case 'http': {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        return response
          .status(exception.response?.status || HttpStatus.BAD_REQUEST)
          .json({
            message: `AxiosError: ${exception.message}`,
            timestamp: new Date(),
            path: request.url,
          });
      }
      default:
        return exception;
    }
  }
}
