/*
 * Created by Diluka on 2020-04-29.
 *
 *
 * ----------- 神 兽 佑 我 -----------
 *        ┏┓      ┏┓+ +
 *       ┏┛┻━━━━━━┛┻┓ + +
 *       ┃          ┃
 *       ┣     ━    ┃ ++ + + +
 *      ████━████   ┃+
 *       ┃          ┃ +
 *       ┃  ┴       ┃
 *       ┃          ┃ + +
 *       ┗━┓      ┏━┛  Code is far away from bug
 *         ┃      ┃       with the animal protecting
 *         ┃      ┃ + + + +
 *         ┃      ┃
 *         ┃      ┃ +
 *         ┃      ┃      +  +
 *         ┃      ┃    +
 *         ┃      ┗━━━┓ + +
 *         ┃          ┣┓
 *         ┃          ┏┛
 *         ┗┓┓┏━━━━┳┓┏┛ + + + +
 *          ┃┫┫    ┃┫┫
 *          ┗┻┛    ┗┻┛+ + + +
 * ----------- 永 无 BUG ------------
 */
import { Log } from '@nest-mods/log';
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlContextType, GqlExceptionFilter } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { GraphQLError } from 'graphql';
import { GraphQLErrorExtensions } from 'graphql/error/GraphQLError';
import * as _ from 'lodash';

@Catch(HttpException)
export class HttpExceptionFilter
  implements GqlExceptionFilter, ExceptionFilter
{
  @Log('shared') private logger: Logger;

  catch(exception: HttpException, host: ArgumentsHost) {
    this.logger.error(
      `${host.getType()}: ${exception.message}`,
      exception.stack,
    );

    switch (host.getType<GqlContextType>()) {
      case 'graphql':
        return this.toApolloError(exception);
      case 'http': {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        return response.status(exception.getStatus()).json({
          ...this.toBody(exception),
          timestamp: new Date(),
          path: request.url,
        });
      }
      default:
        return exception;
    }
  }

  private toBody(exception: HttpException) {
    return _.isString(exception.getResponse())
      ? { message: exception.getResponse() }
      : (exception.getResponse() as any);
  }

  private toApolloError(
    exception: HttpException & { extensions?: GraphQLErrorExtensions },
  ) {
    const resp: string | any = exception.getResponse();
    const newError = new GraphQLError(exception.message, {
      originalError: exception,
      extensions: {
        code: this.exceptionToCode(exception),
        ...exception.extensions,
      },
    });

    if (_.isString(resp)) {
      newError.message = resp;
    } else if (resp) {
      const { message: error, statusCode, error: name } = resp;
      Object.assign(newError, { error, statusCode, name });
    }

    if (!_.isString(resp) && _.isArray(resp.message)) {
      newError.message =
        'Validation Errors, see `extensions.errors` for details';
      newError.extensions.errors = resp.message;
      newError.name = 'ValidationErrors';
    }

    return newError;
  }

  private exceptionToCode(exception: HttpException) {
    if (exception instanceof UnauthorizedException) return 'UNAUTHENTICATED';
    if (exception instanceof ForbiddenException) return 'FORBIDDEN';
    if (exception instanceof BadRequestException) return 'BAD_USER_INPUT';
    return HttpStatus[exception.getStatus()];
  }
}
