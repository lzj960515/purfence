import { BaseEntity } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';
import { ModelConfig } from '../type';

@Index(['name'], { unique: true })
@Entity()
export class Agent extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  changeDescription: string;

  @Column({ nullable: true })
  parentId?: string;

  @Column({ default: false, comment: '是否为全局角色, 所有agent可以访问' })
  global: boolean;

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
}
