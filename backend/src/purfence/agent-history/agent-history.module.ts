import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { AgentModule } from '../agent/agent.module';
import { AgentHistoryCreateInput } from './agent-history-create.input';
import { AgentHistoryDto } from './agent-history.dto';
import { AgentHistory } from './agent-history.entity';
import { AgentHistoryResolver } from './agent-history.resolver';
import { AgentHistoryUpdateInput } from './agent-history-update.input';
import { AgentHistoryService } from './agent-history.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AgentHistory]),
    AgentModule,
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([AgentHistory])],
      resolvers: [
        {
          EntityClass: AgentHistory,
          DTOClass: AgentHistoryDto,
          CreateDTOClass: AgentHistoryCreateInput,
          UpdateDTOClass: AgentHistoryUpdateInput,
          read: { pagingStrategy: PagingStrategies.OFFSET },
          create: { disabled: true },
          update: { disabled: true },
          delete: { many: { disabled: true } },
          enableTotalCount: true,
        },
      ],
    }),
  ],
  providers: [AgentHistoryService, AgentHistoryResolver],
})
export class AgentHistoryModule {}
