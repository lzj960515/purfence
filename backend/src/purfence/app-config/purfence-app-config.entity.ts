import { BaseEntity } from '@app/shared';
import { Column, Entity } from 'typeorm';
import { AppConfigType } from '../types/app-config-type.enum';

@Entity()
export class PurfenceAppConfig extends BaseEntity {
  @Column({ type: 'varchar', length: 128, default: '' })
  name: string;

  @Column({ type: 'varchar', length: 64 })
  type: AppConfigType;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'json', nullable: true })
  config?: Record<string, unknown>;
}
