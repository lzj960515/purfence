import { MyAgentService } from '@app/my-agent';
import { LlmService } from '@app/my-agent/llm.service';
import { SocketService } from '@app/my-agent/socket.service';
import { Injectable, Logger } from '@nestjs/common';
import { ProviderModelService } from './provider-model.service';
import { MyUtil } from '@app/shared';
import { Agent } from './agent/agent.entity';
import { AgentConversation } from './conversation/agent-conversation.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { CommonService } from '@src/common';
import { FindOptionsWhere, Not } from 'typeorm';

@Injectable()
export class PurfenceAgentService {
  private readonly logger = new Logger(PurfenceAgentService.name);

  constructor(
    private readonly myAgentService: MyAgentService,
    private readonly providerModelService: ProviderModelService,
    private readonly llmService: LlmService,
  ) {}

  streamTianxiang(params: {
    threadId: string;
    query: string;
    context?: Record<string, unknown>;
  }) {
    void params;
    return Promise.resolve();
  }

  async streamAgent(params: {
    userId: string;
    threadId: string;
    query: string;
    agentId: string;
    context?: Record<string, unknown>;
    imageUrl?: string;
  }) {
    const { userId, threadId, query, agentId, context, imageUrl } = params;
    const agentConfig = await Agent.findOneOrFail({
      where: { id: agentId },
    });

    // 当前 agent 可以 spawn 的目标
    const subAgents = await Agent.find({
      where: [
        { parentId: agentConfig.id }, // 我的下级
        {
          parentId: agentConfig.parentId, // 我的平级
          id: Not(agentConfig.id),
        },
        { global: true }, // 全局角色
        agentConfig.parentId ? { id: agentConfig.parentId } : undefined,
      ],
    });

    const subAgentOptions = subAgents.map((subAgent) => ({
      name: subAgent.name,
      description: subAgent.description,
    }));

    const agentModelOptions =
      await this.providerModelService.findAgentModelOptions(
        agentConfig.modelConfig,
      );

    const agent = this.myAgentService.createAgent({
      tools: agentConfig.tools,
      name: agentConfig.name,
      prompt: agentConfig.instructions,
      subAgentOptions,
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
                text: query,
              },
              ...(imageUrl
                ? [
                    {
                      type: 'text' as const,
                      text: `user uploaded image path is: ${imageUrl}`,
                    },
                  ]
                : []),
            ],
          },
        ],
        conversationId: threadId,
        userId: userId,
        agentModelOptions,
        context: {
          ...(context || {}),
        },
      }),
    );
    CommonService.emit('generate.title', {
      threadId,
      query,
      agentId,
      userId,
    });
  }

  @OnEvent('generate.title')
  async generateTitle(payload: {
    threadId: string;
    query: string;
    agentId: string;
    userId: string;
  }) {
    const { threadId, query, agentId, userId } = payload;

    const conversation = await AgentConversation.findOne({
      where: { id: threadId },
    });
    if (conversation) {
      const agentConfig = await Agent.findOneOrFail({
        where: { id: agentId },
      });

      const agentModelOptions =
        await this.providerModelService.findAgentModelOptions(
          agentConfig.modelConfig,
        );

      const title = await this.myAgentService.generateText(
        agentModelOptions.default,
        [
          {
            role: 'system',
            content:
              'Please summarize the conversation messages in 20 characters or less. Return only plain text without any quotes, symbols, or formatting.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: query,
              },
            ],
          },
        ],
      );
      conversation.title = title;
      conversation.agentId = agentId;
      conversation.userId = userId;
      await conversation.save();
    }
  }
}
