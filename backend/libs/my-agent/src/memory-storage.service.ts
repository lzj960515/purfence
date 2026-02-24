import { Injectable } from '@nestjs/common';
import type { UIMessage } from 'ai';
import { In } from 'typeorm';
import { AgentMemoryConversation } from './agent-memory-conversation.ai.entity';
import { AgentMemoryMessage } from './agent-memory-message.ai.entity';
import { AgentWorkingMemory } from './agent-working-memory.ai.entity';
import { AgentWorkflowState } from './agent-workflow-state.ai.entity';

// ============================================================================
// 类型定义（替代 @voltagent/core 的类型）
// ============================================================================

export interface Conversation {
  id: string;
  resourceId: string;
  userId: string;
  title: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GetMessagesOptions {
  limit?: number;
  before?: Date;
  after?: Date;
  roles?: string[];
}

export interface CreateConversationInput {
  id: string;
  resourceId: string;
  userId: string;
  title: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationQueryOptions {
  resourceId?: string;
  userId?: string;
}

export interface WorkingMemoryQuery {
  scope: 'user' | 'conversation' | 'global';
  userId?: string;
  conversationId?: string;
}

export interface WorkingMemoryEntry {
  id: string;
  scope: string;
  userId?: string;
  conversationId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStateEntry {
  workflowId: string;
  workflowName: string;
  status: 'running' | 'suspended' | 'completed' | 'cancelled' | 'error';
  userId?: string;
  conversationId?: string;
  input?: unknown;
  context?: Array<[string, unknown]>;
  workflowState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRunQuery {
  workflowId?: string;
  status?: WorkflowStateEntry['status'];
  userId?: string;
  conversationId?: string;
}

export type WorkingMemoryScope = 'user' | 'conversation';

export class ConversationAlreadyExistsError extends Error {
  constructor(public readonly conversationId: string) {
    super(`Conversation ${conversationId} already exists`);
    this.name = 'ConversationAlreadyExistsError';
  }
}

// ============================================================================
// MemoryStorageService - 替代 TypeOrmMemoryStorageAdapter
// 不依赖 @voltagent/core，直接操作 TypeORM 实体
// ============================================================================

@Injectable()
export class MemoryStorageService {
  // =========================================================================
  // Message Operations
  // =========================================================================

  async addMessage(
    message: UIMessage,
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const existing = await AgentMemoryMessage.findOne({
      where: { id: message.id },
    });

    if (existing) {
      existing.role = message.role;
      existing.parts = message.parts as unknown[];
      existing.metadata = (message.metadata as any) ?? undefined;
      existing.userId = userId;
      existing.conversationId = conversationId;
      await existing.save();
      return;
    }

    const entity = AgentMemoryMessage.create({
      id: message.id,
      userId,
      conversationId,
      role: message.role,
      parts: message.parts as unknown[],
      metadata: (message.metadata as any) ?? undefined,
    });
    await entity.save();
  }

  async addMessages(
    messages: UIMessage[],
    userId: string,
    conversationId: string,
  ): Promise<void> {
    for (const message of messages) {
      await this.addMessage(message, userId, conversationId);
    }
  }

  async getMessages(
    userId: string,
    conversationId: string,
    options?: GetMessagesOptions,
  ): Promise<UIMessage[]> {
    const { limit, before, after, roles } = options || {};
    const qb = AgentMemoryMessage.createQueryBuilder('m')
      .where('m.userId = :userId', { userId })
      .andWhere('m.conversationId = :conversationId', { conversationId });

    if (roles && roles.length > 0) {
      qb.andWhere('m.role IN (:...roles)', { roles });
    }
    if (before) {
      qb.andWhere('m.createdAt < :before', { before });
    }
    if (after) {
      qb.andWhere('m.createdAt > :after', { after });
    }

    qb.orderBy('m.createdAt', 'ASC');

    let rows = await qb.getMany();
    if (limit && limit > 0 && rows.length > limit) {
      rows = rows.slice(rows.length - limit);
    }

    return rows.map((row) => ({
      id: String(row.id),
      role: row.role as any,
      parts: (row.parts ?? []) as any[],
    }));
  }

  // =========================================================================
  // Conversation Operations
  // =========================================================================

  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const existing = await AgentMemoryConversation.findOne({
      where: { id: input.id },
    });
    if (existing) {
      throw new ConversationAlreadyExistsError(input.id);
    }

    const entity = AgentMemoryConversation.create({
      id: input.id,
      resourceId: input.resourceId,
      userId: input.userId,
      title: input.title,
      metadata: input.metadata ?? {},
    });
    await entity.save();
    return this.toConversation(entity);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const entity = await AgentMemoryConversation.findOne({ where: { id } });
    return entity ? this.toConversation(entity) : null;
  }

  async getConversations(options?: ConversationQueryOptions): Promise<Conversation[]> {
    const qb = AgentMemoryConversation.createQueryBuilder('c');

    if (options?.resourceId) {
      qb.andWhere('c.resourceId = :resourceId', { resourceId: options.resourceId });
    }
    if (options?.userId) {
      qb.andWhere('c.userId = :userId', { userId: options.userId });
    }

    qb.orderBy('c.updatedAt', 'DESC');

    const rows = await qb.getMany();
    return rows.map((row) => this.toConversation(row));
  }

  async updateConversation(
    id: string,
    updates: Partial<Conversation>,
  ): Promise<void> {
    await AgentMemoryConversation.update({ id }, updates);
  }

  async deleteConversation(id: string): Promise<void> {
    await AgentMemoryConversation.delete({ id });
    await AgentMemoryMessage.delete({ conversationId: id });
  }

  // =========================================================================
  // Working Memory Operations
  // =========================================================================

  async getWorkingMemory(
    params: WorkingMemoryQuery,
  ): Promise<WorkingMemoryEntry | null> {
    const entity = await AgentWorkingMemory.findOne({
      where: {
        scope: params.scope as 'user' | 'conversation',
        userId: params.userId || null,
        conversationId: params.conversationId || null,
      } as any,
    });

    if (!entity) return null;

    return {
      id: String(entity.id),
      scope: entity.scope,
      userId: entity.userId,
      conversationId: entity.conversationId,
      content: entity.content,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  async setWorkingMemory(
    params: WorkingMemoryQuery & { content: string },
  ): Promise<void> {
    let entity = await AgentWorkingMemory.findOne({
      where: {
        scope: params.scope as 'user' | 'conversation',
        userId: params.userId || null,
        conversationId: params.conversationId || null,
      } as any,
    });

    if (entity) {
      entity.content = params.content;
      await entity.save();
    } else {
      entity = AgentWorkingMemory.create({
        scope: params.scope as 'user' | 'conversation',
        userId: params.userId,
        conversationId: params.conversationId,
        content: params.content,
      } as any);
      await entity.save();
    }
  }

  // =========================================================================
  // Workflow State Operations
  // =========================================================================

  async getWorkflowState(executionId: string): Promise<WorkflowStateEntry | null> {
    const entity = await AgentWorkflowState.findOne({
      where: { workflowId: executionId },
    });

    if (!entity) return null;

    return {
      workflowId: entity.workflowId,
      workflowName: entity.workflowName,
      status: entity.status,
      userId: entity.userId,
      conversationId: entity.conversationId,
      input: entity.input,
      context: entity.context,
      workflowState: entity.workflowState,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  async setWorkflowState(
    executionId: string,
    state: WorkflowStateEntry,
  ): Promise<void> {
    let entity = await AgentWorkflowState.findOne({
      where: { workflowId: executionId },
    });

    if (entity) {
      entity.status = state.status;
      entity.workflowState = state.workflowState;
      entity.input = state.input;
      entity.context = state.context;
      entity.userId = state.userId;
      entity.conversationId = state.conversationId;
      await entity.save();
    } else {
      entity = AgentWorkflowState.create({
        workflowId: executionId,
        workflowName: state.workflowName,
        status: state.status,
        workflowState: state.workflowState,
        input: state.input,
        context: state.context,
        userId: state.userId,
        conversationId: state.conversationId,
      });
      await entity.save();
    }
  }

  async updateWorkflowState(
    executionId: string,
    updates: Partial<WorkflowStateEntry>,
  ): Promise<void> {
    await AgentWorkflowState.update({ workflowId: executionId }, updates);
  }

  async getWorkflowRuns(options?: WorkflowRunQuery): Promise<WorkflowStateEntry[]> {
    const qb = AgentWorkflowState.createQueryBuilder('w');

    if (options?.workflowId) {
      qb.andWhere('w.workflowId = :workflowId', { workflowId: options.workflowId });
    }
    if (options?.status) {
      qb.andWhere('w.status = :status', { status: options.status });
    }
    if (options?.userId) {
      qb.andWhere('w.userId = :userId', { userId: options.userId });
    }
    if (options?.conversationId) {
      qb.andWhere('w.conversationId = :conversationId', {
        conversationId: options.conversationId,
      });
    }

    qb.orderBy('w.createdAt', 'DESC');

    const rows = await qb.getMany();
    return rows.map((row) => ({
      workflowId: row.workflowId,
      workflowName: row.workflowName,
      status: row.status,
      userId: row.userId,
      conversationId: row.conversationId,
      input: row.input,
      context: row.context,
      workflowState: row.workflowState,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  // =========================================================================
  // Additional Methods (from original adapter)
  // =========================================================================

  async clearMessages(userId: string, conversationId?: string): Promise<void> {
    if (conversationId) {
      await AgentMemoryMessage.delete({ userId, conversationId });
      return;
    }
    await AgentMemoryMessage.delete({ userId });
  }

  async deleteMessages(messageIds: string[], userId: string, conversationId: string): Promise<void> {
    if (!messageIds.length) return;
    await AgentMemoryMessage.delete({
      userId,
      conversationId,
      id: In(messageIds),
    });
  }

  async getConversationsByUserId(
    userId: string,
    options?: Omit<ConversationQueryOptions, 'userId'>,
  ): Promise<Conversation[]> {
    return this.getConversations({ ...options, userId });
  }

  async countConversations(options: ConversationQueryOptions): Promise<number> {
    const qb = AgentMemoryConversation.createQueryBuilder('c');
    if (options.userId) qb.andWhere('c.userId = :userId', { userId: options.userId });
    if (options.resourceId)
      qb.andWhere('c.resourceId = :resourceId', { resourceId: options.resourceId });
    return qb.getCount();
  }

  async deleteWorkingMemory(params: WorkingMemoryQuery): Promise<void> {
    const where: any = { scope: params.scope };
    if (params.scope === 'conversation') {
      where.conversationId = params.conversationId;
    } else {
      where.userId = params.userId;
    }
    await AgentWorkingMemory.delete(where);
  }

  async getSuspendedWorkflowStates(workflowId: string): Promise<WorkflowStateEntry[]> {
    const entities = await AgentWorkflowState.find({
      where: { workflowId, status: 'suspended' },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => ({
      workflowId: entity.workflowId,
      workflowName: entity.workflowName,
      status: entity.status,
      userId: entity.userId,
      conversationId: entity.conversationId,
      input: entity.input,
      context: entity.context,
      workflowState: entity.workflowState,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }));
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private toConversation(entity: AgentMemoryConversation): Conversation {
    return {
      id: String(entity.id),
      resourceId: entity.resourceId,
      userId: entity.userId,
      title: entity.title,
      metadata: entity.metadata ?? {},
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
