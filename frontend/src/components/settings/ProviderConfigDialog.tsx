import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { ProviderType } from '@/api/gen/graphql'
import type { ProviderConfig } from '@/hooks/useProviderConfigs'

const DEFAULT_BASE_URLS: Record<string, string> = {
  OPENAI: 'https://api.openai.com/v1',
  ANTHROPIC: 'https://api.anthropic.com',
  OPENAI_COMPATIBLE: '',
}

const PROVIDER_NAMES: Record<string, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  OPENAI_COMPATIBLE: 'OpenAI Compatible',
}

function toUiProvider(config?: ProviderConfig): string {
  if (!config) return 'OPENAI'
  return config.provider?.toUpperCase() || 'OPENAI'
}

interface ProviderConfigDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  initialData?: ProviderConfig
  onSave: (data: Omit<ProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onCancel: () => void
}

interface ValidationResult {
  isValid: boolean
  nameError?: string
  apiKeyError?: string
  baseUrlError?: string
}

export function ProviderConfigDialog({
  open,
  mode,
  initialData,
  onSave,
  onCancel,
}: ProviderConfigDialogProps) {
  const [provider, setProvider] = useState<string>(toUiProvider(initialData))
  const [name, setName] = useState(initialData?.name || '')
  const [apiKey, setApiKey] = useState(initialData?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(initialData?.baseUrl || '')
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)
  const [saving, setSaving] = useState(false)
  const [validation, setValidation] = useState<ValidationResult>({ isValid: false })

  useEffect(() => {
    if (open) {
      if (initialData) {
        setProvider(toUiProvider(initialData))
        setName(initialData.name)
        setApiKey(initialData.apiKey || '')
        setBaseUrl(initialData.baseUrl || '')
        setIsActive(initialData.isActive)
      } else {
        setProvider('openai')
        setName('')
        setApiKey('')
        setBaseUrl('')
        setIsActive(true)
      }
    }
  }, [initialData, open])

  useEffect(() => {
    if (mode === 'add') {
      setBaseUrl(DEFAULT_BASE_URLS[provider] || '')
    }
  }, [provider, mode])

  useEffect(() => {
    const errors: ValidationResult = { isValid: true }

    if (!name.trim()) {
      errors.nameError = '请输入配置名称'
      errors.isValid = false
    } else if (name.trim().length > 50) {
      errors.nameError = '配置名称不能超过 50 个字符'
      errors.isValid = false
    }

    if (mode === 'add' && !apiKey.trim()) {
      errors.apiKeyError = '请输入 API Key'
      errors.isValid = false
    }

    if (baseUrl.trim()) {
      try {
        new URL(baseUrl.trim())
      } catch {
        errors.baseUrlError = '请输入有效的 URL'
        errors.isValid = false
      }
    }

    setValidation(errors)
  }, [name, apiKey, baseUrl, mode])

  const handleSave = async () => {
    if (!validation.isValid || saving) return

    setSaving(true)
    try {
      await onSave({
        provider: provider as ProviderType,
        name: name.trim(),
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
        isActive,
      })
      if (mode === 'add') {
        setProvider('openai')
        setName('')
        setApiKey('')
        setBaseUrl('')
        setIsActive(true)
      }
    } finally {
      setSaving(false)
    }
  }

  const canSave = validation.isValid && !saving

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[500px] max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? '添加模型提供商配置' : '编辑模型提供商配置'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' ? '配置您的 AI 模型提供商信息' : '修改模型提供商配置信息'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-4 overflow-y-auto py-4 pr-1">
          {mode === 'add' && (
            <div className="space-y-2">
              <Label htmlFor="provider">
                提供商 <span className="text-destructive">*</span>
              </Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="选择提供商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPENAI">OpenAI</SelectItem>
                  <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                  <SelectItem value="OPENAI_COMPATIBLE">OpenAI Compatible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              配置名称 <span className="text-destructive">*</span>
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            {validation.nameError && (
              <p className="text-sm text-destructive">{validation.nameError}</p>
            )}
          </div>

          {mode === 'edit' && (
            <div className="space-y-2">
              <Label>提供商</Label>
              <p className="text-sm text-muted-foreground">
                {PROVIDER_NAMES[provider] || provider}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="apiKey">
              API Key {mode === 'add' && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={mode === 'add' ? 'sk-...' : '留空表示不修改'}
              rows={3}
            />
            {validation.apiKeyError && (
              <p className="text-sm text-destructive">{validation.apiKeyError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL（可选）</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={DEFAULT_BASE_URLS[provider] || 'https://api.example.com/v1'}
            />
            {validation.baseUrlError && (
              <p className="text-sm text-destructive">{validation.baseUrlError}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">启用此配置</Label>
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? '保存中...' : mode === 'add' ? '添加' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
