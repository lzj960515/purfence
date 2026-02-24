import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { PurfenceStatus, IssueOrigin } from './purfence-status.enum';

export interface RemoteIssueData {
  remoteIssueId: string;
  remoteIssueNumber: number;
  remoteUrl: string;
  remoteState: string;
  lastSyncedAt: Date;
  syncedData?: {
    title: string;
    description: string;
    labels: string[];
    assignees: string[];
  };
}

@Index(['projectId'])
@Index(['dependsOnIssueId'])
@Entity()
export class PurfenceIssue extends BaseEntity {
  @Column({ ...IDColumnOpts })
  projectId: string;

  @Column({ type: 'varchar', length: 256 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 48, nullable: true })
  slug?: string;

  @Column({ type: 'varchar', length: 32, default: PurfenceStatus.open })
  status: PurfenceStatus;

  @Column({ type: 'varchar', length: 512, nullable: true })
  workdir: string;

  @Column({ ...IDColumnOpts, nullable: true })
  latestExecutionId?: string;

  @Column({ ...IDColumnOpts, nullable: true })
  dependsOnIssueId?: string;

  @ManyToOne(() => PurfenceIssue, { nullable: true })
  @JoinColumn({ name: 'dependsOnIssueId' })
  dependsOnIssue?: PurfenceIssue;

  @Column({ type: 'varchar', length: 32, default: IssueOrigin.user })
  origin: IssueOrigin;

  @Column({ type: 'varchar', length: 8, nullable: true })
  branchSuffix?: string;

  @Column({ type: 'json', nullable: true })
  remoteIssueData?: RemoteIssueData;
}
