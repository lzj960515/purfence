import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  usePurfenceConfig,
  type ModelConfigItem,
} from '@/hooks/usePurfenceConfig'
import { useUpdate } from '@/hooks/useUpdate'
import { UpdateDialog } from '@/components/update'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'

type FallbackDraft = ModelConfigItem & {
  localKey: string
}

export function PurfenceConfigPage() {
  const { toast } = useToast()
  const {
    config,
    loading,
    error,
    saving,
    saveConfig,
    providers,
    saveModelConfig,
    getModelConfig,
  } = usePurfenceConfig()
  const [projectsRootPath, setProjectsRootPath] = useState('')
  const [proxyUrl, setProxyUrl] = useState('')
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)

  // 模型配置状态
  const [defaultModel, setDefaultModel] = useState<ModelConfigItem>({
    id: '',
    model: '',
  })
  const [fallbacks, setFallbacks] = useState<FallbackDraft[]>([])
  const fallbackDraftIdRef = useRef(0)

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
  const persistedModelConfig = useMemo(() => getModelConfig(), [getModelConfig])

  const createFallbackDraft = useCallback((item?: ModelConfigItem): FallbackDraft => {
    fallbackDraftIdRef.current += 1
    return {
      id: item?.id || '',
      model: item?.model || '',
      localKey: `fallback-${fallbackDraftIdRef.current}`,
    }
  }, [])

  useEffect(() => {
    setProjectsRootPath(config?.projectsRootPath || '')
    setProxyUrl(config?.proxyUrl || '')
  }, [config?.projectsRootPath, config?.proxyUrl])

  useEffect(() => {
    if (persistedModelConfig) {
      setDefaultModel(persistedModelConfig.default)
      setFallbacks((persistedModelConfig.fallbacks || []).map(createFallbackDraft))
    }
  }, [createFallbackDraft, persistedModelConfig])

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

  const handleSaveModelConfig = async () => {
    if (!defaultModel.id || !defaultModel.model.trim()) {
      toast({
        title: '保存失败',
        description: '请选择默认提供商并填写模型名称',
        variant: 'destructive',
      })
      return
    }

    try {
      await saveModelConfig({
        default: defaultModel,
        fallbacks: fallbacks
          .filter((fallback) => fallback.id && fallback.model.trim())
          .map(({ id, model }) => ({ id, model })),
      })
      toast({
        title: '保存成功',
        description: '模型配置已更新',
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
    } else if (updateError) {
      toast({
        title: '检查失败',
        description: updateError,
        variant: 'destructive',
      })
    } else {
      toast({
        title: '检查完成',
        description: '当前已是最新版本',
      })
    }
  }

  const addFallback = () => {
    setFallbacks([...fallbacks, createFallbackDraft()])
  }

  const removeFallback = (index: number) => {
    setFallbacks(fallbacks.filter((_, i) => i !== index))
  }

  const updateFallback = (
    index: number,
    field: 'id' | 'model',
    value: string
  ) => {
    const updated = [...fallbacks]
    updated[index] = { ...updated[index], [field]: value }
    setFallbacks(updated)
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
        <CardContent className="p-5">
          <div className="space-y-5">
            <section className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="projects-root-path" className="text-base font-medium">
                  工作目录（必填）
                </Label>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
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
                    size="sm"
                    onClick={handlePickProjectsRootPath}
                    disabled={loading || saving}
                  >
                    选择文件夹
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={loading || saving || !projectsRootPath.trim()}
                  >
                    {saving ? '保存中...' : '保存'}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-5 space-y-2">
                <Label htmlFor="proxy-url" className="text-base font-medium">
                  代理地址
                </Label>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Input
                    id="proxy-url"
                    placeholder="http://127.0.0.1:7890"
                    value={proxyUrl}
                    onChange={(e) => setProxyUrl(e.target.value)}
                    disabled={loading || saving}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={loading || saving || !projectsRootPath.trim()}
                  >
                    {saving ? '保存中...' : '保存'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  留空表示不使用代理。
                </p>
              </div>
            </section>

            <section className="space-y-4 border-t pt-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-medium">模型配置</h2>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveModelConfig}
                  disabled={loading || saving || providers.length === 0}
                >
                  {saving ? '保存中...' : '保存模型配置'}
                </Button>
              </div>

              {providers.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                  请先在「模型提供商」页面添加配置。
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="rounded-lg border bg-background/80 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-medium">默认模型</h3>
                        <span className="text-xs text-muted-foreground">主路由</span>
                      </div>
                      <div className="grid gap-2 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                        <Select
                          value={defaultModel.id}
                          onValueChange={(value) =>
                            setDefaultModel({ ...defaultModel, id: value })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="选择提供商" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          className="h-9"
                          placeholder="gpt-5.4"
                          value={defaultModel.model}
                          onChange={(e) =>
                            setDefaultModel({ ...defaultModel, model: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-medium">备用模型</h3>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addFallback}
                          disabled={loading || saving}
                          className="shrink-0"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          添加
                        </Button>
                      </div>

                      {fallbacks.length === 0 ? (
                        <div className="rounded-md border border-dashed bg-background/70 px-3 py-4 text-sm text-muted-foreground">
                          暂无备用模型，点击「添加」按钮配置。
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {fallbacks.map((fallback, index) => (
                            <div
                              key={fallback.localKey}
                              className="flex items-center gap-2 rounded-md border bg-background/80 p-2.5"
                            >
                              <div className="grid flex-1 gap-2 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                                <Select
                                  value={fallback.id}
                                  onValueChange={(value) =>
                                    updateFallback(index, 'id', value)
                                  }
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="选择提供商" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {providers.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  className="h-9"
                                  placeholder="gpt-5.4"
                                  value={fallback.model}
                                  onChange={(e) =>
                                    updateFallback(index, 'model', e.target.value)
                                  }
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFallback(index)}
                                className="mt-0.5 h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3 border-t pt-5">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-medium">软件更新</h2>
                  <p className="text-sm text-muted-foreground">
                    当前版本：{currentVersion || '未知'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckForUpdates}
                  disabled={status === 'checking'}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${status === 'checking' ? 'animate-spin' : ''}`}
                  />
                  {status === 'checking' ? '检查中...' : '检查更新'}
                </Button>
              </div>
            </section>
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
