import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import myAgentConfig from '@src/common/configs/my-agent.config';
import typeormConfig from '@src/common/configs/typeorm.config';
import VoltAgent, { andThen, createWorkflowChain } from '@voltagent/core';
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
    const workflow = createWorkflowChain({
      id: 'greeter',
      name: 'Greeter Workflow',
      // A detailed description for VoltOps or team clarity
      purpose: 'A simple workflow to generate a greeting for a given name.',
      input: z.object({ name: z.string() }),
      result: z.object({ greeting: z.string() }),
    })
      // Add the first step: a function to create the greeting
      .andThen({
        id: 'create-greeting',
        execute: async ({ data }) => {
          return { greeting: `Hello, ${data.name}!` };
        },
      });

    new VoltAgent({ workflows: { workflow } });

    const result = await workflow.run({ name: 'World' });

    console.log(result.result);
  });

  it('run workflow with agent', async () => {
    const agent = service.createAgent({
      name: 'Analyzer',
      model: 'gpt-5-mini',
      prompt: 'You are a text analyzer.',
    });

    // 创建初始 workflow
    const initialWorkflow = createWorkflowChain({
      id: 'greeter',
      name: 'Greeter Workflow',
      input: z.object({ name: z.string() }),
      result: z.object({
        greeting: z.string(),
        sentiment: z.string(),
      }),
    });

    // 第一步
    const afterGreeting = initialWorkflow.andThen({
      id: 'create-greeting',
      execute: async ({ data }) => {
        return { greeting: `Hello, ${data.name}!` };
      },
    });

    // 第二步
    const afterSentiment = afterGreeting.andAgent(
      async ({ data }) =>
        `Analyze the sentiment of this greeting: "${data.greeting}"`,
      agent.getAgent(),
      {
        schema: z.object({
          sentiment: z.string().describe('e.g., positive, neutral, negative'),
        }),
      },
    );

    // 最后一步
    const workflow = afterSentiment.andThen({
      id: 'combine-results',
      execute: async ({ data, getStepData }) => {
        const greeting = getStepData('create-greeting')?.output.greeting || '';
        const sentiment = data.sentiment;
        return { greeting, sentiment };
      },
    });
    // Run the enhanced workflow
    new VoltAgent({ workflows: { workflow } });

    const result = await workflow.run({ name: 'World' });

    console.log(result.result);
  });

  it('run workflow with agent conditional step', async () => {
    const agent = service.createAgent({
      name: 'Analyzer',
      model: 'gpt-5-mini',
      prompt: 'You are a text analyzer.',
    });

    const workflow = createWorkflowChain({
      id: 'greeter',
      name: 'Greeter Workflow',
      input: z.object({ name: z.string() }),
      // The final result now includes an optional 'isLongName' field
      result: z.object({
        greeting: z.string(),
        sentiment: z.string(),
        isLongName: z.boolean().optional(),
      }),
    })
      .andThen({
        id: 'create-greeting',
        execute: async ({ data }) => {
          return { greeting: `Hello, ${data.name}!` };
        },
      })
      .andAgent(
        async ({ data }) =>
          `Analyze the sentiment of this greeting: "${data.greeting}"`,
        agent.getAgent(),
        {
          schema: z.object({
            sentiment: z.string().describe('e.g., positive, neutral, negative'),
          }),
        },
      )
      .andThen({
        id: 'combine-results',
        execute: async ({ data, getStepData }) => {
          const greeting =
            getStepData('create-greeting')?.output.greeting || '';
          const sentiment = data.sentiment;
          return { greeting, sentiment };
        },
      })
      // Add a conditional step
      .andWhen({
        id: 'check-name-length',
        // Provide input/output schemas for the conditional step per typing requirements
        inputSchema: z.object({
          greeting: z.string(),
          sentiment: z.string(),
        }),
        outputSchema: z.object({
          greeting: z.string(),
          sentiment: z.string(),
          isLongName: z.boolean(),
        }),
        condition: async ({ data }) => data.greeting.length > 15,
        step: andThen({
          id: 'set-long-name-flag',
          execute: async ({
            data,
          }: {
            data: { greeting: string; sentiment: string };
          }) => ({
            ...data,
            isLongName: true,
          }),
        }),
      });

    // Run with a long name to trigger the conditional step
    new VoltAgent({ workflows: { workflow } });

    const longNameResult = await workflow.run({ name: 'Alexanderson' });
    console.log(longNameResult.result);
    // Output: { greeting: 'Hello, Alexanderson!', sentiment: 'positive', isLongName: true }

    // Run with a short name to skip the conditional step
    const shortNameResult = await workflow.run({ name: 'Alex' });
    console.log(shortNameResult.result);
  });
});
