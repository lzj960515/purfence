import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { ModelProvider } from './model-provider.entity';
import { ModelProviderDto } from './model-provider.dto';
import { ModelProviderCreateInput } from './model-provider-create.input';
import { ModelProviderUpdateInput } from './model-provider-update.input';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ModelProvider]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([ModelProvider])],
      resolvers: [
        {
          EntityClass: ModelProvider,
          DTOClass: ModelProviderDto,
          CreateDTOClass: ModelProviderCreateInput,
          UpdateDTOClass: ModelProviderUpdateInput,
          read: { pagingStrategy: PagingStrategies.OFFSET },
          create: { many: { disabled: true } },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          enableTotalCount: true,
        },
      ],
    }),
  ],
})
export class ModelProviderModule {}
