import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { ModelProviderConfigModule } from '../model-provider-config/model-provider-config.module';
import { OAuthModule } from '../oauth/oauth.module';
import { ProviderModelService } from '../provider-model.service';
import { PurfenceConfigModule } from '../purfence-config/purfence-config.module';
import { PurfenceAppConfigCreateInput } from './purfence-app-config-create.input';
import { PurfenceAppConfigDto } from './purfence-app-config.dto';
import { PurfenceAppConfigSubscriber } from './purfence-app-config.subscriber';
import { PurfenceAppConfig } from './purfence-app-config.entity';
import { PurfenceAppConfigService } from './purfence-app-config.service';
import { PurfenceSlackService } from './purfence-slack.service';
import { PurfenceAppConfigUpdateInput } from './purfence-app-config-update.input';
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
