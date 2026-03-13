import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  GET_PROVIDER_CONFIGS,
  CREATE_PROVIDER_CONFIG,
  UPDATE_PROVIDER_CONFIG,
  DELETE_PROVIDER_CONFIG,
} from '@/api/provider-config.graphql'

import type { ProviderType } from '@/api/gen/graphql'

export interface ProviderConfig {
  id: string
  provider: ProviderType
  name: string
  apiKey?: string
  baseUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProviderConfigInput {
  provider: ProviderType
  name: string
  apiKey?: string
  baseUrl?: string
  isActive: boolean
}

const mapFromGraphQL = (data: any): ProviderConfig => ({
  id: data.id,
  provider: data.provider,
  name: data.name,
  apiKey: data.apiKey || undefined,
  baseUrl: data.baseUrl || undefined,
  isActive: data.isActive ?? false,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
})

const mapToGraphQLCreateInput = (input: CreateProviderConfigInput) => {
  const result: any = {
    provider: input.provider.toUpperCase(),
    name: input.name,
    baseUrl: input.baseUrl || null,
    isActive: input.isActive,
  }

  if (input.apiKey) {
    result.apiKey = input.apiKey
  }

  return result
}

const mapToGraphQLUpdateInput = (updates: Partial<CreateProviderConfigInput>) => {
  const update: any = {}

  if (updates.name !== undefined) update.name = updates.name
  if (updates.apiKey !== undefined) update.apiKey = updates.apiKey
  if (updates.baseUrl !== undefined) update.baseUrl = updates.baseUrl
  if (updates.isActive !== undefined) update.isActive = updates.isActive
  if (updates.provider !== undefined) update.provider = updates.provider.toUpperCase()

  return update
}

export const useProviderConfigs = () => {
  const [configs, setConfigs] = useState<ProviderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { data, refetch } = useQuery(GET_PROVIDER_CONFIGS, {
    fetchPolicy: 'network-only',
  })

  const [createMutation] = useMutation(CREATE_PROVIDER_CONFIG)
  const [updateMutation] = useMutation(UPDATE_PROVIDER_CONFIG)
  const [deleteMutation] = useMutation(DELETE_PROVIDER_CONFIG)

  useEffect(() => {
    if (data?.modelProviders) {
      const mappedConfigs = data.modelProviders.nodes.map(mapFromGraphQL)
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
            modelProvider: mapToGraphQLCreateInput(input),
          },
        },
      })

      if (result?.createOneModelProvider) {
        const newConfig = mapFromGraphQL(result.createOneModelProvider)
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

      if (result?.updateOneModelProvider) {
        const updatedConfig = mapFromGraphQL(result.updateOneModelProvider)
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
