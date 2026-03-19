import { MessageService, MyAgentService } from '@app/my-agent';
import { MyUtil } from '@app/shared';
import { Injectable, Logger } from '@nestjs/common';
import { ToolExecuteOptions } from '@voltagent/core';
import { lastValueFrom } from 'rxjs';
import { filter, map, reduce } from 'rxjs/operators';
import { Agent } from '../agent/agent.entity';
import { ProviderModelService } from '../provider-model.service';
import { AgentConversation } from '../conversation/agent-conversation.entity';

const DEFAULT_USER_ID = 'purfence';
type SessionListSortField = 'createdAt' | 'updatedAt' | 'title';
type SessionListSortOrder = 'ASC' | 'DESC';

@Injectable()
export class SessionToolsService {
  private readonly logger = new Logger(SessionToolsService.name);

  constructor(
    private readonly myAgentService: MyAgentService,
    private readonly messageService: MessageService,
    private readonly providerModelService: ProviderModelService,
  ) {}

  async listAgents() {
    const agents = await Agent.find({ order: { updatedAt: 'DESC' } });
    return {
      total: agents.length,
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description ?? null,
        tools: agent.tools ?? [],
        skills: agent.skills ?? [],
        updatedAt: agent.updatedAt.toISOString(),
      })),
    };
  }

  async listSessions(params: {
    options: ToolExecuteOptions;
    title?: string;
    limit: number;
    offset: number;
    agentId?: string;
    currentConversationOnly: boolean;
    sortBy: SessionListSortField;
    sortOrder: SessionListSortOrder;
  }) {
    const query = AgentConversation.createQueryBuilder('conversation')
      .orderBy(`conversation.${params.sortBy}`, params.sortOrder)
      .skip(params.offset)
      .take(params.limit);

    if (params.agentId) {
      query.andWhere('conversation.agentId = :agentId', {
        agentId: params.agentId,
      });
    }
    if (params.currentConversationOnly) {
      query.andWhere(
        'conversation.parentConversationId = :parentConversationId',
        {
          parentConversationId: params.options.conversationId,
        },
      );
    }
    if (params.title?.trim()) {
      query.andWhere('conversation.title LIKE :title', {
        title: `%${params.title.trim()}%`,
      });
    }

    const [conversations, total] = await query.getManyAndCount();
    const statuses = new Map(
      conversations.map((conversation) => [
        conversation.id,
        this.myAgentService.isConversationRunning(conversation.id)
          ? 'running'
          : 'idle',
      ]),
    );

    return {
      total,
      conversations: conversations.map((conversation) => ({
        ...conversation,
        status: statuses.get(conversation.id),
      })),
    };
  }

  async getSessionHistory(params: {
    options: ToolExecuteOptions;
    sessionId: string;
    limit: number;
    offset: number;
  }) {
    const userId = params.options.userId || DEFAULT_USER_ID;
    await AgentConversation.findOneOrFail({ where: { id: params.sessionId } });
    const messages = await this.messageService.summarizeHistory(
      userId,
      params.sessionId,
      {},
    );
    const sliced = messages.slice(params.offset, params.offset + params.limit);
    return {
      sessionId: params.sessionId,
      total: messages.length,
      truncated: sliced.length < messages.length,
      items: sliced,
    };
  }

  async getToolCallDetails(params: {
    options: ToolExecuteOptions;
    sessionId: string;
    toolCallIds: string[];
  }) {
    const userId = params.options.userId || DEFAULT_USER_ID;
    await AgentConversation.findOneOrFail({ where: { id: params.sessionId } });
    return {
      sessionId: params.sessionId,
      items: await this.messageService.loadToolCallDetails(
        userId,
        params.sessionId,
        params.toolCallIds,
      ),
    };
  }

  async spawnSession(params: {
    options: ToolExecuteOptions;
    agentId: string;
    title: string;
    task: string;
    sessionId?: string;
    background: boolean;
  }) {
    const userId = params.options.userId || DEFAULT_USER_ID;
    const currentConversationId = params.options.conversationId;
    const agent = await Agent.findOneOrFail({ where: { id: params.agentId } });
    const sessionId = params.sessionId?.trim();
    if (sessionId) {
      if (this.myAgentService.isConversationRunning(sessionId)) {
        throw new Error(`Session is already running: ${sessionId}`);
      }
    }
    const conversation = await this.findOrCreateSession(
      agent.id,
      userId,
      currentConversationId,
      params.title,
      sessionId,
    );

    const agentModelOptions =
      await this.providerModelService.findAgentModelOptions(agent.modelConfig);

    const runtimeAgent = this.myAgentService.createAgent({
      tools: agent.tools,
      name: agent.name,
      prompt: agent.instructions,
    });

    const stream$ = await runtimeAgent.stream({
      message: [
        {
          id: MyUtil.uuid(),
          role: 'user',
          parts: [
            {
              type: 'text',
              text: params.task,
            },
          ],
        },
      ],
      conversationId: conversation.id,
      userId,
      agentModelOptions,
      context: params.options.context,
    });

    if (params.background) {
      stream$
        .pipe(
          filter((event) => event.data.type === 'text'),
          map((event) => event.data.content ?? ''),
          reduce((acc, content) => `${acc}${content}`, ''),
        )
        .subscribe({
          next: (result) => {
            this.logger.log(
              `sessionsSpawn completed for ${conversation.id}: ${result}`,
            );
          },
          error: (error) => {
            this.logger.error(
              `sessionsSpawn failed for ${conversation.id}: ${error instanceof Error ? error.message : String(error)}`,
              error instanceof Error ? error.stack : undefined,
            );
          },
        });
      return {
        status: 'accepted',
        sessionId: conversation.id,
        note: 'auto-announces on completion, do not poll/sleep. The response will be sent back as an user message',
      };
    }

    const result = await lastValueFrom(
      stream$.pipe(
        filter((event) => event.data.type === 'text'),
        map((event) => event.data.content ?? ''),
        reduce((acc, content) => `${acc}${content}`, ''),
      ),
    );
    return {
      status: 'completed',
      sessionId: conversation.id,
      result,
    };
  }

  private async findOrCreateSession(
    agentId: string,
    userId: string,
    currentConversationId: string,
    title: string,
    sessionId?: string,
  ) {
    if (sessionId) {
      return await AgentConversation.findOneOrFail({
        where: { id: sessionId },
      });
    }

    return await AgentConversation.create({
      id: sessionId,
      agentId,
      parentConversationId: currentConversationId,
      userId,
      title,
    }).save();
  }

  async getSessionStatus(params: {
    options: ToolExecuteOptions;
    sessionId: string;
  }) {
    await AgentConversation.findOneOrFail({ where: { id: params.sessionId } });

    return {
      sessionId: params.sessionId,
      status: this.myAgentService.isConversationRunning(params.sessionId)
        ? 'running'
        : 'idle',
    };
  }

  killSession(sessionId: string) {
    const terminated = this.myAgentService.sessionTerminate(sessionId);
    return {
      sessionId,
      status: terminated ? 'terminated' : 'not_running',
    };
  }
}
