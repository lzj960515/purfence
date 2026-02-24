import { Tool } from '@app/my-agent';
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { ToolExecuteOptions } from '@voltagent/core';
import { PurfenceExecution } from '../purfence-execution.entity';
import { ExecutionStage, PurfenceStatus } from '../purfence-status.enum';

/**
 * Execution 管理工具
 *
 * 提供以下功能：
 * - listExecutions: 查询指定 Issue 的所有运行列表
 * - continueExecution: 继续运行指定的 Execution（根据 stage 自动选择天机或天府）
 */
@Injectable()
export class ExecutionTools {
  private readonly logger = new Logger(ExecutionTools.name);

  @Tool({
    name: 'listExecutions',
    description: `查询指定 Issue 的所有 Execution 运行列表。

返回的信息包括：
- executionId: 执行 ID
- stage: 当前阶段（tianji=天机调度；tianfu=天府评估）
- status: 执行状态（running/done/failed 等）
- goal: 本次执行目标
- createdAt: 创建时间
- updatedAt: 更新时间

用途：用于查看 Issue 的执行历史，找到需要继续的 Execution。`,
    parameters: z.object({
      issueId: z.string().min(1).describe('Issue ID'),
    }),
    outputSchema: z.object({
      items: z.array(
        z.object({
          executionId: z.string(),
          stage: z.nativeEnum(ExecutionStage),
          status: z.nativeEnum(PurfenceStatus),
          goal: z.string().nullable(),
          createdAt: z.string(),
          updatedAt: z.string(),
        }),
      ),
      total: z.number(),
    }),
  })
  async listExecutions(
    { issueId }: { issueId: string },
    _options: ToolExecuteOptions,
  ) {
    this.logger.log(`Listing executions for issue: ${issueId}`);

    const executions = await PurfenceExecution.find({
      where: { issueId },
      order: { createdAt: 'DESC' },
    });

    return {
      items: executions.map((e) => ({
        executionId: e.id,
        stage: e.stage,
        status: e.status,
        goal: e.goal ?? null,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      total: executions.length,
    };
  }

  @Tool({
    name: 'resumeExecution',
    description: `继续运行指定的 Execution。

根据 Execution 的 stage 字段自动选择：
- stage=tianji: 使用天机 Agent 继续执行（调度、分配任务）
- stage=tianfu: 使用天府 Agent 继续执行（评估、规划下一步）

使用场景：
- 天机执行过程中断，需要继续调度
- 天府评估过程中断，需要继续评估
- 手动触发特定阶段的执行

注意：这个工具只是触发继续执行的信号，实际执行是异步的。`,
    parameters: z.object({
      executionId: z.string().min(1).describe('要继续的 Execution ID'),
      message: z.string().optional().describe('附加的消息/指令（可选）'),
    }),
    outputSchema: z.object({
      executionId: z.string(),
      stage: z.nativeEnum(ExecutionStage),
      status: z.string(),
      message: z.string(),
    }),
  })
  async resumeExecution(
    { executionId, message }: { executionId: string; message?: string },
    options: ToolExecuteOptions,
  ) {
    this.logger.log(`Resuming execution: ${executionId}`);

    const execution = await PurfenceExecution.findOne({
      where: { id: executionId },
    });

    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // 获取上下文服务
    const context = options.context;

    // 根据 stage 发送不同的事件
    if (execution.stage === ExecutionStage.tianji) {
      // 天机阶段：发送继续执行事件
      context.set('event', 'purfence.execution.execute');
      context.set('executionId', executionId);
      context.set('issueId', execution.issueId);

      return {
        executionId: execution.id,
        stage: execution.stage,
        status: 'resuming',
        message: `天机阶段将继续执行。${message ? `附加指令: ${message}` : ''}`,
      };
    } else if (execution.stage === ExecutionStage.tianfu) {
      // 天府阶段：发送评估事件
      context.set('event', 'purfence.execution.evaluate');
      context.set('executionId', executionId);
      context.set('issueId', execution.issueId);

      return {
        executionId: execution.id,
        stage: execution.stage,
        status: 'resuming',
        message: `天府阶段将继续评估。${message ? `附加指令: ${message}` : ''}`,
      };
    }

    throw new Error(`Unknown stage: ${execution.stage}`);
  }
}
