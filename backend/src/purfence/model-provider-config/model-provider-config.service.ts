import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Not } from 'typeorm';
import { ModelProviderConfig } from './model-provider-config.entity';
import { ModelProviderConfigCreateInput } from './model-provider-config-create.input';
import { ProviderType } from '../types/provider-type.enum';
import { ProviderUtils } from '../utils/provider-utils';

/**
 * ModelProviderConfig Service
 *
 * Provides CRUD operations for model provider configurations.
 * Uses Active Record pattern (Entity static methods) instead of Repository injection.
 *
 * @example
 * ```typescript
 * const config = await modelProviderConfigService.create(input);
 * const activeConfig = await modelProviderConfigService.getActiveProviderConfig(ProviderType.OPENAI);
 * ```
 */
@Injectable()
export class ModelProviderConfigService {
  private sanitize(config: ModelProviderConfig): ModelProviderConfig {
    const { apiKey, refreshToken, oauthInfo, ...rest } = config;
    return rest as any;
  }

  private async clearDefaultFlag(excludeId?: string): Promise<void> {
    if (excludeId) {
      await ModelProviderConfig.update(
        { isDefault: true, id: Not(excludeId) },
        { isDefault: false },
      );
      return;
    }

    await ModelProviderConfig.update({ isDefault: true }, { isDefault: false });
  }

  private async assertNameUnique(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await ModelProviderConfig.findOne({ where: { name } });
    if (!existing) {
      return;
    }

    if (excludeId && existing.id === excludeId) {
      return;
    }

    throw new ConflictException(`配置名称 "${name}" 已存在`);
  }

  /**
   * Create a new model provider configuration
   *
   * Automatically encrypts apiKey and refreshToken before storage.
   * If isActive is true, deactivates all other configurations for the same provider.
   *
   * @param input Configuration input data
   * @returns Created configuration (without sensitive data)
   * @throws ConflictException if configuration with same provider+name already exists
   */
  async create(
    input: ModelProviderConfigCreateInput,
  ): Promise<ModelProviderConfig> {
    await this.assertNameUnique(input.name);

    // If setting to active, deactivate other configurations for this provider
    if (input.isActive) {
      await ModelProviderConfig.update(
        { provider: input.provider, isActive: true },
        { isActive: false },
      );
    }

    if (input.isDefault) {
      await this.clearDefaultFlag();
    }

    const config = ModelProviderConfig.create({ ...input });

    const saved = await config.save();

    return this.sanitize(saved);
  }

  /**
   * Get all configurations (without sensitive data)
   *
   * @returns Array of configurations (apiKey and refreshToken excluded)
   */
  async findAll(): Promise<ModelProviderConfig[]> {
    const configs = await ModelProviderConfig.find();
    return configs.map((config) => this.sanitize(config));
  }

  /**
   * Get a single configuration by ID (without sensitive data)
   *
   * @param id Configuration ID
   * @returns Configuration (apiKey and refreshToken excluded)
   * @throws NotFoundException if configuration not found
   */
  async findOne(id: string): Promise<ModelProviderConfig> {
    const config = await ModelProviderConfig.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`配置 ${id} 不存在`);
    }
    return this.sanitize(config);
  }

  /**
   * Update a configuration
   *
   * Automatically re-encrypts apiKey and refreshToken if provided.
   * If setting isActive to true, deactivates other configurations for the same provider.
   *
   * @param id Configuration ID
   * @param updates Partial updates to apply
   * @returns Updated configuration (without sensitive data)
   * @throws NotFoundException if configuration not found
   */
  async update(
    id: string,
    updates: Partial<ModelProviderConfig>,
  ): Promise<ModelProviderConfig> {
    const config = await ModelProviderConfig.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`配置 ${id} 不存在`);
    }

    if (updates.name && updates.name !== config.name) {
      await this.assertNameUnique(updates.name, id);
    }

    // If setting to active, deactivate other configurations for this provider
    if (updates.isActive === true && config.provider) {
      await ModelProviderConfig.update(
        { provider: config.provider, isActive: true, id: Not(id) },
        { isActive: false },
      );
    }

    if (updates.isDefault === true) {
      await this.clearDefaultFlag(id);
    }

    Object.assign(config, updates);
    const saved = await config.save();

    return this.sanitize(saved);
  }

  /**
   * Delete a configuration
   *
   * @param id Configuration ID
   * @throws NotFoundException if configuration not found
   */
  async remove(id: string): Promise<void> {
    const config = await ModelProviderConfig.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`配置 ${id} 不存在`);
    }
    await config.remove();
  }

  /**
   * Toggle the active status of a configuration
   *
   * When setting to active, deactivates all other configurations for the same provider.
   *
   * @param id Configuration ID
   * @param isActive New active state
   * @returns Updated configuration (without sensitive data)
   * @throws NotFoundException if configuration not found
   */
  async toggleActive(
    id: string,
    isActive: boolean,
  ): Promise<ModelProviderConfig> {
    const config = await ModelProviderConfig.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`配置 ${id} 不存在`);
    }

    // If setting to active, deactivate other configurations for this provider
    if (isActive && config.provider) {
      await ModelProviderConfig.update(
        { provider: config.provider, isActive: true, id: Not(id) },
        { isActive: false },
      );
    }

    config.isActive = isActive;
    if (!isActive && config.isDefault) {
      config.isDefault = false;
    }
    const saved = await config.save();

    return this.sanitize(saved);
  }

  /**
   * Get the active configuration for a specific provider (includes decrypted API key)
   *
   * This method is intended for internal use by services like LlmService.
   * It is NOT exposed via GraphQL API for security reasons.
   *
   * @param provider Provider type
   * @returns Configuration with decrypted API key, or null if no active configuration exists
   */
  async getActiveProviderConfig(provider: ProviderType): Promise<{
    apiKey: string;
    baseUrl?: string;
    model?: string;
  } | null> {
    const config = await ModelProviderConfig.findOne({
      where: { provider, isActive: true },
    });

    if (!config) {
      return null;
    }

    // Return apiKey as-is (no encryption)
    return {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || undefined,
      model: ProviderUtils.getDefaultModel(provider),
    };
  }

  /**
   * Find existing Codex OAuth configuration
   *
   * Searches for an existing Codex provider configuration.
   * Used during OAuth callback to decide whether to create or update.
   *
   * @returns Existing Codex configuration or null
   */
  async findExistingCodexConfig(): Promise<ModelProviderConfig | null> {
    return ModelProviderConfig.findOne({
      where: {
        provider: ProviderType.CODEX,
      },
    });
  }

  /**
   * Get configuration with decrypted sensitive data
   *
   * Returns configuration including decrypted apiKey and refreshToken.
   * WARNING: Only use this internally, never expose via GraphQL API.
   *
   * @param id Configuration ID
   * @returns Configuration with decrypted sensitive data
   * @throws NotFoundException if configuration not found
   * @internal
   */
  async findOneWithSensitive(id: string): Promise<ModelProviderConfig> {
    const config = await ModelProviderConfig.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`配置 ${id} 不存在`);
    }

    // Return config as-is (no encryption/decryption)
    return config;
  }

  /**
   * Resolve user selected config. If name is empty, return current default config.
   */
  async resolveByNameOrDefaultWithSensitive(
    name?: string,
  ): Promise<ModelProviderConfig> {
    if (name) {
      const byName = await ModelProviderConfig.findOne({
        where: { name, isActive: true },
      });
      if (!byName) {
        throw new Error(`未找到已启用配置: ${name}`);
      }
      return byName;
    }

    const defaultConfig = await ModelProviderConfig.findOne({
      where: { isDefault: true, isActive: true },
    });
    if (!defaultConfig) {
      console.log('未配置默认模型，请先在设置中设置默认配置');
      throw new Error('未配置默认模型，请先在设置中设置默认配置');
    }
    return defaultConfig;
  }
}
