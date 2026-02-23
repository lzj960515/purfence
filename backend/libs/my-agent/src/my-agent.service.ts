import { MyUtil } from '@app/shared';
import { Log } from '@nest-mods/log';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommonService } from '@src/common';
import {
  streamText,
  generateText,
  type UIMessage,
  type ToolSet,
  type StreamTextResult,
  type GenerateTextResult,
} from 'ai';

// 本地定义 CoreMessage 类型
interface CoreMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | any[];
}
import _ from 'lodash';
import {
  catchError,
  concatMap,
  defer,
  EMPTY,
  filter,
  finalize,
  from,
  map,
  Observable,
  of,
  retry,
  tap,
  throwError,
  timer,
} from 'rxjs';
import { z } from 'zod';
import { AgentConversationSession } from './agent-conversation-sessions.ai.entity';
import { AgentSseErrorActionType } from './agent-sse-error-action.enum';
import {
  getErrorActionType,
  shouldRetryError,
} from './agent-sse-error-mapping';
import { AgentLifecycleService } from './agent-lifecycle.service';
import { LlmService } from './llm.service';
import { MemoryStorageService } from './memory-storage.service';
import { MessageService } from './message.service';
import { MyModel } from './model';
import { MyAgent } from './my-agent';
import { summarizationSystemPrompt, summarizationUserPrompt } from './prompt';
import { SocketService } from './socket.service';
import { ToolsService } from './tools.service';
import {
  AgentOptions,
  ChatOptions,
  GenerateTextOutputOptions,
  ModelOptions,
  MyAgentModuleOptions,
} from './types';
import { AgentArtifact } from '@src/purfence/artifact/agent-artifact.ai.entity';

// ============================================================================
// 生成选项类型（替代 @voltagent/core 的 BaseGenerationOptions）
// ============================================================================

export interface GenerationOptions {
  userId?: string;
  conversationId?: string;
  context?: Record<string, any>;
  providerOptions?: Record<string, any>;
  headers?: Record<string, string>;
  abortSignal?: AbortSignal;
  modelOptions?: ModelOptions;
}

// ============================================================================
// 流式响应块类型（替代 @voltagent/core 的 VoltAgentTextStreamPart）
// ============================================================================

export type StreamPart =
  | { type: 'text-delta'; id: string; text: string }
  | { type: 'reasoning-delta'; id: string; text: string }
  | { type: 'tool-input-start'; id: string; toolName: string; input: any }
  | { type: 'tool-result'; toolCallId: string; toolName: string; output: any }
  | { type: 'finish'; id: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }
  | { type: 'error'; error: Error };

// ============================================================================
// MyAgentService - 使用 AI SDK 替代 @voltagent/core
// ============================================================================

@Injectable()
export class MyAgentService {
  constructor(
    private configService: ConfigService,
    private toolsService: ToolsService,
    private memoryStorage: MemoryStorageService,
    private agentLifecycle: AgentLifecycleService,
    private llmService: LlmService,
    private messageService: MessageService,
  ) {}

  private conversationAbortCtrls: Map<string, AbortController> = new Map();

  @Log() private logger: Logger;

  sessionTerminate(threadId: string) {
    this.logger.log(`sessionTerminate: ${threadId}`);
    const abortCtrl = this.conversationAbortCtrls.get(threadId);
    if (abortCtrl) {
      abortCtrl.abort('User Cancelled');
      return true;
    }
  }

  stream(myAgent: MyAgent, chatOptions: ChatOptions) {
    const { conversationId } = chatOptions;
    const abortCtrl = new AbortController();
    this.conversationAbortCtrls.set(conversationId, abortCtrl);
    const generationOptions = this.generationOptions(
      myAgent.getMyModel(),
      chatOptions,
      abortCtrl.signal,
    );

    let compress = false;

    const ob = defer(async () => {
      return this.createStream(
        generationOptions,
        myAgent,
        chatOptions.message,
        compress,
      );
    }).pipe(
      concatMap((it) => from(it)),
      retry({
        count: 5,
        resetOnSuccess: true,
        delay: (error, retryCount) => {
          this.logger.error(
            `Stream error: ${error.message} (${retryCount}/${5})`,
          );
          chatOptions.message = 'continue';
          // 重试时间依次为 5s, 10s, 5s, 10s, 5s
          const retryDelays = [5000, 10000, 5000, 10000, 5000];

          compress = error?.statusCode === 413;

          return compress || shouldRetryError(error.message)
            ? timer(retryDelays[retryCount - 1])
            : throwError(() => error);
        },
      }),
      finalize(() => {
        this.conversationAbortCtrls.delete(conversationId);
        this.logger.verbose('finalize');
      }),
      catchError((e) => {
        const actionType = getErrorActionType(e.message);
        if (actionType === AgentSseErrorActionType.RETRY) {
          CommonService.emit('agent.error', {
            thread_id: conversationId,
            message: e.message,
          });
        }
        throw new Error(
          JSON.stringify({
            actionType,
            message: e.message,
          }),
        );
      }),
    );

    return this.formatObservable(ob, generationOptions);
  }

  async invoke(
    myAgent: MyAgent,
    options: { chatOptions: ChatOptions },
  ): Promise<string>;
  async invoke<T extends z.ZodType>(
    myAgent: MyAgent,
    options: {
      chatOptions: ChatOptions;
      generateTextOutputOptions?: GenerateTextOutputOptions<T>;
    },
  ): Promise<z.infer<T>>;
  async invoke<T extends z.ZodType>(
    myAgent: MyAgent,
    options: {
      chatOptions: ChatOptions;
      generateTextOutputOptions?: GenerateTextOutputOptions<T>;
    },
  ) {
    const { chatOptions, generateTextOutputOptions } = options;

    const generationOptions = this.generationOptions(
      myAgent.getMyModel(),
      chatOptions,
    );

    // 使用 AI SDK 的 generateText 替代 voltagent 的 generateText
    const response = await this.generateTextWithSDK(
      myAgent,
      chatOptions.message,
      generationOptions,
    );

    if (!generateTextOutputOptions) {
      return response.text;
    }

    // 创建总结 agent 用于结构化输出
    const summarizeAgent = this.createAgent({
      name: myAgent.getName(),
      model: myAgent.getModelName() as any,
      prompt: `You are a helpful assistant that summarizes the conversation.`,
    });

    const result = await this.generateObjectWithSDK(
      summarizeAgent,
      generateTextOutputOptions.prompt,
      generateTextOutputOptions.schema,
      chatOptions,
    );
    return result as z.infer<T>;
  }

  private generationOptions(
    myModel: MyModel,
    options: ChatOptions,
    signal?: AbortSignal,
  ): GenerationOptions {
    const providerOptions = myModel.providerOptions();
    const headers = myModel.headers();
    return {
      ...options,
      providerOptions,
      headers,
      abortSignal: signal,
    };
  }

  createAgent(options: AgentOptions): MyAgent {
    const { name, model, modelOptions, prompt, tools, subAgentsOptions } =
      options;

    const subAgents = _.map(subAgentsOptions, (op) => this.createAgent(op));
    const resolvedModelOptions: ModelOptions = modelOptions || { model };
    const myModel = this.llmService.get(resolvedModelOptions);
    const resolvedModel = resolvedModelOptions.model;

    // 创建 MyAgent 实例，不再依赖 voltagent 的 Agent 类
    return new MyAgent({
      name,
      instructions: prompt,
      model: myModel.model(),
      tools: this.getAgentTools(tools, resolvedModel),
      memory: options.memory,
      maxSteps: 300,
      subAgents,
    }, this, myModel);
  }

  private getAgentTools(
    tools: AgentOptions['tools'],
    model: ModelOptions['model'],
  ) {
    return _.chain(tools)
      .map((tool) => {
        if (_.isString(tool)) {
          return this.toolsService.getTools([tool], model);
        }
        return tool;
      })
      .flatten()
      .value();
  }

  async createStream(
    generationOptions: GenerationOptions,
    myAgent: MyAgent,
    message: ChatOptions['message'],
    compress: boolean,
  ) {
    const { session, message: _message } = await this.prepareSession(
      myAgent,
      message,
      generationOptions.userId,
      generationOptions.conversationId,
      compress,
    );
    generationOptions.conversationId = session.id;

    // 使用 AI SDK 的 streamText 替代 voltagent 的 streamText
    const response = await this.streamTextWithSDK(
      myAgent,
      _message,
      generationOptions,
    );

    return this.createErrorThrowingStream(response.fullStream);
  }

  /**
   * 使用 AI SDK 的 streamText
   */
  private async streamTextWithSDK(
    myAgent: MyAgent,
    message: string | UIMessage[],
    options: GenerationOptions,
  ): Promise<StreamTextResult<ToolSet, any>> {
    const model = myAgent.getModel();
    const tools = myAgent.getTools();
    const instructions = myAgent.getInstructions();

    // 转换消息格式
    const messages = await this.buildMessages(message, options.conversationId, options.userId);

    // 触发开始事件
    this.agentLifecycle.emitStart({
      agentName: myAgent.getName(),
      conversationId: options.conversationId,
      userId: options.userId,
      input: message,
      context: options.context ? new Map(Object.entries(options.context)) : new Map(),
    });

    const result = streamText({
      model,
      messages: messages as any,
      tools: tools as unknown as ToolSet,
      system: instructions,
      providerOptions: options.providerOptions,
      abortSignal: options.abortSignal,
      onStepFinish: this.agentLifecycle.createStepFinishCallback(
        myAgent.getName(),
        options.conversationId,
        options.userId,
        options.context || {},
      ) as any,
    });

    return result;
  }

  /**
   * 使用 AI SDK 的 generateText
   */
  private async generateTextWithSDK(
    myAgent: MyAgent,
    message: string | UIMessage[],
    options: GenerationOptions,
  ): Promise<GenerateTextResult<ToolSet, any>> {
    const model = myAgent.getModel();
    const tools = myAgent.getTools();
    const instructions = myAgent.getInstructions();

    // 转换消息格式
    const messages = await this.buildMessages(message, options.conversationId, options.userId);

    const result = await generateText({
      model,
      messages: messages as any,
      tools: tools as unknown as ToolSet,
      system: instructions,
      providerOptions: options.providerOptions,
      abortSignal: options.abortSignal,
    });

    return result;
  }

  /**
   * 使用 AI SDK 生成结构化对象
   */
  private async generateObjectWithSDK<T extends z.ZodType>(
    myAgent: MyAgent,
    prompt: string,
    schema: T,
    chatOptions?: ChatOptions,
  ): Promise<z.infer<T>> {
    const model = myAgent.getModel();

    const messages: CoreMessage[] = [
      { role: 'system', content: myAgent.getInstructions() || 'You are a helpful assistant.' },
      { role: 'user', content: prompt },
    ];

    const result = await generateText({
      model,
      messages: messages as any,
      providerOptions: chatOptions?.modelOptions
        ? this.llmService.get(chatOptions.modelOptions).providerOptions()
        : undefined,
    });

    // 尝试解析 JSON 输出
    try {
      const parsed = JSON.parse(result.text);
      return schema.parse(parsed);
    } catch (error) {
      this.logger.error('Failed to parse structured output:', error);
      throw error;
    }
  }

  /**
   * 构建消息列表
   */
  private async buildMessages(
    message: string | UIMessage[],
    conversationId?: string,
    userId?: string,
  ): Promise<CoreMessage[]> {
    const messages: CoreMessage[] = [];

    // 加载历史消息
    if (conversationId && userId) {
      const historyMessages = await this.memoryStorage.getMessages(userId, conversationId);
      for (const msg of historyMessages) {
        messages.push({
          role: msg.role as any,
          content: this.convertPartsToContent(msg.parts),
        } as CoreMessage);
      }
    }

    // 添加当前消息
    if (typeof message === 'string') {
      messages.push({ role: 'user', content: message });
    } else if (Array.isArray(message)) {
      // 处理 UIMessage 数组
      for (const msg of message) {
        messages.push({
          role: msg.role as any,
          content: this.convertPartsToContent(msg.parts),
        } as CoreMessage);
      }
    }

    return messages;
  }

  /**
   * 转换 UIMessage parts 为 AI SDK content 格式
   */
  private convertPartsToContent(parts: any[]): string | any[] {
    if (!parts || parts.length === 0) return '';
    if (parts.length === 1 && parts[0].type === 'text') {
      return parts[0].text;
    }
    return parts.map((part) => {
      if (part.type === 'text') return { type: 'text', text: part.text };
      if (part.type === 'file') return { type: 'image', image: part.url };
      return part;
    });
  }

  /**
   * 包装 fullStream，将 error 事件转换为抛出的错误
   * 这样可以让 RxJS 的 retry 和 catchError 正常工作
   */
  private createErrorThrowingStream(
    baseStream: AsyncIterable<any>,
  ): AsyncIterable<StreamPart> {
    const self = this;
    return (async function* () {
      for await (const chunk of baseStream) {
        // 检测 AI SDK 的错误类型
        if (chunk.type === 'error') {
          const error =
            chunk.error instanceof Error
              ? chunk.error
              : new Error(String(chunk.error));
          throw error;
        }

        // 转换 AI SDK 事件为内部 StreamPart 格式
        const converted = self.convertAIStreamChunk(chunk);
        if (converted) {
          yield converted;
        }
      }
    })();
  }

  /**
   * 转换 AI SDK 流事件为内部格式
   */
  private convertAIStreamChunk(chunk: any): StreamPart | null {
    switch (chunk.type) {
      case 'text-delta':
        return {
          type: 'text-delta',
          id: chunk.toolCallId || 'text',
          text: chunk.textDelta || chunk.text,
        };
      case 'reasoning':
      case 'reasoning-delta':
        return {
          type: 'reasoning-delta',
          id: 'reasoning',
          text: chunk.textDelta || chunk.text,
        };
      case 'tool-call':
        return {
          type: 'tool-input-start',
          id: chunk.toolCallId,
          toolName: chunk.toolName,
          input: chunk.args,
        };
      case 'tool-result':
        return {
          type: 'tool-result',
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          output: chunk.result,
        };
      case 'finish':
        return {
          type: 'finish',
          id: 'finish',
          usage: chunk.usage ? {
            promptTokens: chunk.usage.promptTokens,
            completionTokens: chunk.usage.completionTokens,
            totalTokens: chunk.usage.totalTokens,
          } : undefined,
        };
      default:
        return null;
    }
  }

  private formatObservable(
    ob: Observable<StreamPart>,
    chatOptions: Pick<
      GenerationOptions,
      'userId' | 'conversationId' | 'context'
    >,
  ) {
    return ob.pipe(
      concatMap((chunk) => {
        return this.formatMessage(chunk, chatOptions);
      }),
      // 去掉未转换的消息
      filter((it) => 'type' in it),
      // 去掉空消息，但tool result为空时保留
      filter((it) => !_.isEmpty(it.content) || it.type === 'tool_result'),
      // 仅保留前端可解析消息
      filter((it) =>
        ['thinking', 'text', 'tool_text', 'tool_result', 'interrupt'].includes(
          it.type,
        ),
      ),
      tap((it) => {
        this.logger.verbose(`[${it.type}] ${JSON.stringify(it.content)}`);
      }),
      map((data) => ({ data })),
    );
  }

  private formatMessage(
    chunk: StreamPart,
    chatOptions: Pick<
      GenerationOptions,
      'userId' | 'conversationId' | 'context'
    >,
  ) {
    if (chunk.type === 'error') {
      throw new Error(
        JSON.stringify({
          actionType: AgentSseErrorActionType.NO_RETRY,
          message: JSON.stringify((chunk.error as any)?.message),
        }),
      );
    }
    if (chunk.type === 'reasoning-delta') {
      return of({
        role: 'ai',
        id: chunk.id,
        type: 'thinking',
        content: chunk.text,
      });
    } else if (chunk.type === 'text-delta') {
      return of({
        role: 'ai',
        id: chunk.id,
        type: 'text',
        content: chunk.text,
      });
    } else if (chunk.type === 'tool-input-start') {
      return of({
        role: 'ai',
        id: chunk.id,
        type: 'tool_text',
        content: chunk.toolName,
      });
    } else if (chunk.type === 'tool-result') {
      return from(
        AgentArtifact.find({
          where: {
            toolCallId: chunk.toolCallId,
            conversationId: chatOptions.conversationId,
          },
        }),
      ).pipe(
        map((artifact) => ({
          role: 'ai',
          id: chunk.toolCallId,
          toolName: chunk.toolName,
          type: 'tool_result',
          content: chunk.output,
          status: chunk.output?.error ? 'error' : undefined,
          artifact,
        })),
      );
    } else if (chunk.type === 'finish') {
      this.logger.verbose(`finish ${JSON.stringify(chunk, null, 2)}`);
    }
    return EMPTY;
  }

  /**
   * 处理子会话：
   * 1) 根据外部 conversationId 查找当前子会话，不存在则创建
   * 2) 判断是否超过阈值，超过则总结旧会话，创建新会话并构造桥接消息
   */
  private async prepareSession(
    myAgent: MyAgent,
    message: ChatOptions['message'],
    userId: string,
    conversationId: string,
    compress: boolean,
  ) {
    if (compress) {
      return this.compressSessionForPromptTooLong({
        myAgent,
        userId,
        conversationId,
      });
    }

    const session = await this.findCurrentSession(userId, conversationId);

    const full = await this.messageService.isSessionFull(session, myAgent);
    if (!full) {
      return { session, message };
    }
    return this.rolloverSessionWithSummary({
      myAgent,
      userId,
      conversationId,
      session,
      currentMessage: message,
    });
  }

  private async compressSessionForPromptTooLong({
    myAgent,
    userId,
    conversationId,
  }: {
    myAgent: MyAgent;
    userId?: string;
    conversationId: string;
  }) {
    const session = await this.findCurrentSession(userId, conversationId);

    return await this.rolloverSessionWithSummary({
      myAgent,
      userId,
      conversationId,
      session,
    });
  }

  private async rolloverSessionWithSummary({
    myAgent,
    userId,
    conversationId,
    session,
    currentMessage,
  }: {
    myAgent: MyAgent;
    userId: string;
    conversationId: string;
    session: AgentConversationSession;
    currentMessage?: ChatOptions['message'];
  }) {
    this.logger.verbose(`Rolling session, summarizing conversation...`);

    SocketService.broadcast(conversationId, 'message', {
      role: 'ai',
      id: MyUtil.uuid(),
      type: 'thinking',
      content:
        "We've covered a lot of information. Let me quickly organize and summarize the key points to continue more efficiently...",
    });

    const summary = await this.summarizeConversation(
      myAgent,
      userId,
      session.id,
      currentMessage,
    );

    const bridge = await this.messageService.buildBridgeMessage(
      userId,
      session.id,
      summary,
      currentMessage,
    );

    await AgentConversationSession.update(
      { id: session.id },
      { isCurrent: false },
    );

    const newSession = await AgentConversationSession.create({
      userId,
      conversationId,
      isCurrent: true,
    }).save();

    return { session: newSession, message: bridge };
  }

  private async findCurrentSession(userId: string, conversationId: string) {
    // 1) 查找/创建当前子会话
    const session = await AgentConversationSession.findOne({
      where: { conversationId, isCurrent: true },
    });
    if (session) {
      return session;
    }
    // 第一次创建，为兼容旧数据， id设置为conversationId
    return await AgentConversationSession.create({
      id: conversationId,
      userId,
      conversationId,
      isCurrent: true,
    }).save();
  }

  private async summarizeConversation(
    myAgent: MyAgent,
    userId: string,
    conversationId: string,
    currentMessages?: ChatOptions['message'],
  ) {
    const summarizer = this.createAgent({
      name: 'summarize-conversation',
      model: myAgent.getModelName() as any,
      prompt: summarizationSystemPrompt,
      memory: false,
    });

    const prompt = currentMessages
      ? summarizationUserPrompt(JSON.stringify(currentMessages))
      : summarizationUserPrompt();

    const messages = await this.memoryStorage.getMessages(userId, conversationId);
    const messagesWithPrompt: CoreMessage[] = [
      ...messages.map((m) => ({
        role: m.role as any,
        content: this.convertPartsToContent(m.parts),
      }) as CoreMessage),
      { role: 'user', content: prompt },
    ];

    const result = await this.generateTextWithSDK(
      summarizer,
      messagesWithPrompt as any,
      { userId, conversationId },
    );
    return result.text;
  }

  getTools() {
    return this.toolsService.getAllTools();
  }

  getToolkit(name: string) {
    return this.toolsService.getToolKit(name);
  }

  getModel(name: AgentOptions['model']) {
    return this.llmService.getModel(name);
  }

  async generateText<T extends z.ZodType>({
    input,
    prompt,
    schema,
    model,
    name,
    options,
  }: {
    input: string | UIMessage[];
    prompt?: string;
    schema: T;
    model?: AgentOptions['model'];
    name?: string;
    options?: any;
  }): Promise<z.infer<T>> {
    const agent = this.createAgent({
      name: name || 'generate-text',
      model: model || 'gpt-5-mini',
      prompt:
        prompt || `You are a helpful assistant that generates structured data.`,
      memory: false,
    });

    const result = await this.generateObjectWithSDK(
      agent,
      typeof input === 'string' ? input : JSON.stringify(input),
      schema,
      options,
    );
    return result;
  }

  private get config() {
    return this.configService.get<MyAgentModuleOptions>('my-agent');
  }
}
