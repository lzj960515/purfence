import type {
  Conversation,
  ConversationQueryOptions,
  CreateConversationInput,
  GetMessagesOptions,
  StorageAdapter,
  WorkflowRunQuery,
  WorkflowStateEntry,
  WorkingMemoryScope,
} from '@voltagent/core';
import { ConversationAlreadyExistsError } from '@voltagent/core';
import type { UIMessage } from 'ai';
import { In } from 'typeorm';
import { AgentMemoryConversation } from './agent-memory-conversation.ai.entity';
import { AgentMemoryMessage } from './agent-memory-message.ai.entity';
import { AgentWorkingMemory } from './agent-working-memory.ai.entity';
import { AgentWorkflowState } from './agent-workflow-state.ai.entity';

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

export class TypeOrmMemoryStorageAdapter implements StorageAdapter {
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

  async addMessages(
    messages: UIMessage[],
    userId: string,
    conversationId: string,
  ) {
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

  async deleteMessages(
    messageIds: string[],
    userId: string,
    conversationId: string,
  ) {
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
  async createConversation(
    input: CreateConversationInput,
  ): Promise<Conversation> {
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

  async queryConversations(
    options: ConversationQueryOptions,
  ): Promise<Conversation[]> {
    const qb = AgentMemoryConversation.createQueryBuilder('c');
    if (options.userId)
      qb.andWhere('c.userId = :userId', { userId: options.userId });
    if (options.resourceId)
      qb.andWhere('c.resourceId = :resourceId', {
        resourceId: options.resourceId,
      });

    const orderDirection = options.orderDirection ?? 'DESC';
    const orderBy = options.orderBy ?? 'updated_at';
    const orderColumn =
      orderBy === 'created_at'
        ? 'c.createdAt'
        : orderBy === 'title'
          ? 'c.title'
          : 'c.updatedAt';
    qb.orderBy(orderColumn, orderDirection);

    if (options.offset && options.offset > 0) qb.skip(options.offset);
    if (options.limit && options.limit > 0) qb.take(options.limit);

    const entities = await qb.getMany();
    return entities.map(toConversation);
  }

  async countConversations(options: ConversationQueryOptions): Promise<number> {
    const qb = AgentMemoryConversation.createQueryBuilder('c');
    if (options.userId)
      qb.andWhere('c.userId = :userId', { userId: options.userId });
    if (options.resourceId)
      qb.andWhere('c.resourceId = :resourceId', {
        resourceId: options.resourceId,
      });
    return qb.getCount();
  }

  async updateConversation(
    id: string,
    updates: Partial<Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Conversation> {
    const entity = await AgentMemoryConversation.findOne({ where: { id } });
    if (!entity) {
      // VoltAgent expects conversation to exist; match behavior by creating it.
      const created = AgentMemoryConversation.create({
        id,
        resourceId: String(updates.resourceId ?? ''),
        userId: String(updates.userId ?? ''),
        title: String(updates.title ?? ''),
        metadata: updates.metadata ?? {},
      });
      await created.save();
      return toConversation(created);
    }

    if (updates.title !== undefined) entity.title = updates.title;
    if (updates.metadata !== undefined)
      entity.metadata = updates.metadata ?? {};

    await entity.save();
    return toConversation(entity);
  }

  async deleteConversation(id: string): Promise<void> {
    const conversation = await AgentMemoryConversation.findOne({
      where: { id },
    });
    if (conversation) {
      await AgentMemoryMessage.delete({
        userId: conversation.userId,
        conversationId: String(conversation.id),
      });
      await AgentWorkingMemory.delete({
        conversationId: String(conversation.id),
      });
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
      scope: params.scope,
      userId: params.userId,
      conversationId: params.conversationId,
      content: params.content,
    });
    await entity.save();
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
  async getWorkflowState(
    executionId: string,
  ): Promise<WorkflowStateEntry | null> {
    const entity = await AgentWorkflowState.findOne({
      where: { id: executionId },
    });
    if (!entity) return null;
    return this.toWorkflowState(entity);
  }

  async queryWorkflowRuns(
    query: WorkflowRunQuery,
  ): Promise<WorkflowStateEntry[]> {
    const qb = AgentWorkflowState.createQueryBuilder('w');
    if (query.workflowId)
      qb.andWhere('w.workflowId = :workflowId', {
        workflowId: query.workflowId,
      });
    if (query.status)
      qb.andWhere('w.status = :status', { status: query.status });
    if (query.from) qb.andWhere('w.createdAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('w.createdAt <= :to', { to: query.to });
    qb.orderBy('w.createdAt', 'DESC');
    if (query.offset && query.offset > 0) qb.skip(query.offset);
    if (query.limit && query.limit > 0) qb.take(query.limit);
    const entities = await qb.getMany();
    return entities.map((e) => this.toWorkflowState(e));
  }

  async setWorkflowState(
    executionId: string,
    state: WorkflowStateEntry,
  ): Promise<void> {
    const entity = AgentWorkflowState.create({
      id: executionId,
      workflowId: state.workflowId,
      workflowName: state.workflowName,
      status: state.status,
      input: state.input,
      context: state.context?.map(([k, v]) => [String(k), v]) as any,
      workflowState: state.workflowState,
      suspension: state.suspension,
      events: state.events,
      output: state.output,
      cancellation: state.cancellation,
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
    const entity = await AgentWorkflowState.findOne({
      where: { id: executionId },
    });
    if (!entity) {
      const state = updates as WorkflowStateEntry;
      await this.setWorkflowState(executionId, {
        id: executionId,
        workflowId: state.workflowId ?? '',
        workflowName: state.workflowName ?? '',
        status: (state.status as any) ?? 'running',
        createdAt: state.createdAt ?? new Date(),
        updatedAt: state.updatedAt ?? new Date(),
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
        case 'suspension':
          entity.suspension = v;
          break;
        case 'events':
          entity.events = v;
          break;
        case 'output':
          entity.output = v;
          break;
        case 'cancellation':
          entity.cancellation = v;
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

  async getSuspendedWorkflowStates(
    workflowId: string,
  ): Promise<WorkflowStateEntry[]> {
    const entities = await AgentWorkflowState.find({
      where: { workflowId, status: 'suspended' },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toWorkflowState(e));
  }

  private toWorkflowState(entity: AgentWorkflowState): WorkflowStateEntry {
    return {
      id: String(entity.id),
      workflowId: entity.workflowId,
      workflowName: entity.workflowName,
      status: entity.status,
      input: entity.input,
      context: (entity.context as any) ?? undefined,
      workflowState: entity.workflowState,
      suspension: entity.suspension as any,
      events: entity.events as any,
      output: entity.output,
      cancellation: entity.cancellation as any,
      userId: entity.userId,
      conversationId: entity.conversationId,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
