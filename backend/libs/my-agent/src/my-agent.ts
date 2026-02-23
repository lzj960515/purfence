import {
  type LanguageModel,
  type UIMessage,
} from 'ai';

// 本地定义 CoreMessage 类型（替代从 'ai' 导入）
interface CoreMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | any[];
}
import { MyModel } from './model';
import type { MyAgentService } from './my-agent.service';
import type { ChatOptions, GenerateTextOutputOptions } from './types';
import { z } from 'zod';

// ============================================================================
// MyAgent 配置选项（替代 @voltagent/core 的 Agent 配置）
// ============================================================================

export interface MyAgentConfig {
  name: string;
  instructions?: string;
  model: LanguageModel;
  tools?: any[];
  memory?: false | 'in-memory';
  maxSteps?: number;
  subAgents?: MyAgent[];
}

// ============================================================================
// MyAgent - 替代 @voltagent/core 的 Agent 类
// ============================================================================

export class MyAgent {
  private config: MyAgentConfig;
  private service: MyAgentService;
  private myModel: MyModel;

  constructor(
    config: MyAgentConfig,
    service: MyAgentService,
    myModel: MyModel,
  ) {
    this.config = config;
    this.service = service;
    this.myModel = myModel;
  }

  /**
   * 获取 Agent 名称
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * 获取模型名称
   */
  getModelName(): string {
    // 从模型实例中获取模型名称
    return this.myModel.model().modelId || 'unknown';
  }

  /**
   * 获取模型实例
   */
  getModel(): LanguageModel {
    return this.config.model;
  }

  /**
   * 获取工具列表
   */
  getTools(): any[] {
    return this.config.tools || [];
  }

  /**
   * 获取系统指令
   */
  getInstructions(): string | undefined {
    return this.config.instructions;
  }

  /**
   * 获取最大步骤数
   */
  getMaxSteps(): number {
    return this.config.maxSteps || 300;
  }

  /**
   * 获取内存配置
   */
  getMemory(): false | 'in-memory' | undefined {
    return this.config.memory;
  }

  /**
   * 获取子 Agent 列表
   */
  getSubAgents(): MyAgent[] {
    return this.config.subAgents || [];
  }

  /**
   * 获取 MyModel 实例
   */
  getMyModel(): MyModel {
    return this.myModel;
  }

  /**
   * 获取 MyAgentService 实例
   */
  getService(): MyAgentService {
    return this.service;
  }

  /**
   * 生成文本（非流式）
   * 直接使用 AI SDK 的 generateText
   */
  async generateText(
    message: string | UIMessage[] | CoreMessage[],
    options?: {
      userId?: string;
      conversationId?: string;
      context?: Record<string, any>;
      abortSignal?: AbortSignal;
    },
  ): Promise<string> {
    return this.service.invoke(this, {
      chatOptions: {
        message: message as any,
        userId: options?.userId,
        conversationId: options?.conversationId,
        context: options?.context,
      },
    });
  }

  /**
   * 流式生成文本
   * 使用 MyAgentService 的 stream 方法
   */
  async streamText(
    message: string | UIMessage[] | CoreMessage[],
    options?: {
      userId?: string;
      conversationId?: string;
      context?: Record<string, any>;
      abortSignal?: AbortSignal;
    },
  ): Promise<any> {
    return this.service.stream(this, {
      message: message as any,
      userId: options?.userId,
      conversationId: options?.conversationId,
      context: options?.context,
    });
  }

  /**
   * 流式对话（统一入口）
   */
  async stream(chatOptions: ChatOptions) {
    await this.populateUserContext(chatOptions);
    return this.service.stream(this, chatOptions);
  }

  /**
   * 调用 Agent（非流式）
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
    const { chatOptions, generateTextOutputOptions } = options;
    await this.populateUserContext(chatOptions);
    return this.service.invoke(this, {
      chatOptions,
      generateTextOutputOptions,
    });
  }

  /**
   * 填充用户上下文信息
   */
  private async populateUserContext(options?: {
    userId?: string;
    context?: Map<string | symbol, unknown> | Record<string | symbol, unknown>;
  }) {
    if (!options) return;
    const userId = options.userId;
    if (!userId) return;

    try {
      const store = {
        title: 'test',
        v1PlanType: 'free',
        avatarUrl: 'https://example.com/avatar.png',
      };
      const userMetadata = {
        plan: store.v1PlanType,
      } as const;

      if (options.context instanceof Map) {
        options.context.set('user.name', store.title);
        options.context.set('user.avatar', store.avatarUrl);
        options.context.set('user.metadata', userMetadata);
      } else {
        const base = options.context || {};
        options.context = {
          ...base,
          'user.name': store.title,
          'user.avatar': store.avatarUrl,
          'user.metadata': userMetadata,
        };
      }
    } catch {
      // 静默失败，不影响主流程
    }
  }
}
