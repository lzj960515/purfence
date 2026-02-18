import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  CREATE_APP_CONFIG,
  DELETE_APP_CONFIG,
  GET_APP_CONFIGS,
  UPDATE_APP_CONFIG,
} from '@/api/app-config.graphql'

export type AppConfigType = 'SLACK'

export interface AppConfigItem {
  id: string
  name: string
  type: AppConfigType
  enabled: boolean
  config?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface AppConfigInput {
  name: string
  type: AppConfigType
  enabled: boolean
  config?: Record<string, unknown>
}

const mapFromGraphQL = (node: any): AppConfigItem => ({
  id: node.id,
  name: String(node.name || ''),
  type: node.type,
  enabled: Boolean(node.enabled),
  config:
    node.config && typeof node.config === 'object'
      ? (node.config as Record<string, unknown>)
      : undefined,
  createdAt: node.createdAt,
  updatedAt: node.updatedAt,
})

export function useAppConfigs() {
  const [items, setItems] = useState<AppConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { data, refetch } = useQuery(GET_APP_CONFIGS, {
    fetchPolicy: 'network-only',
  })
  const [createMutation] = useMutation(CREATE_APP_CONFIG)
  const [updateMutation] = useMutation(UPDATE_APP_CONFIG)
  const [deleteMutation] = useMutation(DELETE_APP_CONFIG)

  useEffect(() => {
    if (!data?.purfenceAppConfigs) return
    const next = data.purfenceAppConfigs.nodes.map(mapFromGraphQL)
    setItems(next)
    setLoading(false)
  }, [data])

  const createItem = async (input: AppConfigInput) => {
    setError(null)
    const result = await createMutation({
      variables: {
        input: {
          purfenceAppConfig: input,
        },
      },
    })

    const created = result.data?.createOnePurfenceAppConfig
    if (!created) {
      throw new Error('创建 App 配置失败')
    }

    const mapped = mapFromGraphQL(created)
    setItems((prev) => [...prev, mapped])
    return mapped
  }

  const updateItem = async (id: string, updates: Partial<AppConfigInput>) => {
    setError(null)
    const result = await updateMutation({
      variables: {
        input: {
          id,
          update: updates,
        },
      },
    })

    const updated = result.data?.updateOnePurfenceAppConfig
    if (!updated) {
      throw new Error('更新 App 配置失败')
    }

    const mapped = mapFromGraphQL(updated)
    setItems((prev) => prev.map((item) => (item.id === id ? mapped : item)))
    return mapped
  }

  const deleteItem = async (id: string) => {
    setError(null)
    await deleteMutation({
      variables: {
        input: { id },
      },
    })
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const refetchItems = async () => {
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
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refetchItems,
  }
}
