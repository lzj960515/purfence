/**
 * State Data Types
 *
 * Type definitions for OAuth state parameter storage and validation.
 * Used to prevent CSRF attacks during OAuth flow.
 */

/**
 * State Data
 *
 * Stored information associated with OAuth state parameter.
 * Used to validate OAuth callbacks and prevent CSRF attacks.
 */
export interface StateData {
  /** Redirect URI used in authorization request */
  redirectUri: string;
  /** Timestamp when state was created (Unix timestamp in ms) */
  timestamp: number;
  /** Optional provider identifier for multi-provider support */
  provider?: string;
  /** Optional user ID for tracking user-specific OAuth flows */
  userId?: string;
  /** Optional additional metadata */
  metadata?: Record<string, any>;
}

/**
 * State Validation Result
 *
 * Result of state parameter validation
 */
export interface StateValidationResult {
  /** Whether state is valid */
  valid: boolean;
  /** Stored state data (if valid) */
  data?: StateData;
  /** Error message (if invalid) */
  error?: string;
}

/**
 * State Storage Options
 *
 * Configuration options for state storage behavior
 */
export interface StateStorageOptions {
  /** State expiry time in milliseconds (default: 10 minutes) */
  expiryMs?: number;
  /** Maximum number of states to store (default: 1000) */
  maxStates?: number;
  /** Whether to enable automatic cleanup (default: true) */
  autoCleanup?: boolean;
  /** Cleanup interval in milliseconds (default: 5 minutes) */
  cleanupIntervalMs?: number;
}
