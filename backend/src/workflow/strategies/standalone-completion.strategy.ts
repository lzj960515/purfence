import { Injectable, Logger } from '@nestjs/common';
import { PurfenceIssue } from '../../purfence/purfence-issue.entity';
import { PurfenceStatus } from '../../purfence/purfence-status.enum';
import { PurfenceIssueService } from '../../purfence/purfence-issue.service';
import {
  CompletionStrategy,
  CompletionResult,
} from './completion-strategy.interface';

@Injectable()
export class StandaloneCompletionStrategy implements CompletionStrategy {
  private readonly logger = new Logger(StandaloneCompletionStrategy.name);

  constructor(private readonly issueService: PurfenceIssueService) {}

  async canComplete(issue: PurfenceIssue): Promise<boolean> {
    // 检查 issue 状态是否为 running
    return issue.status === PurfenceStatus.running;
  }

  async complete(issue: PurfenceIssue): Promise<CompletionResult> {
    this.logger.log(`Starting standalone completion for issue ${issue.id}`);

    // 1. 检查是否可以完成
    const canComplete = await this.canComplete(issue);
    if (!canComplete) {
      const message = `Issue ${issue.id} cannot be completed: status is ${issue.status}, expected ${PurfenceStatus.running}`;
      this.logger.warn(message);
      return {
        success: false,
        issue,
        message,
        requiresManualAction: false,
        nextState: issue.status,
      };
    }

    try {
      // 2. 自动合并到 main 分支
      this.logger.log(`Merging branch for issue ${issue.id}`);
      const mergeResult = await this.issueService.mergeBranch(issue.id);

      if (!mergeResult.success) {
        const message = mergeResult.conflict
          ? `Merge conflict detected: ${mergeResult.conflict.message}`
          : 'Merge failed';
        this.logger.warn(`Merge failed for issue ${issue.id}: ${message}`);
        return {
          success: false,
          issue: mergeResult.issue,
          message,
          requiresManualAction: true,
          nextState: PurfenceStatus.needs_approval,
        };
      }

      // 3. 自动推送到远程（在 mergeBranch 中已处理）
      this.logger.log(`Issue ${issue.id} completed successfully`);

      // 4. 返回结果 - 状态已经是 done（由 mergeBranch 设置）
      return {
        success: true,
        issue: mergeResult.issue,
        message: 'Issue completed and merged to main branch',
        requiresManualAction: false,
        nextState: PurfenceStatus.done,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error completing issue ${issue.id}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        success: false,
        issue,
        message: `Completion failed: ${errorMessage}`,
        requiresManualAction: false,
        nextState: issue.status,
      };
    }
  }
}
