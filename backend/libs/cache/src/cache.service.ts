import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import _ from 'lodash';
import ms from 'ms';

@Injectable()
export class CacheService {
  private static cache: Cache;
  constructor(@Inject(CACHE_MANAGER) cache: Cache) {
    CacheService.cache = cache;
  }

  static async cacheGet<T>(key: string) {
    if (this.cache) {
      Logger.debug(`cache get ${key}`, 'CacheService.cacheGet');
      return this.cache.get<T>(key);
    }
  }

  static async cacheSet(
    key: string,
    value: unknown,
    ttl?: number | ms.StringValue,
  ) {
    if (this.cache) {
      Logger.debug(
        `cache set ${key} ${value as string} ${ttl}`,
        'CacheService.cacheSet',
      );
      if (_.isNil(value)) {
        Logger.debug(`skip null values`, 'CacheService.cacheSet');
        return;
      }
      return this.cache.set(key, value, _.isString(ttl) ? ms(ttl) : ttl);
    }
  }

  static async cacheDel(key: string) {
    if (this.cache) {
      Logger.debug(`cache del ${key}`, 'CacheService.cacheDel');
      return this.cache.del(key);
    }
  }

  static async cacheReset() {
    if (this.cache) {
      Logger.debug(`cache reset`, 'CacheService.cacheReset');
      return this.cache.clear();
    }
  }
}
