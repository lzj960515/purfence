import { AgentModelOptions } from '@app/my-agent/types';
import { Injectable } from '@nestjs/common';
import { ModelProvider } from './model-provider/model-provider.entity';
import {
  ConfigKey,
  PurfenceConfig,
} from './purfence-config/purfence-config.entity';
import { ModelConfig } from './type';

@Injectable()
export class ProviderModelService {
  async findAgentModelOptions(): Promise<AgentModelOptions> {
    const config = await PurfenceConfig.findOne({
      where: { key: ConfigKey.MODEL_CONFIG },
    });
    const modelConfig = config?.value as ModelConfig;
    const defaultModel = modelConfig.default;
    const fallbacks = modelConfig.fallbacks;
    const modelProvider = await ModelProvider.findOneOrFail({
      where: {
        id: defaultModel.id,
      },
    });
    const defaultModelOptions = {
      baseUrl: modelProvider.baseUrl,
      apiKey: modelProvider.apiKey,
      model: defaultModel.model,
      provider: modelProvider.provider,
    };

    const fallbacksModelOptions = await Promise.all(
      fallbacks.map(async (fallback) => {
        const modelProvider = await ModelProvider.findOneOrFail({
          where: {
            id: fallback.id,
          },
        });
        return {
          baseUrl: modelProvider.baseUrl,
          apiKey: modelProvider.apiKey,
          model: fallback.model,
          provider: modelProvider.provider,
        };
      }),
    );

    return {
      default: defaultModelOptions,
      fallbacks: fallbacksModelOptions,
    };
  }
}
