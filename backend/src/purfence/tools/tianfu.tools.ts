import { Tool } from '@app/my-agent';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ToolExecuteOptions } from '@voltagent/core';
import { PurfenceIssueService } from '../purfence-issue.service';
import { PurfenceExecutionService } from '../purfence-execution.service';
import { PurfenceIssue } from '../purfence-issue.entity';
import { IssueOrigin, PurfenceStatus } from '../purfence-status.enum';

/**
 * 天府（tianfu）Agent 专用工具
 *
 * Execution 完成后评估下一步行动：
 * - continueExecution: 继续当前执行（更新目标后重新执行）
 * - createNextExecution: 创建下一执行（新阶段）
 * - completeIssue: 完成 Issue（自动合并分支）
 * - createNextIssue: 创建后续 Issue
 */
@Injectable()
export class TianfuTools {
  constructor(
    private readonly issueService: PurfenceIssueService,
    private readonly executionService: PurfenceExecutionService,
  ) {}

  @Tool({
    name: 'continueExecution',
    description: '继续当前执行，更新目标后重新执行',
    parameters: z.object({
      goal: z.string().min(1).describe('更新后的执行目标'),
    }),
  })
  async continueExecution(
    { goal }: { goal: string },
    options: ToolExecuteOptions,
  ) {
    const executionId = options.context.get('executionId') as string;
    if (!executionId) throw new Error('executionId is required in context');

    await this.executionService.continueExecution(executionId, goal);
    return {
      executionId,
      goal,
      message: `执行 ${executionId} 将以新目标继续执行`,
    };
  }

  @Tool({
    name: 'createNextExecution',
    description: '创建新执行，用于开始新阶段',
    parameters: z.object({
      goal: z.string().min(1).describe('新执行的目标'),
    }),
  })
  async createNextExecution(
    { goal }: { goal: string },
    options: ToolExecuteOptions,
  ) {
    const issueId = options.context.get('issueId') as string;
    const currentExecutionId = options.context.get('executionId') as string;
    if (!issueId) throw new Error('issueId is required in context');

    if (currentExecutionId) {
      await this.executionService.markExecutionDone(currentExecutionId);
    }

    const newExecution = await this.executionService.createExecutionForIssue(
      issueId,
      goal,
    );
    return {
      executionId: newExecution.id,
      goal,
      message: `新执行 ${newExecution.id} 已创建`,
    };
  }

  @Tool({
    name: 'completeIssue',
    description:
      '完成 Issue 并合并分支到 main。如有冲突返回 success: false，需用 delegateTask 解决后重试',
    parameters: z.object({}),
  })
  async completeIssue(_: unknown, options: ToolExecuteOptions) {
    const issueId = options.context.get('issueId') as string;
    const executionId = options.context.get('executionId') as string;

    if (!issueId) throw new Error('issueId is required in context');

    if (executionId) {
      await this.executionService.markExecutionDone(executionId);
    }

    const result = await this.issueService.completeIssue(issueId);

    if (!result.success && result.conflict) {
      return {
        issueId: result.issue.id,
        status: result.issue.status,
        success: false,
        message: `合并冲突: ${result.conflict.message}。请用 delegateTask 执行 git merge main 解决冲突后重试`,
      };
    }

    return {
      issueId: result.issue.id,
      status: result.issue.status,
      success: true,
      message: `Issue ${issueId} 已完成，分支已合并到 main`,
    };
  }

  @Tool({
    name: 'createNextIssue',
    description: '创建新 Issue 继续推进项目',
    parameters: z.object({
      title: z.string().min(1).max(256).describe('Issue 标题'),
      description: z.string().min(1).describe('Issue 描述'),
    }),
  })
  async createNextIssue(
    { title, description }: { title: string; description: string },
    options: ToolExecuteOptions,
  ) {
    const currentIssueId = options.context.get('issueId') as string;
    const issue = await PurfenceIssue.findOneOrFail({
      where: { id: currentIssueId },
    });

    const newIssue = await PurfenceIssue.create({
      projectId: issue.projectId,
      title,
      description,
      dependsOnIssueId: currentIssueId,
      origin: IssueOrigin.ai,
      status: PurfenceStatus.needs_user,
    }).save();

    return {
      issueId: newIssue.id,
      title: newIssue.title,
      message: `新 Issue ${newIssue.id} 已创建`,
    };
  }
}
