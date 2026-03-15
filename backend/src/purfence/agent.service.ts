import { MyAgentService, getAgentPrompt } from '@app/my-agent';
import { LlmService } from '@app/my-agent/llm.service';
import { SocketService } from '@app/my-agent/socket.service';
import { AgentModelOptions } from '@app/my-agent/types';
import { Injectable, Logger } from '@nestjs/common';
import { ProviderModelService } from './provider-model.service';
import { PurfenceExecution } from './purfence-execution.entity';
import { ExecutionStage } from './purfence-status.enum';
import { MyUtil } from '@app/shared';
import { Agent } from './agent/agent.entity';
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
  'image',
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
    private readonly llmService: LlmService,
  ) {}

  async streamTianxiang(params: {
    threadId: string;
    query: string;
    context?: Record<string, unknown>;
  }) {}

  async streamAgent(params: {
    userId: string;
    threadId: string;
    query: string;
    agentId: string;
    context?: Record<string, unknown>;
    imageUrl?: string;
  }) {
    const agentConfig = await Agent.findOneOrFail({
      where: { id: params.agentId },
    });

    const agentModelOptions =
      await this.providerModelService.findAgentModelOptions(
        agentConfig.modelConfig,
      );

    const agent = this.myAgentService.createAgent({
      tools: agentConfig.tools,
      name: agentConfig.name,
      prompt: agentConfig.instructions,
    });

    await SocketService.warpSocket(params.threadId, () =>
      agent.stream({
        message: [
          {
            id: MyUtil.uuid(),
            role: 'user',
            parts: [
              {
                type: 'text',
                text: params.query,
              },
              {
                type: 'text',
                text: `user uploaded image path is: ${params.imageUrl}`,
              },
            ],
          },
        ],
        conversationId: params.threadId,
        userId: params.userId,
        agentModelOptions,
        context: {
          ...(params.context || {}),
        },
      }),
    );
  }
}
