import {
  ClaudeAgentSdkService,
  getAgentPrompt,
  Tool,
  type EnhancedExecutionResult,
  type ExecutionErrorInfo,
} from '@app/my-agent';
import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ToolExecuteOptions } from '@voltagent/core';
import path from 'node:path';
import { z } from 'zod';
import { pathExists } from '../../common/utils/file.util';
import { ClaudeCodeConfigService } from '../claude-code-config/claude-code-config.service';
import { PurfenceIssue } from '../purfence-issue.entity';
import { PurfenceProject } from '../purfence-project.entity';
import { PurfenceExecution } from '../purfence-execution.entity';

const TOOL_DESCRIPTION = `Launch a new agent to handle complex, multi-step tasks autonomously.

The Task tool launches specialized agents (subprocesses) that autonomously handle complex tasks.
Each agent type has specific capabilities and tools available to them.

Available agent types and the tools they have access to:
{{AGENTS}}

When using this tool, you must specify a subagent_type parameter to select which agent type to use.

`;

const TASK_TOOL_DESCRIPTION = `Launch a new agent to handle complex, multi-step tasks autonomously.

The Task tool launches specialized agents (subprocesses) that autonomously handle complex tasks.
Each agent type has specific capabilities and tools available to them.

Available agent types and the tools they have access to:

- default: 通用型 agent，能够处理多种任务类型。具备完整工具访问权限（文件读写、代码搜索、bash 命令等），适合需要全面能力或不确定具体 agent 类型时使用。

{{AGENTS}}

When using this tool, you must specify a subagent_type parameter to select which agent type to use.

`;

/**
 * Task 工具的返回结果类型
 * 包含 SDK 原始结果和可选的错误/重试信息
 */
export interface TaskToolResult {
  /** SDK 原始结果 */
  result: SDKResultMessage;
  /** 错误信息（如果发生了 conversation not found 并进行了重试） */
  error?: ExecutionErrorInfo;
}

@Injectable()
export class TaskTools {
  private readonly logger = new Logger(TaskTools.name);
  constructor(
    private readonly claudeAgentSdkService: ClaudeAgentSdkService,
    private readonly claudeCodeConfigService: ClaudeCodeConfigService,
  ) {}

  @Tool({
    name: 'delegateTask',
    description: TOOL_DESCRIPTION,
    parameters: z.object({
      description: z
        .string()
        .describe('A short (3-5 word) description of the task'),
      prompt: z.string().describe('The task for the agent to perform'),
      subagent_type: z
        .string()
        .describe(
          'The type of specialized agent to use. Each agent type has specific capabilities and tools available to it.',
        ),
    }),
  })
  async delegateTask(
    args: {
      description: string;
      prompt: string;
      subagent_type: string;
    },
    options: ToolExecuteOptions,
  ) {
    const { subagent_type: agent, prompt: task } = args;
    const { conversationId, toolContext, context } = options;
    const issueId = context.get('issueId') as string;
    const executionId = context.get('executionId') as string;

    const { resume, sessionId, cwd } = await this.determineParams(
      executionId,
      issueId,
    );

    const fullTask = `${task} \n\n 需求原文: .purfence/${issueId}/inputs/idea.md`;

    const claudeCodeEnv =
      await this.claudeCodeConfigService.buildClaudeCodeEnv();

    const enhancedResult = await this.claudeAgentSdkService.executeClaudeAgent({
      prompt: fullTask,
      resume,
      threadId: conversationId,
      sessionId,
      callId: toolContext.callId,
      cwd,
      systemPrompt: getAgentPrompt(agent),
      env: claudeCodeEnv,
      // 提供回调：当 sessionId 更新时同步更新 execution
      onSessionIdUpdate: async (newSessionId: string) => {
        await this.updateExecutionSessionId(executionId, newSessionId);
      },
    });

    return this.formatResult(enhancedResult);
  }

  /**
   * 更新 execution 的 sessionId
   */
  private async updateExecutionSessionId(
    executionId: string,
    newSessionId: string,
  ) {
    const execution = await PurfenceExecution.findOne({
      where: { id: executionId },
    });
    if (execution) {
      execution.sessionId = newSessionId;
      await execution.save();
      this.logger.log(
        `Updated execution ${executionId} sessionId to ${newSessionId}`,
      );
    } else {
      this.logger.warn(`Execution ${executionId} not found for sessionId update`);
    }
  }

  /**
   * 格式化返回结果，包含错误信息（如果有）
   * 返回一个包装对象，包含 SDK 结果和可选的错误/重试信息
   */
  private formatResult(enhancedResult: EnhancedExecutionResult): TaskToolResult {
    const { result, error } = enhancedResult;

    // 如果没有错误，直接返回包装结果
    if (!error) {
      return { result };
    }

    // 记录错误和重试信息到日志
    this.logger.warn(
      `Task completed with retry: type=${error.type}, retried=${error.retried}, success=${error.retrySuccess}`,
    );

    if (error.retrySuccess) {
      this.logger.log(
        `Task recovered successfully. Original sessionId: ${error.originalSessionId}, New sessionId: ${error.newSessionId}`,
      );
    } else {
      this.logger.error(
        `Task retry failed. Original sessionId: ${error.originalSessionId}, New sessionId: ${error.newSessionId}`,
      );
    }

    // 返回包含错误信息的包装结果
    return {
      result,
      error,
    };
  }

  // 确定
  private async determineParams(executionId: string, issueId: string) {
    const issue = await PurfenceIssue.findOne({ where: { id: issueId } });
    // 如何这个issue已经被合了，则需要切换成主分支，且新建一个sessionId， resume为false
    if (!issue.workdir || !(await pathExists(issue.workdir))) {
      const project = await PurfenceProject.findOne({
        where: { id: issue.projectId },
      });
      return {
        resume: false,
        sessionId: crypto.randomUUID(),
        cwd: path.join(project.localRootPath, 'repo'),
      };
    }

    const execution = await PurfenceExecution.findOne({
      where: { id: executionId },
    });
    // 如果已经有conversaionId了，说明之前已经执行过一次了，resume为true
    if (execution.sessionId) {
      return {
        resume: true,
        sessionId: execution.sessionId,
        cwd: issue.workdir,
      };
    }
    // 如果没有conversaionId，说明之前没有执行过，resume为false
    const sessionId = crypto.randomUUID();
    execution.sessionId = sessionId;
    await execution.save();
    return {
      resume: false,
      sessionId,
      cwd: issue.workdir,
    };
  }

  @Tool({
    name: 'Task',
    description: TASK_TOOL_DESCRIPTION,
    parameters: z.object({
      description: z
        .string()
        .describe('A short (3-5 word) description of the task'),
      prompt: z.string().describe('The task for the agent to perform'),
      subagent_type: z
        .string()
        .describe(
          'The type of specialized agent to use. Each agent type has specific capabilities and tools available to it.',
        ),
      cwd: z
        .string()
        .describe('The working directory for the agent to perform the task')
        .optional(),
      resume: z
        .string()
        .describe(
          'The session id to resume the agent, if not provided, a new session will be created, if provided, it must be the same as the previous cwd',
        )
        .optional(),
    }),
  })
  async executeTask(
    args: {
      description: string;
      prompt: string;
      subagent_type: string;
      cwd?: string;
      resume?: string;
    },
    options: ToolExecuteOptions,
  ) {
    const { prompt: task, cwd, resume, subagent_type } = args;
    const { conversationId, toolContext, context } = options;

    let _cwd = cwd;
    const projectId = context.get('projectId') as string;
    if (projectId) {
      const project = await PurfenceProject.findOne({
        where: { id: projectId },
      });
      if (project && project.localRootPath) {
        _cwd = path.join(project.localRootPath, 'repo');
      }
    }

    const claudeCodeEnv =
      await this.claudeCodeConfigService.buildClaudeCodeEnv();

    // 注意：executeTask 不需要 onSessionIdUpdate 回调，因为它不关联 execution
    const enhancedResult = await this.claudeAgentSdkService.executeClaudeAgent({
      prompt: task,
      resume: resume ? true : false,
      threadId: conversationId,
      sessionId: resume ? resume : crypto.randomUUID(),
      callId: toolContext.callId,
      cwd: _cwd,
      env: claudeCodeEnv,
      systemPrompt:
        subagent_type === 'default' ? undefined : getAgentPrompt(subagent_type),
    });

    return this.formatResult(enhancedResult);
  }
}
