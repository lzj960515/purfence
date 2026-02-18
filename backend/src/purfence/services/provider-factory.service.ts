import { Injectable, Logger } from '@nestjs/common';
import { ProviderConfigService } from './provider-config.service';
import { ProviderType } from '../types/provider-type.enum';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * Provider Factory Service
 *
 * Factory service for creating and configuring AI provider client instances.
 * Supports OpenAI-compatible providers like Kimi and Zhipu.
 *
 * @example
 * ```typescript
 * const kimiModel = await providerFactory.createKimi('kimi-k2-0905-preview');
 * const zhipuModel = await providerFactory.createZhipu('glm-4');
 * ```
 */
@Injectable()
export class ProviderFactoryService {
  private readonly logger = new Logger(ProviderFactoryService.name);

  constructor(private readonly providerConfigService: ProviderConfigService) {}

  /**
   * Create an OpenAI-compatible client instance
   *
   * Used for providers that are compatible with the OpenAI API (Kimi, Zhipu).
   *
   * @param provider Provider type
   * @param modelId Optional model identifier. If not provided, returns the client factory
   * @returns AI model instance or client factory
   * @example
   * ```typescript
   * // Get client factory
   * const client = await providerFactory.createOpenAICompatible(ProviderType.KIMI);
   * // Get specific model
   * const model = await providerFactory.createOpenAICompatible(ProviderType.KIMI, 'kimi-k2-0905-preview');
   * ```
   */
  async createOpenAICompatible(
    provider: ProviderType,
    modelId?: string,
  ): Promise<any> {
    const config = await this.providerConfigService.getActiveConfig(provider);

    this.logger.log(`创建 ${provider} 客户端实例`);

    const client = createOpenAICompatible({
      name: provider,
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });

    // Return model instance if modelId is provided, otherwise return client factory
    return modelId ? client(modelId) : client;
  }

  /**
   * Create a Kimi (Moonshot) client instance
   *
   * @param modelId Model identifier (default: 'kimi-k2-0905-preview')
   * @returns AI model instance
   */
  async createKimi(modelId?: string) {
    return this.createOpenAICompatible(
      ProviderType.KIMI,
      modelId || 'kimi-k2-0905-preview',
    );
  }

  /**
   * Create a Zhipu client instance
   *
   * @param modelId Model identifier (default: 'glm-4')
   * @returns AI model instance
   */
  async createZhipu(modelId?: string) {
    return this.createOpenAICompatible(
      ProviderType.ZHIPU,
      modelId || 'glm-4',
    );
  }
}
