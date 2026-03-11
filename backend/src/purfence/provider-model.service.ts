import { ModelOptions } from '@app/my-agent/types';
import { Injectable } from '@nestjs/common';
import { CodexTokenService } from './codex/codex-token.service';
import { ModelProviderConfigService } from './model-provider-config/model-provider-config.service';
import { PurfenceConfigService } from './purfence-config/purfence-config.service';

@Injectable()
export class ProviderModelService {
  constructor(
    private readonly modelProviderConfigService: ModelProviderConfigService,
    private readonly purfenceConfigService: PurfenceConfigService,
    private readonly codexTokenService: CodexTokenService,
  ) {}

  async resolveModelOptions(configurationName?: string): Promise<ModelOptions> {
    const config =
      await this.modelProviderConfigService.resolveByNameOrDefaultWithSensitive(
        configurationName,
      );

    const proxyUrl = await this.purfenceConfigService.getProxyUrl();

    const modelOptions: ModelOptions = {
      model: 'gpt-5.4',
      apiKey: config.apiKey || undefined,
      baseUrl: config.baseUrl || undefined,
      proxyUrl,
      provider: config.provider,
    };

    return modelOptions as ModelOptions;
  }
}
