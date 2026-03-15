import { AgentModelOptions, Providers } from '@app/my-agent/types';
import { Injectable } from '@nestjs/common';
import { ModelProvider } from './model-provider/model-provider.entity';
import {
  ConfigKey,
  PurfenceConfig,
} from './purfence-config/purfence-config.entity';
import { ModelConfig } from './type';
import { ProviderType } from './types/provider-type.enum';

@Injectable()
export class ProviderModelService {
  private mapProvider(provider: ModelProvider['provider']): Providers {
    switch (provider) {
      case ProviderType.OPENAI:
        return 'openai';
      case ProviderType.ANTHROPIC:
        return 'anthropic';
      case ProviderType.OPENAI_COMPATIBLE:
        return 'openai-compatible';
    }
  }

  async findAgentModelOptions(
    modelConfig?: ModelConfig,
  ): Promise<AgentModelOptions> {
    const resolvedModelConfig =
      modelConfig ?? (await this.getGlobalModelConfig());
    const defaultModel = resolvedModelConfig.default;
    const fallbacks = resolvedModelConfig.fallbacks;
    const modelProvider = await ModelProvider.findOneOrFail({
      where: {
        id: defaultModel.id,
      },
    });
    const defaultModelOptions = {
      baseUrl: modelProvider.baseUrl,
      apiKey: modelProvider.apiKey,
      model: defaultModel.model,
      provider: this.mapProvider(modelProvider.provider),
    };

    const fallbacksModelOptions = await Promise.all(
      fallbacks.map(async (fallback) => {
        const fallbackProvider = await ModelProvider.findOneOrFail({
          where: {
            id: fallback.id,
          },
        });
        return {
          baseUrl: fallbackProvider.baseUrl,
          apiKey: fallbackProvider.apiKey,
          model: fallback.model,
          provider: this.mapProvider(fallbackProvider.provider),
        };
      }),
    );

    return {
      default: defaultModelOptions,
      fallbacks: fallbacksModelOptions,
    };
  }

  private async getGlobalModelConfig(): Promise<ModelConfig> {
    const config = await PurfenceConfig.findOne({
      where: { key: ConfigKey.MODEL_CONFIG },
    });
    const modelConfig = config?.value as ModelConfig | undefined;
    if (!modelConfig) {
      throw new Error('请在通用设置中配置模型配置');
    }
    return {
      default: modelConfig.default,
      fallbacks: modelConfig.fallbacks,
    };
  }
}
