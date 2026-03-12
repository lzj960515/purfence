import { BaseEntity } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';

export enum ConfigKey {
  PROJECTS_ROOT_PATH = 'PROJECTS_ROOT_PATH',
  PROXY_URL = 'PROXY_URL',
  MAX_ISSUE_CONCURRENCY = 'MAX_ISSUE_CONCURRENCY',
  MODEL_CONFIG = 'MODEL_CONFIG',
}

@Entity()
@Index(['key'], { unique: true })
export class PurfenceConfig extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'json', nullable: true })
  value?: any;
}
