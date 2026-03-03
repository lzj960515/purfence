import { Injectable, Logger } from '@nestjs/common';
import { Gitlab } from '@gitbeaker/rest';
import axiosRetry from 'axios-retry';
import type { Gitlab as GitbeakerClient } from '@gitbeaker/rest';
import type { Camelize } from '@gitbeaker/core';
import {
  GitAdapter,
  ConnectionTestResult,
  GetIssuesOptions,
  RemoteIssue,
  CreateMRParams,
  MergeRequestResult,
  MRStatus,
  Branch,
} from './git-adapter.interface';
import {
  RemoteGitError,
  TokenExpiredError,
  PermissionDeniedError,
  RateLimitError,
  RepositoryNotFoundError,
  ConnectionError,
} from '../errors/remote-git.error';

interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description: string | null;
  state: string;
  labels: string[];
  assignees?: { username?: string }[];
  web_url: string;
  created_at: string;
  updated_at: string;
}

interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  state: string;
  web_url: string;
  source_branch: string;
  target_branch: string;
  merge_commit_sha?: string;
}

interface GitLabBranch {
  name: string;
  default: boolean;
  protected: boolean;
}

// Define permission types for GitLab
type GitLabPermissions = {
  project_access?: { access_level: number; notification_level: number };
  group_access?: { access_level: number; notification_level: number };
};

/**
 * GitLab Adapter - Implements GitAdapter interface for GitLab API
 */
@Injectable()
export class GitLabAdapter implements GitAdapter {
  private readonly logger = new Logger(GitLabAdapter.name);
  private readonly client: InstanceType<typeof GitbeakerClient>;
  private readonly projectId: string | number;
  private readonly baseUrl?: string;

  constructor(
    private readonly token: string,
    private readonly repositoryUrl: string,
  ) {
    const parsed = this.parseRepositoryUrl(repositoryUrl);
    this.projectId = parsed.projectId;
    this.baseUrl = parsed.baseUrl;

    this.client = new Gitlab({
      token,
      host: this.baseUrl,
    });

    // Note: Gitbeaker uses its own HTTP client, retry logic is handled in methods
  }

  /**
   * Parse GitLab repository URL to extract project ID or path
   */
  private parseRepositoryUrl(url: string): {
    projectId: string | number;
    baseUrl?: string;
  } {
    try {
      // Handle HTTPS URLs: https://gitlab.com/namespace/project
      // Handle SSH URLs: git@gitlab.com:namespace/project.git
      // Handle self-hosted: https://gitlab.company.com/namespace/project

      let projectPath = '';
      let baseUrl: string | undefined;

      if (url.startsWith('git@')) {
        // SSH format: git@gitlab.com:namespace/project.git
        const match = url.match(/git@([^:]+):(.+)\.git?$/);
        if (!match) {
          throw new Error('Invalid SSH URL format');
        }
        baseUrl = `https://${match[1]}`;
        projectPath = match[2];
      } else {
        // HTTPS format
        const parsedUrl = new URL(url);
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

        if (pathParts.length < 2) {
          throw new Error(
            'Invalid repository URL: missing namespace or project',
          );
        }

        // For GitLab, we need the full path (namespace/project)
        projectPath = pathParts.join('/').replace(/\.git$/, '');

        // Handle self-hosted GitLab
        if (parsedUrl.hostname !== 'gitlab.com') {
          baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
        }
      }

      if (!projectPath) {
        throw new Error('Could not parse project path from URL');
      }

      this.logger.debug(
        `Parsed GitLab project: ${projectPath}, baseUrl: ${baseUrl || 'gitlab.com'}`,
      );

      // Try to parse as numeric ID, otherwise use as path
      const numericId = parseInt(projectPath, 10);
      return {
        projectId: isNaN(numericId) ? projectPath : numericId,
        baseUrl,
      };
    } catch (error) {
      this.logger.error('Failed to parse repository URL:', error);
      throw new ConnectionError(
        `Invalid repository URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Execute API call with retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    const maxRetries = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on auth errors or not found
        const status = (error as { response?: { status?: number } }).response
          ?.status;
        if (status === 401 || status === 403 || status === 404) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.debug(
            `${operationName} failed (attempt ${attempt}), retrying in ${delay}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Handle GitLab API errors and convert to domain errors
   */
  private handleError(error: unknown): never {
    if (error instanceof RemoteGitError) {
      throw error;
    }

    const err = error as {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
      cause?: { description?: string };
    };

    const status = err.response?.status;
    const message =
      err.response?.data?.message ||
      err.cause?.description ||
      err.message ||
      'Unknown error';

    // Log error with sanitized info (no token)
    this.logger.error('GitLab API error:', {
      status,
      message,
      projectId: this.projectId,
    });

    // Handle rate limiting
    if (status === 429) {
      throw new RateLimitError('GitLab API rate limit exceeded');
    }

    // Handle authentication errors
    if (status === 401) {
      throw new TokenExpiredError(
        'GitLab access token has expired or is invalid',
      );
    }

    // Handle permission errors
    if (status === 403) {
      throw new PermissionDeniedError(
        'Insufficient permissions for this GitLab operation',
      );
    }

    // Handle not found errors
    if (status === 404) {
      throw new RepositoryNotFoundError(`Project ${this.projectId} not found`);
    }

    // Handle server errors
    if (status && status >= 500) {
      throw new ConnectionError(`GitLab server error: ${message}`);
    }

    // Generic error
    throw new RemoteGitError(message, status || 500);
  }

  /**
   * Test connection to GitLab repository
   */
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      this.logger.debug(`Testing connection to GitLab: ${this.projectId}`);

      // Get project info to verify access
      const project = await this.withRetry(
        () => this.client.Projects.show(this.projectId),
        'testConnection',
      );

      // Determine permissions based on access level
      const permissions: string[] = [];
      const projectPermissions = project.permissions as
        | GitLabPermissions
        | undefined;
      if (projectPermissions?.project_access) {
        const accessLevel = projectPermissions.project_access.access_level;
        if (accessLevel >= 40) {
          permissions.push('maintainer');
        } else if (accessLevel >= 30) {
          permissions.push('developer');
        } else if (accessLevel >= 20) {
          permissions.push('reporter');
        } else if (accessLevel >= 10) {
          permissions.push('guest');
        }
      }

      this.logger.log(`Successfully connected to GitLab: ${this.projectId}`);

      return {
        success: true,
        permissions,
      };
    } catch (error) {
      this.logger.error('GitLab connection test failed:', error);

      try {
        this.handleError(error);
      } catch (domainError) {
        if (domainError instanceof RemoteGitError) {
          return {
            success: false,
            error: domainError.message,
          };
        }
        throw domainError;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get list of issues from GitLab
   */
  async getIssues(options: GetIssuesOptions = {}): Promise<RemoteIssue[]> {
    try {
      const {
        state = 'open',
        labels,
        assignee,
        perPage = 30,
        page = 1,
      } = options;

      this.logger.debug(
        `Fetching issues: state=${state}, page=${page}, perPage=${perPage}`,
      );

      const issues = await this.withRetry(
        () =>
          this.client.Issues.all({
            projectId: String(this.projectId),
            state: state === 'all' ? undefined : state,
            labels: labels?.join(','),
            assigneeId: assignee ? undefined : undefined, // GitLab uses ID, would need lookup
            perPage,
            page,
          }),
        'getIssues',
      );

      this.logger.debug(`Fetched ${issues.length} issues`);

      return issues.map((issue) =>
        this.mapGitLabIssueToRemoteIssue(issue as GitLabIssue),
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get a single issue by IID
   */
  async getIssue(issueId: string): Promise<RemoteIssue> {
    try {
      this.logger.debug(`Fetching issue: ${issueId}`);

      const issueIid = parseInt(issueId, 10);
      if (isNaN(issueIid)) {
        throw new RemoteGitError('Invalid issue ID: must be a number');
      }

      const issue = await this.withRetry(
        () => this.client.Issues.show(issueIid, { projectId: this.projectId }),
        'getIssue',
      );

      return this.mapGitLabIssueToRemoteIssue(issue as GitLabIssue);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a Merge Request
   */
  async createMergeRequest(
    params: CreateMRParams,
  ): Promise<MergeRequestResult> {
    try {
      this.logger.debug(
        `Creating MR: ${params.sourceBranch} → ${params.targetBranch}`,
      );

      const mr = await this.withRetry(
        () =>
          this.client.MergeRequests.create(
            this.projectId,
            params.sourceBranch,
            params.targetBranch,
            params.title,
            {
              description: params.description,
            },
          ),
        'createMergeRequest',
      );

      const gitlabMR = mr as GitLabMergeRequest;
      this.logger.log(`Created MR !${gitlabMR.iid}: ${gitlabMR.web_url}`);

      return {
        id: gitlabMR.iid.toString(),
        url: gitlabMR.web_url,
        state: this.mapGitLabMRState(gitlabMR.state),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get Merge Request status
   */
  async getMergeRequestStatus(mrId: string): Promise<MRStatus> {
    try {
      this.logger.debug(`Fetching MR status: ${mrId}`);

      const mrIid = parseInt(mrId, 10);
      if (isNaN(mrIid)) {
        throw new RemoteGitError('Invalid MR ID: must be a number');
      }

      const mr = await this.withRetry(
        () => this.client.MergeRequests.show(this.projectId, mrIid),
        'getMergeRequestStatus',
      );

      const gitlabMR = mr as GitLabMergeRequest;

      return {
        id: gitlabMR.iid.toString(),
        state: this.mapGitLabMRState(gitlabMR.state),
        mergeCommitSha: gitlabMR.merge_commit_sha,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get list of branches
   */
  async getBranches(): Promise<Branch[]> {
    try {
      this.logger.debug('Fetching branches');

      const branches = await this.withRetry(
        () =>
          this.client.Branches.all(this.projectId, {
            perPage: 100,
          }),
        'getBranches',
      );

      // Get default branch
      const project = await this.withRetry(
        () => this.client.Projects.show(this.projectId),
        'getProject',
      );
      const defaultBranch = project.default_branch;

      return branches.map((branch) => ({
        name: (branch as GitLabBranch).name,
        isDefault: (branch as GitLabBranch).name === defaultBranch,
        isProtected: (branch as GitLabBranch).protected,
      }));
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get default branch name
   */
  async getDefaultBranch(): Promise<string> {
    try {
      this.logger.debug('Fetching default branch');

      const project = await this.withRetry(
        () => this.client.Projects.show(this.projectId),
        'getDefaultBranch',
      );

      // Handle both snake_case and camelCase responses
      const defaultBranch =
        (
          project as unknown as {
            default_branch?: string;
            defaultBranch?: string;
          }
        ).default_branch ||
        (
          project as unknown as {
            default_branch?: string;
            defaultBranch?: string;
          }
        ).defaultBranch ||
        'main';
      return defaultBranch;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Map GitLab MR state to our MRState
   */
  private mapGitLabMRState(state: string): 'open' | 'merged' | 'closed' {
    switch (state) {
      case 'opened':
      case 'open':
        return 'open';
      case 'merged':
        return 'merged';
      case 'closed':
        return 'closed';
      default:
        return 'closed';
    }
  }

  /**
   * Map GitLab issue to RemoteIssue
   */
  private mapGitLabIssueToRemoteIssue(gitlabIssue: GitLabIssue): RemoteIssue {
    return {
      id: gitlabIssue.id.toString(),
      number: gitlabIssue.iid,
      title: gitlabIssue.title,
      description: gitlabIssue.description || '',
      state: gitlabIssue.state,
      labels: gitlabIssue.labels || [],
      assignees: (gitlabIssue.assignees || [])
        .map((a) => a.username || '')
        .filter(Boolean),
      url: gitlabIssue.web_url,
      createdAt: new Date(gitlabIssue.created_at),
      updatedAt: new Date(gitlabIssue.updated_at),
    };
  }
}
