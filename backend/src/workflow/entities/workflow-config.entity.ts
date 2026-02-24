import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, Index, Unique } from 'typeorm';

export enum WorkflowMode {
  STANDALONE = 'standalone',
  COLLABORATIVE = 'collaborative',
}

@Entity()
@Unique(['projectId'])
export class WorkflowConfig extends BaseEntity {
  @Index()
  @Column({ ...IDColumnOpts })
  projectId: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: WorkflowMode.STANDALONE,
  })
  mode: WorkflowMode;

  @Column({ type: 'boolean', default: true })
  autoCreateIssue: boolean;

  @Column({ type: 'boolean', default: true })
  autoMerge: boolean;

  @Column({ type: 'boolean', default: true })
  autoPush: boolean;

  @Column({ type: 'boolean', default: false })
  requireManualApproval: boolean;
}
