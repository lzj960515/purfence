import { BaseEntity } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';
import { ModelConfig } from '../type';

@Index(['name', 'version'], { unique: true })
@Entity()
export class Agent extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'simple-json',
    nullable: true,
    comment: '为空所有agent都可以访问该agent',
  })
  tags: string[];

  @Column({ type: 'simple-json', nullable: true, comment: '为空使用全部工具' })
  tools: string[];

  @Column({
    type: 'simple-json',
    nullable: true,
    comment: '为空使用全部skills',
  })
  skills: string[];

  @Column({ type: 'json', nullable: true, comment: '为空使用全局配置' })
  modelConfig: ModelConfig;

  @Column({ type: 'int', default: 1 })
  version: number;
}
