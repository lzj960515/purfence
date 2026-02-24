# Voltagent → AI SDK 迁移技术设计文档

## 执行摘要

本文档详细描述了从 `@voltagent/core` 迁移到直接使用 `ai` SDK 的技术方案。迁移目标是保持现有 `MyAgentService` API 不变，同时移除对 voltagent 的依赖，直接使用 AI SDK 提供的核心功能。

### 关键决策

1. **封装策略**: 保持 `MyAgentService` 和 `MyAgent` 的公共 API 不变，内部实现替换为 AI SDK
2. **流事件映射**: 建立 `VoltAgentTextStreamPart` 到 AI SDK 流事件的完整映射层
3. **存储层**: 移除 `StorageAdapter` 接口依赖，直接使用 TypeORM 实体操作
4. **Hooks 系统**: 使用 RxJS 操作符和 AI SDK 回调实现生命周期管理
5. **Tool 系统**: 使用 AI SDK 的 `tool()` 函数替换 `createTool()`

### 影响范围

- **文件变更**: 预计修改 8-10 个核心文件
- **代码行数**: 约 1,500 行需要重写或调整
- **风险等级**: 中等（有完善的测试覆盖可降低风险）

---

## 1. AI SDK 封装接口设计

### 1.1 设计原则

1. **向后兼容**: 保持 `MyAgentService` 和 `MyAgent` 的公共方法签名不变
2. **最小侵入**: 上层业务代码无需修改
3. **类型安全**: 完整的 TypeScript 类型定义

### 1.2 核心接口定义

```typescript
// types.ts - 新增/修改的类型定义

import { streamText, generateText, tool, type ToolSet } from 'ai';
import { Observable } from 'rxjs';
import { z } from 'zod';

// ============================================================================
// Agent 配置选项
// ============================================================================

export interface AgentOptions {
  name: string;
  model?: ModelOptions['model'];
  modelOptions?: ModelOptions;
  prompt?: string;
  tools?: (string | { description?: string })[];
  subAgentsOptions?: AgentOptions[];
  memory?: false | 'in-memory';
}

// ============================================================================
// 聊天选项
// ============================================================================

export interface ChatOptions {
  message: string | UIMessage[];
  userId?: string;
  conversationId?: string;
  context?: Record<string, any>;
  modelOptions?: ModelOptions;
}

// ============================================================================
// 生成选项
// ============================================================================

export interface GenerationOptions {
  userId?: string;
  conversationId?: string;
  context?: Map<string, unknown> | Record<string, unknown>;
  abortSignal?: AbortSignal;
  providerOptions?: Record<string, unknown>;
  headers?: Record<string, string>;
  contextLimit?: number;
}

// ============================================================================
// 流事件类型（保持与现有前端兼容）
// ============================================================================

export type StreamEventType =
  | 'thinking'      // 推理内容
  | 'text'          // 文本内容
  | 'tool_text'     // 工具调用开始
  | 'tool_result'   // 工具调用结果
  | 'interrupt';    // 中断

export interface StreamEvent {
  role: 'ai';
  id: string;
  type: StreamEventType;
  content?: string;
  toolName?: string;
  artifact?: any;
}

// ============================================================================
// AI SDK 封装后的 Agent 类型
// ============================================================================

export interface AIAgentConfig {
  name: string;
  instructions: string;
  model: LanguageModel;
  tools?: Record<string, any>;
  maxSteps?: number;
  memory?: AIMemoryAdapter;
}

export interface AIMemoryAdapter {
  getMessages(userId: string, conversationId: string): Promise<UIMessage[]>;
  addMessage(message: UIMessage, userId: string, conversationId: string): Promise<void>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<void>;
}
```

### 1.3 MyAgentService 重构方案

```typescript
// my-agent.service.ts - 重构后的核心类

@Injectable()
export class MyAgentService {
  constructor(
    private configService: ConfigService,
    private toolsService: ToolsService,
    private memoryStorage: MemoryStorageService,  // 替换 Memory
    private llmService: LlmService,
    private messageService: MessageService,
    private eventEmitter: EventEmitter2,  // 用于 hooks 替代
  ) {}

  private conversationAbortCtrls: Map<string, AbortController> = new Map();
  @Log() private logger: Logger;

  /**
   * 创建 Agent - 保持 API 不变，内部使用 AI SDK
   */
  createAgent(options: AgentOptions): MyAgent {
    const { name, modelOptions, prompt, tools, subAgentsOptions } = options;

    // 解析模型
    const resolvedModelOptions: ModelOptions = modelOptions || { model };
    const myModel = this.llmService.get(resolvedModelOptions);
    const resolvedModel = resolvedModelOptions.model;

    // 获取工具（AI SDK 格式）
    const aiTools = this.getAgentTools(tools, resolvedModel);

    // 获取内存适配器
    const memoryAdapter = this.getMemoryAdapter(options.memory);

    // 创建 AI Agent 配置
    const agentConfig: AIAgentConfig = {
      name,
      instructions: prompt || '',
      model: myModel.model(),
      tools: aiTools,
      maxSteps: 300,
      memory: memoryAdapter,
    };

    return new MyAgent(agentConfig, this, myModel);
  }

  /**
   * 流式调用 - 保持 API 不变
   */
  stream(myAgent: MyAgent, chatOptions: ChatOptions): Observable<{ data: StreamEvent }> {
    const { conversationId } = chatOptions;
    const abortCtrl = new AbortController();
    this.conversationAbortCtrls.set(conversationId, abortCtrl);

    const generationOptions = this.buildGenerationOptions(
      myAgent.getMyModel(),
      chatOptions,
      abortCtrl.signal,
    );

    let compress = false;

    const ob = defer(async () => {
      return this.createStream(generationOptions, myAgent, chatOptions.message, compress);
    }).pipe(
      concatMap((it) => from(it)),
      retry({
        count: 5,
        resetOnSuccess: true,
        delay: (error, retryCount) => {
          this.logger.error(`Stream error: ${error.message} (${retryCount}/5)`);
          // ... 重试逻辑保持不变
        },
      }),
      finalize(() => {
        this.conversationAbortCtrls.delete(conversationId);
      }),
      catchError((e) => {
        // ... 错误处理保持不变
      }),
    );

    return this.formatObservable(ob, generationOptions);
  }

  /**
   * 非流式调用 - 保持 API 不变
   */
  async invoke<T extends z.ZodType>(
    myAgent: MyAgent,
    options: {
      chatOptions: ChatOptions;
      generateTextOutputOptions?: GenerateTextOutputOptions<T>;
    },
  ): Promise<string | z.infer<T>> {
    const { chatOptions, generateTextOutputOptions } = options;

    // 使用 AI SDK 的 generateText
    const result = await generateText({
      model: myAgent.getModel(),
      messages: await this.prepareMessages(chatOptions),
      tools: myAgent.getTools(),
      maxSteps: 300,
      // ... 其他选项
    });

    if (!generateTextOutputOptions) {
      return result.text;
    }

    // 结构化输出处理
    const outputResult = await generateText({
      model: myAgent.getModel(),
      messages: [
        { role: 'system', content: generateTextOutputOptions.prompt },
        { role: 'user', content: result.text },
      ],
      output: generateTextOutputOptions.schema,
    });

    return outputResult.output as z.infer<T>;
  }

  /**
   * 创建流 - 使用 AI SDK 的 streamText
   */
  private async createStream(
    generationOptions: GenerationOptions,
    myAgent: MyAgent,
    message: ChatOptions['message'],
    compress: boolean,
  ): Promise<AsyncIterable<StreamEvent>> {
    const { session, message: _message } = await this.prepareSession(
      myAgent,
      message,
      generationOptions.userId,
      generationOptions.conversationId,
      compress,
    );

    // 使用 AI SDK 的 streamText
    const streamResult = streamText({
      model: myAgent.getModel(),
      messages: _message as any,
      tools: myAgent.getTools(),
      maxSteps: 300,
      abortSignal: generationOptions.abortSignal,
      onStepFinish: async (step) => {
        // 实现 onEnd hook 的功能
        await this.handleStepFinish(step, generationOptions);
      },
    });

    // 转换 AI SDK 流事件为内部格式
    return this.convertAIStreamToInternal(streamResult.fullStream);
  }

  /**
   * 将 AI SDK 流事件转换为内部 StreamEvent 格式
   */
  private async* convertAIStreamToInternal(
    aiStream: AsyncIterable<{
      type: string;
      [key: string]: any;
    }>,
  ): AsyncIterable<StreamEvent> {
    for await (const chunk of aiStream) {
      // 流事件映射逻辑（详见第2章）
      yield* this.mapAIChunkToStreamEvents(chunk);
    }
  }
}
```

### 1.4 MyAgent 类重构

```typescript
// my-agent.ts - 重构后的 MyAgent 类

import { LanguageModel } from 'ai';

export class MyAgent {
  constructor(
    private config: AIAgentConfig,
    private service: MyAgentService,
    private myModel: MyModel,
  ) {}

  /**
   * 获取 AI SDK 模型实例
   */
  getModel(): LanguageModel {
    return this.config.model;
  }

  /**
   * 获取工具集合（AI SDK 格式）
   */
  getTools(): Record<string, any> {
    return this.config.tools || {};
  }

  /**
   * 获取模型信息
   */
  getMyModel(): MyModel {
    return this.myModel;
  }

  getAgentName(): string {
    return this.config.name;
  }

  /**
   * 流式调用 - 委托给 service
   */
  async stream(chatOptions: ChatOptions): Promise<Observable<{ data: StreamEvent }>> {
    return this.service.stream(this, chatOptions);
  }

  /**
   * 非流式调用 - 委托给 service
   */
  async invoke(options: { chatOptions: ChatOptions }): Promise<string>;
  async invoke<T extends z.ZodType>(options: {
    chatOptions: ChatOptions;
    generateTextOutputOptions?: GenerateTextOutputOptions<T>;
  }): Promise<z.infer<T>>;
  async invoke<T extends z.ZodType>(options: {
    chatOptions: ChatOptions;
    generateTextOutputOptions?: GenerateTextOutputOptions<T>;
  }) {
    return this.service.invoke(this, options);
  }
}
```

---

## 2. 流事件映射方案

### 2.1 事件类型对比

| VoltAgent 事件 | AI SDK 事件 | 说明 |
|---------------|------------|------|
| `text-delta` | `text-delta` | 文本增量，直接映射 |
| `reasoning-delta` | `reasoning-delta` | 推理增量，直接映射 |
| `tool-input-start` | `tool-call` | 工具调用开始，需要转换 |
| `tool-result` | `tool-result` | 工具结果，直接映射 |
| `error` | `error` | 错误事件，需要转换 |
| `finish` | `finish` | 完成事件，需要转换 |

### 2.2 详细映射实现

```typescript
// stream-event-mapper.ts

import type {
  TextStreamPart,
  ObjectStreamPart,
  ToolCallPart,
  ToolResultPart,
} from 'ai';

export class StreamEventMapper {
  private toolCallBuffer: Map<string, ToolCallPart> = new Map();

  /**
   * 将 AI SDK 流事件转换为内部 StreamEvent
   */
  async* mapAIChunkToStreamEvents(
    chunk: TextStreamPart<ToolSet>,
  ): AsyncIterable<StreamEvent> {
    switch (chunk.type) {
      case 'text-delta': {
        yield {
          role: 'ai',
          id: this.generateId(),
          type: 'text',
          content: chunk.textDelta,
        };
        break;
      }

      case 'reasoning-delta': {
        yield {
          role: 'ai',
          id: this.generateId(),
          type: 'thinking',
          content: chunk.textDelta,
        };
        break;
      }

      case 'tool-call': {
        // AI SDK 的 tool-call 包含完整的调用信息
        // 映射为 tool_text 事件
        yield {
          role: 'ai',
          id: chunk.toolCallId,
          type: 'tool_text',
          content: chunk.toolName,
          toolName: chunk.toolName,
        };
        // 缓存工具调用信息，等待结果
        this.toolCallBuffer.set(chunk.toolCallId, chunk);
        break;
      }

      case 'tool-result': {
        // 获取对应的工具调用信息
        const toolCall = this.toolCallBuffer.get(chunk.toolCallId);

        // 查询 artifact（保持现有逻辑）
        const artifact = await this.loadArtifact(chunk.toolCallId);

        yield {
          role: 'ai',
          id: chunk.toolCallId,
          type: 'tool_result',
          toolName: toolCall?.toolName || 'unknown',
          content: artifact ? undefined : JSON.stringify(chunk.result),
          artifact,
        };

        this.toolCallBuffer.delete(chunk.toolCallId);
        break;
      }

      case 'finish': {
        // 完成事件，可以触发 onEnd 逻辑
        // 但不在流中输出，由 onStepFinish 处理
        break;
      }

      case 'error': {
        // 错误事件转换为异常抛出
        throw chunk.error;
      }

      default: {
        // 忽略未识别的事件类型
        break;
      }
    }
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadArtifact(toolCallId: string): Promise<any> {
    // 保持现有逻辑：从 AgentArtifact 实体查询
    const artifacts = await AgentArtifact.find({
      where: { toolCallId },
    });
    return artifacts[0] || null;
  }
}
```

### 2.3 流事件处理管道

```typescript
// my-agent.service.ts - formatObservable 方法更新

private formatObservable(
  ob: Observable<StreamEvent>,
  chatOptions: Pick<GenerationOptions, 'userId' | 'conversationId' | 'context'>,
): Observable<{ data: StreamEvent }> {
  return ob.pipe(
    concatMap((chunk) => {
      // 保持现有逻辑：处理 tool-result 并加载 artifact
      if (chunk.type === 'tool_result' && chunk.toolCallId) {
        return from(
          AgentArtifact.find({
            where: {
              toolCallId: chunk.toolCallId,
              conversationId: chatOptions.conversationId,
            },
          }),
        ).pipe(
          map((artifact) => ({
            ...chunk,
            artifact: artifact[0] || undefined,
          })),
        );
      }
      return of(chunk);
    }),
    filter((it) => 'type' in it),
    filter((it) => !_.isEmpty(it.content) || it.type === 'tool_result'),
    filter((it) =>
      ['thinking', 'text', 'tool_text', 'tool_result', 'interrupt'].includes(it.type),
    ),
    tap((it) => {
      this.logger.verbose(`[${it.type}] ${JSON.stringify(it.content)}`);
    }),
    map((data) => ({ data })),
  );
}
```

---

## 3. Hooks 替代方案

### 3.1 设计思路

AI SDK 不提供原生的 hooks 系统，但提供了 `onStepFinish` 和 `onFinish` 回调。我们将使用这些回调结合 NestJS 的 `EventEmitter2` 来实现生命周期管理。

### 3.2 实现方案

```typescript
// agent-lifecycle.service.ts - 新的生命周期管理服务

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface AgentLifecycleEvent {
  agentName: string;
  conversationId?: string;
  userId?: string;
  input?: any;
  output?: {
    text?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      reasoningTokens?: number;
      cachedInputTokens?: number;
    };
  };
  error?: Error;
  context?: Map<string, unknown>;
}

@Injectable()
export class AgentLifecycleService {
  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * 触发 Agent 开始事件
   */
  emitStart(event: AgentLifecycleEvent): void {
    this.eventEmitter.emit('agent.start', event);
  }

  /**
   * 触发 Agent 结束事件
   */
  emitEnd(event: AgentLifecycleEvent): void {
    this.eventEmitter.emit('agent.end', event);
  }

  /**
   * 创建 AI SDK 的 onStepFinish 回调
   */
  createStepFinishCallback(
    agentName: string,
    conversationId: string,
    userId: string,
    context: Map<string, unknown>,
  ) {
    return async (step: any) => {
      const event: AgentLifecycleEvent = {
        agentName,
        conversationId,
        userId,
        context,
        output: {
          text: step.text,
          usage: step.usage ? {
            promptTokens: step.usage.promptTokens,
            completionTokens: step.usage.completionTokens,
            totalTokens: step.usage.totalTokens,
          } : undefined,
        },
      };

      this.emitEnd(event);

      // 执行原有的 onEnd 逻辑
      await this.handleOnEnd(event);
    };
  }

  private async handleOnEnd(event: AgentLifecycleEvent): Promise<void> {
    if (!event.conversationId || event.error) return;

    // 1. 更新会话标题（CODEX provider）
    if (event.context?.get('provider') === ProviderType.CODEX) {
      // ... 原有逻辑
    }

    // 2. 更新 Token 使用量
    await this.updateSessionUsage(event);

    // 3. 触发事件
    await this.handleCustomEvent(event);
  }

  private async updateSessionUsage(event: AgentLifecycleEvent): Promise<void> {
    const usage = event.output?.usage;
    if (!usage) return;

    await AgentConversationSession.update(
      { id: event.conversationId },
      {
        inputTokens: usage.promptTokens || 0,
        outputTokens: usage.completionTokens || 0,
        totalTokens: usage.totalTokens || 0,
        reasoningTokens: usage.reasoningTokens || 0,
        cachedInputTokens: usage.cachedInputTokens || 0,
      },
    );
  }

  private async handleCustomEvent(event: AgentLifecycleEvent): Promise<void> {
    const customEvent = event.context?.get('event') as string;
    if (!customEvent) return;

    const contextPayload = Object.fromEntries(event.context.entries());
    CommonService.emit(customEvent, {
      ...contextPayload,
      conversationId: event.conversationId,
    });
  }
}
```

### 3.3 在 MyAgentService 中使用

```typescript
// my-agent.service.ts - 集成生命周期服务

@Injectable()
export class MyAgentService {
  constructor(
    // ... 其他依赖
    private lifecycleService: AgentLifecycleService,
  ) {}

  private async createStream(
    generationOptions: GenerationOptions,
    myAgent: MyAgent,
    message: ChatOptions['message'],
    compress: boolean,
  ): Promise<AsyncIterable<StreamEvent>> {
    const { session, message: _message } = await this.prepareSession(...);

    // 触发开始事件
    this.lifecycleService.emitStart({
      agentName: myAgent.getAgentName(),
      conversationId: generationOptions.conversationId,
      userId: generationOptions.userId,
      input: message,
      context: generationOptions.context as Map<string, unknown>,
    });

    const streamResult = streamText({
      model: myAgent.getModel(),
      messages: _message as any,
      tools: myAgent.getTools(),
      maxSteps: 300,
      abortSignal: generationOptions.abortSignal,
      onStepFinish: this.lifecycleService.createStepFinishCallback(
        myAgent.getAgentName(),
        generationOptions.conversationId!,
        generationOptions.userId!,
        generationOptions.context as Map<string, unknown>,
      ),
    });

    return this.convertAIStreamToInternal(streamResult.fullStream);
  }
}
```

---

## 4. 存储层适配方案

### 4.1 设计思路

移除对 `StorageAdapter` 接口的依赖，直接使用 TypeORM 实体操作。创建 `MemoryStorageService` 作为统一入口。

### 4.2 新存储服务实现

```typescript
// memory-storage.service.ts - 新的存储服务

import { Injectable } from '@nestjs/common';
import { UIMessage } from 'ai';
import { In } from 'typeorm';
import { AgentMemoryConversation } from './agent-memory-conversation.ai.entity';
import { AgentMemoryMessage } from './agent-memory-message.ai.entity';
import { AgentWorkingMemory } from './agent-working-memory.ai.entity';
import { AgentWorkflowState } from './agent-workflow-state.ai.entity';

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

export class ConversationAlreadyExistsError extends Error {
  constructor(public readonly conversationId: string) {
    super(`Conversation ${conversationId} already exists`);
  }
}

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

    return rows.map((row) => ({
      id: String(row.id),
      role: row.role as any,
      parts: (row.parts ?? []) as any[],
      metadata: { ...(row.metadata ?? {}), createdAt: row.createdAt },
    }));
  }

  // =========================================================================
  // Conversation Operations
  // =========================================================================

  async createConversation(input: {
    id: string;
    resourceId: string;
    userId: string;
    title: string;
    metadata?: Record<string, unknown>;
  }): Promise<Conversation> {
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

  async getWorkingMemory(params: {
    scope: 'user' | 'conversation' | 'global';
    userId?: string;
    conversationId?: string;
  }): Promise<string | null> {
    const entity = await AgentWorkingMemory.findOne({
      where: {
        scope: params.scope,
        userId: params.userId || null,
        conversationId: params.conversationId || null,
      },
    });
    return entity?.content || null;
  }

  async setWorkingMemory(
    params: {
      scope: 'user' | 'conversation' | 'global';
      userId?: string;
      conversationId?: string;
    },
    content: string,
  ): Promise<void> {
    let entity = await AgentWorkingMemory.findOne({
      where: {
        scope: params.scope,
        userId: params.userId || null,
        conversationId: params.conversationId || null,
      },
    });

    if (entity) {
      entity.content = content;
      await entity.save();
    } else {
      entity = AgentWorkingMemory.create({
        scope: params.scope,
        userId: params.userId,
        conversationId: params.conversationId,
        content,
      });
      await entity.save();
    }
  }

  // =========================================================================
  // Workflow State Operations
  // =========================================================================

  async getWorkflowState(executionId: string): Promise<any> {
    const entity = await AgentWorkflowState.findOne({
      where: { workflowId: executionId },
    });
    return entity?.workflowState;
  }

  async setWorkflowState(
    executionId: string,
    state: { status: string; state: Record<string, unknown> },
  ): Promise<void> {
    let entity = await AgentWorkflowState.findOne({
      where: { workflowId: executionId },
    });

    if (entity) {
      entity.workflowState = state.state;
      entity.status = state.status as any;
      await entity.save();
    } else {
      entity = AgentWorkflowState.create({
        workflowId: executionId,
        workflowName: 'unknown',
        status: state.status as any,
        workflowState: state.state,
      });
      await entity.save();
    }
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
```

### 4.3 Module 更新

```typescript
// my-agent.module.ts - 更新后的模块配置

@Global()
@Module({
  imports: [DiscoveryModule, ConfigModule, HttpModule, EventEmitterModule],
  providers: [
    MyAgentService,
    ToolsService,
    AgentLifecycleService,  // 替换 MyAgentHooks
    LlmService,
    MessageService,
    MemoryStorageService,   // 替换 Memory + TypeOrmMemoryStorageAdapter
    // ... 其他服务
  ],
  exports: [
    MyAgentService,
    LlmService,
    MessageService,
    ToolsService,
    MemoryStorageService,
  ],
})
export class MyAgentModule {}
```

---

## 5. 遗漏功能评估

### 5.1 subAgents / supervisorConfig

**当前使用**: `my-agent.service.ts` 中创建 Agent 时传入 `subAgents` 和 `supervisorConfig`

**评估结果**:
- 经代码扫描，`subAgentsOptions` 在实际调用中通常为空数组
- `supervisorConfig` 主要用于错误处理和流事件转发

**替代方案**:
```typescript
// 如果确实需要 subAgents 功能，使用 AI SDK 的多步调用实现
// 否则，移除相关参数

// 简化后的 createAgent
const agentConfig: AIAgentConfig = {
  name,
  instructions: prompt || '',
  model: myModel.model(),
  tools: aiTools,
  maxSteps: 300,
  memory: memoryAdapter,
  // 移除: subAgents, supervisorConfig
};
```

### 5.2 createReasoningTools()

**当前使用**: `tools.service.ts` 第 119 行

```typescript
const reasoningToolkit: Toolkit = createReasoningTools();
this.toolKits.set('reasoning_tools', reasoningToolkit);
```

**评估结果**:
- `reasoning_tools` 是一个特殊的工具包，用于支持推理功能
- AI SDK 本身支持 `reasoning-delta` 事件，无需额外工具

**替代方案**:
```typescript
// 移除 createReasoningTools() 调用
// AI SDK 会自动处理推理内容

// 在 onModuleInit 中
async onModuleInit() {
  await this.registerMcpTools();
  this.scanAndRegisterTools();
  this.createToolKits();
  // 移除: const reasoningToolkit = createReasoningTools();
}
```

### 5.3 messageHelpers

**当前使用**: `my-agent-hooks.ts` 第 10 行导入但未使用

**评估结果**: 代码中未实际使用，可直接移除。

### 5.4 extractText

**当前使用**: `message.service.ts` 第 3 行导入，第 69、81 行使用

**评估结果**: 需要从 `@voltagent/core` 迁移到 `ai` SDK 的等效功能。

**替代方案**:
```typescript
// message.service.ts
import { UIMessage } from 'ai';

// 自定义实现 extractText
function extractText(message: UIMessage | UIMessage[] | undefined): string {
  if (!message) return '';

  const messages = Array.isArray(message) ? message : [message];

  return messages
    .map((msg) => {
      return msg.parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('') || '';
    })
    .join('');
}
```

---

## 6. Tool 系统重构

### 6.1 Tool 装饰器更新

```typescript
// tool.decorator.ts - 更新后的装饰器

import { applyDecorators } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { z } from 'zod';

// 移除对 @voltagent/core 的依赖

export interface MyAgentToolOptions {
  name?: string;
  description?: string;
  parameters?: z.ZodType<any>;
  /**
   * @deprecated 使用 parameters 替代
   */
  schema?: Record<string, z.ZodTypeAny>;
}

export const ToolWatermark = DiscoveryService.createDecorator();
export const ToolOpt = Reflector.createDecorator<MyAgentToolOptions>({
  key: 'MY_AGENT_TOOL_OPTIONS',
});

export function Tool(options?: MyAgentToolOptions) {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    options = {
      name: String(propertyKey),
      description: String(propertyKey),
      parameters: options?.parameters || z.object(options?.schema || {}),
      ...options,
    };
    delete (options as any).schema;

    const ctor = typeof target === 'function' ? target : target.constructor;
    applyDecorators(ToolWatermark())(ctor);
    applyDecorators(ToolOpt(options))(target, propertyKey, descriptor);
  };
}
```

### 6.2 ToolsService 重构

```typescript
// tools.service.ts - 核心变更

import { tool as aiTool, type Tool as AITool } from 'ai';

@Injectable()
export class ToolsService implements OnModuleInit {
  // ... 依赖注入保持不变

  private tools = new Map<string, AITool>();  // 改为 AI SDK Tool 类型
  private toolKits = new Map<string, { name: string; description: string; tools: AITool[] }>();

  /**
   * 获取工具（返回 AI SDK 格式）
   */
  getTools(tools: string[], model?: ModelOptions['model']): AITool[] {
    return _.chain(tools)
      .map((toolName) => {
        const provider = this.llmService.getProviderByModel(model);
        const serverTool = this.getServerTool(toolName, provider);
        if (serverTool) return serverTool;

        const tool = this.tools.get(toolName);
        if (tool) return tool;

        const toolKit = this.toolKits.get(toolName);
        if (toolKit) return toolKit.tools;

        throw new Error(`Tool with name ${toolName} not found`);
      })
      .flatten()
      .compact()
      .value() as AITool[];
  }

  /**
   * 扫描并注册工具（使用 AI SDK 的 tool 函数）
   */
  private scanAndRegisterTools() {
    const wrappers = this.discoveryService.getProviders({
      metadataKey: ToolWatermark.KEY,
    });

    for (const wrapper of wrappers) {
      const instance = wrapper.instance;
      const prototype = Object.getPrototypeOf(instance);

      for (const methodName of this.metadataScanner.getAllMethodNames(prototype)) {
        const options = this.reflector.get(ToolOpt.KEY, prototype[methodName]);
        if (!options) continue;

        // 使用 AI SDK 的 tool 函数创建工具
        const aiToolDef = aiTool({
          description: options.description,
          parameters: options.parameters,
          execute: async (args, context) => {
            // 调用原方法
            const result = await instance[methodName].call(instance, args, {
              toolCallId: context.toolCallId,
              messages: context.messages,
            });
            return result;
          },
        });

        this.tools.set(options.name, aiToolDef);
        this.logger.debug(`Registered tool: ${options.name}`);
      }
    }
  }

  /**
   * MCP 工具注册
   */
  private async registerMcpTools() {
    // 使用 @modelcontextprotocol/sdk 替代 MCPConfiguration
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

    for (const [serverName, serverConfig] of Object.entries(this.config.mcpServers || {})) {
      try {
        const transport = new StdioClientTransport({
          command: serverConfig.command,
          args: serverConfig.args,
          env: serverConfig.env,
        });

        const client = new Client({ name: 'my-agent', version: '1.0.0' });
        await client.connect(transport);

        const toolsResponse = await client.listTools();

        for (const mcpTool of toolsResponse.tools) {
          if (this.tools.has(mcpTool.name)) {
            this.logger.warn(`MCP tool ${mcpTool.name} already registered, skipping`);
            continue;
          }

          // 将 MCP 工具包装为 AI SDK 工具
          const wrappedTool = aiTool({
            description: mcpTool.description || '',
            parameters: this.convertMCPSchemaToZod(mcpTool.inputSchema),
            execute: async (args) => {
              const result = await client.callTool({
                name: mcpTool.name,
                arguments: args,
              });
              return result;
            },
          });

          this.tools.set(mcpTool.name, wrappedTool);
          this.logger.debug(`Registered MCP tool: ${mcpTool.name}`);
        }
      } catch (error) {
        this.logger.error(`Failed to register MCP server ${serverName}:`, error);
      }
    }
  }

  private convertMCPSchemaToZod(schema: any): z.ZodType {
    // 实现 MCP JSON Schema 到 Zod 的转换
    // ... 具体实现
    return z.any();
  }
}
```

---

## 7. 风险分析和缓解措施

### 7.1 风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|------|---------|
| 流事件格式不兼容 | 中 | 高 | 完善的映射层 + 全面测试 |
| Tool 执行参数差异 | 中 | 高 | 逐个 Tool 验证 + 集成测试 |
| Memory 存储数据格式变化 | 低 | 高 | 保持 TypeORM 实体不变 |
| 性能下降 | 低 | 中 | 性能基准测试 + 对比 |
| 子 Agent 功能缺失 | 低 | 中 | 确认使用场景 + 替代方案 |

### 7.2 详细缓解措施

#### 风险 1: 流事件格式不兼容

**缓解措施**:
1. 建立完整的流事件映射层（第 2 章）
2. 编写单元测试覆盖所有事件类型
3. 与前端联调验证事件格式

#### 风险 2: Tool 执行参数差异

**缓解措施**:
1. 创建 Tool 执行测试套件
2. 逐个验证 Tool 的输入输出
3. 保留原有 Tool 装饰器 API

#### 风险 3: Memory 存储数据格式变化

**缓解措施**:
1. 保持 TypeORM 实体完全不变
2. 仅替换存储访问层接口
3. 数据迁移验证

---

## 8. 实施计划

### Phase 2: 存储层适配（1-2 天）

**负责人**: backend-dev
**协调**: backend-architect

#### 任务清单

- [ ] 2.1 创建 `MemoryStorageService` 替换 `StorageAdapter`
  - 复制 `typeorm-memory-storage.adapter.ts` 逻辑
  - 移除 `StorageAdapter` 接口实现
  - 保持所有方法签名不变

- [ ] 2.2 更新 `my-agent.module.ts`
  - 替换 `Memory` provider 为 `MemoryStorageService`
  - 添加 `EventEmitterModule` 依赖

- [ ] 2.3 更新 `MessageService`
  - 注入 `MemoryStorageService` 替代 `Memory`
  - 替换 `extractText` 为自定义实现

- [ ] 2.4 代码审查
  - backend-dev-reviewer 审查
  - 确保 TypeORM 实体未变更

- [ ] 2.5 基础测试
  - tester 验证存储操作正常

### Phase 3: 核心功能迁移（3-5 天）

**负责人**: backend-dev
**协调**: backend-architect

#### 任务清单

- [ ] 3.1 创建 `AgentLifecycleService`
  - 实现 `onStart`/`onEnd` 事件系统
  - 替换 `MyAgentHooks`

- [ ] 3.2 创建 `StreamEventMapper`
  - 实现 AI SDK 到内部事件的映射
  - 编写单元测试

- [ ] 3.3 重构 `ToolsService`
  - 使用 AI SDK `tool()` 函数
  - 更新 MCP 工具注册（使用 `@modelcontextprotocol/sdk`）
  - 移除 `createReasoningTools()`

- [ ] 3.4 更新 `tool.decorator.ts`
  - 移除 `@voltagent/core` 依赖
  - 保持装饰器 API 不变

- [ ] 3.5 重构 `MyAgentService`
  - 替换 `createAgent()` 使用 AI SDK
  - 替换 `stream()` 流式处理
  - 替换 `invoke()` 非流式调用
  - 移除 `VoltAgent` 依赖

- [ ] 3.6 重构 `MyAgent` 类
  - 替换内部实现使用 AI SDK
  - 保持公共 API 不变

- [ ] 3.7 代码审查
  - backend-dev-reviewer 审查
  - 重点检查流事件映射

### Phase 4: 集成测试（2-3 天）

**负责人**: tester

#### 测试清单

- [ ] 4.1 功能测试
  - Agent 创建和配置
  - 流式调用（SSE 事件）
  - 非流式调用
  - Tool 执行
  - 会话管理

- [ ] 4.2 数据兼容性测试
  - 历史消息加载
  - Token 使用量统计
  - 会话标题生成

- [ ] 4.3 性能测试
  - 首 token 响应时间
  - 流式传输延迟
  - 并发请求处理

- [ ] 4.4 回归测试
  - 所有现有功能正常
  - 前端无感知切换

### Phase 5: 清理验证（1 天）

**负责人**: backend-dev

#### 任务清单

- [ ] 5.1 移除 voltagent 依赖
  - `package.json` 清理
  - 删除无用导入

- [ ] 5.2 代码清理
  - 删除废弃文件
  - 更新注释

- [ ] 5.3 文档更新
  - 更新 README
  - 更新 API 文档

- [ ] 5.4 最终审查
  - backend-dev-reviewer
  - tester 回归测试

---

## 9. 附录

### 9.1 依赖变更清单

```json
// package.json 变更
{
  "dependencies": {
    // 移除
    "@voltagent/core": "^2.6.0",
    "@voltagent/logger": "^2.0.2",
    "@voltagent/server-hono": "^2.0.7",

    // 新增/保持
    "ai": "^6.0.68",
    "@ai-sdk/anthropic": "^3.0.6",
    "@ai-sdk/google-vertex": "^4.0.6",
    "@ai-sdk/openai": "^3.0.25",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@nestjs/event-emitter": "^2.0.0"
  }
}
```

### 9.2 文件变更清单

| 文件 | 操作 | 说明 |
|-----|------|------|
| `my-agent.service.ts` | 修改 | 核心重构 |
| `my-agent.ts` | 修改 | 适配 AI SDK |
| `tools.service.ts` | 修改 | Tool 系统重构 |
| `tool.decorator.ts` | 修改 | 移除 voltagent 依赖 |
| `message.service.ts` | 修改 | 存储层适配 |
| `my-agent-hooks.ts` | 删除 | 替换为生命周期服务 |
| `typeorm-memory-storage.adapter.ts` | 删除 | 替换为存储服务 |
| `memory-storage.service.ts` | 新增 | 新存储服务 |
| `agent-lifecycle.service.ts` | 新增 | 生命周期管理 |
| `stream-event-mapper.ts` | 新增 | 流事件映射 |
| `my-agent.module.ts` | 修改 | 模块配置更新 |

### 9.3 回滚方案

如果迁移过程中出现严重问题，可按以下步骤回滚：

1. **代码回滚**: 使用 git 回滚到迁移前版本
2. **依赖恢复**: 恢复 `package.json` 中的 voltagent 依赖
3. **数据验证**: 确认 TypeORM 实体数据未损坏
4. **服务重启**: 重新部署回滚版本

---

**文档版本**: 1.0
**创建日期**: 2025-02-23
**作者**: Backend Architect
