import { convertToAnthropicMessagesPrompt } from '@ai-sdk/anthropic';
import type { LanguageModelV3Prompt, SharedV3Warning } from '@ai-sdk/provider';
import { asSchema, createToolNameMapping } from '@ai-sdk/provider-utils';
import Anthropic from '@anthropic-ai/sdk';
import { createTool, ToolManager } from '@voltagent/core';
import { convertToModelMessages } from 'ai';
import z from 'zod';

describe('Anthropic: convertToAnthropicMessagesPrompt', () => {
  it('converts a basic V3 prompt to Anthropic messages format', async () => {
    const prompt: LanguageModelV3Prompt = [
      { role: 'system', content: 'system rules' },
      { role: 'user', content: [{ type: 'text', text: 'hello' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'hi' }] },
    ];

    const warnings: Array<SharedV3Warning> = [];
    const toolNameMapping = createToolNameMapping({
      tools: undefined,
      providerToolNames: {},
    });

    const result = await convertToAnthropicMessagesPrompt({
      prompt,
      sendReasoning: false,
      warnings,
      toolNameMapping,
    });

    expect(result.betas).toBeInstanceOf(Set);
    expect(result.prompt).toMatchObject({
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'hello' }],
        },
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'hi' }],
        },
      ],
    });
    expect(result.prompt.system).toEqual([
      expect.objectContaining({ type: 'text', text: 'system rules' }),
    ]);
  });

  it('countTokens: system + tools + tool use/results (end-to-end)', async () => {
    const getWeatherTool = createTool({
      name: 'get_weather',
      description: 'Get the current weather in a given location',
      parameters: z.object({
        location: z
          .string()
          .describe('The city and state, e.g. San Francisco, CA'),
      }),
      execute: async ({ location }) => ({
        location,
        temperatureF: 68,
        condition: 'sunny',
      }),
    });

    const toolManager = new ToolManager([getWeatherTool]);
    const createToolExecuteFunction = (tool: any) => (args: any) =>
      tool.execute(args);
    const preparedTools = toolManager.prepareToolsForExecution(
      createToolExecuteFunction,
    );

    const anthropicTools = await Promise.all(
      Object.entries(preparedTools).map(async ([name, tool]) => ({
        name,
        description: tool.description,
        input_schema: await asSchema(tool.inputSchema).jsonSchema,
      })),
    );

    expect(anthropicTools).toEqual([
      expect.objectContaining({
        name: 'get_weather',
        description: 'Get the current weather in a given location',
        input_schema: expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            location: expect.any(Object),
          }),
        }),
      }),
    ]);

    expect((anthropicTools[0].input_schema as any).required).toContain(
      'location',
    );

    const toolCallInput = { location: 'San Francisco, CA' };
    const toolOutputValue =
      await preparedTools.get_weather.execute(toolCallInput);
    const prompt: LanguageModelV3Prompt = [
      { role: 'system', content: 'You are a helpful assistant.' },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: "What's the weather like in San Francisco?",
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call-1',
            toolName: 'get_weather',
            input: toolCallInput,
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call-1',
            toolName: 'get_weather',
            output: { type: 'json', value: toolOutputValue },
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: `It is ${toolOutputValue.condition} and ${toolOutputValue.temperatureF}F in ${toolOutputValue.location}.`,
          },
        ],
      },
    ];

    const warnings: Array<SharedV3Warning> = [];
    const toolNameMapping = createToolNameMapping({
      tools: undefined,
      providerToolNames: {},
    });

    const anthropicPrompt = await convertToAnthropicMessagesPrompt({
      prompt,
      sendReasoning: false,
      warnings,
      toolNameMapping,
    });

    const client = new Anthropic();
    const tokens = await client.messages.countTokens({
      model: 'claude-sonnet-4-5',
      tools: anthropicTools as any,
      system: anthropicPrompt.prompt.system as any,
      messages: anthropicPrompt.prompt.messages as any,
    });

    expect(tokens).toEqual(
      expect.objectContaining({ input_tokens: expect.any(Number) }),
    );
    console.log(JSON.stringify(tokens, null, 2));
  });
});
