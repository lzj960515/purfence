import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isTauri } from '@tauri-apps/api/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EnvironmentChecklist } from '@/components/onboarding/EnvironmentChecklist'
import { ProviderConfigDialog } from '@/components/settings/ProviderConfigDialog'
import { usePurfenceConfig } from '@/hooks/usePurfenceConfig'
import { useProviderConfigs } from '@/hooks/useProviderConfigs'
import { useToast } from '@/hooks/use-toast'

const ONBOARDING_DONE_KEY = 'purfence.onboarding.done'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [providerDialogOpen, setProviderDialogOpen] = useState(false)
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false)
  const [projectsRootPath, setProjectsRootPath] = useState('')
  const { addConfig, configs, loading: providerLoading, refetchConfigs } = useProviderConfigs()
  const { config: purfenceConfig, loading: configLoading, saving: savingWorkspace, saveConfig } = usePurfenceConfig()

  useEffect(() => {
    setProjectsRootPath(purfenceConfig?.projectsRootPath || '')
  }, [purfenceConfig?.projectsRootPath])

  const busy = providerLoading || configLoading || savingWorkspace

  const workspaceReady = useMemo(
    () => ({
      installed: Boolean(purfenceConfig?.projectsRootPath?.trim()),
      detail: purfenceConfig?.projectsRootPath?.trim() ? '已配置' : '请先配置工作目录',
    }),
    [purfenceConfig?.projectsRootPath],
  )

  const providerReady = useMemo(
    () => ({
      installed: configs.some((config) => config.isActive),
      detail: configs.some((config) => config.isActive) ? '已配置' : '请先配置模型提供商',
    }),
    [configs],
  )

  const handleSaveProvider = async (data: Parameters<typeof addConfig>[0]) => {
    await addConfig(data)
    await refetchConfigs()
    setProviderDialogOpen(false)
  }

  const handlePickProjectsRootPath = async () => {
    if (!isTauri()) {
      toast({
        title: '当前环境不支持',
        description: '请选择桌面版后再使用文件夹选择功能。',
        variant: 'destructive',
      })
      return
    }

    try {
      const { open } = await import('@tauri-apps/plugin-dialog')
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择工作目录',
        defaultPath: projectsRootPath.trim() || undefined,
      })

      if (typeof selected === 'string') {
        setProjectsRootPath(selected)
      }
    } catch (err) {
      toast({
        title: '选择失败',
        description: err instanceof Error ? err.message : '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  const handleSaveWorkspace = async () => {
    const normalizedProjectsRootPath = projectsRootPath.trim()
    if (!normalizedProjectsRootPath) {
      toast({
        title: '保存失败',
        description: '工作目录不能为空',
        variant: 'destructive',
      })
      return
    }

    try {
      await saveConfig({
        projectsRootPath: normalizedProjectsRootPath,
        proxyUrl: purfenceConfig?.proxyUrl || '',
      })
      setWorkspaceDialogOpen(false)
      toast({
        title: '保存成功',
        description: '工作目录已更新',
      })
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  const finishOnboarding = () => {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1')
    navigate('/agent', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#ecf4ff_0%,#f4f7fb_40%,#eef2f7_100%)] px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center">
        <Card className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_32px_90px_-44px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <CardContent className="space-y-6 p-8 md:p-10">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Welcome to <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Purfence</span>
            </h1>
          </div>

          <div className="mx-auto w-full max-w-2xl">
            <EnvironmentChecklist
              embedded
              workspace={workspaceReady}
              provider={providerReady}
              busy={busy}
              onConfigureProvider={() => setProviderDialogOpen(true)}
              onConfigureWorkspace={() => setWorkspaceDialogOpen(true)}
              onLater={finishOnboarding}
              onDone={finishOnboarding}
            />
          </div>

          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-indigo-200/30 blur-3xl" />
          </CardContent>
        </Card>
      </div>

      <ProviderConfigDialog
        open={providerDialogOpen}
        mode="add"
        onSave={handleSaveProvider}
        onCancel={() => setProviderDialogOpen(false)}
      />

      <Dialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>配置工作目录</DialogTitle>
            <DialogDescription>
              新建项目与工作区会创建在这个目录下。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="onboarding-projects-root-path">工作目录</Label>
            <div className="flex gap-3">
              <Input
                id="onboarding-projects-root-path"
                placeholder="例如: C:\\Purfence\\projects 或 /Users/you/purfence/projects"
                value={projectsRootPath}
                onChange={(e) => setProjectsRootPath(e.target.value)}
                disabled={savingWorkspace}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handlePickProjectsRootPath}
                disabled={savingWorkspace}
              >
                选择文件夹
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWorkspaceDialogOpen(false)}
              disabled={savingWorkspace}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveWorkspace}
              disabled={savingWorkspace || !projectsRootPath.trim()}
            >
              {savingWorkspace ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function hasOnboardingCompleted() {
  return localStorage.getItem(ONBOARDING_DONE_KEY) === '1'
}
