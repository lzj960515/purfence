import { MyUtil } from '@app/shared';
import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import myAgentConfig from '@src/common/configs/my-agent.config';
import typeormConfig from '@src/common/configs/typeorm.config';
import { from, lastValueFrom, tap } from 'rxjs';
import {
  AgentConversationSession,
  MyAgentModule,
  MyAgentService,
} from '../src';
import { Output } from 'ai';
import z from 'zod';

const logger = new Logger();

describe('Basic Agent', () => {
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

  it('create agent', async () => {
    const agent = service.createAgent({
      name: 'basic-agent-test',
      prompt: '',
      tools: [],
    });

    const result = await agent.generateText('Hello, world!');

    logger.log(`Successfully created agent: ${result.text}`);
  });

  it('create agent output', async () => {
    const agent = service.createAgent({
      name: 'basic-agent-test',
      prompt: '',
      tools: [],
    });

    const result = await agent.generateText('Hello, world!', {
      output: Output.object({ schema: z.object({ name: z.string() }) }),
    });

    logger.log(`Successfully created agent: ${JSON.stringify(result.output)}`);
  });

  it('stream agent', async () => {
    const agent = service.createAgent({
      name: 'stream-agent-test',
      prompt: 'your are a helpful assistant',
      tools: [],
    });

    const result = agent.stream({
      message: [
        {
          id: MyUtil.uuid(),
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Hello, world!',
            },
          ],
          metadata: {
            user_id: '123',
            conversation_id: '456',
          },
        },
      ],
      userId: '123',
      conversationId: MyUtil.uuid(),
    });
    await lastValueFrom(
      from(result).pipe(
        tap((it) => {
          logger.log(JSON.stringify(it));
        }),
      ),
    );
  });

  it('stream vertex agent', async () => {
    const agent = service.createAgent({
      name: 'stream-agent-test',
      prompt: 'your are a helpful assistant',
      tools: [],
    });

    const result = agent.stream({
      message: 'Hello, world!',
      userId: '123',
      conversationId: '456',
    });
    await lastValueFrom(
      from(result).pipe(
        tap((it) => {
          logger.log(JSON.stringify(it));
        }),
      ),
    );
  });
});
