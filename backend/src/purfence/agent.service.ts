import { MyAgentService, getAgentPrompt } from '@app/my-agent';
import { SocketService } from '@app/my-agent/socket.service';
import { MyUtil } from '@app/shared';
import { Injectable, Logger } from '@nestjs/common';
import { ProviderModelService } from './provider-model.service';
import { PurfenceExecution } from './purfence-execution.entity';
import { ExecutionStage } from './purfence-status.enum';
import { readFile } from 'node:fs/promises';

const ZIWEI_TOOLS = [
  'createProject',
  'createIssue',
  'startIssue',
  'searchProjects',
  'searchIssues',
  'getCurrentTime',
  'updateProject',
  'renderArtifacts',
  'createScheduledTask',
] as const;

const TIANXIANG_TOOLS = [
  'delegateTask',
  'renderArtifacts',
  'getCurrentTime',
] as const;

// 天机（Tianji）工具集 - 用于调度、分配任务
const TIANJI_TOOLS = ['delegateTask', 'getCurrentTime'] as const;

// 天府（Tianfu）工具集 - 用于评估、规划下一步
const TIANFU_TOOLS = [
  'continueExecution',
  'createNextExecution',
  'completeIssue',
  'createNextIssue',
  'delegateTask',
  'getCurrentTime',
] as const;

@Injectable()
export class PurfenceAgentService {
  private readonly logger = new Logger(PurfenceAgentService.name);

  constructor(
    private readonly myAgentService: MyAgentService,
    private readonly providerModelService: ProviderModelService,
  ) {}

  async streamZiwei(params: {
    threadId: string;
    query: string;
    providerName?: string;
    context?: Record<string, unknown>;
    userId?: string;
    imageUrl?: string;
  }) {
    const ziweiPrompt = getAgentPrompt('ziwei');
    if (!ziweiPrompt) {
      throw new Error('ziwei agent not found');
    }

    await this.streamAgent({
      threadId: params.threadId,
      query: params.query,
      agentName: 'ziwei',
      prompt: ziweiPrompt,
      tools: [...ZIWEI_TOOLS],
      providerName: params.providerName,
      context: params.context,
      userId: params.userId,
      imageUrl: params.imageUrl,
    });
  }

  async streamTianxiang(params: {
    threadId: string;
    query: string;
    providerName?: string;
    context?: Record<string, unknown>;
  }) {
    const tianxiangPrompt = getAgentPrompt('tianxiang');
    if (!tianxiangPrompt) {
      throw new Error('tianxiang agent not found');
    }

    await this.streamAgent({
      threadId: params.threadId,
      query: params.query,
      agentName: 'tianxiang',
      prompt: tianxiangPrompt,
      tools: [...TIANXIANG_TOOLS],
      providerName: params.providerName,
      context: params.context,
    });
  }

  async streamAgent(params: {
    threadId: string;
    query: string;
    agentName: string;
    prompt: string;
    tools: readonly string[];
    providerName?: string;
    context?: Record<string, unknown>;
    userId?: string;
    imageUrl?: string;
  }) {
    const modelOptions = await this.providerModelService.resolveModelOptions(
      params.providerName,
    );

    const agent = this.myAgentService.createAgent({
      tools: [...params.tools],
      name: params.agentName,
      prompt: params.prompt,
      agentModelOptions: {
        default: modelOptions,
        fallbacks: [],
      },
    });

    // 构建消息 parts，支持图片
    const parts: Array<
      | { type: 'text'; text: string }
      | { type: 'file'; url: string; mediaType: string }
    > = [{ type: 'text', text: params.query }];

    if (params.imageUrl) {
      // 读取文件转 base64
      const buffer = await readFile(params.imageUrl);
      const base64 = buffer.toString('base64');
      const mediaType = this.inferMediaType(params.imageUrl);
      parts.push({
        type: 'file',
        url: `data:${mediaType};base64,${base64}`,
        mediaType,
      });
    }

    console.log('parts', parts);
    await SocketService.warpSocket(params.threadId, () =>
      agent.stream({
        message: [
          {
            id: MyUtil.uuid(),
            role: 'user',
            parts,
          },
        ],
        conversationId: params.threadId,
        userId: params.userId || 'purfence',
        modelOptions,
        context: {
          provider: modelOptions.provider,
          ...(params.context || {}),
        },
      }),
    );
  }

  /**
   * 根据文件扩展名推断 media type
   */
  private inferMediaType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'image/png';
    }
  }

  /**
   * 根据 agent 类型继续执行 Execution
   * - tianji: 使用天机 Agent（调度、分配任务）
   * - tianfu: 使用天府 Agent（评估、规划下一步）
   */
  async streamExecutionAgent(params: {
    threadId: string;
    query: string;
    agent: 'tianji' | 'tianfu';
    executionId: string;
    providerName?: string;
    context?: Record<string, unknown>;
  }) {
    const { threadId, query, agent, executionId, providerName, context } =
      params;

    this.logger.log(
      `streamExecutionAgent: executionId=${executionId}, agent=${agent}`,
    );

    // 获取 Execution 信息
    const execution = await PurfenceExecution.findOne({
      where: { id: executionId },
    });

    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // 更新 stage
    const newStage =
      agent === 'tianji' ? ExecutionStage.tianji : ExecutionStage.tianfu;
    execution.stage = newStage;
    await execution.save();

    this.logger.log(`Updated execution ${executionId} stage to ${newStage}`);

    // 根据 agent 类型选择提示词和工具集
    const prompt = getAgentPrompt(agent);
    if (!prompt) {
      throw new Error(`${agent} agent prompt not found`);
    }

    const tools = agent === 'tianji' ? [...TIANJI_TOOLS] : [...TIANFU_TOOLS];

    // 构建 context
    const streamContext = {
      executionId,
      issueId: execution.issueId,
      event:
        agent === 'tianji'
          ? 'purfence.execution.evaluate'
          : 'purfence.evaluation.stream-ended',
      ...context,
    };

    await this.streamAgent({
      threadId,
      query,
      agentName: agent,
      prompt,
      tools,
      providerName,
      context: streamContext,
    });
  }
}
