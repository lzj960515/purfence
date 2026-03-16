import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { AgentConversationSessionCreateInput } from './agent-conversation-create.input';
import { AgentConversationSessionDto } from './agent-conversation.dto';
import { AgentConversationSession } from './agent-conversation.entity';
import { AgentConversationSubscriber } from './agent-conversation.subscriber';
import { AgentConversationSessionUpdateInput } from './agent-conversation-update.input';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AgentConversationSession]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypeOrmModule.forFeature([AgentConversationSession]),
      ],
      resolvers: [
        {
          EntityClass: AgentConversationSession,
          DTOClass: AgentConversationSessionDto,
          CreateDTOClass: AgentConversationSessionCreateInput,
          UpdateDTOClass: AgentConversationSessionUpdateInput,
          read: { pagingStrategy: PagingStrategies.OFFSET },
          create: { many: { disabled: true } },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          enableTotalCount: true,
        },
      ],
    }),
  ],
  providers: [AgentConversationSubscriber],
})
export class AgentConversationModule {}
