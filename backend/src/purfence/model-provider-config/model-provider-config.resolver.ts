import { Resolver, Mutation, Args, ID } from '@nestjs/graphql';
import { ModelProviderConfigService } from './model-provider-config.service';
import { ModelProviderConfigDto } from './model-provider-config.dto';

/**
 * ModelProviderConfig Resolver
 *
 * Provides GraphQL mutations for managing model provider configurations.
 * Note: getActiveProviderConfig() is intentionally NOT exposed as a Query
 * for security reasons - it should only be called internally by services
 * like LlmService, not through the GraphQL API.
 */
@Resolver(() => ModelProviderConfigDto)
export class ModelProviderConfigResolver {
  constructor(private readonly service: ModelProviderConfigService) {}

  /**
   * Toggle the active status of a model provider configuration
   *
   * When setting a configuration to active, all other configurations
   * for the same provider will be automatically deactivated.
   *
   * @param id Configuration ID
   * @param isActive New active state
   * @returns Updated configuration (without sensitive data)
   */
  @Mutation(() => ModelProviderConfigDto, { name: 'toggleModelProviderConfig' })
  async toggleActive(
    @Args('id', { type: () => ID }) id: string,
    @Args('isActive') isActive: boolean,
  ): Promise<ModelProviderConfigDto> {
    return this.service.toggleActive(id, isActive);
  }
}
