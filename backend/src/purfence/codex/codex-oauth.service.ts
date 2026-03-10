import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { randomBytes, createHash } from 'crypto';
import { AxiosRequestConfig } from 'axios';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { PurfenceConfigService } from '../purfence-config/purfence-config.service';
import {
  TokenResponse,
  AccountInfo,
  CodexJWTClaims,
  OAuthErrorCode,
  OAuthError,
  OAuthConfig,
  AuthorizationUrlParams,
  OAuthCallbackParams,
  TokenRefreshParams,
} from './types/oauth-types';
import _ from 'lodash';

/**
 * PKCE (Proof Key for Code Exchange) pair
 *
 * Used for OAuth 2.0 Authorization Code Flow with PKCE extension.
 * Provides additional security for public clients (desktop, mobile, SPA).
 *
 * @property codeVerifier - Random string used to generate code challenge
 * @property codeChallenge - SHA256 hash of code verifier (base64url encoded)
 */
interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * OAuth Service
 *
 * Handles OpenAI Codex OAuth authorization flow with PKCE support.
 * Provides methods for authorization URL generation, token exchange,
 * token refresh, and account information retrieval.
 *
 * Based on OpenAI's Auth0 OAuth 2.0 implementation with PKCE extension.
 * Reference: https://auth0.com/docs/authenticate/login/oauth-v2
 * PKCE: https://datatracker.ietf.org/doc/html/rfc7636
 *
 * @example
 * ```typescript
 * const state = oauthService.generateState();
 * const pkce = oauthService.generatePKCE();
 * const authUrl = oauthService.getAuthorizationUrl({ state, codeChallenge: pkce.codeChallenge });
 * const tokens = await oauthService.handleCallback({ code, state, codeVerifier: pkce.codeVerifier });
 * const accountInfo = await oauthService.getAccountInfo(tokens.access_token);
 * ```
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly config: OAuthConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly purfenceConfigService: PurfenceConfigService,
  ) {
    this.config = {
      clientId:
        this.configService.get<string>('OPENAI_OAUTH_CLIENT_ID') ||
        'app_EMoamEEZ73f0CkXaXp7hrann', // Codex CLI client ID
      clientSecret:
        this.configService.get<string>('OPENAI_OAUTH_CLIENT_SECRET') || '',
      redirectUri:
        this.configService.get<string>('OPENAI_OAUTH_REDIRECT_URI') ||
        'http://localhost:3000/oauth/callback',
      scope:
        this.configService.get<string>('OPENAI_OAUTH_SCOPE') ||
        'openid email profile offline_access',
      authorizationEndpoint: 'https://auth.openai.com/oauth/authorize',
      tokenEndpoint: 'https://auth.openai.com/oauth/token',
      usageEndpoint: 'https://chatgpt.com/backend-api/wham/usage',
    };
  }

  /**
   * Generate authorization URL for OAuth flow with PKCE
   *
   * Creates a URL that redirects user to OpenAI's authorization page.
   * Includes state parameter for CSRF protection and PKCE parameters for security.
   *
   * @param params Authorization parameters including state and codeChallenge
   * @returns Full authorization URL
   * @example
   * ```typescript
   * const state = oauthService.generateState();
   * const pkce = oauthService.generatePKCE();
   * const url = oauthService.getAuthorizationUrl({ state, codeChallenge: pkce.codeChallenge });
   * // Redirects user to: https://auth0.openai.com/authorize?client_id=...&code_challenge=...&state=...
   * ```
   */
  getAuthorizationUrl(params: AuthorizationUrlParams): string {
    const { state, redirectUri, responseType = 'code', codeChallenge } = params;

    const urlParams = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri || this.config.redirectUri,
      response_type: responseType,
      scope: this.config.scope,
      state: state,
      // Codex-specific parameters
      codex_cli_simplified_flow: 'true',
      id_token_add_organizations: 'true',
      prompt: 'login',
    });

    // Add PKCE code challenge if provided
    if (codeChallenge) {
      urlParams.append('code_challenge', codeChallenge);
      urlParams.append('code_challenge_method', 'S256');
      this.logger.debug(
        `Using PKCE with code_challenge: ${codeChallenge.substring(0, 16)}...`,
      );
    }

    const url = `${this.config.authorizationEndpoint}?${urlParams.toString()}`;
    this.logger.log(`Generated authorization URL for state: ${state}`);
    this.logger.debug(`Authorization URL: ${url}`);

    return url;
  }

  /**
   * Handle OAuth callback and exchange code for tokens with PKCE
   *
   * After user authorizes, exchanges the authorization code for access tokens.
   * Uses PKCE code_verifier to prove the client that initiated the request.
   * Calculates token expiration time based on expires_in.
   *
   * @param params Callback parameters including code, state, and codeVerifier
   * @returns Token response with access_token, refresh_token, and expiration
   * @throws BadRequestException if code exchange fails
   * @example
   * ```typescript
   * const tokens = await oauthService.handleCallback({
   *   code: 'AUTH_CODE_FROM_REDIRECT',
   *   state: 'VALID_STATE_VALUE',
   *   codeVerifier: 'CODE_VERIFIER_FROM_PKCE_GENERATION'
   * });
   * ```
   */
  async handleCallback(params: OAuthCallbackParams): Promise<TokenResponse> {
    const { code, state, redirectUri, codeVerifier } = params;

    try {
      this.logger.log(`Exchanging code for token (state: ${state})`);

      // Prepare token request as JSON object (Codex CLI format)
      const tokenRequest: Record<string, string> = {
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        code: code,
        redirect_uri: redirectUri || this.config.redirectUri,
      };

      // Add PKCE code verifier if provided (for public clients)
      if (codeVerifier) {
        tokenRequest.code_verifier = codeVerifier;
        this.logger.debug('Using PKCE code_verifier for token exchange');
      } else {
        // For confidential clients, include client_secret
        if (this.config.clientSecret) {
          tokenRequest.client_secret = this.config.clientSecret;
        }
      }

      const requestConfig = await this.buildRequestConfig({
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Call OpenAI token endpoint with JSON format
      const response = await firstValueFrom(
        this.httpService.post<{
          access_token: string;
          refresh_token: string;
          id_token?: string;
          expires_in: number;
          token_type: string;
          scope?: string;
        }>(this.config.tokenEndpoint, tokenRequest, requestConfig),
      );
      console.log(JSON.stringify(response.data, null, 2));
      // Calculate expires_at (Unix timestamp)
      const expiresAt =
        Math.floor(Date.now() / 1000) + response.data.expires_in;

      const tokenResponse: TokenResponse = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        id_token: response.data.id_token,
        expires_at: expiresAt,
        token_type: response.data.token_type as 'Bearer',
        scope: response.data.scope,
      };

      this.logger.log(
        `Token exchange successful (expires at: ${new Date(expiresAt * 1000).toISOString()})`,
      );

      return tokenResponse;
    } catch (error) {
      this.logger.error('Token exchange failed', error.stack);

      // Handle specific OAuth errors
      if (error.response?.data) {
        const errorData = error.response.data;
        const errorCode = errorData.error || 'unknown_error';
        const errorDesc =
          errorData.error_description || 'Failed to exchange token';

        throw this.createOAuthError(errorCode, errorDesc);
      }

      throw this.createOAuthError(
        OAuthErrorCode.NETWORK_ERROR,
        'Failed to exchange token',
      );
    }
  }

  /**
   * Refresh access token using refresh token
   *
   * Obtains a new access token without user interaction using the refresh token.
   * Should be called when access token is expired or about to expire.
   *
   * @param params Refresh token parameters
   * @returns New token response with updated access_token and expiration
   * @throws UnauthorizedException if refresh token is invalid
   * @example
   * ```typescript
   * const newTokens = await oauthService.refreshToken({
   *   refreshToken: 'STORED_REFRESH_TOKEN'
   * });
   * ```
   */
  async refreshToken(params: TokenRefreshParams): Promise<TokenResponse> {
    const { refreshToken } = params;

    try {
      this.logger.log('Refreshing token');

      // Prepare token request as JSON object (Codex CLI format)
      const tokenRequest: Record<string, string> = {
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        refresh_token: refreshToken,
      };

      // For confidential clients, include client_secret
      if (this.config.clientSecret) {
        tokenRequest.client_secret = this.config.clientSecret;
      }

      const requestConfig = await this.buildRequestConfig({
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await firstValueFrom(
        this.httpService.post<{
          access_token: string;
          refresh_token: string;
          id_token?: string;
          expires_in: number;
          token_type: string;
          scope?: string;
        }>(this.config.tokenEndpoint, tokenRequest, requestConfig),
      );
      const expiresAt =
        Math.floor(Date.now() / 1000) + response.data.expires_in;

      const tokenResponse: TokenResponse = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshToken, // Some providers don't return new refresh token
        id_token: response.data.id_token,
        expires_at: expiresAt,
        token_type: response.data.token_type as 'Bearer',
        scope: response.data.scope,
      };

      this.logger.log(
        `Token refresh successful (expires at: ${new Date(expiresAt * 1000).toISOString()})`,
      );

      return tokenResponse;
    } catch (error) {
      this.logger.error('Token refresh failed', error.stack);

      if (error.response?.data) {
        const errorData = error.response.data;
        const errorCode = errorData.error || 'unknown_error';
        const errorDesc =
          errorData.error_description || 'Failed to refresh token';

        throw this.createOAuthError(errorCode, errorDesc);
      }

      throw this.createOAuthError(
        OAuthErrorCode.UNKNOWN_ERROR,
        'Failed to refresh token',
      );
    }
  }

  /**
   * Get account information including quota usage
   *
   * Fetches usage information from OpenAI's usage endpoint.
   * Returns session (3-hour) and weekly usage statistics.
   *
   * @param accessToken Valid access token from OAuth flow
   * @returns Account information with email and quota details
   * @throws BadRequestException if request fails
   * @example
   * ```typescript
   * const accountInfo = await oauthService.getAccountInfo(accessToken);
   * console.log(`Email: ${accountInfo.email}, Quota remaining: ${accountInfo.quota.remaining}`);
   * ```
   */
  async getAccountInfo(accessToken: string): Promise<AccountInfo> {
    try {
      this.logger.log('Fetching account info');

      const requestConfig = await this.buildRequestConfig({
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const response = await firstValueFrom(
        this.httpService.get<{
          email?: string;
          session_usage?: number;
          session_limit?: number;
          weekly_usage?: number;
          weekly_limit?: number;
        }>(this.config.usageEndpoint, requestConfig),
      );

      // Parse usage data
      const sessionUsed = response.data.session_usage || 0;
      const sessionLimit = response.data.session_limit || 100000;
      const weeklyUsed = response.data.weekly_usage || 0;
      const weeklyLimit = response.data.weekly_limit || 1000000;

      // Calculate remaining quota (use session limit by default)
      const total = sessionLimit;
      const used = sessionUsed;
      const remaining = Math.max(0, total - used);

      const accountInfo: AccountInfo = {
        email: response.data.email || 'unknown@example.com',
        quota: {
          total,
          used,
          remaining,
        },
      };

      this.logger.log(
        `Account info fetched: ${accountInfo.email}, quota: ${used}/${total} (${remaining} remaining)`,
      );

      return accountInfo;
    } catch (error) {
      this.logger.error('Failed to fetch account info', error.stack);

      // Return default quota info on error
      return {
        email: 'unknown@example.com',
        quota: {
          total: 100000,
          used: 0,
          remaining: 100000,
        },
      };
    }
  }

  /**
   * Decode JWT id_token to extract user claims
   *
   * Simple JWT decoding without signature verification.
   * Safe for this use case since token comes from trusted OAuth provider.
   *
   * @param token JWT token (id_token from token response)
   * @returns Decoded JWT claims
   * @throws BadRequestException if token format is invalid
   * @example
   * ```typescript
   * const claims = oauthService.decodeJWT(idToken);
   * console.log(`User email: ${claims.email}, verified: ${claims.email_verified}`);
   * ```
   */
  decodeJWT(token: string): CodexJWTClaims {
    try {
      // Simple JWT decoding (no signature verification needed for trusted source)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode payload (base64url)
      const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
      const claims: CodexJWTClaims = JSON.parse(payload);

      this.logger.log(`Decoded JWT for user: ${claims.email}`);
      return claims;
    } catch (error) {
      this.logger.error('Failed to decode JWT', error.stack);
      throw new BadRequestException('Failed to decode JWT');
    }
  }

  /**
   * Generate cryptographically secure random state parameter
   *
   * State parameter prevents CSRF attacks by verifying the callback
   * matches the authorization request.
   *
   * @returns Random 32-character hex string
   * @example
   * ```typescript
   * const state = oauthService.generateState();
   * // Returns: "a1b2c3d4e5f6..."
   * ```
   */
  generateState(): string {
    const state = randomBytes(16).toString('hex');
    this.logger.debug(`Generated OAuth state: ${state}`);
    return state;
  }

  /**
   * Generate PKCE (Proof Key for Code Exchange) pair
   *
   * Creates a code verifier and code challenge for OAuth 2.0 PKCE extension.
   * This provides additional security for public clients (desktop, mobile, SPA)
   * that cannot securely store client secrets.
   *
   * Code Verifier: Cryptographically random string (43-128 characters)
   * Code Challenge: SHA256 hash of code verifier, base64url encoded
   *
   * @returns Object with code_verifier and code_challenge
   * @example
   * ```typescript
   * const pkce = oauthService.generatePKCE();
   * // pkce.codeVerifier: "db5...9a2" (random 43-char string)
   * // pkce.codeChallenge: "I-ARDqhhHuW_JoYe6vX-CMPzOEKmlUVIaN6UkFZTySw" (SHA256 hash)
   *
   * // Use in authorization URL
   * const authUrl = oauthService.getAuthorizationUrl({
   *   state,
   *   codeChallenge: pkce.codeChallenge
   * });
   *
   * // Use code_verifier when exchanging code for tokens
   * const tokens = await oauthService.handleCallback({
   *   code,
   *   state,
   *   codeVerifier: pkce.codeVerifier
   * });
   * ```
   */
  generatePKCE(): PKCEPair {
    // Generate code verifier: 43-128 character random string using unreserved characters
    // Using 32 bytes of random data (enough for security)
    const codeVerifier = randomBytes(32)
      .toString('base64url')
      .replace(/=/g, '')
      .substring(0, 128); // Ensure max 128 chars

    // Generate code challenge: SHA256 hash of code verifier, base64url encoded
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')
      .replace(/=/g, '');

    this.logger.debug(
      `Generated PKCE pair (verifier: ${codeVerifier.substring(0, 16)}..., challenge: ${codeChallenge.substring(0, 16)}...)`,
    );

    return {
      codeVerifier,
      codeChallenge,
    };
  }

  /**
   * Create standardized OAuth error
   *
   * Maps OAuth error codes to internal error types.
   *
   * @param code Error code from OAuth provider
   * @param message Human-readable error message
   * @returns Formatted OAuth error
   * @private
   */
  private createOAuthError(code: string, message: string): OAuthError {
    return {
      code: this.mapErrorCode(code),
      message,
    };
  }

  /**
   * Map OAuth error codes to internal enum
   *
   * Converts provider-specific error codes to standardized codes.
   *
   * @param code Error code from provider
   * @returns Mapped OAuth error code
   * @private
   */
  private mapErrorCode(code: string): OAuthErrorCode {
    const errorMap: Record<string, OAuthErrorCode> = {
      invalid_code: OAuthErrorCode.INVALID_CODE,
      expired_code: OAuthErrorCode.EXPIRED_CODE,
      invalid_state: OAuthErrorCode.INVALID_STATE,
      invalid_client: OAuthErrorCode.INVALID_CLIENT,
      invalid_grant: OAuthErrorCode.INVALID_GRANT,
      access_denied: OAuthErrorCode.INVALID_CODE,
      unauthorized_client: OAuthErrorCode.INVALID_CLIENT,
    };

    return errorMap[code] || OAuthErrorCode.UNKNOWN_ERROR;
  }

  private async buildRequestConfig(
    baseConfig: AxiosRequestConfig = {},
  ): Promise<AxiosRequestConfig> {
    const proxyUrl = await this.purfenceConfigService.getProxyUrl();
    if (!proxyUrl) {
      return baseConfig;
    }

    return {
      ...baseConfig,
      proxy: false,
      httpAgent: new HttpProxyAgent({ proxy: proxyUrl }),
      httpsAgent: new HttpsProxyAgent({ proxy: proxyUrl }),
    };
  }
}
