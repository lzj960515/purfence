import { MyUtil } from '@app/shared';
import { Log } from '@nest-mods/log';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommonService } from '@src/common';
import VoltAgent, {
  Agent,
  BaseGenerationOptions,
  InMemoryStorageAdapter,
  Memory,
  StreamTextOptions,
  AgentOptions as VoltAgentOptions,
  VoltAgentTextStreamPart,
  Workflow,
} from '@voltagent/core';
import { Output, type Tool } from 'ai';
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
import { LlmService } from './llm.service';
import { MessageService } from './message.service';
import { MyModel } from './model';
import { MyAgent } from './my-agent';
import { MyAgentHooks } from './my-agent-hooks';
import { summarizationSystemPrompt, summarizationUserPrompt } from './prompt';
import { SocketService } from './socket.service';
import { ToolsService } from './tools.service';
import {
  AgentOptions,
  ChatOptions,
  GenerateTextOutputOptions,
  IndexedKnowledgeBaseOptions,
  KnowledgeBaseAttachment,
  ModelOptions,
  MyAgentModuleOptions,
} from './types';
import { AgentArtifact } from '@src/purfence/artifact/agent-artifact.ai.entity';

@Injectable()
export class MyAgentService {
  constructor(
    private configService: ConfigService,
    private toolsService: ToolsService,
    private memory: Memory,
    private myHooks: MyAgentHooks,
    private llmService: LlmService,
    private messageService: MessageService,
    @Optional() private voltAgent?: VoltAgent,
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

    const response = await myAgent
      .getAgent()
      .generateText(chatOptions.message, generationOptions);

    if (!generateTextOutputOptions) {
      return response.text;
    }
    const summarizeAgent = this.createAgent({
      name: myAgent.getAgent().name,
      model: myAgent.getAgent().getModelName() as any,
      prompt: `You are a helpful assistant that summarizes the conversation.`,
    });

    const output = Output.object({ schema: generateTextOutputOptions.schema });
    const result = await summarizeAgent.generateText(
      generateTextOutputOptions.prompt,
      {
        ...(chatOptions as any),
        output,
      },
    );
    return result.output as z.infer<T>;
  }

  private generationOptions(
    myModel: MyModel,
    options: ChatOptions,
    signal?: AbortSignal,
  ): BaseGenerationOptions {
    const providerOptions = myModel.providerOptions();
    const headers = myModel.headers();
    return {
      ...options,
      providerOptions,
      headers,
      abortSignal: signal,
      contextLimit: 100,
    };
  }

  createAgent(options: AgentOptions): MyAgent {
    const { name, model, modelOptions, prompt, tools, subAgentsOptions } =
      options;

    const subAgents = _.map(subAgentsOptions, (op) =>
      this.createAgent(op).getAgent(),
    );
    const resolvedModelOptions: ModelOptions = modelOptions || { model };
    const myModel = this.llmService.get(resolvedModelOptions);
    const resolvedModel = resolvedModelOptions.model;

    const agent: Agent = new Agent({
      name,
      instructions: prompt,
      model: myModel.model(),
      tools: this.getAgentTools(tools, resolvedModel),
      memory: this.getMemory(options.memory),
      hooks: this.myHooks.getHooks(),
      maxSteps: 300,
      subAgents,
      supervisorConfig: {
        throwOnStreamError: true,
        fullStreamEventForwarding: {
          types: ['tool-input-start', 'tool-result'],
        },
      },
    });
    return new MyAgent(agent, this, myModel);
  }

  registerAgent(agent: Agent) {
    this.voltAgent?.registerAgent(agent);
  }

  registerWorkflow(workflow: Workflow<any, any>) {
    this.voltAgent?.registerWorkflow(workflow);
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
      .value() as VoltAgentOptions['tools'];
  }

  private getMemory(memory: AgentOptions['memory']) {
    switch (memory) {
      case false:
        return undefined;
      case 'in-memory':
        return new Memory({ storage: new InMemoryStorageAdapter() });
      default:
        return this.memory;
    }
  }

  async createStream(
    generationOptions: BaseGenerationOptions,
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
    const response = await myAgent
      .getAgent()
      .streamText(_message, generationOptions);

    return this.createErrorThrowingStream(response.fullStream);
  }

  /**
   * 包装 fullStream，将 error 事件转换为抛出的错误
   * 这样可以让 RxJS 的 retry 和 catchError 正常工作
   */
  private createErrorThrowingStream(
    baseStream: AsyncIterable<VoltAgentTextStreamPart>,
  ): AsyncIterable<VoltAgentTextStreamPart> {
    return (async function* () {
      for await (const chunk of baseStream) {
        // 检测到 error 事件时抛出错误
        if (chunk.type === 'error') {
          // 将 AI SDK 的 error 事件转换为可抛出的错误
          const error =
            chunk.error instanceof Error
              ? chunk.error
              : new Error(String(chunk.error));
          throw error;
        }

        // 正常事件直接 yield
        yield chunk;
      }
    })();
  }

  private formatObservable(
    ob: Observable<VoltAgentTextStreamPart>,
    chatOptions: Pick<
      StreamTextOptions,
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
    chunk: VoltAgentTextStreamPart<{ [k: string]: Tool }>,
    chatOptions: Pick<
      StreamTextOptions,
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
          //  output: { error: true }
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
      model: myAgent.getAgent().getModelName() as any,
      prompt: summarizationSystemPrompt,
      memory: false,
    });

    const prompt = currentMessages
      ? summarizationUserPrompt(JSON.stringify(currentMessages))
      : summarizationUserPrompt();

    const messages = await this.memory.getMessages(userId, conversationId);
    messages.push({
      id: MyUtil.uuid(),
      role: 'user',
      parts: [
        {
          type: 'text',
          text: prompt,
        },
      ],
    });
    const res = await summarizer.generateText(messages);
    return res.text;
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
    input: Parameters<Agent['generateText']>[0];
    prompt?: string;
    schema: T;
    model?: AgentOptions['model'];
    name?: string;
    options?: Parameters<Agent['generateText']>[1];
  }): Promise<z.infer<T>> {
    const agent = this.createAgent({
      name: name || 'generate-text',
      model: model || 'gpt-5-mini',
      prompt:
        prompt || `You are a helpful assistant that generates structured data.`,
      memory: false,
    });

    const output = Output.object({ schema });
    const resp = await agent.generateText(input, {
      ...options,
      output,
    });
    return resp.output as z.infer<T>;
  }

  private get config() {
    return this.configService.get<MyAgentModuleOptions>('my-agent');
  }
}
