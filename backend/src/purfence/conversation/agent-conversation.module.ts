import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { AgentConversationCreateInput } from './agent-conversation-create.input';
import { AgentConversationDto } from './agent-conversation.dto';
import { AgentConversation } from './agent-conversation.entity';
import { AgentConversationSubscriber } from './agent-conversation.subscriber';
import { AgentConversationUpdateInput } from './agent-conversation-update.input';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AgentConversation]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([AgentConversation])],
      resolvers: [
        {
          EntityClass: AgentConversation,
          DTOClass: AgentConversationDto,
          CreateDTOClass: AgentConversationCreateInput,
          UpdateDTOClass: AgentConversationUpdateInput,
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
