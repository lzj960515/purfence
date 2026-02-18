import type {
  ApolloServerPlugin,
  GraphQLRequestContextDidResolveOperation,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestListener,
} from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { Logger } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';

@Plugin()
export class ComplexityPlugin
  implements ApolloServerPlugin, GraphQLRequestListener<any>
{
  private logger = new Logger('GraphQL');

  async requestDidStart() {
    return this;
  }

  async willSendResponse(
    requestContext: GraphQLRequestContextWillSendResponse<any>,
  ) {
    const { costs } = requestContext.contextValue;
    if (requestContext.operationName !== 'IntrospectionQuery' && costs) {
      switch (requestContext.response.body.kind) {
        case 'single':
          requestContext.response.body.singleResult.extensions = {
            ...requestContext.response.body.singleResult.extensions,
            costs,
          };
      }
    }
  }

  async didResolveOperation({
    request,
    schema,
    document,
    contextValue,
  }: GraphQLRequestContextDidResolveOperation<any>) {
    if (request.operationName === 'IntrospectionQuery') return;
    const maxComplexity = 1000;

    const complexity = getComplexity({
      schema,
      operationName: request.operationName,
      query: document,
      variables: request.variables,
      estimators: [
        fieldExtensionsEstimator(),
        simpleEstimator({ defaultComplexity: 1 }),
      ],
    });

    if (complexity > maxComplexity) {
      throw new GraphQLError(
        `Query [${request.operationName}] is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
      );
    }

    contextValue.costs = {
      maxCost: maxComplexity,
      requestedQueryCost: complexity,
    };
  }
}
