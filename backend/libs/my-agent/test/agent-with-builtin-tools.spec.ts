import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import myAgentConfig from '@src/common/configs/my-agent.config';
import { Agent } from '@voltagent/core';
import { LlmService, MyAgent, MyAgentModule, MyAgentService } from '../src';

const logger = new Logger();

describe('AgentWithBuiltinTools', () => {
  let module: TestingModule;
  let service: MyAgentService;
  let llm: LlmService;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ConfigModule.forFeature(myAgentConfig),
        MyAgentModule,
      ],
    })
      .setLogger(logger)
      .compile();

    await module.init();

    service = module.get<MyAgentService>(MyAgentService);
    llm = module.get<LlmService>(LlmService);
  });

  describe('ClaudeWebSearch', () => {
    let agent: MyAgent;
    beforeAll(() => {
      const webSearchTool = llm.createAnthropicTool(({ webSearch_20250305 }) =>
        webSearch_20250305({ maxUses: 3 }),
      );
      console.log(webSearchTool);
      agent = service.createAgent({
        name: 'claude-web-search-agent',
        model: 'claude-sonnet-4-5',
        prompt: `You are an AI assistant with access to a web search tool. Use the tool to find relevant information to answer user queries accurately.`,
        tools: [webSearchTool],
      });
    });

    it('should answer questions using web search', async () => {
      const resp = await agent.generateText('今天重庆天气怎么样？', {
        headers: { 'anthropic-beta': 'web-search-2025-03-05' },
      });
      logger.debug(`Response: ${resp.text}`);
      console.log(resp.response.messages[0].content);
    });
  });

  describe('OpenaiWebSearch', () => {
    let agent: MyAgent;
    beforeAll(() => {
      const webSearchTool = llm.createOpenaiTool(({ webSearch }) =>
        webSearch({}),
      );
      console.log(webSearchTool);
      agent = service.createAgent({
        name: 'openai-web-search-agent',
        model: 'gpt-5',
        prompt: `You are an AI assistant with access to a web search tool. Use the tool to find relevant information to answer user queries accurately.`,
        tools: [webSearchTool],
      });
    });

    it('should answer questions using web search', async () => {
      const resp = await agent.generateText('今天重庆天气怎么样？');
      logger.debug(`Response: ${resp.text}`);
    });
  });

  describe('web search invoke', () => {
    let agent: Agent;

    it('should answer questions using web search', async () => {
      const webSearchTool = llm.createAnthropicTool(({ webSearch_20250305 }) =>
        webSearch_20250305({ maxUses: 3 }),
      );
      const agent = service.createAgent({
        name: 'web-search-agent',
        prompt: `You are an AI assistant with access to a web search tool. Use the tool to find relevant information to answer user queries accurately.`,
        tools: [webSearchTool],
      });
      const resp = await agent.invoke({
        chatOptions: {
          message: '今天重庆天气怎么样？',
        },
      });
      logger.debug(`Response: ${resp}`);
    });
  });
});
