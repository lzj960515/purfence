import { Injectable } from '@nestjs/common';
import { AppConfigType } from '../types/app-config-type.enum';
import { PurfenceAppConfig } from './purfence-app-config.entity';

export interface SlackRuntimeConfig {
  appConfigId: string;
  name: string;
  enabled: boolean;
  botToken: string;
  appToken: string;
  providerName?: string;
}

@Injectable()
export class PurfenceAppConfigService {
  async getById(id: string) {
    return PurfenceAppConfig.findOne({ where: { id } });
  }

  async getByType(type: AppConfigType) {
    return PurfenceAppConfig.find({
      where: { type },
      order: { updatedAt: 'DESC' },
    });
  }

  async getSlackRuntimeConfig(): Promise<SlackRuntimeConfig | null> {
    const configs = await this.getByType(AppConfigType.SLACK);
    const config = configs.find((item) => item.enabled);
    if (!config) {
      return null;
    }

    return this.toSlackRuntimeConfig(config);
  }

  async getSlackRuntimeConfigById(
    appConfigId: string,
  ): Promise<SlackRuntimeConfig | null> {
    const config = await this.getById(appConfigId);
    if (!config || config.type !== AppConfigType.SLACK) {
      return null;
    }

    return this.toSlackRuntimeConfig(config);
  }

  private toSlackRuntimeConfig(
    config: PurfenceAppConfig,
  ): SlackRuntimeConfig | null {
    if (!config?.enabled) {
      return null;
    }

    const payload = (config.config || {}) as Record<string, unknown>;
    const botToken = String(payload.botToken || '').trim();
    const appToken = String(payload.appToken || '').trim();
    const providerNameRaw = String(payload.providerName || '').trim();
    if (!botToken || !appToken) {
      return null;
    }

    return {
      appConfigId: config.id,
      name: config.name,
      enabled: config.enabled,
      botToken,
      appToken,
      providerName: providerNameRaw || undefined,
    };
  }
}
