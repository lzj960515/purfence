import { Logger } from '@nestjs/common';
import retry from 'async-retry';
import _ from 'lodash';
import { MyUtil } from './my-util';

const logger = new Logger('UseRetry');

export interface UseRetryOptions extends retry.Options {
  // TODO
  bailWhen?: (e: Error) => any;
  retries?: number;
}

export function UseRetry(options?: UseRetryOptions) {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>,
  ) => {
    options = _.defaults(options, {
      retries: 3,
    } satisfies retry.Options);

    const fn = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      return retry(async (bail, attempt) => {
        if (attempt > 1) {
          logger.debug(
            `Retrying ${target.constructor.name}#${String(propertyKey)}: ${attempt} / ${options.retries}`,
          );
        }
        return await fn.apply(this, args);
      }, options);
    };

    MyUtil.copyMetadata(fn, descriptor.value);
    return descriptor;
  };
}
