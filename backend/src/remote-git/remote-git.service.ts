import { CryptoUtil } from '@app/shared';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RemoteRepositoryConfig,
  RemoteRepositoryStatus,
  RemoteRepositoryType,
} from './entities/remote-repository.entity';
import {
  RemoteRepositoryConfigInput,
  UpdateRemoteRepositoryInput,
} from './dto/remote-repository.input';
import {
  RemoteGitError,
  TokenExpiredError,
  ConnectionError,
} from './errors/remote-git.error';
import { GitAdapterFactory } from './adapters/adapter.factory';
import {
  GitAdapter,
  ConnectionTestResult,
  RemoteIssue,
} from './adapters/git-adapter.interface';
import { RemoteIssueDto } from './dto/remote-issue.dto';
import {
  PurfenceIssue,
  RemoteIssueData,
} from '../purfence/purfence-issue.entity';
import { generateBranchSuffix } from './utils/branch-suffix.util';
import { IssueOrigin, PurfenceStatus } from '../purfence/purfence-status.enum';

@Injectable()
export class RemoteGitService {
  private readonly logger = new Logger(RemoteGitService.name);
  private readonly crypto: CryptoUtil;

  constructor(
    @InjectRepository(RemoteRepositoryConfig)
    private readonly remoteRepositoryRepository: Repository<RemoteRepositoryConfig>,
    private readonly configService: ConfigService,
    private readonly adapterFactory: GitAdapterFactory,
  ) {
    const encryptionKey = this.configService.get<string>(
      'REMOTE_GIT_ENCRYPTION_KEY',
    );
    if (!encryptionKey) {
      this.logger.warn('REMOTE_GIT_ENCRYPTION_KEY not set, using default key');
    }
    // Use AES-256-CBC with 32-byte key
    const key = Buffer.from(
      (encryptionKey || 'default-encryption-key-32-bytes!')
        .padEnd(32, '0')
        .slice(0, 32),
    );
    const iv = Buffer.alloc(16, 0); // Use zero IV for simplicity, consider using random IV in production
    this.crypto = new CryptoUtil('aes-256-cbc', key, iv);
  }

  /**
   * Encrypt token using AES-256
   */
  encryptToken(token: string): string {
    try {
      return this.crypto.encrypt(token);
    } catch (error) {
      this.logger.error('Failed to encrypt token:', error);
      throw new RemoteGitError('Failed to encrypt token');
    }
  }

  /**
   * Decrypt token using AES-256
   */
  decryptToken(encryptedToken: string): string {
    try {
      return this.crypto.decrypt(encryptedToken);
    } catch (error) {
      this.logger.error('Failed to decrypt token:', error);
      throw new RemoteGitError('Failed to decrypt token');
    }
  }

  /**
   * Get remote repository config by project ID
   */
  async findByProjectId(
    projectId: string,
  ): Promise<RemoteRepositoryConfig | null> {
    return this.remoteRepositoryRepository.findOne({
      where: { projectId },
    });
  }

  /**
   * Get remote repository config with decrypted token
   */
  async getConfigWithDecryptedToken(
    projectId: string,
  ): Promise<{ config: RemoteRepositoryConfig; token: string } | null> {
    const config = await this.findByProjectId(projectId);
    if (!config) {
      return null;
    }

    const token = this.decryptToken(config.encryptedToken);
    return { config, token };
  }

  /**
   * Configure remote repository for a project
   */
  async configure(
    projectId: string,
    input: RemoteRepositoryConfigInput,
  ): Promise<RemoteRepositoryConfig> {
    // Validate URL format
    this.validateUrl(input.url, input.type);

    // Encrypt token
    const encryptedToken = this.encryptToken(input.token);

    let config = await this.findByProjectId(projectId);

    if (config) {
      // Update existing config
      config.type = input.type;
      config.url = input.url;
      config.encryptedToken = encryptedToken;
      if (input.defaultBranch) {
        config.defaultBranch = input.defaultBranch;
      }
      config.status = RemoteRepositoryStatus.CONNECTED;
      config.errorMessage = undefined;
      this.logger.log(
        `Updated remote repository config for project ${projectId}`,
      );
    } else {
      // Create new config
      config = this.remoteRepositoryRepository.create({
        projectId,
        type: input.type,
        url: input.url,
        encryptedToken,
        defaultBranch: input.defaultBranch || 'main',
        status: RemoteRepositoryStatus.CONNECTED,
      });
      this.logger.log(
        `Created remote repository config for project ${projectId}`,
      );
    }

    return this.remoteRepositoryRepository.save(config);
  }

  /**
   * Update remote repository config
   */
  async update(
    projectId: string,
    input: UpdateRemoteRepositoryInput,
  ): Promise<RemoteRepositoryConfig> {
    const config = await this.findByProjectId(projectId);

    if (!config) {
      throw new NotFoundException(
        `Remote repository config not found for project ${projectId}`,
      );
    }

    // Validate URL if provided
    if (input.url) {
      this.validateUrl(input.url, input.type || config.type);
    }

    // Update fields
    if (input.type) config.type = input.type;
    if (input.url) config.url = input.url;
    if (input.token) {
      config.encryptedToken = this.encryptToken(input.token);
    }
    if (input.defaultBranch) config.defaultBranch = input.defaultBranch;

    this.logger.log(
      `Updated remote repository config for project ${projectId}`,
    );
    return this.remoteRepositoryRepository.save(config);
  }

  /**
   * Delete remote repository config
   */
  async delete(projectId: string): Promise<boolean> {
    const result = await this.remoteRepositoryRepository.delete({ projectId });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Test connection to remote repository with provided credentials
   * This method is used for initial configuration testing before saving
   */
  async testConnection(
    type: RemoteRepositoryType,
    url: string,
    token: string,
  ): Promise<ConnectionTestResult> {
    try {
      this.validateUrl(url, type);

      this.logger.log(`Testing connection to ${type} repository: ${url}`);

      // Create a temporary adapter for testing
      const adapter = this.adapterFactory.createAdapter(type, token, url);
      const result = await adapter.testConnection();

      return result;
    } catch (error) {
      this.logger.error('Connection test failed:', error);

      // Handle specific error types
      if (error instanceof TokenExpiredError) {
        return {
          success: false,
          error: 'Access token has expired or is invalid',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update repository status
   */
  async updateStatus(
    projectId: string,
    status: RemoteRepositoryStatus,
    errorMessage?: string,
  ): Promise<RemoteRepositoryConfig> {
    const config = await this.findByProjectId(projectId);

    if (!config) {
      throw new NotFoundException(
        `Remote repository config not found for project ${projectId}`,
      );
    }

    config.status = status;
    config.errorMessage = errorMessage;

    if (status === RemoteRepositoryStatus.CONNECTED) {
      config.lastSyncedAt = new Date();
    }

    return this.remoteRepositoryRepository.save(config);
  }

  /**
   * Mark token as expired
   */
  async markTokenExpired(projectId: string): Promise<void> {
    await this.updateStatus(
      projectId,
      RemoteRepositoryStatus.EXPIRED,
      'Access token has expired',
    );
  }

  /**
   * Check if project has remote repository configured
   */
  async hasRemoteRepository(projectId: string): Promise<boolean> {
    const count = await this.remoteRepositoryRepository.count({
      where: { projectId },
    });
    return count > 0;
  }

  /**
   * Get GitAdapter for a project
   * @param projectId - Project ID
   * @returns GitAdapter instance
   * @throws NotFoundException if remote repository is not configured
   */
  async getAdapter(projectId: string): Promise<GitAdapter> {
    const configWithToken = await this.getConfigWithDecryptedToken(projectId);

    if (!configWithToken) {
      throw new NotFoundException(
        `Remote repository not configured for project ${projectId}`,
      );
    }

    const { config, token } = configWithToken;

    return this.adapterFactory.createAdapter(config.type, token, config.url);
  }

  /**
   * Test connection to remote repository for a project
   * @param projectId - Project ID
   * @returns Connection test result
   */
  async testConnectionForProject(
    projectId: string,
  ): Promise<ConnectionTestResult> {
    try {
      const adapter = await this.getAdapter(projectId);
      const result = await adapter.testConnection();

      // Update status based on result
      if (result.success) {
        await this.updateStatus(projectId, RemoteRepositoryStatus.CONNECTED);
      } else {
        await this.updateStatus(
          projectId,
          RemoteRepositoryStatus.ERROR,
          result.error,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Connection test failed for project ${projectId}:`,
        error,
      );

      // Handle specific error types
      if (error instanceof TokenExpiredError) {
        await this.markTokenExpired(projectId);
        return {
          success: false,
          error: 'Access token has expired. Please update your credentials.',
        };
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.updateStatus(
        projectId,
        RemoteRepositoryStatus.ERROR,
        errorMessage,
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate repository URL format
   */
  private validateUrl(url: string, type: RemoteRepositoryType): void {
    try {
      const parsedUrl = new URL(url);

      if (type === RemoteRepositoryType.GITHUB) {
        if (!parsedUrl.hostname.includes('github.com')) {
          throw new BadRequestException(
            'Invalid GitHub URL. Expected hostname to contain github.com',
          );
        }
      } else if (type === RemoteRepositoryType.GITLAB) {
        // GitLab can be self-hosted, so we just check it's a valid URL
        if (!parsedUrl.protocol.match(/^https?:$/)) {
          throw new BadRequestException(
            'Invalid GitLab URL. Expected HTTP or HTTPS protocol',
          );
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid repository URL');
    }
  }

  /**
   * Sync remote issues from the configured remote repository
   * @param projectId - Project ID
   * @returns Array of remote issues
   */
  async syncRemoteIssues(projectId: string): Promise<RemoteIssueDto[]> {
    this.logger.log(`Syncing remote issues for project ${projectId}`);

    // 1. Get adapter for the project
    const adapter = await this.getAdapter(projectId);

    // 2. Fetch issues from remote
    const remoteIssues = await adapter.getIssues({ state: 'open' });

    // 3. Convert to DTOs
    const issueDtos = remoteIssues.map((issue) =>
      this.mapToRemoteIssueDto(issue),
    );

    // 4. Update last synced timestamp
    await this.updateStatus(projectId, RemoteRepositoryStatus.CONNECTED);

    this.logger.log(
      `Synced ${issueDtos.length} remote issues for project ${projectId}`,
    );
    return issueDtos;
  }

  /**
   * Import a remote issue into Purfence
   * @param projectId - Project ID
   * @param remoteIssueId - Remote issue ID
   * @returns Created Purfence issue
   * @throws NotFoundException if remote issue not found
   * @throws BadRequestException if issue already imported
   */
  async importRemoteIssue(
    projectId: string,
    remoteIssueId: string,
  ): Promise<PurfenceIssue> {
    this.logger.log(
      `Importing remote issue ${remoteIssueId} for project ${projectId}`,
    );

    // 1. Check if already imported
    const existingIssue = await PurfenceIssue.findOne({
      where: {
        projectId,
        origin: IssueOrigin.remote,
      },
    });

    if (existingIssue?.remoteIssueData?.remoteIssueId === remoteIssueId) {
      throw new BadRequestException(
        `Remote issue ${remoteIssueId} has already been imported for this project`,
      );
    }

    // 2. Get adapter and fetch remote issue
    const adapter = await this.getAdapter(projectId);
    const remoteIssue = await adapter.getIssue(remoteIssueId);

    if (!remoteIssue) {
      throw new NotFoundException(`Remote issue ${remoteIssueId} not found`);
    }

    // 3. Generate branch suffix
    const branchSuffix = generateBranchSuffix();

    // 4. Create remote issue data
    const remoteIssueData: RemoteIssueData = {
      remoteIssueId: remoteIssue.id,
      remoteIssueNumber: remoteIssue.number,
      remoteUrl: remoteIssue.url,
      remoteState: remoteIssue.state,
      lastSyncedAt: new Date(),
      syncedData: {
        title: remoteIssue.title,
        description: remoteIssue.description,
        labels: remoteIssue.labels,
        assignees: remoteIssue.assignees,
      },
    };

    // 5. Create Purfence issue
    const issue = PurfenceIssue.create({
      projectId,
      title: remoteIssue.title,
      description: remoteIssue.description || '',
      slug: `issue-${remoteIssue.number}`,
      status: PurfenceStatus.open,
      origin: IssueOrigin.remote,
      branchSuffix,
      remoteIssueData,
    });

    await issue.save();

    this.logger.log(
      `Imported remote issue ${remoteIssueId} as Purfence issue ${issue.id}`,
    );
    return issue;
  }

  /**
   * Get imported remote issues for a project
   * @param projectId - Project ID
   * @returns Array of imported Purfence issues
   */
  async getImportedRemoteIssues(projectId: string): Promise<PurfenceIssue[]> {
    return PurfenceIssue.find({
      where: {
        projectId,
        origin: IssueOrigin.remote,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Map RemoteIssue to RemoteIssueDto
   */
  private mapToRemoteIssueDto(issue: RemoteIssue): RemoteIssueDto {
    return {
      remoteIssueId: issue.id,
      remoteIssueNumber: issue.number,
      title: issue.title,
      description: issue.description,
      state: issue.state,
      labels: issue.labels,
      assignees: issue.assignees,
      remoteUrl: issue.url,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  }
}
