import { Global, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import {
  AxiosErrorFilter,
  EntityNotFoundErrorFilter,
  GraphqlClientErrorFilter,
  HttpExceptionFilter,
} from './filter';
import { OmitEmptyStringInQueryPipe, ParserPipe, XssFilterPipe } from './pipe';
import { ApolloLogPlugin } from './utils';
import { ComplexityPlugin } from './utils/complexity.plugin';

@Global()
@Module({
  providers: [
    ApolloLogPlugin,
    ComplexityPlugin,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: GraphqlClientErrorFilter },
    { provide: APP_FILTER, useClass: EntityNotFoundErrorFilter },
    { provide: APP_FILTER, useClass: AxiosErrorFilter },
    { provide: APP_PIPE, useClass: OmitEmptyStringInQueryPipe },
    { provide: APP_PIPE, useClass: XssFilterPipe },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        validationError: { target: false, value: false },
      }),
    },
    { provide: APP_PIPE, useClass: ParserPipe },
  ],
})
export class SharedModule {}
