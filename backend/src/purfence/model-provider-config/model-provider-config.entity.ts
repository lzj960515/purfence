import { BaseEntity } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';
import { ProviderType } from '../types/provider-type.enum';

/**
 * ModelProviderConfig Entity
 *
 * Represents configuration for AI model providers (OpenAI, Kimi, Zhipu).
 * Supports encrypted storage of API keys and refresh tokens.
 *
 * @extends BaseEntity - Provides id, createdAt, updatedAt
 */
@Entity()
@Index(['provider', 'name'], { unique: true })
export class ModelProviderConfig extends BaseEntity {
  /**
   * Provider type (openai, kimi, zhipu, codex)
   */
  @Column({
    type: 'varchar',
    length: 50,
    default: ProviderType.OPENAI,
  })
  provider: ProviderType;

  /**
   * User-defined configuration name
   */
  @Column({ type: 'varchar' })
  name: string;

  /**
   * Optional account email for OAuth-backed configurations.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  /**
   * API key
   * Required for non-Codex providers
   */
  @Column({ type: 'text', nullable: true })
  apiKey?: string;

  /**
   * OAuth refresh token (optional)
   * Only used by Codex provider
   */
  @Column({ type: 'text', nullable: true })
  refreshToken?: string;

  /**
   * OAuth payload (access token, expiry, id token claims, account id, etc.)
   */
  @Column({ type: 'simple-json', nullable: true })
  oauthInfo?: Record<string, unknown>;

  /**
   * Custom base URL for API requests (optional)
   * Only OpenAI supports custom base URL
   */
  @Column({ type: 'text', nullable: true })
  baseUrl?: string;

  /**
   * Whether this configuration is active
   * Only one configuration per provider can be active at a time
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Whether this config is the default runtime selection.
   */
  @Column({ type: 'boolean', default: false })
  isDefault: boolean;
}
