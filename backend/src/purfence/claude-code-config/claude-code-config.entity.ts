import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity } from 'typeorm';

export type ClaudeCodeEnvItem = {
  key: string;
  value: string;
};

@Entity()
export class ClaudeCodeConfig extends BaseEntity {
  @Column({ type: 'boolean', default: true })
  useDefaultConfig: boolean;

  @Column({ ...IDColumnOpts, nullable: true })
  modelProviderId?: string;

  @Column({ type: 'json', nullable: true })
  env?: ClaudeCodeEnvItem[];
}
