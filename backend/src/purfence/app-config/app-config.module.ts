import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { ModelProviderConfigModule } from '../model-provider-config/model-provider-config.module';
import { OAuthModule } from '../codex/codex-oauth.module';
import { ProviderModelService } from '../provider-model.service';
import { PurfenceConfigModule } from '../purfence-config/purfence-config.module';
import { PurfenceAppConfigCreateInput } from './app-config-create.input';
import { PurfenceAppConfigDto } from './app-config.dto';
import { PurfenceAppConfigSubscriber } from './app-config.subscriber';
import { PurfenceAppConfig } from './app-config.entity';
import { PurfenceAppConfigService } from './app-config.service';
import { PurfenceSlackService } from './purfence-slack.service';
import { PurfenceAppConfigUpdateInput } from './app-config-update.input';
import { SlackRuntimeService } from './slack-runtime.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([PurfenceAppConfig]),
    ModelProviderConfigModule,
    PurfenceConfigModule,
    OAuthModule,
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([PurfenceAppConfig])],
      resolvers: [
        {
          EntityClass: PurfenceAppConfig,
          DTOClass: PurfenceAppConfigDto,
          CreateDTOClass: PurfenceAppConfigCreateInput,
          UpdateDTOClass: PurfenceAppConfigUpdateInput,
          read: { pagingStrategy: PagingStrategies.OFFSET },
          create: { many: { disabled: true } },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          enableTotalCount: true,
        },
      ],
    }),
  ],
  providers: [
    PurfenceAppConfigService,
    PurfenceAppConfigSubscriber,
    SlackRuntimeService,
    PurfenceSlackService,
    ProviderModelService,
  ],
  exports: [PurfenceAppConfigService, SlackRuntimeService],
})
export class PurfenceAppConfigModule {}
