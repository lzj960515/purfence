import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { PurfenceScheduledTaskCreateInput } from './purfence-scheduled-task-create.input';
import { PurfenceScheduledTaskDto } from './purfence-scheduled-task.dto';
import { PurfenceScheduledTask } from './purfence-scheduled-task.entity';
import { PurfenceScheduledTaskResolver } from './purfence-scheduled-task.resolver';
import { PurfenceScheduledTaskService } from './purfence-scheduled-task.service';
import { PurfenceScheduledTaskUpdateInput } from './purfence-scheduled-task-update.input';
import { ModelProviderConfigModule } from '../model-provider-config/model-provider-config.module';
import { PurfenceConfigModule } from '../purfence-config/purfence-config.module';
import { OAuthModule } from '../oauth/oauth.module';
import { ProviderModelService } from '../provider-model.service';
import { PurfenceAgentService } from '../agent.service';

@Global()
@Module({
  imports: [
    ModelProviderConfigModule,
    PurfenceConfigModule,
    OAuthModule,
    TypeOrmModule.forFeature([PurfenceScheduledTask]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([PurfenceScheduledTask])],
      resolvers: [
        {
          EntityClass: PurfenceScheduledTask,
          DTOClass: PurfenceScheduledTaskDto,
          CreateDTOClass: PurfenceScheduledTaskCreateInput,
          UpdateDTOClass: PurfenceScheduledTaskUpdateInput,
          read: { pagingStrategy: PagingStrategies.OFFSET },
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
          enableTotalCount: true,
        },
      ],
    }),
  ],
  providers: [
    PurfenceScheduledTaskService,
    PurfenceScheduledTaskResolver,
    ProviderModelService,
    PurfenceAgentService,
  ],
  exports: [
    PurfenceScheduledTaskService,
    ProviderModelService,
    PurfenceAgentService,
  ],
})
export class PurfenceScheduledTaskModule {}
