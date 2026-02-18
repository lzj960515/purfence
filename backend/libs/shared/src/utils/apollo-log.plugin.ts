/*
 * Created by Diluka on 2020-06-30.
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

import {
  ApolloServerPlugin,
  GraphQLRequest,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestListener,
  GraphQLResponse,
} from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { Logger } from '@nestjs/common';
import _ from 'lodash';
import { MyUtil } from './my-util';

@Plugin()
export class ApolloLogPlugin
  implements ApolloServerPlugin, GraphQLRequestListener<any>
{
  private logger = new Logger('GraphQL');

  async willSendResponse(
    requestContext: GraphQLRequestContextWillSendResponse<any>,
  ) {
    if (
      ['__ApolloGetServiceDefinition__', 'IntrospectionQuery'].includes(
        requestContext.operationName,
      )
    )
      return;

    this.logRequest(requestContext.request);
    this.logResponse(requestContext.response);
  }

  async requestDidStart() {
    return this;
  }

  private logRequest({ operationName, query, variables }: GraphQLRequest) {
    this.logger.verbose(`${operationName}\n${query}`);
    if (!_.isEmpty(variables)) {
      this.logger.verbose(
        `variables: ${MyUtil.ensureStrInSafeLength(JSON.stringify(variables), 200, '...')}`,
      );
    }
  }

  private logResponse({ body }: GraphQLResponse) {
    const errors =
      body.kind === 'single'
        ? body.singleResult.errors
        : body.initialResult.errors;

    if (errors) {
      for (const error of errors) {
        this.logger.verbose(
          `[${error.extensions?.code}] ${error.message} : ${
            error.extensions?.error || ''
          }`,
        );
      }
    }
  }
}
