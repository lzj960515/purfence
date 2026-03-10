/**
 * OAuth Type Definitions
 *
 * Defines types for OpenAI Codex OAuth authorization flow.
 * Based on OpenAI's Auth0 OAuth 2.0 implementation.
 */

/**
 * Token response from OAuth token endpoint
 */
export interface TokenResponse {
  /** Bearer access token for API calls */
  access_token: string;
  /** Refresh token for obtaining new access tokens */
  refresh_token: string;
  /** Unix timestamp when token expires */
  expires_at: number;
  /** Token type (always Bearer for OAuth 2.0) */
  token_type: 'Bearer';
  /** Optional ID token (JWT) containing user claims */
  id_token?: string;
  /** Optional scopes returned by provider */
  scope?: string;
}

export interface CodexOAuthInfo {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  tokenType: string;
  scope?: string;
  expiresAt: number;
  accountId?: string;
}

/**
 * Account information from OpenAI API
 */
export interface AccountInfo {
  /** User email address */
  email: string;
  /** Quota usage information */
  quota: {
    /** Total quota available */
    total: number;
    /** Quota already used */
    used: number;
    /** Remaining quota */
    remaining: number;
  };
}

/**
 * Decoded JWT claims from Codex id_token
 * Contains user information from Auth0/OpenAI
 */
export interface CodexJWTClaims {
  /** User email address */
  email: string;
  /** Whether email has been verified */
  email_verified: boolean;
  /** Plan type (plus, free, etc.) */
  plan_type?: string;
  /** Account ID */
  account_id?: string;
  /** User ID */
  user_id?: string;
  /** Organization name */
  organization_name?: string;
  /** Subscription expiration date */
  subscription_active_until?: Date;
  /** Issuer of the token */
  iss?: string;
  /** Audience of the token */
  aud?: string;
  /** Token expiration time */
  exp?: number;
  /** Token issued at time */
  iat?: number;
}

/**
 * OAuth error codes
 * Maps to standard OAuth 2.0 error responses
 */
export enum OAuthErrorCode {
  /** Authorization code is invalid */
  INVALID_CODE = 'invalid_code',
  /** Authorization code has expired */
  EXPIRED_CODE = 'expired_code',
  /** State parameter doesn't match */
  INVALID_STATE = 'invalid_state',
  /** Network or HTTP error */
  NETWORK_ERROR = 'network_error',
  /** Unknown error occurred */
  UNKNOWN_ERROR = 'unknown_error',
  /** Invalid client credentials */
  INVALID_CLIENT = 'invalid_client',
  /** Invalid grant type */
  INVALID_GRANT = 'invalid_grant',
}

/**
 * OAuth error response structure
 */
export interface OAuthError {
  /** Error code */
  code: OAuthErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: any;
}

/**
 * OAuth configuration from environment
 */
export interface OAuthConfig {
  /** OAuth client ID from OpenAI */
  clientId: string;
  /** OAuth client secret from OpenAI */
  clientSecret: string;
  /** Redirect URI for OAuth callback */
  redirectUri: string;
  /** OAuth scope (permissions requested) */
  scope: string;
  /** Authorization endpoint URL */
  authorizationEndpoint: string;
  /** Token endpoint URL */
  tokenEndpoint: string;
  /** User info endpoint URL (optional, not used by OpenAI) */
  userInfoEndpoint?: string;
  /** Usage endpoint for quota information */
  usageEndpoint: string;
}

/**
 * Authorization URL parameters
 */
export interface AuthorizationUrlParams {
  /** State parameter for CSRF protection */
  state: string;
  /** Optional override redirect URI */
  redirectUri?: string;
  /** Optional response type (default: code) */
  responseType?: 'code' | 'token';
  /** Optional PKCE code challenge (base64url encoded SHA256 hash) */
  codeChallenge?: string;
}

/**
 * Callback parameters from OAuth redirect
 */
export interface OAuthCallbackParams {
  /** Authorization code from provider */
  code: string;
  /** State parameter for verification */
  state: string;
  /** Optional redirect URI override */
  redirectUri?: string;
  /** Optional PKCE code verifier (used in token exchange) */
  codeVerifier?: string;
}

/**
 * Token refresh parameters
 */
export interface TokenRefreshParams {
  /** Refresh token from previous authorization */
  refreshToken: string;
}

/**
 * Stored state data for CSRF protection
 */
export interface StoredStateData {
  /** Redirect URI used in authorization request */
  redirectUri: string;
  /** Timestamp when state was created */
  timestamp: number;
  /** Optional user ID for state tracking */
  userId?: string;
}
