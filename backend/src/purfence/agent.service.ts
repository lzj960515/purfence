import { MyAgentService, getAgentPrompt } from '@app/my-agent';
import { SocketService } from '@app/my-agent/socket.service';
import { MyUtil } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { ProviderModelService } from './provider-model.service';

const ZIWEI_TOOLS = [
  'createProject',
  'createIssue',
  'startIssue',
  'searchProjects',
  'searchIssues',
  'getCurrentTime',
  'Task',
  'updateProject',
  'renderArtifacts',
  'createScheduledTask',
] as const;

const TIANXIANG_TOOLS = [
  'delegateTask',
  'renderArtifacts',
  'getCurrentTime',
] as const;

@Injectable()
export class PurfenceAgentService {
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
  }) {
    const modelOptions =
      await this.providerModelService.resolveModelOptions(params.providerName);

    const agent = this.myAgentService.createAgent({
      tools: [...params.tools],
      name: params.agentName,
      prompt: params.prompt,
      modelOptions,
    });

    await SocketService.warpSocket(params.threadId, () =>
      agent.stream({
        message: [
          {
            id: MyUtil.uuid(),
            role: 'user',
            parts: [{ type: 'text', text: params.query }],
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
}
