import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config) => config.get('cache'),
    }),
  ],
  providers: [CacheService],
})
export class MyCacheModule {}
