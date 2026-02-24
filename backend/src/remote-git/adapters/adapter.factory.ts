import { Injectable, Logger } from '@nestjs/common';
import { GitAdapter } from './git-adapter.interface';
import { GitHubAdapter } from './github.adapter';
import { GitLabAdapter } from './gitlab.adapter';
import { RemoteRepositoryType } from '../entities/remote-repository.entity';

/**
 * Factory for creating GitAdapter instances based on repository type
 */
@Injectable()
export class GitAdapterFactory {
  private readonly logger = new Logger(GitAdapterFactory.name);

  /**
   * Create a GitAdapter instance based on repository type
   * @param type - Repository type (gitlab or github)
   * @param token - Access token for authentication
   * @param url - Repository URL
   * @returns GitAdapter instance
   */
  createAdapter(type: RemoteRepositoryType, token: string, url: string): GitAdapter {
    this.logger.debug(`Creating adapter for ${type} repository: ${url}`);

    // Sanitize URL for logging (remove credentials if present)
    const sanitizedUrl = this.sanitizeUrlForLogging(url);
    this.logger.debug(`Creating adapter for repository: ${sanitizedUrl}`);

    switch (type) {
      case RemoteRepositoryType.GITHUB:
        return new GitHubAdapter(token, url);

      case RemoteRepositoryType.GITLAB:
        return new GitLabAdapter(token, url);

      default:
        // Exhaustiveness check
        const _exhaustiveCheck: never = type;
        throw new Error(`Unsupported repository type: ${type}`);
    }
  }

  /**
   * Create a GitAdapter instance from repository configuration
   * @param config - Repository configuration
   * @param decryptedToken - Decrypted access token
   * @returns GitAdapter instance
   */
  createAdapterFromConfig(
    config: { type: RemoteRepositoryType; url: string },
    decryptedToken: string,
  ): GitAdapter {
    return this.createAdapter(config.type, decryptedToken, config.url);
  }

  /**
   * Sanitize URL for logging by removing credentials
   */
  private sanitizeUrlForLogging(url: string): string {
    try {
      if (url.startsWith('git@')) {
        // SSH URLs don't contain passwords in the URL itself
        return url;
      }

      const parsedUrl = new URL(url);
      // Remove username and password from URL
      parsedUrl.username = '';
      parsedUrl.password = '';
      return parsedUrl.toString();
    } catch {
      // If URL parsing fails, return a masked version
      return '[invalid-url]';
    }
  }
}
