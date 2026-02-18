import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelProviderConfigService } from '../model-provider-config/model-provider-config.service';
import { ProviderType } from '../types/provider-type.enum';
import { ProviderUtils } from '../utils/provider-utils';

/**
 * Provider Configuration Service
 *
 * Manages provider configuration with database-first strategy.
 * Falls back to environment variables if no database configuration exists.
 */
@Injectable()
export class ProviderConfigService {
  private readonly logger = new Logger(ProviderConfigService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly modelProviderConfigService: ModelProviderConfigService,
  ) {}

  /**
   * Get active configuration for a provider
   *
   * Prioritizes database configuration over environment variables.
   *
   * @param provider Provider type
   * @returns Provider configuration with API key, base URL, and model
   */
  async getActiveConfig(provider: ProviderType): Promise<{
    apiKey: string;
    baseUrl?: string;
    model: string;
  }> {
    // Try to get from database
    const dbConfig =
      await this.modelProviderConfigService.getActiveProviderConfig(provider);

    if (dbConfig && dbConfig.apiKey) {
      this.logger.log(`使用数据库配置: ${provider}`);
      return {
        apiKey: dbConfig.apiKey,
        baseUrl: dbConfig.baseUrl,
        model: dbConfig.model || ProviderUtils.getDefaultModel(provider),
      };
    }

    // Fallback to environment variables
    this.logger.warn(`数据库中没有 ${provider} 的启用配置，使用环境变量`);
    return this.getFallbackConfig(provider);
  }

  /**
   * Get configuration from environment variables (fallback)
   *
   * @param provider Provider type
   * @returns Provider configuration from environment variables
   */
  private getFallbackConfig(provider: ProviderType): {
    apiKey: string;
    baseUrl?: string;
    model: string;
  } {
    switch (provider) {
      case ProviderType.OPENAI:
        return {
          apiKey: this.configService.get<string>('OPENAI_API_KEY') || '',
          baseUrl: this.configService.get<string>('OPENAI_BASE_URL'),
          model: ProviderUtils.getDefaultModel(provider),
        };
      case ProviderType.KIMI:
        return {
          apiKey: this.configService.get<string>('KIMI_API_KEY') || '',
          baseUrl: this.configService.get<string>('KIMI_BASE_URL') || ProviderUtils.getBaseUrl(provider),
          model: ProviderUtils.getDefaultModel(provider),
        };
      case ProviderType.ZHIPU:
        return {
          apiKey: this.configService.get<string>('ZHIPU_API_KEY') || '',
          baseUrl: this.configService.get<string>('ZHIPU_BASE_URL') || ProviderUtils.getBaseUrl(provider),
          model: ProviderUtils.getDefaultModel(provider),
        };
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}
