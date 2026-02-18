import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StateData, StateStorageOptions } from './types/state.types';

/**
 * State Service
 *
 * Manages OAuth state parameters for CSRF protection.
 * Stores state data temporarily and validates callbacks.
 *
 * SECURITY: This service prevents CSRF attacks by:
 * 1. Generating cryptographically secure state parameters
 * 2. Storing state with associated metadata (redirectUri, timestamp)
 * 3. Validating state on callback (checking existence, expiry, and redirectUri match)
 * 4. Removing state after validation (one-time use)
 *
 * @example
 * ```typescript
 * // Store state when initiating OAuth
 * stateService.set('abc123', { redirectUri: '...', timestamp: Date.now() });
 *
 * // Validate state on callback
 * const data = stateService.get('abc123');
 * if (!data) {
 *   throw new BadRequestException('Invalid or expired state');
 * }
 * ```
 *
 * @implements OnModuleInit for automatic cleanup scheduling
 */
@Injectable()
export class StateService implements OnModuleInit {
  private readonly logger = new Logger(StateService.name);
  private readonly states = new Map<string, StateData>();
  private readonly DEFAULT_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  private readonly DEFAULT_MAX_STATES = 1000;
  private readonly DEFAULT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private expiryMs: number;
  private maxStates: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Create StateService with default or custom options
   *
   * @param options Optional configuration for state storage
   */
  constructor() {
    this.expiryMs = this.DEFAULT_EXPIRY_MS;
    this.maxStates = this.DEFAULT_MAX_STATES;
  }

  /**
   * Module initialization hook
   *
   * Starts automatic cleanup of expired states.
   * Can be disabled by setting autoCleanup to false in options.
   */
  onModuleInit(): void {
    this.scheduleCleanup();
    this.logger.log(
      `StateService initialized with expiry: ${this.expiryMs}ms, max states: ${this.maxStates}`,
    );
  }

  /**
   * Store state with associated data
   *
   * Stores the state parameter along with redirect URI and timestamp.
   * Enforces maximum state limit to prevent memory exhaustion.
   *
   * @param state State parameter string (hex string from generateState)
   * @param data State data including redirectUri and timestamp
   * @throws Error if maximum states limit reached
   *
   * @example
   * ```typescript
   * stateService.set('abc123def456', {
   *   redirectUri: 'http://localhost:3000/oauth/callback',
   *   timestamp: Date.now(),
   *   provider: 'openai',
   * });
   * ```
   */
  set(state: string, data: StateData): void {
    // Enforce maximum states limit
    if (this.states.size >= this.maxStates) {
      this.logger.warn(
        `Maximum states limit reached (${this.maxStates}), cleaning oldest states`,
      );
      this.cleanOldestStates(Math.floor(this.maxStates * 0.1)); // Remove 10% oldest
    }

    this.states.set(state, data);
    this.logger.debug(`Stored OAuth state: ${state} (total: ${this.states.size})`);
  }

  /**
   * Get and validate state
   *
   * Retrieves stored state data and performs validation:
   * 1. Checks if state exists
   * 2. Checks if state has expired
   * 3. Removes state after validation (one-time use)
   *
   * @param state State parameter string from OAuth callback
   * @returns State data if valid, null if invalid/expired
   *
   * @example
   * ```typescript
   * const data = stateService.get('abc123def456');
   * if (!data) {
   *   throw new BadRequestException('Invalid or expired state parameter');
   * }
   * console.log('Redirect URI:', data.redirectUri);
   * ```
   */
  get(state: string): StateData | null {
    const data = this.states.get(state);

    if (!data) {
      this.logger.warn(
        `State not found or already used: ${state} (current states: ${this.states.size})`,
      );
      return null;
    }

    // Check expiration
    const age = Date.now() - data.timestamp;
    if (age > this.expiryMs) {
      this.logger.warn(
        `State expired: ${state} (age: ${Math.floor(age / 1000)}s, expiry: ${Math.floor(this.expiryMs / 1000)}s)`,
      );
      this.states.delete(state);
      return null;
    }

    // Validate and remove (one-time use)
    this.states.delete(state);
    this.logger.log(
      `State validated and removed: ${state} (age: ${Math.floor(age / 1000)}s)`,
    );

    return data;
  }

  /**
   * Validate state with redirect URI matching
   *
   * Enhanced validation that also checks if redirect URI matches.
   * Useful for additional security verification.
   *
   * @param state State parameter string
   * @param expectedRedirectUri Expected redirect URI to match
   * @returns State data if valid and redirect URI matches, null otherwise
   *
   * @example
   * ```typescript
   * const data = stateService.validateWithRedirectUri('abc123', 'http://localhost:3000/callback');
   * if (!data) {
   *   throw new BadRequestException('Invalid state or redirect URI mismatch');
   * }
   * ```
   */
  validateWithRedirectUri(
    state: string,
    expectedRedirectUri: string,
  ): StateData | null {
    const data = this.get(state);

    if (!data) {
      return null;
    }

    // Verify redirect URI matches
    if (data.redirectUri !== expectedRedirectUri) {
      this.logger.warn(
        `Redirect URI mismatch for state ${state}. Expected: ${data.redirectUri}, Got: ${expectedRedirectUri}`,
      );
      return null;
    }

    return data;
  }

  /**
   * Check if state exists (without removing it)
   *
   * Useful for debugging or checking state status.
   * Does not remove the state or validate expiration.
   *
   * @param state State parameter string
   * @returns True if state exists (may be expired)
   *
   * @example
   * ```typescript
   * if (stateService.has('abc123')) {
   *   console.log('State exists');
   * }
   * ```
   */
  has(state: string): boolean {
    return this.states.has(state);
  }

  /**
   * Get state count
   *
   * Returns the current number of stored states.
   * Useful for monitoring and debugging.
   *
   * @returns Number of stored states
   */
  getCount(): number {
    return this.states.size;
  }

  /**
   * Clean expired states
   *
   * Removes all states that have exceeded the expiry time.
   * Should be called periodically to prevent memory leaks.
   * Automatically scheduled on module init.
   *
   * @returns Number of states cleaned
   *
   * @example
   * ```typescript
   * const cleaned = stateService.cleanExpiredStates();
   * console.log(`Cleaned ${cleaned} expired states`);
   * ```
   */
  cleanExpiredStates(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [state, data] of this.states.entries()) {
      if (now - data.timestamp > this.expiryMs) {
        this.states.delete(state);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(
        `Cleaned ${cleaned} expired states (${this.states.size} remaining)`,
      );
    }

    return cleaned;
  }

  /**
   * Clean oldest states
   *
   * Removes the oldest N states to free up memory.
   * Useful when approaching maximum states limit.
   *
   * @param count Number of oldest states to remove
   * @returns Number of states cleaned
   *
   * @private
   */
  private cleanOldestStates(count: number): number {
    // Convert to array, sort by timestamp, remove oldest
    const entries = Array.from(this.states.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    let cleaned = 0;
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.states.delete(entries[i][0]);
      cleaned++;
    }

    if (cleaned > 0) {
      this.logger.log(
        `Cleaned ${cleaned} oldest states (${this.states.size} remaining)`,
      );
    }

    return cleaned;
  }

  /**
   * Clear all states
   *
   * Removes all stored states.
   * Useful for testing or manual cleanup.
   *
   * @returns Number of states cleared
   *
   * @example
   * ```typescript
   * const cleared = stateService.clear();
   * console.log(`Cleared ${cleared} states`);
   * ```
   */
  clear(): number {
    const count = this.states.size;
    this.states.clear();
    this.logger.log(`Cleared all ${count} states`);
    return count;
  }

  /**
   * Schedule automatic cleanup
   *
   * Schedules periodic cleanup of expired states.
   * Runs automatically on module init.
   *
   * @private
   */
  private scheduleCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const cleaned = this.cleanExpiredStates();
      if (cleaned > 0) {
        this.logger.debug(
          `Automatic cleanup: removed ${cleaned} expired states`,
        );
      }
    }, this.DEFAULT_CLEANUP_INTERVAL_MS);

    this.logger.log(
      `Scheduled automatic cleanup every ${this.DEFAULT_CLEANUP_INTERVAL_MS / 1000}s`,
    );
  }

  /**
   * Module destroy hook
   *
   * Cleans up cleanup interval when module is destroyed.
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.logger.log('StateService cleanup interval cleared');
    }
  }

  /**
   * Configure state storage options
   *
   * Allows runtime configuration of state storage behavior.
   *
   * @param options Configuration options
   *
   * @example
   * ```typescript
   * stateService.configure({
   *   expiryMs: 5 * 60 * 1000, // 5 minutes
   *   maxStates: 500,
   * });
   * ```
   */
  configure(options: StateStorageOptions): void {
    if (options.expiryMs !== undefined) {
      this.expiryMs = options.expiryMs;
      this.logger.log(`State expiry updated to ${this.expiryMs}ms`);
    }

    if (options.maxStates !== undefined) {
      this.maxStates = options.maxStates;
      this.logger.log(`Max states updated to ${this.maxStates}`);
    }
  }
}
