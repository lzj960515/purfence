import { useEffect, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { usePurfenceConfig } from '@/hooks/usePurfenceConfig'
import { useUpdate } from '@/hooks/useUpdate'
import { UpdateDialog } from '@/components/update'
import { RefreshCw } from 'lucide-react'

export function PurfenceConfigPage() {
  const { toast } = useToast()
  const { config, loading, error, saving, saveConfig } = usePurfenceConfig()
  const [projectsRootPath, setProjectsRootPath] = useState('')
  const [proxyUrl, setProxyUrl] = useState('')
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const {
    status,
    updateInfo,
    downloadProgress,
    error: updateError,
    currentVersion,
    checkForUpdates,
    startDownload,
    dismissUpdate,
    installAndRestart,
    skipVersion,
  } = useUpdate()

  useEffect(() => {
    setProjectsRootPath(config?.projectsRootPath || '')
    setProxyUrl(config?.proxyUrl || '')
  }, [config?.projectsRootPath, config?.proxyUrl])

  const handleSave = async () => {
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
        proxyUrl,
      })
      toast({
        title: '保存成功',
        description: '基础配置已更新',
      })
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '请稍后重试',
        variant: 'destructive',
      })
    }
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

  const handleCheckForUpdates = async () => {
    const hasUpdate = await checkForUpdates()
    if (hasUpdate) {
      setUpdateDialogOpen(true)
    } else {
      toast({
        title: '检查完成',
        description: '当前已是最新版本',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          基础配置
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
          <p>加载失败：{error.message}</p>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="projects-root-path">工作目录（必填）</Label>
          <div className="mt-3 flex gap-3 items-center">
            <Input
              id="projects-root-path"
              placeholder="例如: C:\\Purfence\\projects 或 /Users/you/purfence/projects"
              value={projectsRootPath}
              onChange={(e) => setProjectsRootPath(e.target.value)}
              disabled={loading || saving}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handlePickProjectsRootPath}
              disabled={loading || saving}
            >
              选择文件夹
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || saving || !projectsRootPath.trim()}
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            新建项目与工作区将基于该目录创建；未配置则无法开始使用。
          </p>

          <div className="mt-6 border-t pt-6">
            <Label htmlFor="proxy-url">代理地址</Label>
            <div className="mt-3 flex gap-3 items-center">
              <Input
                id="proxy-url"
                placeholder="http://127.0.0.1:7890"
                value={proxyUrl}
                onChange={(e) => setProxyUrl(e.target.value)}
                disabled={loading || saving}
                className="flex-1"
              />
              <Button
                onClick={handleSave}
                disabled={loading || saving || !projectsRootPath.trim()}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">留空表示不使用代理。</p>
          </div>

          <div className="mt-6 border-t pt-6">
            <Label>软件更新</Label>
            <div className="mt-3 flex gap-3 items-center">
              <span className="text-sm text-muted-foreground flex-1">
                当前版本：{currentVersion || '未知'}
              </span>
              <Button
                variant="outline"
                onClick={handleCheckForUpdates}
                disabled={status === 'checking'}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
                {status === 'checking' ? '检查中...' : '检查更新'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <UpdateDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        status={status}
        updateInfo={updateInfo}
        downloadProgress={downloadProgress}
        error={updateError}
        onConfirm={startDownload}
        onCancel={dismissUpdate}
        onInstallAndRestart={installAndRestart}
        onSkipVersion={() => {
          if (updateInfo?.version) {
            skipVersion(updateInfo.version)
          }
        }}
      />
    </div>
  )
}
