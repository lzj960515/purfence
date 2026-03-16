import { MyCacheModule } from '@app/cache';
import { SharedModule } from '@app/shared';
import { AuthModule, AuthService } from '@nest-mods/auth';
import { ApolloFederationDriver } from '@nestjs/apollo';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import _ from 'lodash';
import { RequestContextModule } from 'nestjs-request-context';
import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { CommonController } from './common.controller';
import { CommonResolver } from './common.resolver';
import { CommonService } from './common.service';
import authConfig from './configs/auth.config';
import cacheConfig from './configs/cache.config';
import graphqlConfig from './configs/graphql.config';
import serverConfig from './configs/server.config';
import typeormConfig from './configs/typeorm.config';
import { ToJsonInterceptor } from './to-json.interceptor';
import { createWithRoleFieldMiddleware } from './utils/with-role';
import { AgentConversationSession, MyAgentModule } from '@app/my-agent';
import { AgentMemoryConversation } from '@app/my-agent/agent-memory-conversation.entity';
import { AgentMemoryMessage } from '@app/my-agent/agent-memory-message.entity';
import { AgentWorkingMemory } from '@app/my-agent/agent-working-memory.entity';
import { AgentWorkflowState } from '@app/my-agent/agent-workflow-state.entity';
import myAgentConfig from './configs/my-agent.config';
initializeTransactionalContext();
const logger = new Logger('common');

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    ConfigModule.forFeature(cacheConfig),
    ConfigModule.forFeature(graphqlConfig),
    ConfigModule.forFeature(serverConfig),
    ConfigModule.forFeature(typeormConfig),
    ConfigModule.forFeature(myAgentConfig),
    RequestContextModule,
    SharedModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const opts = config.get('typeorm');

        logger.verbose('typeorm');
        logger.verbose(_.omit(opts, 'password'));

        return opts;
      },
      dataSourceFactory: async (options) =>
        addTransactionalDataSource(new DataSource(options)),
    }),
    AuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config) => config.get('auth'),
    }),
    GraphQLModule.forRootAsync({
      driver: ApolloFederationDriver,
      inject: [ConfigService, AuthService],
      useFactory: (config: ConfigService, authService: AuthService) => {
        const opts = config.get('graphql');

        opts.buildSchemaOptions.fieldMiddleware.push(
          createWithRoleFieldMiddleware(authService),
        );

        // logger.verbose('graphql');
        // logger.verbose(opts);

        return opts;
      },
    }),
    EventEmitterModule.forRoot({ global: true }),
    ScheduleModule.forRoot(),
    TerminusModule,
    MyCacheModule,
    MyAgentModule,
    TypeOrmModule.forFeature([
      AgentConversationSession,
      AgentMemoryConversation,
      AgentMemoryMessage,
      AgentWorkingMemory,
      AgentWorkflowState,
    ]),
  ],
  providers: [
    CommonService,
    { provide: APP_INTERCEPTOR, useClass: ToJsonInterceptor },
    CommonResolver,
  ],
  exports: [CommonService],
  controllers: [CommonController],
})
export class CommonModule {}
