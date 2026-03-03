import {
  Resolver,
  Mutation,
  Args,
  ID,
  ObjectType,
  Field,
} from '@nestjs/graphql';
import { BadRequestException, Logger } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { StateService } from './state.service';
import { ModelProviderConfigService } from '../model-provider-config/model-provider-config.service';
import { ModelProviderConfigDto } from '../model-provider-config/model-provider-config.dto';
import { ProviderType } from '../types/provider-type.enum';
import { CodexTokenService } from '../codex-token.service';
import { CodexJWTClaims } from './types/oauth-types';

/**
 * Quota Information
 *
 * Represents API quota usage for Codex account
 */
@ObjectType('QuotaInfo')
class QuotaInfo {
  @Field()
  total: number;

  @Field()
  used: number;

  @Field()
  remaining: number;
}

/**
 * OAuth Authorization Response
 *
 * Returns authorization URL and state for initiating OAuth flow
 */
@ObjectType('OAuthAuthorization')
class OAuthAuthorization {
  @Field()
  authorizationUrl: string;

  @Field()
  state: string;
}

/**
 * Codex OAuth payload
 */
@ObjectType('CodexOAuthInfoObject')
class CodexOAuthInfoObject {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field({ nullable: true })
  idToken?: string;

  @Field()
  tokenType: string;

  @Field({ nullable: true })
  scope?: string;

  @Field()
  expiresAt: number;

  @Field({ nullable: true })
  accountId?: string;
}

/**
 * OAuth Callback Response
 *
 * Returns configuration and account info after successful OAuth callback
 */
@ObjectType('OAuthCallbackResponse')
class OAuthCallbackResponse {
  @Field()
  email: string;

  @Field(() => QuotaInfo)
  quota: QuotaInfo;

  @Field(() => CodexOAuthInfoObject)
  oauthInfo: CodexOAuthInfoObject;
}

/**
 * OAuth Resolver
 *
 * GraphQL resolver for OpenAI Codex OAuth authorization flow.
 * Provides mutations for initiating OAuth, handling callbacks, and refreshing tokens.
 *
 * @example
 * ```graphql
 * mutation {
 *   initiateCodexOAuth(redirectUri: "http://localhost:3000/oauth/callback") {
 *     authorizationUrl
 *     state
 *   }
 * }
 * ```
 */
@Resolver()
export class OAuthResolver {
  private readonly logger = new Logger(OAuthResolver.name);

  constructor(
    private readonly oauthService: OAuthService,
    private readonly stateService: StateService,
    private readonly configService: ModelProviderConfigService,
    private readonly codexTokenService: CodexTokenService,
  ) {}

  /**
   * Initiate Codex OAuth flow with PKCE
   *
   * Generates authorization URL with PKCE parameters for enhanced security.
   * PKCE (Proof Key for Code Exchange) is required for public clients.
   *
   * SECURITY:
   * - State parameter prevents CSRF attacks
   * - PKCE code_verifier proves the client that initiated the request
   *
   * @param redirectUri Redirect URI for OAuth callback
   * @returns Authorization URL and state parameter
   *
   * @example
   * ```graphql
   * mutation {
   *   initiateCodexOAuth(redirectUri: "http://localhost:3000/oauth/callback") {
   *     authorizationUrl
   *     state
   *   }
   * }
   * ```
   */
  @Mutation(() => OAuthAuthorization, { name: 'initiateCodexOAuth' })
  async initiateCodexOAuth(
    @Args('redirectUri') redirectUri: string,
  ): Promise<OAuthAuthorization> {
    // Generate state for CSRF protection
    const state = this.oauthService.generateState();

    // Generate PKCE pair for public client security
    const pkce = this.oauthService.generatePKCE();

    // Generate authorization URL with PKCE code_challenge
    const authorizationUrl = this.oauthService.getAuthorizationUrl({
      state,
      redirectUri,
      codeChallenge: pkce.codeChallenge,
    });

    // 🔐 Store state with redirect URI and code_verifier for CSRF protection and PKCE
    this.stateService.set(state, {
      redirectUri,
      timestamp: Date.now(),
      provider: 'openai',
      metadata: {
        codeVerifier: pkce.codeVerifier,
      },
    });

    this.logger.log(
      `OAuth initiated with state: ${state}, redirectUri: ${redirectUri}`,
    );
    this.logger.debug(`PKCE code_verifier stored for state: ${state}`);

    return {
      authorizationUrl,
      state,
    };
  }

  /**
   * Handle Codex OAuth callback
   *
   * After user authorizes, exchange code for tokens and return OAuth payload.
   * Also fetches account information including quota usage.
   *
   * SECURITY: Validates state parameter to prevent CSRF attacks.
   *
   * @param code Authorization code from OAuth provider
   * @param state State parameter for CSRF verification
   * @param redirectUri Redirect URI used in authorization request
   * @returns OAuth payload and account info
   *
   * @example
   * ```graphql
   * mutation {
   *   handleCodexOAuthCallback(
   *     code: "AUTH_CODE_FROM_REDIRECT"
   *     state: "STATE_VALUE"
   *     redirectUri: "http://localhost:3000/oauth/callback"
   *   ) {
   *     email
   *     quota {
   *       total
   *       used
   *       remaining
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => OAuthCallbackResponse, { name: 'handleCodexOAuthCallback' })
  async handleCodexOAuthCallback(
    @Args('code') code: string,
    @Args('state') state: string,
    @Args('redirectUri') redirectUri: string,
  ): Promise<OAuthCallbackResponse> {
    // 🔐 Validate state parameter (CSRF protection)
    const storedState = this.stateService.validateWithRedirectUri(
      state,
      redirectUri,
    );

    if (!storedState) {
      this.logger.warn(
        `Invalid or expired state parameter: ${state} for redirectUri: ${redirectUri}`,
      );
      throw new BadRequestException(
        'Invalid or expired state parameter. Please restart the OAuth flow.',
      );
    }

    this.logger.log(
      `State validated successfully for OAuth callback: ${state}`,
    );

    // Retrieve code_verifier from stored state metadata (PKCE)
    const codeVerifier = storedState.metadata?.codeVerifier as
      | string
      | undefined;
    if (codeVerifier) {
      this.logger.debug('Using PKCE code_verifier for token exchange');
    }

    try {
      // Exchange code for tokens with PKCE code_verifier
      const tokens = await this.oauthService.handleCallback({
        code,
        state,
        redirectUri,
        codeVerifier,
      });

      // Get account info with quota
      const accountInfo = await this.oauthService.getAccountInfo(
        tokens.access_token,
      );

      // Decode JWT to get user claims
      let claims: CodexJWTClaims | undefined;
      if (tokens.id_token) {
        claims = this.oauthService.decodeJWT(tokens.id_token);
      }

      const email = claims?.email || accountInfo.email;
      const oauthInfo = this.codexTokenService.buildOauthInfo(
        tokens,
        claims?.account_id,
      );

      return {
        email,
        quota: accountInfo.quota,
        oauthInfo: {
          accessToken: oauthInfo.accessToken,
          refreshToken: oauthInfo.refreshToken,
          idToken: oauthInfo.idToken,
          tokenType: oauthInfo.tokenType,
          scope: oauthInfo.scope,
          expiresAt: oauthInfo.expiresAt,
          accountId: oauthInfo.accountId,
        },
      };
    } catch (error) {
      this.logger.error('OAuth callback failed', error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`OAuth callback failed: ${error.message}`);
    }
  }

  /**
   * Refresh Codex OAuth token
   *
   * Manually refresh the access token for a Codex configuration.
   * Useful when token is expired or API calls fail with 401.
   *
   * @param configId Configuration ID to refresh token for
   * @returns Updated configuration
   *
   * @example
   * ```graphql
   * mutation {
   *   refreshCodexToken(configId: "CONFIG_ID") {
   *     id
   *     name
   *     provider
   *     isActive
   *   }
   * }
   * ```
   */
  @Mutation(() => ModelProviderConfigDto, { name: 'refreshCodexToken' })
  async refreshCodexToken(
    @Args('configId', { type: () => ID }) configId: string,
  ): Promise<ModelProviderConfigDto> {
    try {
      return await this.codexTokenService.refreshCodexConfigToken(configId);
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to refresh Codex token',
      );
    }
  }
}
