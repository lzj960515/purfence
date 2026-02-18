import { Injectable, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ToolExecuteOptions } from '@voltagent/core';
import { z } from 'zod';
import myAgentConfig from '@src/common/configs/my-agent.config';
import typeormBiConfig from '@src/common/configs/typeorm-ai.config';
import {
  MyAgentModule,
  Tool,
  WorkflowConfig,
  WorkflowState,
  WorkflowService,
} from '../src';
import { JsCodeExecutorTool } from '@src/agent/tools/general/js-code-executor.tool';
import { CurrentDateTimeTool } from '@src/agent/tools/general/current-date-time.tool';

const logger = new Logger('WorkflowServiceSpec');

@Injectable()
class WorkflowTestTools {
  @Tool({
    name: 'inspectQuery',
    parameters: z.object({
      query: z.string(),
    }),
    outputSchema: z.object({
      finalQuery: z.string(),
      userId: z.string().nullable(),
      conversationId: z.string().nullable(),
    }),
    tags: ['test'],
  })
  async inspectQuery(args: { query: string }, options: ToolExecuteOptions) {
    const { query } = args;

    logger.log(`inspectQuery received query=${query}`);

    return {
      finalQuery: query,
      userId: options?.userId ?? null,
      conversationId: options?.conversationId ?? null,
    };
  }
}

describe('WorkflowService (config-driven with tools)', () => {
  let module: TestingModule;
  let workflowService: WorkflowService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ConfigModule.forFeature(typeormBiConfig),
        ConfigModule.forFeature(myAgentConfig),
        MyAgentModule,
      ],
      providers: [WorkflowTestTools, JsCodeExecutorTool, CurrentDateTimeTool],
    })
      .setLogger(logger)
      .compile();

    await module.init();

    workflowService = module.get<WorkflowService>(WorkflowService);
  });

  it('runs a workflow using jsCodeExecutor and other tools', async () => {
    const config: WorkflowConfig = {
      name: 'Workflow with currentDateTime and jsCodeExecutor',
      nodes: [
        {
          type: 'start',
          preId: null,
          nextId: 'build-order-query',
          node: {
            id: 'current-time',
            type: 'tool',
            toolName: 'currentDateTime',
          },
        },
        {
          type: 'normal',
          preId: 'current-time',
          nextId: 'inspect-query',
          node: {
            id: 'build-order-query',
            type: 'tool',
            toolName: 'jsCodeExecutor',
            params: {
              code: {
                type: 'literal',
                value:
                  'const now = new Date(params);\n' +
                  'const endDate = now.toISOString().slice(0, 10);\n' +
                  'const start = new Date(now);\n' +
                  'start.setMonth(start.getMonth() - 1);\n' +
                  'const startDate = start.toISOString().slice(0, 10);\n' +
                  'const sql = `\n' +
                  '  SELECT *\n' +
                  '  FROM bi_shopify_trans_order o\n' +
                  '  WHERE o."storeV1Id" = $1\n' +
                  '    AND o."processedAt" >= \'${startDate}\'::timestamp\n' +
                  '    AND o."processedAt" < \'${endDate}\'::timestamp\n' +
                  '`;\n' +
                  'return { query: sql };',
              },
              params: {
                type: 'node',
                nodeId: 'current-time',
              },
            },
          },
        },
        {
          type: 'end',
          preId: 'build-order-query',
          nextId: null,
          node: {
            id: 'inspect-query',
            type: 'tool',
            toolName: 'inspectQuery',
            params: {
              query: {
                type: 'node',
                nodeId: 'build-order-query',
                value: 'result.query',
              },
            },
          },
        },
      ],
    };

    const state: WorkflowState = {
      userId: 'user-workflow-test',
      conversationId: 'conv-workflow-test',
      context: new Map(),
    };

    const result = await workflowService.run<{
      finalQuery: string;
    }>('workflow-js-sql', config, {}, state);

    expect(result.result.finalQuery).toContain('bi_shopify_trans_order');

    // Extract dates from the generated SQL and validate they form a 1-month window ending today
    const dateMatches = Array.from(
      result.result.finalQuery.matchAll(/'(\d{4}-\d{2}-\d{2})'::timestamp/g),
    ).map((m) => m[1]);

    expect(dateMatches.length).toBe(2);

    const [startStr, endStr] = dateMatches;
    const endDate = new Date(endStr);
    const startDate = new Date(startStr);

    // endDate should be "today" (same calendar day)
    const today = new Date();
    const toDayStr = today.toISOString().slice(0, 10);
    expect(endStr).toBe(toDayStr);

    // startDate should be exactly one month before endDate (by month difference)
    const expectedStart = new Date(endDate);
    expectedStart.setMonth(expectedStart.getMonth() - 1);
    const expectedStartStr = expectedStart.toISOString().slice(0, 10);
    expect(startStr).toBe(expectedStartStr);
  });
});
