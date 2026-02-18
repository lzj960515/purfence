import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { PurfenceConfigCreateInput } from './purfence-config-create.input';
import { PurfenceConfigDto } from './purfence-config.dto';
import { PurfenceConfig } from './purfence-config.entity';
import { PurfenceConfigUpdateInput } from './purfence-config-update.input';
import { PurfenceConfigService } from './purfence-config.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([PurfenceConfig]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([PurfenceConfig])],
      resolvers: [
        {
          EntityClass: PurfenceConfig,
          DTOClass: PurfenceConfigDto,
          CreateDTOClass: PurfenceConfigCreateInput,
          UpdateDTOClass: PurfenceConfigUpdateInput,
          read: { pagingStrategy: PagingStrategies.OFFSET },
          create: { many: { disabled: true } },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          enableTotalCount: true,
        },
      ],
    }),
  ],
  providers: [PurfenceConfigService],
  exports: [PurfenceConfigService],
})
export class PurfenceConfigModule {}
