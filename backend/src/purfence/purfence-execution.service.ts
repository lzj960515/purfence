import { getAgentPrompt } from '@app/my-agent';
import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import path from 'node:path';
import { Transactional } from 'typeorm-transactional';
import { CommonService } from '../common/common.service';
import {
  assertSafeRelPath,
  listFilesRecursive,
  pathExists,
  readText,
} from '../common/utils/file.util';
import { PurfenceIssue } from './purfence-issue.entity';
import { PurfenceProject } from './purfence-project.entity';
import { PurfenceExecution } from './purfence-execution.entity';
import { PurfenceStatus, ExecutionStage } from './purfence-status.enum';
import { PurfenceAgentService } from './agent.service';

@Injectable()
export class PurfenceExecutionService {
  constructor(private readonly purfenceAgentService: PurfenceAgentService) {}

  @Transactional()
  async createExecutionForIssue(issueId: string, goal?: string) {
    const issue = await PurfenceIssue.findOneOrFail({ where: { id: issueId } });

    const execution = PurfenceExecution.create({
      projectId: issue.projectId,
      issueId: issue.id,
      goal,
      status: PurfenceStatus.running,
    });
    await execution.save();

    await PurfenceIssue.update(issue.id, {
      latestExecutionId: execution.id,
      status: PurfenceStatus.running,
    });

    return execution;
  }

  /**
   * 继续当前 Execution，更新目标后重新执行
   */
  async continueExecution(executionId: string, newGoal: string) {
    const execution = await PurfenceExecution.findOne({
      where: { id: executionId },
    });
    if (!execution) {
      throw new Error(`execution not found: ${executionId}`);
    }

    execution.goal = newGoal;
    execution.status = PurfenceStatus.running;
    await execution.save();

    // 触发重新执行
    CommonService.emit('purfence.execution.execute', {
      executionId: execution.id,
    });

    return execution;
  }

  /**
   * 标记 Execution 为完成
   */
  async markExecutionDone(executionId: string) {
    const execution = await PurfenceExecution.findOne({
      where: { id: executionId },
    });
    if (!execution) {
      throw new Error(`execution not found: ${executionId}`);
    }

    execution.status = PurfenceStatus.done;
    await execution.save();

    return execution;
  }

  async execute(executionId: string) {
    const execution = await PurfenceExecution.findOneOrFail({
      where: { id: executionId },
    });
    const issue = await PurfenceIssue.findOneOrFail({
      where: { id: execution.issueId },
    });

    const project = await PurfenceProject.findOneOrFail({
      where: { id: issue.projectId },
    });

    const tianjiPrompt = getAgentPrompt('tianji');
    execution.status = PurfenceStatus.running;
    execution.stage = ExecutionStage.tianji;
    await execution.save();

    const goalLine = execution.goal?.trim()
      ? `本次目标：${execution.goal.trim()}\n\n`
      : '';

    const taskPrompt = `# 任务信息

## 项目背景

**项目名称**：${project.name}
**项目描述**：${project.description || '无'}

## Issue 信息

**Issue ID**：${issue.id}
**标题**：${issue.title}
**描述**：
${issue.description || '无'}

${goalLine}
---

请分析以上信息，选择合适的团队（通过 delegateTask）来推进这个 Issue。
`;

    await this.purfenceAgentService.streamAgent({
      threadId: execution.id,
      query: taskPrompt,
      agentName: 'tianji',
      prompt: tianjiPrompt,
      tools: ['delegateTask', 'getCurrentTime'],
      context: {
        issueId: issue.id,
        executionId: execution.id,
        event: 'purfence.execution.evaluate',
      },
    });

    return execution;
  }

  /**
   * 评估 Execution 完成后的下一步行动
   *
     * 使用天府（tianfu）Agent + 工具模式，让 AI 自主决策：
    * - continueExecution: 继续当前执行（更新目标后重新执行）
    * - createNextExecution: 创建下一执行（新阶段）
    * - completeIssue: 完成 Issue（含合并分支）
    * - createNextIssue: 创建后续 Issue
    */
  async evaluateAndScheduleNextStep(executionId: string) {
    const execution = await PurfenceExecution.findOneOrFail({
      where: { id: executionId },
    });

    const issue = await PurfenceIssue.findOneOrFail({
      where: { id: execution.issueId },
    });

    const project = await PurfenceProject.findOneOrFail({
      where: { id: issue.projectId },
    });

    const tianfuPrompt = getAgentPrompt('tianfu');

    // 更新 stage 为 tianfu（天府评估阶段）
    execution.stage = ExecutionStage.tianfu;
    await execution.save();

    const userMessage = `刚才的任务执行完了，现在需要你评估：这个 Issue 是否已经完成？如果完成了，下一步应该做什么？

## 背景信息

你正在处理「${project.name}」项目（项目 ID: ${project.id}）。

当前 Issue：**${issue.title}**
Issue ID: ${issue.id}

Issue artifacts root (read via delegateTask):
- .purfence/${issue.id}/artifacts/
${issue.description ? `Issue 说明：${issue.description}` : ''}

${execution.goal ? `刚才执行的目标是：${execution.goal}` : '刚才执行了一个任务'}

## 你的任务

按照你的工作流程：
1. 先探索项目，了解实际完成情况
2. 判断这个 Issue 是否已达成目标
3. 如果完成了，规划下一步应该做什么（比如创建新的 Issue）`;

    await this.purfenceAgentService.streamAgent({
      threadId: execution.id,
      query: userMessage,
      agentName: 'tianfu',
      prompt: tianfuPrompt,
      tools: [
        'continueExecution',
        'createNextExecution',
        'completeIssue',
        'createNextIssue',
        'delegateTask',
        'getCurrentTime',
      ],
      context: {
        issueId: issue.id,
        executionId: execution.id,
        projectId: project.id,
        // 传递项目的 Slack 配置，用于评估完成时的通知
        slackAppConfigId: project.slackAppConfigId,
        slackChannelId: project.slackChannelId,
        // 评估完成时发送 Slack 通知的事件（复用定时任务的事件机制）
        event: 'purfence.evaluation.stream-ended',
      },
    });
  }

  async listIssueArtifactFiles(issueId: string) {
    const issue = await PurfenceIssue.findOneOrFail({ where: { id: issueId } });
    if (!issue.workdir) {
      return [];
    }

    const newRoot = path.join(
      issue.workdir,
      '.purfence',
      issueId,
      'artifacts',
    );
    if (!(await pathExists(newRoot))) {
      return [];
    }

    return listFilesRecursive(newRoot, { ignoreDotfiles: true });
  }

  async readIssueArtifactFile(issueId: string, filePath: string) {
    const issue = await PurfenceIssue.findOneOrFail({ where: { id: issueId } });
    const safeRel = assertSafeRelPath(filePath);
    const newPath = path.join(
      issue.workdir,
      '.purfence',
      issueId,
      'artifacts',
      safeRel,
    );
    return readText(newPath);
  }

  /**
   * 分析导入的项目，自动生成 name 和 description
   */
  async analyzeImportedProject(projectId: string) {
    const project = await PurfenceProject.findOneOrFail({
      where: { id: projectId },
    });

    if (!project.externalPath) {
      throw new Error(`Project ${projectId} is not an imported project`);
    }

    const repoPath = path.join(project.localRootPath, 'repo');

    const analyzerPrompt = `你是一个项目分析协调者。你的任务是让代码分析团队分析项目，并更新项目信息。

工作流程：
1. 使用 Task 调用代码分析团队，让他们直接给出项目名称和产品描述
2. 收到结果后，使用 Task 更新项目信息

重要：让真正分析代码的团队直接给出名称和描述。`;

    const analyzePrompt = `请分析以下项目并更新信息：

项目 ID：${projectId}
项目路径：${repoPath}

步骤：
1. 使用 Task 工具，要求代码分析团队：
   - 分析项目结构、README、package.json 等关键文件
   - 直接给出：
     a) 项目名称（中文，简洁明了，不超过 20 字）
     b) 项目描述（产品视角，讲故事）
   
   项目描述要求：
   - 这是什么产品？解决什么问题？
   - 主要功能有哪些？目标用户是谁？
   - 用产品的语言描述，像产品介绍一样
   - 如果原文是英文，用中文改写

2. 收到名称和描述后，直接使用 updateProject 更新项目信息`;


    const conversationId = crypto.randomUUID();

    await this.purfenceAgentService.streamAgent({
      threadId: conversationId,
      query: analyzePrompt,
      agentName: 'project-analyzer',
      prompt: analyzerPrompt,
      tools: ['Task', 'updateProject'],
      context: {
        projectId: project.id,
      },
    });

    return project;
  }
}
