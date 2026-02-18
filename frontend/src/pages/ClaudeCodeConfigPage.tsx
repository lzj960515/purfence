import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useClaudeCodeConfig, type ClaudeCodeEnvItem } from '@/hooks/useClaudeCodeConfig'

const EMPTY_ENV_ITEM: ClaudeCodeEnvItem = { key: '', value: '' }

export function ClaudeCodeConfigPage() {
  const { toast } = useToast()
  const { config, providers, loading, error, saving, saveConfig } =
    useClaudeCodeConfig()

  const [useDefaultConfig, setUseDefaultConfig] = useState(true)
  const [modelProviderId, setModelProviderId] = useState('')
  const [envItems, setEnvItems] = useState<ClaudeCodeEnvItem[]>([
    EMPTY_ENV_ITEM,
  ])

  useEffect(() => {
    setUseDefaultConfig(config?.useDefaultConfig ?? true)
    setModelProviderId(config?.modelProviderId || '')
    if (config?.env?.length) {
      setEnvItems(config.env)
      return
    }
    setEnvItems([EMPTY_ENV_ITEM])
  }, [config])

  const canSave = useMemo(() => {
    if (loading || saving) {
      return false
    }
    if (!useDefaultConfig && !modelProviderId) {
      return false
    }
    return true
  }, [loading, modelProviderId, saving, useDefaultConfig])

  const handleAddEnv = () => {
    setEnvItems((prev) => [...prev, { key: '', value: '' }])
  }

  const handleRemoveEnv = (index: number) => {
    setEnvItems((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length ? next : [{ key: '', value: '' }]
    })
  }

  const handleEnvChange = (
    index: number,
    field: keyof ClaudeCodeEnvItem,
    value: string
  ) => {
    setEnvItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const handleSave = async () => {
    if (!canSave) {
      return
    }

    try {
      await saveConfig({
        useDefaultConfig,
        modelProviderId,
        env: envItems,
      })
      toast({
        title: '保存成功',
        description: 'Claude Code 配置已更新',
      })
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Claude Code 配置
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          配置 Claude Code 使用的模型提供商和环境变量。
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
          <p>加载失败：{error.message}</p>
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="use-default-config">使用默认配置</Label>
              <p className="text-xs text-muted-foreground">
                开启后将使用本地 Claude Code 默认配置，不强制选择模型提供商。
              </p>
            </div>
            <Switch
              id="use-default-config"
              checked={useDefaultConfig}
              onCheckedChange={setUseDefaultConfig}
              disabled={loading || saving}
            />
          </div>

          {!useDefaultConfig && (
            <div className="space-y-2">
              <Label htmlFor="provider">模型提供商</Label>
              <Select
                value={modelProviderId}
                onValueChange={setModelProviderId}
                disabled={loading || saving}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="请选择模型提供商" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}（{provider.provider === 'ZHIPU' ? 'GLM' : 'Kimi'}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                目前仅支持 GLM（Zhipu）和 Kimi。
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>环境变量</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEnv}
                disabled={loading || saving}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                添加变量
              </Button>
            </div>

            <div className="space-y-2">
              {envItems.map((item, index) => (
                <div key={`env-${index}`} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-4"
                    placeholder="Key"
                    value={item.key}
                    onChange={(e) =>
                      handleEnvChange(index, 'key', e.target.value)
                    }
                    disabled={loading || saving}
                  />
                  <Input
                    className="col-span-7"
                    placeholder="Value"
                    value={item.value}
                    onChange={(e) =>
                      handleEnvChange(index, 'value', e.target.value)
                    }
                    disabled={loading || saving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-1"
                    onClick={() => handleRemoveEnv(index)}
                    disabled={loading || saving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!canSave}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
