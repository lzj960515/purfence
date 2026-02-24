import { applyDecorators, Logger } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import _ from 'lodash';
import { z } from 'zod';

const logger = new Logger('ToolDecorator');

// ============================================================================
// 类型定义（替代 @voltagent/core 的 ToolOptions/ToolSchema）
// ============================================================================

/**
 * 工具参数 Schema 类型
 */
export type ToolSchema = z.ZodTypeAny;

/**
 * 工具选项接口
 */
export interface ToolOptions<
  TParameters extends ToolSchema = ToolSchema,
  TOuput extends ToolSchema | undefined = undefined,
> {
  name: string;
  description: string;
  parameters: TParameters;
  execute: (args: z.infer<TParameters>, options: ToolExecuteOptions) => Promise<TOuput extends ToolSchema ? z.infer<TOuput> : any>;
  tags?: string[];
}

/**
 * 工具执行选项
 */
export interface ToolExecuteOptions {
  toolCallId: string;
  messages: any[];
  abortSignal?: AbortSignal;
  /**
   * 工具调用上下文（向后兼容）
   */
  toolContext?: {
    callId: string;
    name: string;
  };
  /**
   * 会话 ID（向后兼容）
   */
  conversationId?: string;
  /**
   * 上下文数据（向后兼容）
   */
  context?: Map<string, any>;
}

/**
 * 工具定义（用于存储）
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodTypeAny;
  execute: (args: any, options: ToolExecuteOptions) => Promise<any>;
  tags?: string[];
}

// ============================================================================
// MyAgentToolOptions - 装饰器选项
// ============================================================================

export interface MyAgentToolOptions<
  T extends ToolSchema = ToolSchema,
  O extends ToolSchema | undefined = undefined,
> extends Partial<Omit<ToolOptions<T, O>, 'execute'>> {
  /**
   * @deprecated 使用 parameters 替代
   * @see ToolOptions.parameters
   */
  schema?: Record<string, z.ZodTypeAny>;
  interrupt?: any;
  /**
   * 输出 schema（向后兼容）
   */
  outputSchema?: z.ZodTypeAny;
}

// ============================================================================
// 装饰器定义
// ============================================================================

export const ToolWatermark = DiscoveryService.createDecorator();
export const ToolOpt = Reflector.createDecorator<MyAgentToolOptions>({
  key: 'MY_AGENT_TOOL_OPTIONS',
});

/**
 * Tool 装饰器 - 标记方法为 Agent 工具
 *
 * 使用示例：
 * ```typescript
 * @Tool({
 *   name: 'createProject',
 *   description: '创建新项目',
 *   parameters: z.object({ name: z.string(), description: z.string() }),
 * })
 * async createProject(args: { name: string; description: string }, options: ToolExecuteOptions) {
 *   // 实现
 * }
 * ```
 */
export function Tool<
  T extends ToolSchema = ToolSchema,
  O extends ToolSchema | undefined = undefined,
>(options?: MyAgentToolOptions<T, O>) {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<ToolOptions<T, O>['execute']>,
  ) => {
    // 设置默认值
    const toolOptions = _.defaults({}, options, {
      name: String(propertyKey),
      description: String(propertyKey),
      parameters: options?.parameters || z.object(options?.schema || {}),
      tags: [],
    }) as any;

    // 删除已废弃的 schema 字段
    delete toolOptions.schema;

    // 标记类为工具宿主
    const ctor = typeof target === 'function' ? target : target.constructor;
    applyDecorators(ToolWatermark())(ctor);

    // 应用工具选项装饰器
    applyDecorators(ToolOpt(toolOptions as any))(target, propertyKey, descriptor);

    logger.debug(`Tool ${toolOptions.name} registered on ${String(propertyKey)}`);
  };
}
