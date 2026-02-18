import { GraphQLError } from 'graphql';

export class BizError extends GraphQLError {
  constructor(message: string, code = 'BIZ_ERROR', data?: Record<string, any>) {
    super(message, { extensions: { ...data, code } });
  }
}
