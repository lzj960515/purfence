import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProviderConfigs } from '@/hooks/useProviderConfigs'
import { usePurfenceConfig } from '@/hooks/usePurfenceConfig'
import {
  getDesktopEnvironmentStatus,
  installBuiltinAgentsDesktop,
  installClaudeCodeDesktop,
  type DesktopEnvironmentStatus,
} from '@/lib/desktop-environment'

export interface EnvironmentItemStatus {
  installed: boolean
  detail?: string
}

export interface EnvironmentReadiness {
  platform: string
  allInstalled: boolean
  workspace: EnvironmentItemStatus
  provider: EnvironmentItemStatus
  node: EnvironmentItemStatus
  claudeCode: EnvironmentItemStatus
  git: EnvironmentItemStatus
  agents: EnvironmentItemStatus
}

interface ActionResult {
  success: boolean
  message: string
  updatedCount?: number
}

const EMPTY_DESKTOP_STATUS: DesktopEnvironmentStatus = {
  platform: 'unknown',
  node: { installed: false, detail: '未检测' },
  claudeCode: { installed: false, detail: '未检测' },
  git: { installed: false, detail: '未检测' },
  agents: { installed: false, detail: '未检测' },
}

export function useEnvironmentReadiness() {
  const {
    configs,
    loading: providerLoading,
    error: providerError,
    refetchConfigs,
  } = useProviderConfigs()
  const {
    config,
    loading: configLoading,
    error: configError,
    refetch: refetchPurfenceConfig,
  } = usePurfenceConfig()

  const [desktopStatus, setDesktopStatus] =
    useState<DesktopEnvironmentStatus>(EMPTY_DESKTOP_STATUS)
  const [desktopLoading, setDesktopLoading] = useState(true)
  const [desktopError, setDesktopError] = useState<Error | null>(null)
  const [installingClaudeCode, setInstallingClaudeCode] = useState(false)
  const [installingAgents, setInstallingAgents] = useState(false)

  const loadDesktopStatus = useCallback(async () => {
    setDesktopLoading(true)
    setDesktopError(null)
    try {
      const status = await getDesktopEnvironmentStatus()
      setDesktopStatus(status)
    } catch (error) {
      setDesktopError(error as Error)
    } finally {
      setDesktopLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDesktopStatus()
  }, [loadDesktopStatus])

  const providerInstalled = useMemo(
    () => configs.some((config) => config.isEnabled),
    [configs],
  )
  const workspaceInstalled = useMemo(
    () => Boolean(config?.projectsRootPath?.trim()),
    [config?.projectsRootPath],
  )

  const readiness: EnvironmentReadiness = useMemo(() => {
    const workspace: EnvironmentItemStatus = {
      installed: workspaceInstalled,
      detail: workspaceInstalled ? '已配置' : '请先配置工作目录',
    }

    const provider: EnvironmentItemStatus = {
      installed: providerInstalled,
      detail: providerInstalled ? '已配置' : '请先配置模型提供商',
    }

    return {
      platform: desktopStatus.platform,
      workspace,
      provider,
      node: desktopStatus.node,
      claudeCode: desktopStatus.claudeCode,
      git: desktopStatus.git,
      agents: desktopStatus.agents,
      allInstalled:
        workspace.installed &&
        provider.installed &&
        desktopStatus.node.installed &&
        desktopStatus.claudeCode.installed &&
        desktopStatus.git.installed &&
        desktopStatus.agents.installed,
    }
  }, [desktopStatus, providerInstalled, workspaceInstalled])

  const refetch = useCallback(async () => {
    await Promise.all([
      refetchConfigs(),
      refetchPurfenceConfig(),
      loadDesktopStatus(),
    ])
  }, [loadDesktopStatus, refetchConfigs, refetchPurfenceConfig])

  const installClaudeCode = useCallback(async (): Promise<ActionResult> => {
    setInstallingClaudeCode(true)
    try {
      return await installClaudeCodeDesktop()
    } finally {
      setInstallingClaudeCode(false)
    }
  }, [])

  const installBuiltinAgents = useCallback(async (): Promise<ActionResult> => {
    setInstallingAgents(true)
    try {
      return await installBuiltinAgentsDesktop()
    } finally {
      setInstallingAgents(false)
    }
  }, [])

  return {
    readiness,
    loading: providerLoading || configLoading || desktopLoading,
    error: providerError || configError || desktopError,
    refetch,
    installClaudeCode,
    installingClaudeCode,
    installBuiltinAgents,
    installingAgents,
  }
}
