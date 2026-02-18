import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { PurfenceStatus } from './purfence-status.enum';
import { IssueOrigin } from './purfence-status.enum';

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
}
