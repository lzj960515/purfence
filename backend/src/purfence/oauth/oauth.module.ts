import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ModelProviderConfigModule } from '../model-provider-config/model-provider-config.module';
import { PurfenceConfigModule } from '../purfence-config/purfence-config.module';
import { OAuthResolver } from './oauth.resolver';
import { OAuthService } from './oauth.service';
import { StateService } from './state.service';
import { CodexTokenService } from '../codex-token.service';

/**
 * OAuth Module
 *
 * Provides OAuth authorization flow services for OpenAI Codex.
 * Integrates with ModelProviderConfig for storing OAuth credentials.
 * Includes StateService for CSRF protection via state parameter validation.
 *
 * @example
 * ```typescript
 * import { OAuthModule } from './oauth/oauth.module';
 *
 * @Module({
 *   imports: [OAuthModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        timeout: 30000,
        maxRedirects: 5,
      }),
    }),
    ConfigModule,
    ModelProviderConfigModule,
    PurfenceConfigModule,
  ],
  providers: [OAuthService, OAuthResolver, StateService, CodexTokenService],
  exports: [OAuthService, StateService, CodexTokenService],
})
export class OAuthModule {}
