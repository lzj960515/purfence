import { BaseEntity } from '@app/shared';
import { Column, Entity } from 'typeorm';

@Entity()
export class PurfenceConfig extends BaseEntity {
  @Column({ type: 'varchar', length: 1024, nullable: true })
  projectsRootPath?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  proxyUrl?: string;

  @Column({ type: 'int', default: 2 })
  maxIssueConcurrency: number;
}
