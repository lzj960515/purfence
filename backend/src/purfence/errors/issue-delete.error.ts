import { BizError } from '../../common/errors/biz.error';

export class IssueNotFoundError extends BizError {
  constructor(issueId: string) {
    super(`Issue not found: ${issueId}`, 'ISSUE_NOT_FOUND');
  }
}
