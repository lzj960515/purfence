import { HttpException, HttpStatus } from '@nestjs/common';

export class RemoteGitError extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class TokenExpiredError extends RemoteGitError {
  constructor(message: string = 'Access token has expired') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class PermissionDeniedError extends RemoteGitError {
  constructor(
    message: string = 'Insufficient permissions for this operation',
    public readonly requiredPermissions?: string[],
  ) {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class RepositoryNotFoundError extends RemoteGitError {
  constructor(message: string = 'Repository not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class ConnectionError extends RemoteGitError {
  constructor(message: string = 'Failed to connect to remote repository') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class RateLimitError extends RemoteGitError {
  constructor(
    message: string = 'API rate limit exceeded',
    public readonly retryAfter?: number,
  ) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
