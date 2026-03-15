import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { AgentCreateInput } from './agent-create.input';
import { AgentDto } from './agent.dto';
import { Agent } from './agent.entity';
import { AgentSubscriber } from './agent.subscriber';
import { AgentUpdateInput } from './agent-update.input';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Agent]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([Agent])],
      resolvers: [
        {
          EntityClass: Agent,
          DTOClass: AgentDto,
          CreateDTOClass: AgentCreateInput,
          UpdateDTOClass: AgentUpdateInput,
          read: { pagingStrategy: PagingStrategies.OFFSET },
          create: { many: { disabled: true } },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          enableTotalCount: true,
        },
      ],
    }),
  ],
  providers: [AgentSubscriber],
})
export class AgentModule {}
