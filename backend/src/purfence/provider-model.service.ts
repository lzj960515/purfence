import { Injectable } from '@nestjs/common';
import { ModelOptions } from '@app/my-agent/types';
import { ModelProviderConfigService } from './model-provider-config/model-provider-config.service';
import { PurfenceConfigService } from './purfence-config/purfence-config.service';
import { ProviderType } from './types/provider-type.enum';
import { CodexTokenService } from './codex-token.service';

@Injectable()
export class ProviderModelService {
  constructor(
    private readonly modelProviderConfigService: ModelProviderConfigService,
    private readonly purfenceConfigService: PurfenceConfigService,
    private readonly codexTokenService: CodexTokenService,
  ) {}

  private mapProviderToModel(provider: ProviderType): ModelOptions['model'] {
    if (provider === ProviderType.CODEX) {
      return 'codex';
    }

    if (provider === ProviderType.OPENAI) {
      return 'openai';
    }

    if (provider === ProviderType.KIMI) {
      return 'kimi';
    }

    return 'glm-4.7';
  }

  async resolveModelOptions(configurationName?: string): Promise<ModelOptions> {
    const config =
      await this.modelProviderConfigService.resolveByNameOrDefaultWithSensitive(
        configurationName,
      );

    const proxyUrl = await this.purfenceConfigService.getProxyUrl();
    const model = this.mapProviderToModel(config.provider);

    const modelOptions: ModelOptions = {
      model,
      configurationName: config.name,
      apiKey: config.apiKey || undefined,
      baseUrl: config.baseUrl || undefined,
      proxyUrl,
      provider: config.provider,
    };

    if (model === 'codex') {
      const codexOptions = await this.codexTokenService.resolveCodexOptions(config.id);
      modelOptions.accessToken = codexOptions.accessToken;
      modelOptions.accountId = codexOptions.accountId;
    }

    return modelOptions;
  }
}
