import { ProviderType } from '../types/provider-type.enum';

/**
 * Provider Utility Class
 *
 * Provides utility methods for working with AI model providers.
 * Contains provider-specific configuration like default models and base URLs.
 */
export class ProviderUtils {
  /**
   * Get the default model for a provider
   *
   * @param provider The provider type
   * @returns Default model identifier
   */
  static getDefaultModel(provider: ProviderType): string {
    switch (provider) {
      case ProviderType.OPENAI:
        return 'gpt-4';
      case ProviderType.KIMI:
        return 'moonshot-v1-8k';
      case ProviderType.ZHIPU:
        return 'glm-4';
      default:
        return 'gpt-4';
    }
  }

  /**
   * Get the base URL for a provider
   *
   * @param provider The provider type
   * @returns Base API URL
   */
  static getBaseUrl(provider: ProviderType): string {
    switch (provider) {
      case ProviderType.OPENAI:
        return 'https://api.openai.com/v1';
      case ProviderType.KIMI:
        return 'https://api.moonshot.ai/v1';
      case ProviderType.ZHIPU:
        return 'https://open.bigmodel.cn/api/anthropic/v1';
      default:
        return 'https://api.openai.com/v1';
    }
  }
}
