import { Injectable } from '@nestjs/common';
import { PurfenceConfig } from './purfence-config.entity';

@Injectable()
export class PurfenceConfigService {
  async getConfig(): Promise<PurfenceConfig | undefined> {
    const configs = await PurfenceConfig.find();
    return configs[0];
  }

  async getProjectsRootPath(): Promise<string | undefined> {
    const config = await this.getConfig();
    return config?.projectsRootPath?.trim() || undefined;
  }

  async getProjectsRootPathOrThrow(): Promise<string> {
    const projectsRootPath = await this.getProjectsRootPath();
    if (!projectsRootPath) {
      throw new Error(
        'projectsRootPath is required. Please configure it in 基础配置.',
      );
    }
    return projectsRootPath;
  }

  async getProxyUrl(): Promise<string | undefined> {
    const config = await this.getConfig();
    return config?.proxyUrl || undefined;
  }

  async getMaxIssueConcurrency(): Promise<number> {
    const config = await this.getConfig();
    const concurrency = config?.maxIssueConcurrency ?? 2;
    // 确保最小值为 1
    return Math.max(1, concurrency);
  }
}
