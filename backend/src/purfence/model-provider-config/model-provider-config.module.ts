import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { ModelProviderConfig } from './model-provider-config.entity';
import { ModelProviderConfigDto } from './model-provider-config.dto';
import { ModelProviderConfigCreateInput } from './model-provider-config-create.input';
import { ModelProviderConfigUpdateInput } from './model-provider-config-update.input';
import { ModelProviderConfigService } from './model-provider-config.service';
import { ModelProviderConfigResolver } from './model-provider-config.resolver';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ModelProviderConfig]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([ModelProviderConfig])],
      resolvers: [
        {
          EntityClass: ModelProviderConfig,
          DTOClass: ModelProviderConfigDto,
          CreateDTOClass: ModelProviderConfigCreateInput,
          UpdateDTOClass: ModelProviderConfigUpdateInput,
          read: { pagingStrategy: PagingStrategies.OFFSET },
          create: { many: { disabled: true } },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          enableTotalCount: true,
        },
      ],
    }),
  ],
  providers: [ModelProviderConfigService, ModelProviderConfigResolver],
  exports: [ModelProviderConfigService],
})
export class ModelProviderConfigModule {}
