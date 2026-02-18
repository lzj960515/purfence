import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  GET_PROVIDER_CONFIGS,
  CREATE_PROVIDER_CONFIG,
  UPDATE_PROVIDER_CONFIG,
  DELETE_PROVIDER_CONFIG,
} from '@/api/provider-config.graphql'

// Use generated GraphQL types
import type { ProviderType } from '@/api/gen/graphql'

export interface ProviderConfig {
  id: string
  provider: ProviderType
  name: string
  apiKey?: string
  email?: string
  refreshToken?: string
  baseUrl?: string
  isEnabled: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProviderConfigInput {
  provider: ProviderType
  name: string
  apiKey?: string
  email?: string
  refreshToken?: string
  baseUrl?: string
  isEnabled: boolean
  isDefault?: boolean
}

// Map GraphQL type to local type
const mapFromGraphQL = (data: any): ProviderConfig => ({
  id: data.id,
  provider: data.provider,
  name: data.name,
  apiKey: data.apiKey || undefined,
  email: data.email || undefined,
  refreshToken: data.refreshToken || undefined,
  baseUrl: data.baseUrl || undefined,
  isEnabled: data.isActive ?? false, // GraphQL uses isActive
  isDefault: data.isDefault ?? false,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
})

// Map local type to GraphQL create input
const mapToGraphQLCreateInput = (input: CreateProviderConfigInput) => {
  const result: any = {
    provider: input.provider,
    name: input.name,
    baseUrl: input.baseUrl || null,
    isActive: input.isEnabled,
    isDefault: input.isDefault ?? false,
  }

  if (input.provider.toUpperCase() !== 'CODEX' && input.apiKey) {
    result.apiKey = input.apiKey
  }

  if (input.email) {
    result.email = input.email
  }

  if (input.refreshToken) {
    result.refreshToken = input.refreshToken
  }

  return result
}

// Map local type to GraphQL update input
const mapToGraphQLUpdateInput = (updates: Partial<CreateProviderConfigInput>) => {
  const update: any = {}

  if (updates.name !== undefined) update.name = updates.name
  if (updates.apiKey !== undefined) update.apiKey = updates.apiKey
  if (updates.email !== undefined) update.email = updates.email
  if (updates.refreshToken !== undefined) update.refreshToken = updates.refreshToken
  if (updates.baseUrl !== undefined) update.baseUrl = updates.baseUrl
  if (updates.isEnabled !== undefined) update.isActive = updates.isEnabled
  if (updates.isDefault !== undefined) update.isDefault = updates.isDefault

  return update
}

export const useProviderConfigs = () => {
  const [configs, setConfigs] = useState<ProviderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // GraphQL queries and mutations
  const { data, refetch } = useQuery(GET_PROVIDER_CONFIGS, {
    fetchPolicy: 'network-only',
  })

  const [createMutation] = useMutation(CREATE_PROVIDER_CONFIG)
  const [updateMutation] = useMutation(UPDATE_PROVIDER_CONFIG)
  const [deleteMutation] = useMutation(DELETE_PROVIDER_CONFIG)

  // Load configs from GraphQL
  useEffect(() => {
    if (data?.modelProviderConfigDtos) {
      const mappedConfigs = data.modelProviderConfigDtos.nodes.map(mapFromGraphQL)
      setConfigs(mappedConfigs)
      setLoading(false)
    }
  }, [data])

  const addConfig = async (
    input: CreateProviderConfigInput
  ): Promise<ProviderConfig> => {
    try {
      setError(null)

      const { data: result } = await createMutation({
        variables: {
          input: {
            modelProviderConfigDto: mapToGraphQLCreateInput(input),
          },
        },
      })

      if (result?.createOneModelProviderConfigDto) {
        const newConfig = mapFromGraphQL(result.createOneModelProviderConfigDto)
        setConfigs([...configs, newConfig])
        return newConfig
      }

      throw new Error('Failed to create config')
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }

  const updateConfig = async (
    id: string,
    updates: Partial<CreateProviderConfigInput>
  ): Promise<void> => {
    try {
      setError(null)

      const { data: result } = await updateMutation({
        variables: {
          input: {
            id,
            update: mapToGraphQLUpdateInput(updates),
          },
        },
      })

      if (result?.updateOneModelProviderConfigDto) {
        const updatedConfig = mapFromGraphQL(result.updateOneModelProviderConfigDto)
        setConfigs(
          configs.map((c) => (c.id === id ? updatedConfig : c))
        )
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }

  const deleteConfig = async (id: string): Promise<void> => {
    try {
      setError(null)

      await deleteMutation({
        variables: {
          input: {
            id,
          },
        },
      })

      setConfigs(configs.filter((c) => c.id !== id))
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }

  const refetchConfigs = async () => {
    setLoading(true)
    try {
      await refetch()
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return {
    configs,
    loading,
    error,
    addConfig,
    updateConfig,
    deleteConfig,
    refetchConfigs,
  }
}
