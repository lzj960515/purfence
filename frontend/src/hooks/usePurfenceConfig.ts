import { useCallback, useMemo } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  CREATE_PURFENCE_CONFIG,
  GET_ALL_PURFENCE_CONFIGS,
  UPDATE_PURFENCE_CONFIG,
} from '@/api/purfence-config.graphql'
import { GET_PROVIDER_CONFIGS } from '@/api/provider-config.graphql'

export const CONFIG_KEYS = {
  PROJECTS_ROOT_PATH: 'PROJECTS_ROOT_PATH',
  PROXY_URL: 'PROXY_URL',
  MAX_ISSUE_CONCURRENCY: 'MAX_ISSUE_CONCURRENCY',
  MODEL_CONFIG: 'MODEL_CONFIG',
} as const

export type ModelConfigItem = {
  id: string
  model: string
}

export type ModelConfig = {
  default: ModelConfigItem
  fallbacks: ModelConfigItem[]
}

type PurfenceConfigItem = {
  id: string
  key: string
  value: unknown
  createdAt: string
  updatedAt: string
}

type ProviderConfig = {
  id: string
  name: string
  provider: string
}

export function usePurfenceConfig() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_PURFENCE_CONFIGS, {
    fetchPolicy: 'network-only',
  })

  const { data: providersData } = useQuery(GET_PROVIDER_CONFIGS, {
    fetchPolicy: 'network-only',
  })

  const [createMutation, { loading: creating }] = useMutation(
    CREATE_PURFENCE_CONFIG
  )
  const [updateMutation, { loading: updating }] = useMutation(
    UPDATE_PURFENCE_CONFIG
  )

  const configs: PurfenceConfigItem[] = useMemo(
    () => data?.purfenceConfigs?.nodes ?? [],
    [data?.purfenceConfigs?.nodes]
  )
  const providers: ProviderConfig[] = useMemo(
    () => providersData?.modelProviders?.nodes ?? [],
    [providersData?.modelProviders?.nodes]
  )

  const configById = useMemo(() => {
    const entries: Record<string, PurfenceConfigItem> = {}
    for (const config of configs) {
      entries[config.key] = config
    }
    return entries
  }, [configs])

  const getValue = useCallback(
    <T,>(key: string): T | undefined => configById[key]?.value as T | undefined,
    [configById]
  )

  const saveSingleConfig = useCallback(async <T,>(key: string, value: T) => {
    const existing = configById[key]
    if (existing) {
      await updateMutation({
        variables: {
          input: {
            id: existing.id,
            update: { value },
          },
        },
      })
    } else {
      await createMutation({
        variables: {
          input: {
            purfenceConfig: { key, value },
          },
        },
      })
    }
  }, [configById, createMutation, updateMutation])

  const saveConfig = useCallback(async (input: {
    projectsRootPath: string
    proxyUrl: string
  }) => {
    const itemsToSave = [
      {
        key: CONFIG_KEYS.PROJECTS_ROOT_PATH,
        value: input.projectsRootPath.trim() || null,
      },
      {
        key: CONFIG_KEYS.PROXY_URL,
        value: input.proxyUrl.trim() || null,
      },
    ]

    for (const { key, value } of itemsToSave) {
      await saveSingleConfig(key, value)
    }

    await refetch()
  }, [refetch, saveSingleConfig])

  const saveModelConfig = useCallback(async (modelConfig: ModelConfig) => {
    await saveSingleConfig(CONFIG_KEYS.MODEL_CONFIG, modelConfig)
    await refetch()
  }, [refetch, saveSingleConfig])

  const getModelConfig = useCallback(
    (): ModelConfig | undefined => getValue<ModelConfig>(CONFIG_KEYS.MODEL_CONFIG),
    [getValue]
  )

  return {
    config: {
      projectsRootPath: getValue<string>(CONFIG_KEYS.PROJECTS_ROOT_PATH),
      proxyUrl: getValue<string>(CONFIG_KEYS.PROXY_URL),
    },
    configs,
    providers,
    loading,
    error,
    saving: creating || updating,
    saveConfig,
    saveModelConfig,
    getModelConfig,
    refetch,
  }
}
