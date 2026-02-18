import { UseInterceptors } from '@nestjs/common';
import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';
import _ from 'lodash';
import { Class } from 'type-fest';

/**
 * This function is a decorator that copies interceptors from a base resolver to a target.
 * It uses the `UseInterceptors` decorator from NestJS to apply the copied interceptors.
 *
 * @param {Class<any>} BaseResolver - The base resolver from which to copy interceptors.
 * @returns - A function that applies the copied interceptors to a target.
 *
 * @example
 * ```ts
 * @CopyInterceptors(BaseResolver)
 * class TargetResolver {
 *   // ...
 * }
 * ```
 */
export function CopyInterceptors(BaseResolver: Class<any>) {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    let interceptors: any[];
    if (propertyKey) {
      interceptors = Reflect.getMetadata(
        INTERCEPTORS_METADATA,
        BaseResolver.prototype[propertyKey],
      );
    } else {
      interceptors = Reflect.getMetadata(
        INTERCEPTORS_METADATA,
        BaseResolver.prototype,
      );
    }

    if (!_.isEmpty(interceptors)) {
      return UseInterceptors(...interceptors)(target, propertyKey, descriptor);
    }
  };
}
