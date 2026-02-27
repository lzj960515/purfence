import { useMutation, useQuery } from '@apollo/client'
import {
  CREATE_PURFENCE_CONFIG,
  GET_PURFENCE_CONFIGS,
  UPDATE_PURFENCE_CONFIG,
} from '@/api/purfence-config.graphql'

type PurfenceConfig = {
  id: string
  projectsRootPath?: string | null
  proxyUrl?: string | null
  createdAt: string
  updatedAt: string
}

export function usePurfenceConfig() {
  const { data, loading, error, refetch } = useQuery(GET_PURFENCE_CONFIGS, {
    fetchPolicy: 'network-only',
  })

  const [createMutation, { loading: creating }] = useMutation(
    CREATE_PURFENCE_CONFIG
  )
  const [updateMutation, { loading: updating }] = useMutation(
    UPDATE_PURFENCE_CONFIG
  )

  const config: PurfenceConfig | null = data?.purfenceConfigs?.nodes?.[0] ?? null

  const saveConfig = async (input: {
    projectsRootPath: string
    proxyUrl: string
  }) => {
    const normalizedProjectsRootPath = input.projectsRootPath.trim()
    const normalizedProxyUrl = input.proxyUrl.trim()

    if (config) {
      await updateMutation({
        variables: {
          input: {
            id: config.id,
            update: {
              projectsRootPath: normalizedProjectsRootPath,
              proxyUrl: normalizedProxyUrl || null,
            },
          },
        },
      })
    } else {
      await createMutation({
        variables: {
          input: {
            purfenceConfig: {
              projectsRootPath: normalizedProjectsRootPath,
              proxyUrl: normalizedProxyUrl || null,
            },
          },
        },
      })
    }

    await refetch()
  }

  return {
    config,
    loading,
    error,
    saving: creating || updating,
    saveConfig,
    refetch,
  }
}
