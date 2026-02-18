import { Injectable, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeormConfig from '@src/common/configs/typeorm.config';
import { z } from 'zod';
import myAgentConfig from '../../../src/common/configs/my-agent.config';
import {
  AgentConversationSession,
  MyAgentModule,
  MyAgentService,
  Tool,
} from '../src';

const logger = new Logger();

@Injectable()
class Tools {
  @Tool({
    name: 'get-weather',
    description: 'Get the current weather for a given location',
    parameters: z.object({
      city: z
        .enum(['Beijing', 'Shanghai', 'Chongqing'])
        .describe('The city to get the weather for'),
    }),
    tags: ['test'],
  })
  async getWeather({ city }) {
    logger.debug(`Fetching weather for city: ${city}`);
    return `The current weather in ${city} is sunny with a high of 25°C.`;
  }
}

describe('Agent Object', () => {
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
      providers: [Tools],
    })
      .setLogger(logger)
      .compile();

    await module.init();

    service = module.get<MyAgentService>(MyAgentService);
  });

  it('invoke agent with object', async () => {
    const agent = service.createAgent({
      name: 'agent-object-test',
      prompt: '',
      tools: ['get-weather'],
    });
    const result = await agent.invoke({
      chatOptions: {
        message: 'How do I dress for the weather in Beijing?',
        userId: '123',
        conversationId: '456',
      },
      generateTextOutputOptions: {
        prompt: 'Please summarize the conversation',
        schema: z.object({
          weather: z.object({
            city: z.string(),
            temperature: z.number().describe('The temperature of the weather'),
            description: z.string().describe('The description of the weather'),
          }),
        }),
      },
    });
    logger.log(`Successfully invoked agent: ${JSON.stringify(result)}`);
  });
});
