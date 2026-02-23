/**
 * @deprecated 此文件已废弃，请直接使用 MemoryStorageService
 * 保留此文件是为了向后兼容，将在下一版本中移除
 */

import type { UIMessage } from 'ai';
import { In } from 'typeorm';
import { AgentMemoryConversation } from './agent-memory-conversation.ai.entity';
import { AgentMemoryMessage } from './agent-memory-message.ai.entity';
import { AgentWorkingMemory } from './agent-working-memory.ai.entity';
import { AgentWorkflowState } from './agent-workflow-state.ai.entity';
import {
  Conversation,
  GetMessagesOptions,
  CreateConversationInput,
  ConversationQueryOptions,
  WorkingMemoryQuery,
  WorkingMemoryEntry,
  WorkflowStateEntry,
  WorkflowRunQuery,
  WorkingMemoryScope,
  ConversationAlreadyExistsError,
} from './memory-storage.service';

export {
  Conversation,
  GetMessagesOptions,
  CreateConversationInput,
  ConversationQueryOptions,
  WorkingMemoryQuery,
  WorkingMemoryEntry,
  WorkflowStateEntry,
  WorkflowRunQuery,
  WorkingMemoryScope,
  ConversationAlreadyExistsError,
};

function toIso(d: Date) {
  return d.toISOString();
}

function toConversation(entity: AgentMemoryConversation): Conversation {
  return {
    id: String(entity.id),
    resourceId: entity.resourceId,
    userId: entity.userId,
    title: entity.title,
    metadata: entity.metadata ?? {},
    createdAt: toIso(entity.createdAt),
    updatedAt: toIso(entity.updatedAt),
  };
}

/**
 * @deprecated 请使用 MemoryStorageService
 * 此适配器保留是为了向后兼容，内部实现已改为直接使用 TypeORM 实体
 */
export class TypeOrmMemoryStorageAdapter {
  // =========================================================================
  // Message Operations
  // =========================================================================
  async addMessage(message: UIMessage, userId: string, conversationId: string) {
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

  async addMessages(messages: UIMessage[], userId: string, conversationId: string) {
    for (const message of messages) {
      await this.addMessage(message, userId, conversationId);
    }
  }

  async getMessages(
    userId: string,
    conversationId: string,
    options?: GetMessagesOptions,
  ): Promise<UIMessage<{ createdAt: Date }>[]> {
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

    return rows.map((row) => {
      const uiMessage: any = {
        id: String(row.id),
        role: row.role,
        parts: (row.parts ?? []) as any[],
        metadata: { ...(row.metadata ?? {}) },
      };
      uiMessage.metadata.createdAt = row.createdAt;
      return uiMessage;
    });
  }

  async clearMessages(userId: string, conversationId?: string) {
    if (conversationId) {
      await AgentMemoryMessage.delete({ userId, conversationId });
      return;
    }
    await AgentMemoryMessage.delete({ userId });
  }

  async deleteMessages(messageIds: string[], userId: string, conversationId: string) {
    if (!messageIds.length) return;
    await AgentMemoryMessage.delete({
      userId,
      conversationId,
      id: In(messageIds),
    });
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
    return toConversation(entity);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const entity = await AgentMemoryConversation.findOne({ where: { id } });
    if (!entity) return null;
    return toConversation(entity);
  }

  async getConversations(resourceId: string): Promise<Conversation[]> {
    const entities = await AgentMemoryConversation.find({
      where: { resourceId },
      order: { updatedAt: 'DESC' },
    });
    return entities.map(toConversation);
  }

  async getConversationsByUserId(
    userId: string,
    options?: Omit<ConversationQueryOptions, 'userId'>,
  ): Promise<Conversation[]> {
    return this.queryConversations({ ...options, userId });
  }

  async queryConversations(options: ConversationQueryOptions): Promise<Conversation[]> {
    const qb = AgentMemoryConversation.createQueryBuilder('c');
    if (options.userId) qb.andWhere('c.userId = :userId', { userId: options.userId });
    if (options.resourceId)
      qb.andWhere('c.resourceId = :resourceId', { resourceId: options.resourceId });

    const orderDirection = (options as any).orderDirection ?? 'DESC';
    const orderBy = (options as any).orderBy ?? 'updated_at';
    const orderColumn =
      orderBy === 'created_at'
        ? 'c.createdAt'
        : orderBy === 'title'
          ? 'c.title'
          : 'c.updatedAt';
    qb.orderBy(orderColumn, orderDirection);

    if ((options as any).offset && (options as any).offset > 0) qb.skip((options as any).offset);
    if ((options as any).limit && (options as any).limit > 0) qb.take((options as any).limit);

    const entities = await qb.getMany();
    return entities.map(toConversation);
  }

  async countConversations(options: ConversationQueryOptions): Promise<number> {
    const qb = AgentMemoryConversation.createQueryBuilder('c');
    if (options.userId) qb.andWhere('c.userId = :userId', { userId: options.userId });
    if (options.resourceId)
      qb.andWhere('c.resourceId = :resourceId', { resourceId: options.resourceId });
    return qb.getCount();
  }

  async updateConversation(
    id: string,
    updates: Partial<Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Conversation> {
    const entity = await AgentMemoryConversation.findOne({ where: { id } });
    if (!entity) {
      // 如果会话不存在，创建新会话（保持与原行为一致）
      const created = AgentMemoryConversation.create({
        id,
        resourceId: String(updates.resourceId ?? ''),
        userId: String(updates.userId ?? ''),
        title: String(updates.title ?? ''),
        metadata: (updates.metadata ?? {}) as Record<string, unknown>,
      });
      await created.save();
      return toConversation(created);
    }

    if (updates.title !== undefined) entity.title = updates.title;
    if (updates.metadata !== undefined)
      entity.metadata = (updates.metadata ?? {}) as Record<string, unknown>;

    await entity.save();
    return toConversation(entity);
  }

  async deleteConversation(id: string): Promise<void> {
    const conversation = await AgentMemoryConversation.findOne({ where: { id } });
    if (conversation) {
      await AgentMemoryMessage.delete({
        userId: conversation.userId,
        conversationId: String(conversation.id),
      });
      await AgentWorkingMemory.delete({ conversationId: String(conversation.id) });
    }
    await AgentMemoryConversation.delete({ id });
  }

  // =========================================================================
  // Working Memory
  // =========================================================================
  async getWorkingMemory(params: {
    conversationId?: string;
    userId?: string;
    scope: WorkingMemoryScope;
  }): Promise<string | null> {
    const where: any = { scope: params.scope };
    if (params.scope === 'conversation') {
      where.conversationId = params.conversationId;
    } else {
      where.userId = params.userId;
    }

    const entity = await AgentWorkingMemory.findOne({ where });
    return entity?.content ?? null;
  }

  async setWorkingMemory(params: {
    conversationId?: string;
    userId?: string;
    content: string;
    scope: WorkingMemoryScope;
  }): Promise<void> {
    const where: any = { scope: params.scope };
    if (params.scope === 'conversation') {
      where.conversationId = params.conversationId;
    } else {
      where.userId = params.userId;
    }

    const existing = await AgentWorkingMemory.findOne({ where });
    if (existing) {
      existing.content = params.content;
      await existing.save();
      return;
    }

    const entity = AgentWorkingMemory.create({
      scope: params.scope as 'user' | 'conversation',
      userId: params.userId,
      conversationId: params.conversationId,
      content: params.content,
    });
    await (entity as any).save();
  }

  async deleteWorkingMemory(params: {
    conversationId?: string;
    userId?: string;
    scope: WorkingMemoryScope;
  }): Promise<void> {
    const where: any = { scope: params.scope };
    if (params.scope === 'conversation') {
      where.conversationId = params.conversationId;
    } else {
      where.userId = params.userId;
    }
    await AgentWorkingMemory.delete(where);
  }

  // =========================================================================
  // Workflow state
  // =========================================================================
  async getWorkflowState(executionId: string): Promise<WorkflowStateEntry | null> {
    const entity = await AgentWorkflowState.findOne({ where: { id: executionId } });
    if (!entity) return null;
    return this.toWorkflowState(entity);
  }

  async queryWorkflowRuns(query: WorkflowRunQuery): Promise<WorkflowStateEntry[]> {
    const qb = AgentWorkflowState.createQueryBuilder('w');
    if (query.workflowId) qb.andWhere('w.workflowId = :workflowId', { workflowId: query.workflowId });
    if (query.status) qb.andWhere('w.status = :status', { status: query.status });
    if ((query as any).from) qb.andWhere('w.createdAt >= :from', { from: (query as any).from });
    if ((query as any).to) qb.andWhere('w.createdAt <= :to', { to: (query as any).to });
    qb.orderBy('w.createdAt', 'DESC');
    if ((query as any).offset && (query as any).offset > 0) qb.skip((query as any).offset);
    if ((query as any).limit && (query as any).limit > 0) qb.take((query as any).limit);
    const entities = await qb.getMany();
    return entities.map((e) => this.toWorkflowState(e));
  }

  async setWorkflowState(executionId: string, state: WorkflowStateEntry): Promise<void> {
    const entity = AgentWorkflowState.create({
      id: executionId,
      workflowId: state.workflowId,
      workflowName: state.workflowName,
      status: state.status,
      input: state.input,
      context: state.context?.map(([k, v]) => [String(k), v]) as any,
      workflowState: state.workflowState,
      userId: state.userId,
      conversationId: state.conversationId,
      metadata: state.metadata,
    });
    await entity.save();
  }

  async updateWorkflowState(
    executionId: string,
    updates: Partial<WorkflowStateEntry>,
  ): Promise<void> {
    const entity = await AgentWorkflowState.findOne({ where: { id: executionId } });
    if (!entity) {
      const state = updates as WorkflowStateEntry;
      await this.setWorkflowState(executionId, {
        workflowId: state.workflowId ?? '',
        workflowName: state.workflowName ?? '',
        status: (state.status as any) ?? 'running',
        ...state,
      });
      return;
    }

    const keys = Object.keys(updates) as Array<keyof WorkflowStateEntry>;
    for (const k of keys) {
      const v: any = (updates as any)[k];
      if (v === undefined) continue;
      switch (k) {
        case 'workflowId':
          entity.workflowId = v;
          break;
        case 'workflowName':
          entity.workflowName = v;
          break;
        case 'status':
          entity.status = v;
          break;
        case 'input':
          entity.input = v;
          break;
        case 'context':
          entity.context = v?.map(([kk, vv]: any) => [String(kk), vv]) ?? null;
          break;
        case 'workflowState':
          entity.workflowState = v;
          break;
        case 'userId':
          entity.userId = v;
          break;
        case 'conversationId':
          entity.conversationId = v;
          break;
        case 'metadata':
          entity.metadata = v;
          break;
      }
    }

    await entity.save();
  }

  async getSuspendedWorkflowStates(workflowId: string): Promise<WorkflowStateEntry[]> {
    const entities = await AgentWorkflowState.find({
      where: { workflowId, status: 'suspended' },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toWorkflowState(e));
  }

  private toWorkflowState(entity: AgentWorkflowState): WorkflowStateEntry {
    return {
      workflowId: entity.workflowId,
      workflowName: entity.workflowName,
      status: entity.status,
      input: entity.input,
      context: (entity.context as any) ?? undefined,
      workflowState: entity.workflowState,
      userId: entity.userId,
      conversationId: entity.conversationId,
      metadata: entity.metadata,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
