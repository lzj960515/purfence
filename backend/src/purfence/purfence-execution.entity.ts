import { BaseEntity } from '@app/shared';
import { Column, Entity, Index, BeforeInsert } from 'typeorm';
import { Field } from '@nestjs/graphql';
import { PurfenceStatus, ExecutionStage } from './purfence-status.enum';
import { randomUUID } from 'node:crypto';

@Index(['projectId'])
@Index(['issueId'])
@Entity()
export class PurfenceExecution extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  projectId: string;

  @Column({ type: 'varchar', length: 36 })
  issueId: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  goal: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  sessionId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  parentExecutionId?: string;

  @Column({ type: 'varchar', length: 32, default: PurfenceStatus.running })
  status: PurfenceStatus;

  @Column({ type: 'varchar', length: 32, default: ExecutionStage.tianji })
  stage: ExecutionStage;

  @Column({ type: 'text', nullable: true })
  error?: string;
}
