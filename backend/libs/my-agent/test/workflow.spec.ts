import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import myAgentConfig from '@src/common/configs/my-agent.config';
import typeormConfig from '@src/common/configs/typeorm.config';
import z from 'zod';
import {
  AgentConversationSession,
  MyAgentModule,
  MyAgentService,
} from '../src';

const logger = new Logger();

describe('Workflow', () => {
  let module: TestingModule;
  let service: MyAgentService;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ConfigModule.forFeature(typeormConfig),
        ConfigModule.forFeature(myAgentConfig),
        MyAgentModule,
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config) => config.get('typeorm'),
        }),
        TypeOrmModule.forFeature([AgentConversationSession]),
      ],
    })
      .setLogger(logger)
      .compile();

    await module.init();

    service = module.get<MyAgentService>(MyAgentService);
  });

  it('demo', async () => {
    // TODO: 迁移到新的 Workflow 实现（原 voltagent workflow 已移除）
    // 新的 Workflow 实现需要基于 AI SDK 重新设计
    console.log('Workflow test needs to be migrated to new implementation');
  });

  it('run workflow with agent', async () => {
    // TODO: 迁移到新的 Workflow 实现（原 voltagent workflow 已移除）
    // 新的 Workflow 实现需要基于 AI SDK 重新设计
    console.log('Workflow test needs to be migrated to new implementation');
  });

  it('run workflow with agent conditional step', async () => {
    // TODO: 迁移到新的 Workflow 实现（原 voltagent workflow 已移除）
    // 新的 Workflow 实现需要基于 AI SDK 重新设计
    console.log('Workflow test needs to be migrated to new implementation');
  });
});
