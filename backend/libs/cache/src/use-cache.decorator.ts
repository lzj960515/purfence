import { MyUtil } from '@app/shared';
import { Logger } from '@nestjs/common';
import _ from 'lodash';
import ms from 'ms';
import { CacheService } from './cache.service';

export interface UseCacheOptions {
  getId: (...args) => string;
  ttl: ms.StringValue | number;
}

export function UseCache(options?: Partial<UseCacheOptions>) {
  options = _.defaults(options, {
    getId: (...args) => JSON.stringify(args),
    ttl: '5 seconds',
  } as UseCacheOptions);
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>,
  ) => {
    const prefix = `${target.constructor.name}#${String(propertyKey)}`;
    Logger.debug(`setup method cache for ${prefix}`, 'UseCache');

    const fn = descriptor.value;
    descriptor.value = async function (...args) {
      const key = `${prefix}:${options.getId(...args)}`;
      let result = await CacheService.cacheGet(key);
      if (!result) {
        Logger.debug(`missing ${key}, calling method...`, 'UseCache');
        result = await fn.apply(this, args);
        await CacheService.cacheSet(key, result, options.ttl);
      }
      return result;
    };

    MyUtil.copyMetadata(fn, descriptor.value);
    return descriptor;
  };
}
