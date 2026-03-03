import { Injectable } from '@nestjs/common';
import { ModelOptions } from '@app/my-agent/types';
import { ModelProviderConfig } from './model-provider-config/model-provider-config.entity';
import { ModelProviderConfigService } from './model-provider-config/model-provider-config.service';
import { OAuthService } from './oauth/oauth.service';
import { CodexOAuthInfo, TokenResponse } from './oauth/types/oauth-types';

@Injectable()
export class CodexTokenService {
  constructor(
    private readonly modelProviderConfigService: ModelProviderConfigService,
    private readonly oauthService: OAuthService,
  ) {}

  private isExpiringSoon(expiresAt?: number): boolean {
    if (!expiresAt) {
      return true;
    }

    return Math.floor(Date.now() / 1000) >= expiresAt - 60;
  }

  private decodeJwtPayload(token?: string): Record<string, unknown> | null {
    if (!token) {
      return null;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    } catch {
      return null;
    }
  }

  extractAccountId(
    tokens: TokenResponse,
    fallbackAccountId?: string,
  ): string | undefined {
    const payload = this.decodeJwtPayload(tokens.access_token);
    const auth = payload?.['https://api.openai.com/auth'] as
      | Record<string, unknown>
      | undefined;

    return (
      (auth?.chatgpt_account_id as string | undefined) ||
      fallbackAccountId ||
      undefined
    );
  }

  buildOauthInfo(
    tokens: TokenResponse,
    fallbackAccountId?: string,
  ): CodexOAuthInfo {
    const accountId = this.extractAccountId(tokens, fallbackAccountId);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      tokenType: tokens.token_type,
      scope: tokens.scope,
      expiresAt: tokens.expires_at,
      accountId,
    };
  }

  async refreshCodexConfigToken(
    configId: string,
  ): Promise<ModelProviderConfig> {
    const config =
      await this.modelProviderConfigService.findOneWithSensitive(configId);

    if (!config.refreshToken) {
      throw new Error('Codex configuration is missing refresh token');
    }

    const refreshed = await this.oauthService.refreshToken({
      refreshToken: config.refreshToken,
    });
    const oauthInfo = this.buildOauthInfo(refreshed);

    return this.modelProviderConfigService.update(configId, {
      refreshToken: refreshed.refresh_token,
      oauthInfo: oauthInfo as unknown as Record<string, unknown>,
    });
  }

  async resolveCodexOptions(
    configId: string,
  ): Promise<Pick<ModelOptions, 'accessToken' | 'accountId'>> {
    const config =
      await this.modelProviderConfigService.findOneWithSensitive(configId);
    const oauthInfo = (config.oauthInfo || {}) as Partial<CodexOAuthInfo>;

    if (oauthInfo.accessToken && !this.isExpiringSoon(oauthInfo.expiresAt)) {
      return {
        accessToken: oauthInfo.accessToken,
        accountId: oauthInfo.accountId,
      };
    }

    if (!config.refreshToken) {
      throw new Error('Codex configuration is missing refresh token');
    }

    const updatedConfig = await this.refreshCodexConfigToken(config.id);
    const updatedOauthInfo =
      (updatedConfig.oauthInfo as Partial<CodexOAuthInfo> | undefined) || {};

    return {
      accessToken: updatedOauthInfo.accessToken,
      accountId: updatedOauthInfo.accountId,
    };
  }
}
