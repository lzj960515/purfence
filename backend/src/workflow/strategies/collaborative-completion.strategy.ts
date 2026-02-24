import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PurfenceIssue } from '../../purfence/purfence-issue.entity';
import { PurfenceStatus } from '../../purfence/purfence-status.enum';
import {
  CompletionStrategy,
  CompletionResult,
} from './completion-strategy.interface';

export interface IssueNeedsApprovalEvent {
  issueId: string;
  projectId: string;
  workdir: string | undefined;
  message: string;
  timestamp: Date;
}

export const ISSUE_NEEDS_APPROVAL_EVENT = 'issue.needs_approval';

@Injectable()
export class CollaborativeCompletionStrategy implements CompletionStrategy {
  private readonly logger = new Logger(CollaborativeCompletionStrategy.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async canComplete(issue: PurfenceIssue): Promise<boolean> {
    // 检查 issue 状态是否为 running
    return issue.status === PurfenceStatus.running;
  }

  async complete(issue: PurfenceIssue): Promise<CompletionResult> {
    this.logger.log(`Starting collaborative completion for issue ${issue.id}`);

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
      // 2. 不执行自动合并（协作模式下由用户手动执行）
      // 3. 不执行自动推送（协作模式下由用户手动执行）

      // 4. 发送通知事件
      const event: IssueNeedsApprovalEvent = {
        issueId: issue.id,
        projectId: issue.projectId,
        workdir: issue.workdir,
        message: `Issue ${issue.id} is ready for review and manual merge`,
        timestamp: new Date(),
      };

      this.eventEmitter.emit(ISSUE_NEEDS_APPROVAL_EVENT, event);
      this.logger.log(
        `Emitted ${ISSUE_NEEDS_APPROVAL_EVENT} event for issue ${issue.id}`,
      );

      // 5. 返回结果（requiresManualAction = true）
      const message =
        'Issue work is complete. Please review and manually merge when ready.';
      this.logger.log(`Issue ${issue.id} moved to needs_approval state`);

      return {
        success: true,
        issue,
        message,
        requiresManualAction: true,
        nextState: PurfenceStatus.needs_approval,
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
