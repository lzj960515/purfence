import { BaseEntity } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';

@Index(['name'])
@Index(['slug'], { unique: true })
@Entity()
export class PurfenceProject extends BaseEntity {
  @Column({ type: 'varchar', length: 128, nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  slug?: string;

  @Column({ type: 'varchar', length: 512, default: '' })
  localRootPath: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  externalPath?: string;

  @Column({ type: 'varchar', length: 32, default: 'main' })
  defaultBranch: string;
}
