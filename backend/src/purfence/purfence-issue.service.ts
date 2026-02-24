import { Injectable, Logger } from '@nestjs/common';
import { cp, rm, readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { Transactional } from 'typeorm-transactional';
import { MessageService } from '@app/my-agent';
import { PurfenceIssueCreateInput } from './purfence-issue-create.input';
import { PurfenceIssue } from './purfence-issue.entity';
import { PurfenceProject } from './purfence-project.entity';
import { PurfenceExecution } from './purfence-execution.entity';
import { PurfenceStatus } from './purfence-status.enum';
import {
  ensureDir,
  pathExists,
  safeReaddir,
  writeText,
} from '../common/utils/file.util';
import { IssueNotFoundError } from './errors/issue-delete.error';
import { PurfenceConfigService } from './purfence-config/purfence-config.service';
import { PurfenceExecutionService } from './purfence-execution.service';
import { IssueOrigin } from './purfence-status.enum';

const execFileAsync = promisify(execFile);

@Injectable()
export class PurfenceIssueService {
  private readonly logger = new Logger(PurfenceIssueService.name);

  constructor(
    private readonly messageService: MessageService,
    private readonly purfenceConfigService: PurfenceConfigService,
    private readonly executionService: PurfenceExecutionService,
  ) {}

  async createIssue(input: PurfenceIssueCreateInput) {
    const project = await PurfenceProject.findOne({
      where: { id: input.projectId },
    });
    if (!project) {
      throw new Error(`project not found: ${input.projectId}`);
    }

    if (!input.slug) {
      throw new Error('Issue slug is required');
    }

    // 仅创建 issue 记录，不初始化 workspace
    const issue = PurfenceIssue.create({
      projectId: input.projectId,
      title: input.title,
      slug: input.slug,
      description: input.description,
      dependsOnIssueId: input.dependsOnIssueId,
      origin: input.origin,
      status:
        input.origin === IssueOrigin.ai
          ? PurfenceStatus.needs_user
          : PurfenceStatus.open,
    });
    await issue.save();

    return issue;
  }

  async startIssue(issueId: string) {
    const issue = await PurfenceIssue.findOneOrFail({ where: { id: issueId } });

    if (issue.status === PurfenceStatus.running) {
      throw new Error(`Issue is already running: ${issueId}`);
    }

    await this.initWorkspace(issueId);
    return this.executionService.createExecutionForIssue(issueId);
  }

  async initWorkspace(issueId: string) {
    const issue = await PurfenceIssue.findOneOrFail({ where: { id: issueId } });
    if (issue.workdir) {
      return issue;
    }

    const project = await PurfenceProject.findOneOrFail({
      where: { id: issue.projectId },
    });

    const projectsRoot =
      await this.purfenceConfigService.getProjectsRootPathOrThrow();
    const projectRootPath =
      project.localRootPath ||
      path.join(projectsRoot, project.slug || project.id);
    const repoPath = path.join(projectRootPath, 'repo');

    const branchName = `issue/${issue.id}`;
    const worktreePath = path.join(
      projectRootPath,
      'worktrees',
      issue.slug || issue.id,
    );

    await this.ensureWorktree({
      repoPath,
      worktreePath,
      branchName,
      defaultBranch: project.defaultBranch || 'main',
    });
    await this.syncAttachments({ projectRootPath, worktreePath });

    await this.createSourcePlanStructure(
      worktreePath,
      issue.id,
      issue.title,
      issue.description,
    );

    issue.workdir = worktreePath;
    await issue.save();

    return issue;
  }

  /**
   * 完成 Issue
   *
   * 1. 合并 Issue 分支到 main
   * 2. 更新 Issue 状态为 done
   */
  async completeIssue(issueId: string) {
    return this.mergeBranch(issueId);
  }

  /**
   * 合并 Issue 分支到 main 分支
   *
   * 流程：
   * 1. 先在 issue worktree 中将 main 合并到 issue 分支
   * 2. 如果有冲突，返回冲突信息，让 Agent 在 worktree 中解决
   * 3. 冲突解决后，再将 issue 分支合并回 main（此时应无冲突）
   * 4. 更新 Issue 状态为 done
   *
   * @returns 合并结果，包含成功/失败状态和冲突信息
   */
  async mergeBranch(issueId: string): Promise<{
    success: boolean;
    issue: PurfenceIssue;
    conflict?: { worktreePath: string; branchName: string; message: string };
  }> {
    const issue = await PurfenceIssue.findOneOrFail({ where: { id: issueId } });

    const project = await PurfenceProject.findOneOrFail({
      where: { id: issue.projectId },
    });

    const projectsRoot =
      await this.purfenceConfigService.getProjectsRootPathOrThrow();
    const projectRootPath =
      project.localRootPath ||
      path.join(projectsRoot, project.slug || project.id);
    const repoPath = path.join(projectRootPath, 'repo');
    const worktreePath =
      issue.workdir ||
      path.join(projectRootPath, 'worktrees', issue.slug || issue.id);

    const branchName = `issue/${issue.id}`;

    // 检查分支是否存在
    const branchExists = await this.gitBranchExists(repoPath, branchName);
    if (!branchExists) {
      throw new Error(`branch not found: ${branchName}`);
    }

    const defaultBranch = project.defaultBranch || 'main';

    // Step 0: 在 issue worktree 中提交所有变更
    try {
      await execFileAsync('git', ['add', '.'], { cwd: worktreePath });
      await execFileAsync(
        'git',
        ['commit', '-m', `chore: commit issue ${issue.slug || issue.id} changes`],
        { cwd: worktreePath },
      );
    } catch {
      // 如果没有变更需要提交，忽略错误
    }

    // Step 1: 在 issue worktree 中先将 defaultBranch 合并进来
    try {
      await execFileAsync(
        'git',
        [
          'merge',
          defaultBranch,
          '-m',
          `Merge ${defaultBranch} into issue branch`,
        ],
        {
          cwd: worktreePath,
        },
      );
    } catch (err: any) {
      // 合并 defaultBranch 到 issue 分支时发生冲突
      // 回滚合并状态
      await execFileAsync('git', ['merge', '--abort'], {
        cwd: worktreePath,
      }).catch(() => {
        /* ignore if no merge in progress */
      });

      return {
        success: false,
        issue,
        conflict: {
          worktreePath,
          branchName,
          message: `合并 ${defaultBranch} 到 ${branchName} 时发生冲突: ${err.message || 'merge conflict'}`,
        },
      };
    }

    // Step 2: 在 repo 中切换到 defaultBranch，合并 issue 分支
    await execFileAsync('git', ['checkout', defaultBranch], { cwd: repoPath });

    try {
      await execFileAsync(
        'git',
        ['merge', '--no-ff', '-m', `Merge ${branchName}`, branchName],
        { cwd: repoPath },
      );
    } catch (err: any) {
      // 这种情况理论上不应该发生，因为已经在 issue 分支解决了冲突
      await execFileAsync('git', ['merge', '--abort'], { cwd: repoPath }).catch(
        () => {},
      );

      return {
        success: false,
        issue,
        conflict: {
          worktreePath: repoPath,
          branchName,
          message: `合并 ${branchName} 到 ${defaultBranch} 时发生冲突: ${err.message || 'merge conflict'}`,
        },
      };
    }

    // Step 3: 删除 issue worktree 和分支
    try {
      await execFileAsync('git', ['worktree', 'remove', worktreePath], {
        cwd: repoPath,
      });
    } catch {
      // worktree 可能已被手动删除，忽略错误
    }

    try {
      await execFileAsync('git', ['branch', '-d', branchName], { cwd: repoPath });
    } catch {
      // 忽略删除失败（分支可能已被删除或还有未合并内容）
    }

    // 更新 Issue 状态
    issue.status = PurfenceStatus.done;
    // Worktree has been removed; clear stale pointer.
    issue.workdir = undefined;
    await issue.save();

    // 更新 issue.json 文件，添加完成状态
    await this.updateIssueJsonStatus(worktreePath, issueId);

    return { success: true, issue };
  }

  /** 创建 git worktree */
  private async ensureWorktree(opts: {
    repoPath: string;
    worktreePath: string;
    branchName: string;
    defaultBranch: string;
  }) {
    const exists = await pathExists(opts.worktreePath);
    if (exists) return;

    await ensureDir(path.dirname(opts.worktreePath));

    const branchExists = await this.gitBranchExists(
      opts.repoPath,
      opts.branchName,
    );

    if (branchExists) {
      await execFileAsync(
        'git',
        ['worktree', 'add', opts.worktreePath, opts.branchName],
        { cwd: opts.repoPath },
      );
      return;
    }

    await execFileAsync(
      'git',
      [
        'worktree',
        'add',
        '-b',
        opts.branchName,
        opts.worktreePath,
        opts.defaultBranch,
      ],
      { cwd: opts.repoPath },
    );
  }

  /** 检查 git 分支是否存在 */
  private async gitBranchExists(repoPath: string, branchName: string) {
    try {
      await execFileAsync(
        'git',
        ['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`],
        { cwd: repoPath },
      );
      return true;
    } catch {
      return false;
    }
  }

  /** 同步附件到 worktree */
  private async syncAttachments(opts: {
    projectRootPath: string;
    worktreePath: string;
  }) {
    const canonicalDir = path.join(opts.projectRootPath, 'attachments');
    const mirrorDir = path.join(
      opts.worktreePath,
      '.purfence',
      'attachments',
    );

    await ensureDir(canonicalDir);
    await rm(mirrorDir, { recursive: true, force: true });
    await ensureDir(mirrorDir);

    const entries = await safeReaddir(canonicalDir);
    for (const entry of entries) {
      const from = path.join(canonicalDir, entry);
      const to = path.join(mirrorDir, entry);
      await cp(from, to, { recursive: true });
    }
  }

  /**
   * 写入 Issue 相关文件到 .purfence 目录
   *
   * 目录结构已在 Project 初始化时创建，这里只写入 Issue 相关文件：
   * - meta/issue.json: Issue 元数据
   * - inputs/idea.md: 原始需求描述
   *
   * artifacts（PRD、IA、验收标准等）由 PM agent 根据 product-artifacts skill 自行创建。
   */
  private async createSourcePlanStructure(
    worktreePath: string,
    issueId: string,
    issueTitle: string,
    issueDescription: string,
  ) {
    // New layout: everything is namespaced by issueId so tianfu can read
    // only `.purfence/<issueId>/...`.
    const sourcePlanDir = path.join(worktreePath, '.purfence', issueId);

    // 创建 issue.json 元数据文件
    const issueJsonPath = path.join(sourcePlanDir, 'meta', 'issue.json');
    await writeText(
      issueJsonPath,
      JSON.stringify(
        {
          issueId,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    // 创建/覆盖 idea.md：记录原始需求
    const ideaPath = path.join(sourcePlanDir, 'inputs', 'idea.md');
    await writeText(
      ideaPath,
      `# Idea

## 需求描述（原文）

**标题**：${issueTitle}

${issueDescription.trim()}
`,
    );

    // Ensure artifact directory exists (agents will create files inside).
    await ensureDir(path.join(sourcePlanDir, 'artifacts'));
  }

  /**
   * 更新 issue.json 文件，添加完成状态
   *
   * @param worktreePath - Issue 的 worktree 路径
   * @param issueId - Issue ID
   */
  private async updateIssueJsonStatus(
    worktreePath: string,
    issueId: string,
  ): Promise<void> {
    try {
      const issueJsonPath = path.join(
        worktreePath,
        '.purfence',
        issueId,
        'meta',
        'issue.json',
      );

      // 读取现有 issue.json
      const content = await readFile(issueJsonPath, 'utf-8');
      const issueJson = JSON.parse(content) as {
        issueId: string;
        createdAt: string;
        status?: string;
        completedAt?: string;
      };

      // 更新状态
      issueJson.status = 'completed';
      issueJson.completedAt = new Date().toISOString();

      // 写回文件
      await writeText(issueJsonPath, JSON.stringify(issueJson, null, 2));

      this.logger.log(
        `[updateIssueJsonStatus] ${issueId} issue.json updated with status=completed`,
      );
    } catch (error) {
      // 如果更新失败，记录日志但不阻断主流程
      this.logger.warn(
        `[updateIssueJsonStatus] ${issueId} failed to update issue.json: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 删除 Issue 及其关联资源
   *
   * 4阶段删除流程：
   * 1. 前置校验（事务外）- 校验 Issue 存在性和状态
   * 2. 对话清理（事务外）- 清理 Execution 关联的 Volt Agent 对话
   * 3. Git 清理（事务外）- 删除 worktree 和分支
   * 4. 数据库删除（事务内）- 级联删除 Execution 和 Issue 记录
   */
  async deleteIssue(issueId: string): Promise<string> {
    const loggerPrefix = `[purfence-issue-delete] ${issueId}`;

    // 阶段1: 前置校验（事务外）
    const issue = await this.validateIssueForDelete(issueId);
    this.logger.log(`${loggerPrefix} validation_passed status=${issue.status}`);

    // 阶段2: 对话清理（事务外，失败不阻断）
    await this.cleanupConversations(issueId);
    this.logger.log(`${loggerPrefix} conversation_cleanup_completed`);

    // 阶段3: Git 资源清理（事务外，失败不阻断）
    await this.cleanupGitResources(issue);
    this.logger.log(`${loggerPrefix} git_cleanup_completed`);

    // 阶段4: 数据库删除（事务内）
    await this.deleteIssueRecords(issueId);
    this.logger.log(`${loggerPrefix} database_delete_completed`);

    return issueId;
  }

  /**
   * 阶段1: 前置校验
   * - 校验 Issue 存在性
   * - 所有状态的 Issue 都可以被删除（包括 running/needs_user/needs_approval）
   */
  private async validateIssueForDelete(issueId: string): Promise<PurfenceIssue> {
    const issue = await PurfenceIssue.findOne({ where: { id: issueId } });

    if (!issue) {
      throw new IssueNotFoundError(issueId);
    }

    return issue;
  }

  /**
   * 阶段2: 对话清理
   * - 查询该 Issue 的所有 Execution 记录
   * - 对每个存在 sessionId 的 Execution，调用 deleteConversation
   * - 异常捕获，记录日志，不阻断主流程
   */
  private async cleanupConversations(issueId: string): Promise<void> {
    const executions = await PurfenceExecution.find({ where: { issueId } });

    for (const execution of executions) {
      if (execution.sessionId) {
        try {
          await this.messageService.deleteConversation(execution.sessionId);
          this.logger.debug(
            `[purfence-issue-delete] ${issueId} conversation_deleted ` +
              `executionId=${execution.id}, sessionId=${execution.sessionId}`,
          );
        } catch (error) {
          this.logger.warn(
            `[purfence-issue-delete] ${issueId} conversation_cleanup_failed ` +
              `executionId=${execution.id}, sessionId=${execution.sessionId}, ` +
              `error=${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }

  /**
   * 阶段3: Git 资源清理
   * - 删除 Git worktree（如果存在）
   * - 删除 Git 分支（如果存在）
   */
  private async cleanupGitResources(issue: PurfenceIssue): Promise<void> {
    const project = await PurfenceProject.findOneOrFail({
      where: { id: issue.projectId },
    });

    const projectsRoot =
      await this.purfenceConfigService.getProjectsRootPathOrThrow();
    const projectRootPath =
      project.localRootPath ||
      path.join(projectsRoot, project.slug || project.id);
    const repoPath = path.join(projectRootPath, 'repo');
    const branchName = `issue/${issue.id}`;

    // 删除 worktree（如果路径存在）
    if (issue.workdir) {
      try {
        await execFileAsync('git', ['worktree', 'remove', issue.workdir], {
          cwd: repoPath,
        });
        this.logger.debug(
          `[purfence-issue-delete] ${issue.id} worktree_removed path=${issue.workdir}`,
        );
      } catch {
        // worktree 可能已被手动删除，忽略错误
        this.logger.debug(
          `[purfence-issue-delete] ${issue.id} worktree_remove_skipped ` +
            `(may already be removed)`,
        );
      }
    }

    // 删除分支（如果存在）
    const branchExists = await this.gitBranchExists(repoPath, branchName);
    if (branchExists) {
      try {
        await execFileAsync('git', ['branch', '-D', branchName], {
          cwd: repoPath,
        });
        this.logger.debug(
          `[purfence-issue-delete] ${issue.id} branch_deleted name=${branchName}`,
        );
      } catch {
        // 忽略删除失败
        this.logger.debug(
          `[purfence-issue-delete] ${issue.id} branch_delete_failed ` +
            `(may have unmerged changes)`,
        );
      }
    }
  }

  /**
   * 阶段4: 数据库删除（事务内）
   * - 删除所有关联 Execution 记录
   * - 删除 Issue 记录
   *
   * 注意：使用 @Transactional() 声明式事务
   * 由于 @Transactional() 在 private 方法上不生效，此方法保持为 public
   */
  @Transactional()
  async deleteIssueRecords(issueId: string): Promise<void> {
    // 删除关联的 Execution 记录
    await PurfenceExecution.delete({ issueId });

    // 删除 Issue 记录
    const result = await PurfenceIssue.delete({ id: issueId });

    if (result.affected === 0) {
      throw new IssueNotFoundError(issueId);
    }
  }
}
