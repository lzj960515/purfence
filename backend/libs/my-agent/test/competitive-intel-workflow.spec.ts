import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { z } from 'zod';
import myAgentConfig from '@src/common/configs/my-agent.config';
import typeormBiConfig from '@src/common/configs/typeorm-ai.config';
import typeormV2RoConfig from '@src/common/configs/typeorm-v2-ro.config';
import { CurrentDateTimeTool } from '@src/agent/tools/general/current-date-time.tool';
import { JsCodeExecutorTool } from '@src/agent/tools/general/js-code-executor.tool';
import { WebSearchTool } from '@src/agent/tools/general/web-search.tool';
import { QuerySocialMediaAnalysisDatabaseTool } from '@src/agent/tools/database/query-social-media-analysis-database.tool';
import {
  AgentConversationSession,
  MyAgentModule,
  WorkflowConfig,
  WorkflowState,
  WorkflowService,
} from '../src';
import { MyUtil } from '@app/shared';
import ms from 'ms';
import typeormConfig from '@src/common/configs/typeorm.config';
jest.setTimeout(ms('10 minutes'));
const logger = new Logger('CompetitiveIntelWorkflowSpec');

describe('Competitive Intel Workflow (config-driven, real tools)', () => {
  let module: TestingModule;
  let workflowService: WorkflowService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ConfigModule.forFeature(typeormBiConfig),
        ConfigModule.forFeature(typeormConfig),
        ConfigModule.forFeature(typeormV2RoConfig),
        ConfigModule.forFeature(myAgentConfig),
        MyAgentModule,
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config) => config.get('typeorm'),
        }),
        TypeOrmModule.forRootAsync({
          name: 'v2-ro',
          inject: [ConfigService],
          useFactory: (config: ConfigService) => config.get('typeorm-v2-ro'),
        }),
        TypeOrmModule.forFeature([AgentConversationSession]),
      ],
      // 使用真实工具作为 providers，而不是测试专用工具
      providers: [
        CurrentDateTimeTool,
        JsCodeExecutorTool,
        WebSearchTool,
        QuerySocialMediaAnalysisDatabaseTool,
      ],
    })
      .setLogger(logger)
      .compile();

    await module.init();

    workflowService = module.get<WorkflowService>(WorkflowService);
  });

  it('runs the competitive intel workflow and produces a report', async () => {
    const config: WorkflowConfig = {
      name: 'Weekly Competitive Intelligence Workflow',
      nodes: [
        // 1. currentDateTime - 获取当前时间（保持与原对话一致）
        {
          type: 'start',
          preId: null,
          nextId: 'load-monitored-competitors',
          node: {
            id: 'current-time',
            type: 'tool',
            toolName: 'currentDateTime',
          },
        },
        // 2. 查询监控的竞争对手账号
        {
          type: 'normal',
          preId: 'current-time',
          nextId: 'build-posts-query',
          node: {
            id: 'load-monitored-competitors',
            type: 'tool',
            toolName: 'querySocialMediaAnalysisDatabase',
            params: {
              query: {
                type: 'literal',
                value:
                  "\nSELECT DISTINCT hashTag \nFROM p_social_analysis_cleaning_topic \nWHERE storeId = ? \nAND topicType IN ('account_to_monitor', 'ACCOUNT_TO_MONITOR_INSTAGRAM')\n",
              },
            },
          },
        },
        // 3. 用 jsCodeExecutor 根据竞争对手列表动态构建帖子查询 SQL（包含 hashTag IN (...)）
        {
          type: 'normal',
          preId: 'load-monitored-competitors',
          nextId: 'load-social-posts',
          node: {
            id: 'build-posts-query',
            type: 'tool',
            toolName: 'jsCodeExecutor',
            params: {
              code: {
                type: 'literal',
                value:
                  'const rows = Array.isArray(params) ? params : (params && params.queryResult) || [];\n' +
                  'const handles = rows.map(r => r.hashTag).filter(Boolean);\n' +
                  'if (!handles.length) {\n' +
                  "  const emptySql = '\\nSELECT \\n    hashTag,\\n    postType as platform,\\n    description,\\n    (favourCount + commentCount) as total_engagement,\\n    emv,\\n    FROM_UNIXTIME(publishAt) as post_date,\\n    thumbUrl,\\n    sourceId\\nFROM p_social_analysis_cleaning_post\\nWHERE storeId = ?\\n    AND 1 = 0\\nLIMIT 0\\n';\n" +
                  '  return { query: emptySql };\n' +
                  '}\n' +
                  'const inList = handles\n' +
                  "  .map(h => `'${String(h).replace(/'/g, \"''\")}'`)\n" +
                  "  .join(', ');\n" +
                  'const sql = `\\n' +
                  'SELECT \\n' +
                  '    hashTag,\\n' +
                  '    postType as platform,\\n' +
                  '    description,\\n' +
                  '    (favourCount + commentCount) as total_engagement,\\n' +
                  '    emv,\\n' +
                  '    FROM_UNIXTIME(publishAt) as post_date,\\n' +
                  '    thumbUrl,\\n' +
                  '    sourceId\\n' +
                  'FROM p_social_analysis_cleaning_post\\n' +
                  'WHERE storeId = ?\\n' +
                  '    AND hashTag IN (${inList})\\n' +
                  '    AND brandPosts = 1\\n' +
                  '    AND publishAt >= UNIX_TIMESTAMP(DATE(DATE_SUB(NOW(), INTERVAL 7 DAY)))\\n' +
                  '    AND publishAt < UNIX_TIMESTAMP(DATE_ADD(DATE(NOW()), INTERVAL 1 DAY))\\n' +
                  '    AND english = true\\n' +
                  'LIMIT 100\\n`;\n' +
                  'return { query: sql };',
              },
              // 直接把上一步的 queryResult 当作 params 传给 jsCodeExecutor
              params: {
                type: 'node',
                nodeId: 'load-monitored-competitors',
                value: 'queryResult',
              },
            },
          },
        },
        // 4. 根据动态 SQL 查询竞争对手的帖子
        {
          type: 'normal',
          preId: 'build-posts-query',
          nextId: 'build-web-search-query',
          node: {
            id: 'load-social-posts',
            type: 'tool',
            toolName: 'querySocialMediaAnalysisDatabase',
            params: {
              query: {
                type: 'node',
                nodeId: 'build-posts-query',
                value: 'result.query',
              },
            },
          },
        },
        // 5. 基于竞争对手列表构建 web 搜索 query
        {
          type: 'normal',
          preId: 'load-social-posts',
          nextId: 'web-search-news',
          node: {
            id: 'build-web-search-query',
            type: 'tool',
            toolName: 'jsCodeExecutor',
            params: {
              code: {
                type: 'literal',
                value:
                  'const rows = Array.isArray(params) ? params : (params && params.queryResult) || [];\n' +
                  'const handles = rows.map(r => r.hashTag).filter(Boolean);\n' +
                  "const brandList = handles.join(', ');\n" +
                  'const q = `In the last 7 days, what notable news or announcements have there been about these beauty brands: ${brandList}?`;\n' +
                  'return { query: q };',
              },
              params: {
                type: 'node',
                nodeId: 'load-monitored-competitors',
                value: 'queryResult',
              },
            },
          },
        },
        // 6. 调用 webSearch 获取最近一周的新闻/动态
        {
          type: 'normal',
          preId: 'build-web-search-query',
          nextId: 'generate-report',
          node: {
            id: 'web-search-news',
            type: 'tool',
            toolName: 'web-search',
            params: {
              query: {
                type: 'node',
                nodeId: 'build-web-search-query',
                value: 'result.query',
              },
              system: {
                type: 'literal',
                value:
                  'You are a research assistant. Summarize notable recent news items about the given beauty brands over the last 7 days in a concise, business-relevant way.',
              },
            },
          },
        },
        // 7. 使用 Agent 节点生成最终报告（Markdown 文本）
        {
          type: 'end',
          preId: 'web-search-news',
          nextId: null,
          node: {
            id: 'generate-report',
            type: 'agent',
            agent: {
              name: 'CompetitiveIntelReportAgent',
              model: 'gpt-5-mini',
              prompt:
                'You are a senior marketing analyst.\n\n' +
                'Create a weekly competitive intelligence summary for competitors the user monitors in Pulse.\n' +
                'Focus on:\n' +
                '1) Their top performing ad creatives this week with specific examples,\n' +
                '2) Any new products or features they launched,\n' +
                '3) Current promos or pricing changes on their websites,\n' +
                '4) Any important commentary on their social media including shifts in customer sentiment with actual quotes.\n\n' +
                'Also use the provided web search summary for any notable news about these brands in the past week.\n\n' +
                'Keep it concise with clear sections for each competitor. End with 3 specific digital marketing ideas to consider based on what they are doing.\n\n' +
                'Return only one field in JSON: reportMarkdown (a Markdown formatted report).',
            },
            params: {
              competitors: {
                type: 'node',
                nodeId: 'load-monitored-competitors',
                value: 'queryResult',
              },
              posts: {
                type: 'node',
                nodeId: 'load-social-posts',
                value: 'queryResult',
              },
              newsSummary: {
                type: 'node',
                nodeId: 'web-search-news',
              },
            },
            schema: z.object({
              reportMarkdown: z.string(),
            }),
          },
        },
      ],
    };
    const state: WorkflowState = {
      userId: 'st-6cn5sqhu8glcoa',
      conversationId: MyUtil.uuid(),
      // 这里的 storeId 需要是真实有 Pulse 数据的店铺 ID，测试环境下请根据需要修改
      context: new Map<string, unknown>([
        ['storeId', 'st-6cn5sqhu8glcoa'],
        ['storeV1Id', 295652],
      ]),
    };

    const result = await workflowService.run<{
      reportMarkdown: string;
    }>('weekly-competitive-intel', config, {}, state);

    logger.log(`Generated report:\n${result.result?.reportMarkdown}`);

    expect(typeof result.result?.reportMarkdown).toBe('string');
    expect(result.result?.reportMarkdown.length).toBeGreaterThan(0);
  });
});
