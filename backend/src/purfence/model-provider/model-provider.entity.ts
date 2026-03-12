import { BaseEntity } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';
import { ProviderType } from '../types/provider-type.enum';

@Entity()
@Index(['provider', 'name'], { unique: true })
export class ModelProvider extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    default: ProviderType.OPENAI,
  })
  provider: ProviderType;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  apiKey?: string;

  @Column({ type: 'text', nullable: true })
  baseUrl?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
