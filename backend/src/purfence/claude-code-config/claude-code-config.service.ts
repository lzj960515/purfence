import { Injectable } from '@nestjs/common';
import { ModelProviderConfig } from '../model-provider-config/model-provider-config.entity';
import { ProviderType } from '../types/provider-type.enum';
import { ClaudeCodeConfig } from './claude-code-config.entity';

const CLAUDE_BASE_URL_BY_PROVIDER: Partial<Record<ProviderType, string>> = {
  [ProviderType.ZHIPU]: 'https://open.bigmodel.cn/api/anthropic',
  [ProviderType.KIMI]: 'https://api.kimi.com/coding/',
};

const CLAUDE_DEFAULT_MODELS_BY_PROVIDER: Partial<
  Record<
    ProviderType,
    {
      ANTHROPIC_DEFAULT_HAIKU_MODEL: string;
      ANTHROPIC_DEFAULT_SONNET_MODEL: string;
      ANTHROPIC_DEFAULT_OPUS_MODEL: string;
    }
  >
> = {
  [ProviderType.ZHIPU]: {
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-5',
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-5',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-5',
  },
  [ProviderType.KIMI]: {
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'kimi-2.5',
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'kimi-2.5',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'kimi-2.5',
  },
};

const CLAUDE_AUTH_ENV_KEY_BY_PROVIDER: Partial<Record<ProviderType, string>> = {
  [ProviderType.ZHIPU]: 'ANTHROPIC_AUTH_TOKEN',
  [ProviderType.KIMI]: 'ANTHROPIC_API_KEY',
};

@Injectable()
export class ClaudeCodeConfigService {
  async getSingletonConfig(): Promise<ClaudeCodeConfig | null> {
    const configs = await ClaudeCodeConfig.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    return configs[0] ?? null;
  }

  async buildClaudeCodeEnv(): Promise<Record<string, string>> {
    const config = await this.getSingletonConfig();
    if (!config) {
      return {};
    }

    const envFromConfig = this.toEnvRecord(config.env);
    if (config.useDefaultConfig) {
      return envFromConfig;
    }

    if (!config.modelProviderId) {
      throw new Error('Claude Code 未配置模型提供商，请先在设置中选择');
    }

    const providerConfig = await ModelProviderConfig.findOne({
      where: { id: config.modelProviderId },
    });
    if (!providerConfig) {
      throw new Error('Claude Code 绑定的模型提供商不存在');
    }

    const mappedBaseUrl = CLAUDE_BASE_URL_BY_PROVIDER[providerConfig.provider];
    if (!mappedBaseUrl) {
      throw new Error('Claude Code 仅支持 GLM 或 Kimi 提供商');
    }

    const mappedModels =
      CLAUDE_DEFAULT_MODELS_BY_PROVIDER[providerConfig.provider];
    if (!mappedModels) {
      throw new Error('Claude Code 默认模型映射缺失');
    }

    const authEnvKey = CLAUDE_AUTH_ENV_KEY_BY_PROVIDER[providerConfig.provider];
    if (!authEnvKey) {
      throw new Error('Claude Code 认证环境变量映射缺失');
    }

    if (!providerConfig.apiKey) {
      throw new Error('模型提供商缺少 API Key，无法用于 Claude Code');
    }

    return {
      ...envFromConfig,
      [authEnvKey]: providerConfig.apiKey,
      ANTHROPIC_BASE_URL: mappedBaseUrl,
      ...mappedModels,
    };
  }

  private toEnvRecord(
    envItems?: Array<{ key: string; value: string }>,
  ): Record<string, string> {
    if (!envItems?.length) {
      return {};
    }

    return envItems.reduce<Record<string, string>>((acc, item) => {
      const key = item.key?.trim();
      if (!key) {
        return acc;
      }
      acc[key] = item.value ?? '';
      return acc;
    }, {});
  }
}
