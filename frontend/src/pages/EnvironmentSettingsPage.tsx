import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { EnvironmentChecklist } from '@/components/onboarding/EnvironmentChecklist'
import { ProviderConfigDialog } from '@/components/settings/ProviderConfigDialog'
import { useEnvironmentReadiness } from '@/hooks/useEnvironmentReadiness'
import { useProviderConfigs } from '@/hooks/useProviderConfigs'
import { useToast } from '@/hooks/use-toast'

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string' && error.trim()) {
    return error
  }
  if (error && typeof error === 'object') {
    const message = Reflect.get(error, 'message')
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }
  return fallback
}

export function EnvironmentSettingsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [providerDialogOpen, setProviderDialogOpen] = useState(false)
  const [claudeInstallLogs, setClaudeInstallLogs] = useState<string[]>([])
  const {
    readiness,
    loading,
    refetch,
    installClaudeCode,
    installingClaudeCode,
    installBuiltinAgents,
    installingAgents,
  } = useEnvironmentReadiness()
  const { addConfig, refetchConfigs } = useProviderConfigs()

  const busy = loading || installingClaudeCode || installingAgents

  const appendClaudeLog = (message: string) => {
    const now = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    setClaudeInstallLogs((prev) => [...prev, `[${now}] ${message}`])
  }

  useEffect(() => {
    if (!isTauri()) return

    let unlisten: (() => void) | undefined
    void listen<{ stream: string; message: string }>('claude-install-log', (event) => {
      const { stream, message } = event.payload
      const prefix = stream === 'stderr' ? '[stderr] ' : stream === 'stdout' ? '' : '[info] '
      appendClaudeLog(`${prefix}${message}`)
    }).then((fn) => {
      unlisten = fn
    })

    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  const handleInstallClaudeCode = async () => {
    setClaudeInstallLogs([])
    appendClaudeLog('开始一键安装 Node.js / Git / Claude Code')
    toast({
      title: '正在安装运行环境',
      description: '将自动补齐 Node.js、Git 与 Claude Code，请稍候。',
    })
    try {
      const result = await installClaudeCode()
      appendClaudeLog(result.message)
      toast({
        title: result.success ? '环境安装完成' : '环境安装失败',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
      await refetch()
    } catch (error) {
      const message = getErrorMessage(error, '安装失败，请稍后重试')
      appendClaudeLog(message)
      toast({
        title: '环境安装失败',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleInstallAgents = async () => {
    const result = await installBuiltinAgents()
    toast({
      title: result.success ? '内置 Agents 安装完成' : '内置 Agents 安装失败',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    })
    await refetch()
  }

  const handleSaveProvider = async (data: Parameters<typeof addConfig>[0]) => {
    await addConfig(data)
    await Promise.all([refetchConfigs(), refetch()])
    setProviderDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">环境检查</h1>
        <p className="text-muted-foreground mt-1 text-sm">检查并补齐 Node.js、Git、Claude Code 与内置 agents 依赖。</p>
      </div>

      <EnvironmentChecklist
        readiness={readiness}
        busy={busy}
        installingClaudeCode={installingClaudeCode}
        claudeInstallLogs={claudeInstallLogs}
        onInstallProvider={() => setProviderDialogOpen(true)}
        onInstallWorkspace={() => navigate('/settings/base')}
        onInstallClaudeCode={handleInstallClaudeCode}
        onInstallAgents={handleInstallAgents}
        compact
      />

      <ProviderConfigDialog
        open={providerDialogOpen}
        mode="add"
        onSave={handleSaveProvider}
        onCancel={() => setProviderDialogOpen(false)}
      />
    </div>
  )
}
