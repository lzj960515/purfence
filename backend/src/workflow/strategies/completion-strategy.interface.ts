import { PurfenceIssue } from '../../purfence/purfence-issue.entity';

export interface CompletionResult {
  success: boolean;
  issue: PurfenceIssue;
  message?: string;
  requiresManualAction?: boolean;
  nextState: string;
}

export interface CompletionStrategy {
  /** 执行完成流程 */
  complete(issue: PurfenceIssue): Promise<CompletionResult>;

  /** 检查是否可以执行 */
  canComplete(issue: PurfenceIssue): Promise<boolean>;
}
