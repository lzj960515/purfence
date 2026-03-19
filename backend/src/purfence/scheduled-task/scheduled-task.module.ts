import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { ScheduledTaskCreateInput } from './scheduled-task-create.input';
import { ScheduledTaskDto } from './scheduled-task.dto';
import { ScheduledTask } from './scheduled-task.entity';
import { ScheduledTaskResolver } from './scheduled-task.resolver';
import { ScheduledTaskService } from './scheduled-task.service';
import { ScheduledTaskUpdateInput } from './scheduled-task-update.input';
import { PurfenceConfigModule } from '../purfence-config/purfence-config.module';
import { ProviderModelService } from '../provider-model.service';
import { PurfenceAgentService } from '../agent.service';

@Global()
@Module({
  imports: [
    PurfenceConfigModule,
    TypeOrmModule.forFeature([ScheduledTask]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([ScheduledTask])],
      resolvers: [
        {
          EntityClass: ScheduledTask,
          DTOClass: ScheduledTaskDto,
          CreateDTOClass: ScheduledTaskCreateInput,
          UpdateDTOClass: ScheduledTaskUpdateInput,
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
    ScheduledTaskService,
    ScheduledTaskResolver,
    ProviderModelService,
    PurfenceAgentService,
  ],
  exports: [
    ScheduledTaskService,
    ProviderModelService,
    PurfenceAgentService,
  ],
})
export class ScheduledTaskModule {}
