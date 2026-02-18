import { CacheModuleOptions } from '@nestjs/cache-manager';
import { registerAs } from '@nestjs/config';
import ms from 'ms';

export default registerAs('cache', () => {
  return {
    isGlobal: true,
    ttl: ms('5 seconds'),
    max: 1000,
  } satisfies CacheModuleOptions;
});
