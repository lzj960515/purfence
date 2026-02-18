import { useMemo } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  CREATE_CLAUDE_CODE_CONFIG,
  GET_CLAUDE_CODE_CONFIGS,
  GET_PROVIDER_OPTIONS_FOR_CLAUDE,
  UPDATE_CLAUDE_CODE_CONFIG,
} from '@/api/claude-code-config.graphql'
import type { ProviderType } from '@/api/gen/graphql'

export type ClaudeCodeEnvItem = {
  key: string
  value: string
}

export type ClaudeCodeConfig = {
  id: string
  useDefaultConfig: boolean
  modelProviderId?: string
  env: ClaudeCodeEnvItem[]
}

export type ClaudeCodeProviderOption = {
  id: string
  name: string
  provider: ProviderType
}

type ClaudeCodeConfigNode = {
  id: string
  useDefaultConfig?: boolean | null
  modelProviderId?: string | null
  env?: ClaudeCodeEnvItem[] | null
}

type GetClaudeCodeConfigsResult = {
  claudeCodeConfigs?: {
    nodes: ClaudeCodeConfigNode[]
  }
}

type ProviderNode = {
  id: string
  name: string
  provider: ProviderType
  isActive: boolean
}

type GetProviderOptionsForClaudeResult = {
  modelProviderConfigDtos?: {
    nodes: ProviderNode[]
  }
}

export function useClaudeCodeConfig() {
  const {
    data: configData,
    loading: configLoading,
    error: configError,
    refetch: refetchConfig,
  } = useQuery<GetClaudeCodeConfigsResult>(GET_CLAUDE_CODE_CONFIGS, {
    fetchPolicy: 'network-only',
  })

  const {
    data: providerData,
    loading: providerLoading,
    error: providerError,
  } = useQuery<GetProviderOptionsForClaudeResult>(GET_PROVIDER_OPTIONS_FOR_CLAUDE, {
    fetchPolicy: 'network-only',
  })

  const [createMutation, { loading: creating }] = useMutation(
    CREATE_CLAUDE_CODE_CONFIG
  )
  const [updateMutation, { loading: updating }] = useMutation(
    UPDATE_CLAUDE_CODE_CONFIG
  )

  const config = useMemo<ClaudeCodeConfig | null>(() => {
    const configNode = configData?.claudeCodeConfigs?.nodes?.[0]
    if (!configNode) {
      return null
    }

    return {
      id: configNode.id,
      useDefaultConfig: configNode.useDefaultConfig ?? true,
      modelProviderId: configNode.modelProviderId || undefined,
      env: (configNode.env || []).filter((item) => !!item?.key),
    }
  }, [configData])

  const providers = useMemo<ClaudeCodeProviderOption[]>(() => {
    return (providerData?.modelProviderConfigDtos?.nodes || [])
      .filter((item) => {
        if (!item?.isActive) return false
        const provider = String(item.provider || '').toUpperCase()
        return provider === 'KIMI' || provider === 'ZHIPU'
      })
      .map((item) => ({
        id: item.id,
        name: item.name,
        provider: item.provider,
      }))
  }, [providerData])

  const saveConfig = async (input: {
    useDefaultConfig: boolean
    modelProviderId?: string
    env: ClaudeCodeEnvItem[]
  }) => {
    const env = input.env
      .map((item) => ({
        key: item.key.trim(),
        value: item.value,
      }))
      .filter((item) => item.key)

    const payload = {
      useDefaultConfig: input.useDefaultConfig,
      modelProviderId: input.useDefaultConfig ? null : input.modelProviderId || null,
      env,
    }

    if (config?.id) {
      await updateMutation({
        variables: {
          input: {
            id: config.id,
            update: payload,
          },
        },
      })
    } else {
      await createMutation({
        variables: {
          input: {
            claudeCodeConfig: payload,
          },
        },
      })
    }

    await refetchConfig()
  }

  return {
    config,
    providers,
    loading: configLoading || providerLoading,
    error: configError || providerError,
    saving: creating || updating,
    saveConfig,
    refetchConfig,
  }
}
