import { Log } from '@nest-mods/log';
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { ClientError } from 'graphql-request';

@Catch(ClientError)
export class GraphqlClientErrorFilter
  implements GqlExceptionFilter, ExceptionFilter
{
  @Log('shared') private logger: Logger;

  catch(exception: ClientError, host: ArgumentsHost) {
    const [message] = exception.message.split(':');
    this.logger.error(`${host.getType()}: ${message}`, exception.stack);
    return new GraphQLError(message, {
      originalError: exception,
    });
  }
}
