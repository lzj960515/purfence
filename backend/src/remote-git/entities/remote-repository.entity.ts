import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index, Unique } from 'typeorm';

export enum RemoteRepositoryType {
  GITLAB = 'gitlab',
  GITHUB = 'github',
}

export enum RemoteRepositoryStatus {
  CONNECTED = 'connected',
  ERROR = 'error',
  EXPIRED = 'expired',
}

@Entity()
@Unique(['projectId'])
export class RemoteRepositoryConfig extends BaseEntity {
  @Index()
  @Column({ ...IDColumnOpts })
  projectId: string;

  @Column({
    type: 'varchar',
    length: 16,
  })
  type: RemoteRepositoryType;

  @Column({ type: 'varchar', length: 512 })
  url: string;

  @Column({ type: 'text' })
  encryptedToken: string;

  @Column({ type: 'varchar', length: 64, default: 'main' })
  defaultBranch: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: RemoteRepositoryStatus.CONNECTED,
  })
  status: RemoteRepositoryStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt?: Date;
}
