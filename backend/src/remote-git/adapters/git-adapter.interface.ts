/**
 * Git Adapter Interface
 * Defines the contract for interacting with remote Git repositories (GitHub, GitLab)
 */

export interface GitAdapter {
  /** Test connection to remote repository */
  testConnection(): Promise<ConnectionTestResult>;

  /** Get list of issues */
  getIssues(options?: GetIssuesOptions): Promise<RemoteIssue[]>;

  /** Get a single issue by ID */
  getIssue(issueId: string): Promise<RemoteIssue>;

  /** Create Merge Request / Pull Request */
  createMergeRequest(params: CreateMRParams): Promise<MergeRequestResult>;

  /** Get Merge Request / Pull Request status */
  getMergeRequestStatus(mrId: string): Promise<MRStatus>;

  /** Get list of branches */
  getBranches(): Promise<Branch[]>;

  /** Get default branch name */
  getDefaultBranch(): Promise<string>;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  permissions?: string[];
}

export interface GetIssuesOptions {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  assignee?: string;
  perPage?: number;
  page?: number;
}

export interface RemoteIssue {
  id: string;
  number: number;
  title: string;
  description: string;
  state: string;
  labels: string[];
  assignees: string[];
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMRParams {
  sourceBranch: string;
  targetBranch: string;
  title: string;
  description?: string;
}

export interface MergeRequestResult {
  id: string;
  url: string;
  state: 'open' | 'merged' | 'closed';
}

export interface MRStatus {
  id: string;
  state: 'open' | 'merged' | 'closed' | 'unknown';
  mergeCommitSha?: string;
}

export interface Branch {
  name: string;
  isDefault: boolean;
  isProtected: boolean;
}
