import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import axiosRetry from 'axios-retry';
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

interface GitHubErrorResponse {
  message: string;
  documentation_url?: string;
}

/**
 * GitHub Adapter - Implements GitAdapter interface for GitHub API
 */
@Injectable()
export class GitHubAdapter implements GitAdapter {
  private readonly logger = new Logger(GitHubAdapter.name);
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;
  private readonly baseUrl: string;

  constructor(
    private readonly token: string,
    private readonly repositoryUrl: string,
  ) {
    const parsed = this.parseRepositoryUrl(repositoryUrl);
    this.owner = parsed.owner;
    this.repo = parsed.repo;
    this.baseUrl = parsed.baseUrl;

    this.octokit = new Octokit({
      auth: token,
      baseUrl: this.baseUrl,
    });

    // Setup retry logic for axios
    if (this.octokit.request) {
      axiosRetry(this.octokit.request as any, {
        retries: 3,
        retryDelay: (retryCount) => {
          const delay = Math.pow(2, retryCount) * 1000;
          this.logger.debug(`Retry ${retryCount}, waiting ${delay}ms`);
          return delay;
        },
        retryCondition: (error) => {
          // Retry on network errors or 5xx server errors
          return (
            axiosRetry.isNetworkOrIdempotentRequestError(error) ||
            (error.response?.status && error.response.status >= 500)
          );
        },
      });
    }
  }

  /**
   * Parse GitHub repository URL to extract owner and repo
   */
  private parseRepositoryUrl(url: string): {
    owner: string;
    repo: string;
    baseUrl?: string;
  } {
    try {
      // Handle HTTPS URLs: https://github.com/owner/repo
      // Handle SSH URLs: git@github.com:owner/repo.git
      // Handle GitHub Enterprise: https://github.enterprise.com/api/v3

      let owner = '';
      let repo = '';
      let baseUrl: string | undefined;

      if (url.startsWith('git@')) {
        // SSH format: git@github.com:owner/repo.git
        const match = url.match(/git@([^:]+):(.+)\.git?$/);
        if (!match) {
          throw new Error('Invalid SSH URL format');
        }
        const parts = match[2].split('/');
        owner = parts[0];
        repo = parts[1];
      } else {
        // HTTPS format
        const parsedUrl = new URL(url);
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

        if (pathParts.length < 2) {
          throw new Error('Invalid repository URL: missing owner or repo');
        }

        owner = pathParts[0];
        repo = pathParts[1].replace(/\.git$/, '');

        // Handle GitHub Enterprise
        if (
          !parsedUrl.hostname.includes('github.com') ||
          parsedUrl.hostname !== 'github.com'
        ) {
          baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/api/v3`;
        }
      }

      if (!owner || !repo) {
        throw new Error('Could not parse owner or repository name from URL');
      }

      this.logger.debug(`Parsed GitHub repo: owner=${owner}, repo=${repo}`);
      return { owner, repo, baseUrl };
    } catch (error) {
      this.logger.error('Failed to parse repository URL:', error);
      throw new ConnectionError(
        `Invalid repository URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Handle GitHub API errors and convert to domain errors
   */
  private handleError(error: unknown): never {
    if (error instanceof RemoteGitError) {
      throw error;
    }

    const err = error as {
      status?: number;
      message?: string;
      response?: {
        data?: GitHubErrorResponse;
        headers?: Record<string, string>;
      };
    };

    // Log error with sanitized info (no token)
    this.logger.error('GitHub API error:', {
      status: err.status,
      message: err.message,
      owner: this.owner,
      repo: this.repo,
    });

    // Handle rate limiting
    if (
      err.status === 403 &&
      err.response?.headers?.['x-ratelimit-remaining'] === '0'
    ) {
      const retryAfter = err.response.headers['retry-after'];
      throw new RateLimitError(
        'GitHub API rate limit exceeded',
        retryAfter ? parseInt(retryAfter, 10) : undefined,
      );
    }

    // Handle authentication errors
    if (err.status === 401) {
      throw new TokenExpiredError(
        'GitHub access token has expired or is invalid',
      );
    }

    // Handle permission errors
    if (err.status === 403) {
      throw new PermissionDeniedError(
        'Insufficient permissions for this GitHub operation',
      );
    }

    // Handle not found errors
    if (err.status === 404) {
      throw new RepositoryNotFoundError(
        `Repository ${this.owner}/${this.repo} not found`,
      );
    }

    // Handle server errors with retry
    if (err.status && err.status >= 500) {
      throw new ConnectionError(
        `GitHub server error: ${err.message || 'Unknown error'}`,
      );
    }

    // Generic error
    throw new RemoteGitError(
      err.response?.data?.message || err.message || 'GitHub API error',
      err.status || 500,
    );
  }

  /**
   * Test connection to GitHub repository
   */
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      this.logger.debug(
        `Testing connection to GitHub: ${this.owner}/${this.repo}`,
      );

      // Get repository info to verify access
      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      // Get authenticated user permissions
      const { data: permissions } =
        await this.octokit.rest.repos.getCollaboratorPermissionLevel({
          owner: this.owner,
          repo: this.repo,
          username: (await this.octokit.rest.users.getAuthenticated()).data
            .login,
        });

      const permissionList: string[] = [];
      if (repo.permissions?.admin) permissionList.push('admin');
      if (repo.permissions?.push) permissionList.push('push');
      if (repo.permissions?.pull) permissionList.push('pull');
      if (repo.permissions?.maintain) permissionList.push('maintain');
      if (repo.permissions?.triage) permissionList.push('triage');

      this.logger.log(
        `Successfully connected to GitHub: ${this.owner}/${this.repo}`,
      );

      return {
        success: true,
        permissions: permissionList,
      };
    } catch (error) {
      this.logger.error('GitHub connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get list of issues from GitHub
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

      const { data: issues } = await this.octokit.rest.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: state === 'all' ? 'all' : state,
        labels: labels?.join(','),
        assignee: assignee || undefined,
        per_page: perPage,
        page,
      });

      // Filter out pull requests (GitHub returns PRs as issues)
      const filteredIssues = issues.filter(
        (issue) => !('pull_request' in issue),
      );

      this.logger.debug(`Fetched ${filteredIssues.length} issues`);

      return filteredIssues.map((issue) =>
        this.mapGitHubIssueToRemoteIssue(
          issue as unknown as {
            id: number;
            number: number;
            title: string;
            body?: string | null;
            state: string;
            labels: (string | { name?: string })[];
            assignees: { login?: string }[];
            html_url: string;
            created_at: string;
            updated_at: string;
          },
        ),
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get a single issue by number
   */
  async getIssue(issueId: string): Promise<RemoteIssue> {
    try {
      this.logger.debug(`Fetching issue: ${issueId}`);

      const issueNumber = parseInt(issueId, 10);
      if (isNaN(issueNumber)) {
        throw new RemoteGitError('Invalid issue ID: must be a number');
      }

      const { data: issue } = await this.octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });

      return this.mapGitHubIssueToRemoteIssue(
        issue as unknown as {
          id: number;
          number: number;
          title: string;
          body?: string | null;
          state: string;
          labels: (string | { name?: string })[];
          assignees: { login?: string }[];
          html_url: string;
          created_at: string;
          updated_at: string;
        },
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a Pull Request
   */
  async createMergeRequest(
    params: CreateMRParams,
  ): Promise<MergeRequestResult> {
    try {
      this.logger.debug(
        `Creating PR: ${params.sourceBranch} → ${params.targetBranch}`,
      );

      const { data: pr } = await this.octokit.rest.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: params.title,
        body: params.description,
        head: params.sourceBranch,
        base: params.targetBranch,
      });

      this.logger.log(`Created PR #${pr.number}: ${pr.html_url}`);

      return {
        id: pr.number.toString(),
        url: pr.html_url,
        state: pr.state as 'open' | 'merged' | 'closed',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get Pull Request status
   */
  async getMergeRequestStatus(mrId: string): Promise<MRStatus> {
    try {
      this.logger.debug(`Fetching PR status: ${mrId}`);

      const prNumber = parseInt(mrId, 10);
      if (isNaN(prNumber)) {
        throw new RemoteGitError('Invalid PR ID: must be a number');
      }

      const { data: pr } = await this.octokit.rest.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
      });

      let state: 'open' | 'merged' | 'closed' | 'unknown' = pr.state;

      // Check if PR is merged
      if (pr.merged) {
        state = 'merged';
      }

      return {
        id: pr.number.toString(),
        state,
        mergeCommitSha: pr.merge_commit_sha || undefined,
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

      const { data: branches } = await this.octokit.rest.repos.listBranches({
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
      });

      // Get default branch
      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      const defaultBranch = repo.default_branch;

      // Get branch protection rules (this requires admin access, so we catch errors)
      const protectedBranches = new Set<string>();
      try {
        const { data: protectionRules } =
          await this.octokit.rest.repos.listBranches({
            owner: this.owner,
            repo: this.repo,
            protected: true,
          });
        protectionRules.forEach((b) => protectedBranches.add(b.name));
      } catch {
        // If we can't get protection rules, assume no branches are protected
        this.logger.debug('Could not fetch branch protection rules');
      }

      return branches.map((branch) => ({
        name: branch.name,
        isDefault: branch.name === defaultBranch,
        isProtected: protectedBranches.has(branch.name),
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

      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      return repo.default_branch;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Map GitHub issue to RemoteIssue
   */
  private mapGitHubIssueToRemoteIssue(githubIssue: {
    id: number;
    number: number;
    title: string;
    body?: string | null;
    state: string;
    labels: (string | { name?: string })[];
    assignees: { login?: string }[];
    html_url: string;
    created_at: string;
    updated_at: string;
  }): RemoteIssue {
    return {
      id: githubIssue.id.toString(),
      number: githubIssue.number,
      title: githubIssue.title,
      description: githubIssue.body || '',
      state: githubIssue.state,
      labels: githubIssue.labels
        .map((label) => (typeof label === 'string' ? label : label.name || ''))
        .filter(Boolean),
      assignees: githubIssue.assignees
        .map((a) => a.login || '')
        .filter(Boolean),
      url: githubIssue.html_url,
      createdAt: new Date(githubIssue.created_at),
      updatedAt: new Date(githubIssue.updated_at),
    };
  }
}
