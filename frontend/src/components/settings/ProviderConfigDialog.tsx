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
import { useMutation } from '@apollo/client'
import { isTauri } from '@tauri-apps/api/core'
import { open as openExternal } from '@tauri-apps/plugin-shell'
// Use generated GraphQL types
import type { ProviderType } from '@/api/gen/graphql'
import {
  HANDLE_CODEX_OAUTH_CALLBACK,
  INITIATE_CODEX_OAUTH,
} from '@/api/oauth'
import type { ProviderConfig } from '@/hooks/useProviderConfigs'

type UiProviderType = ProviderType | 'CODEX'

const DEFAULT_BASE_URLS: Record<UiProviderType, string> = {
  KIMI: 'https://api.moonshot.ai/v1',
  ZHIPU: 'https://open.bigmodel.cn/api/anthropic/v1',
  OPENAI: 'https://api.openai.com/v1',
  CODEX: 'https://chatgpt.com/backend-api/codex',
}

const PROVIDER_NAMES: Record<UiProviderType, string> = {
  KIMI: 'Kimi',
  ZHIPU: 'Zhipu',
  OPENAI: 'OpenAI',
  CODEX: 'Codex',
}

function toUiProvider(config?: ProviderConfig): UiProviderType {
  if (!config) {
    return 'KIMI'
  }
  return config.provider
}

function isCodexProvider(provider: UiProviderType): boolean {
  return provider.toUpperCase() === 'CODEX'
}

function toBackendProvider(provider: UiProviderType): ProviderType {
  return provider as ProviderType
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
  oauthError?: string
}

interface CodexOAuthResult {
  email: string
  refreshToken: string
  quota?: {
    total: number
    used: number
    remaining: number
  }
}

export function ProviderConfigDialog({
  open,
  mode,
  initialData,
  onSave,
  onCancel,
}: ProviderConfigDialogProps) {
  const [provider, setProvider] = useState<UiProviderType>(
    toUiProvider(initialData)
  )
  const [name, setName] = useState(initialData?.name || '')
  const [apiKey, setApiKey] = useState(initialData?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(initialData?.baseUrl || '')
  const [isEnabled, setIsEnabled] = useState(
    initialData?.isEnabled ?? true
  )
  const [isDefault, setIsDefault] = useState(
    initialData?.isDefault ?? false
  )
  const [saving, setSaving] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState('')
  const [oauthState, setOauthState] = useState('')
  const [oauthResult, setOauthResult] = useState<CodexOAuthResult | null>(null)
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
  })

  const [initiateCodexOAuthMutation, { loading: initiatingOAuth }] =
    useMutation(INITIATE_CODEX_OAUTH)
  const [handleCodexOAuthCallbackMutation, { loading: completingOAuth }] =
    useMutation(HANDLE_CODEX_OAUTH_CALLBACK)

  // 当对话框打开或 initialData 变化时，重置表单状态
  useEffect(() => {
    if (open) {
      if (initialData) {
        // 编辑模式：使用初始数据
        setProvider(toUiProvider(initialData))
        setName(initialData.name)
        setApiKey(initialData.apiKey || '')
        setBaseUrl(initialData.baseUrl || '')
        setIsEnabled(initialData.isEnabled)
        setIsDefault(initialData.isDefault)
        setCallbackUrl('')
        setOauthState('')
        setOauthResult(null)
      } else {
        // 添加模式：重置为默认值
        setProvider('KIMI')
        setName('')
        setApiKey('')
        setBaseUrl('')
        setIsEnabled(true)
        setIsDefault(false)
        setCallbackUrl('')
        setOauthState('')
        setOauthResult(null)
      }
    }
  }, [initialData, open])

  // 当提供商改变时，更新默认的 Base URL
  useEffect(() => {
    if (mode === 'add') {
      setBaseUrl(DEFAULT_BASE_URLS[provider])
    }
  }, [provider, mode])

  // 验证表单
  useEffect(() => {
    const errors: ValidationResult = {
      isValid: true,
    }

    // 验证配置名称
    if (!name.trim()) {
      errors.nameError = '请输入配置名称'
      errors.isValid = false
    } else if (name.trim().length > 50) {
      errors.nameError = '配置名称不能超过 50 个字符'
      errors.isValid = false
    }

    // 验证 API Key（新增时必填；编辑时留空表示不修改）
    if (mode === 'add' && !isCodexProvider(provider) && !apiKey.trim()) {
      errors.apiKeyError = '请输入 API Key'
      errors.isValid = false
    }

    // 验证 Base URL（仅 OpenAI 且非空时）
    if (provider === 'OPENAI' && baseUrl.trim()) {
      try {
        new URL(baseUrl.trim())
      } catch {
        errors.baseUrlError = '请输入有效的 URL'
        errors.isValid = false
      }
    }

    if (mode === 'add' && isCodexProvider(provider) && !oauthResult) {
      errors.oauthError = '请先完成 Codex 授权'
      errors.isValid = false
    }

    setValidation(errors)
  }, [name, apiKey, baseUrl, provider, mode, oauthResult])

  const handleSave = async () => {
    if (!validation.isValid || saving) return

    setSaving(true)
    try {
      await onSave({
        provider: toBackendProvider(provider),
        name: name.trim(),
        apiKey: isCodexProvider(provider) ? undefined : apiKey.trim() || undefined,
        email: isCodexProvider(provider) ? oauthResult?.email : undefined,
        refreshToken:
          isCodexProvider(provider) ? oauthResult?.refreshToken : undefined,
        baseUrl: baseUrl.trim() || undefined,
        isEnabled,
        isDefault,
      })
      // 重置表单
      if (mode === 'add') {
        setProvider('KIMI')
        setName('')
        setApiKey('')
        setBaseUrl('')
        setIsEnabled(true)
        setIsDefault(false)
        setCallbackUrl('')
        setOauthState('')
        setOauthResult(null)
      }
    } finally {
      setSaving(false)
    }
  }

  const getRedirectUri = () => {
    // Keep the original redirect URI registered in OAuth settings in all environments.
    return 'http://localhost:1455/auth/callback'
  }

  const handleStartCodexOAuth = async () => {
    try {
      const redirectUri = getRedirectUri()
      const { data } = await initiateCodexOAuthMutation({
        variables: { redirectUri },
      })

      const payload = (data as any)?.initiateCodexOAuth
      if (!payload) {
        throw new Error('获取授权链接失败')
      }

      setOauthState(payload.state)
      if (isTauri()) {
        await openExternal(payload.authorizationUrl)
      } else {
        window.open(payload.authorizationUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      setValidation((prev) => ({
        ...prev,
        oauthError: error instanceof Error ? error.message : '启动授权失败',
      }))
    }
  }

  const handleCompleteCodexOAuth = async () => {
    try {
      const parsed = new URL(callbackUrl.trim())
      const code = parsed.searchParams.get('code') || ''
      const state = parsed.searchParams.get('state') || ''
      if (!code || !state) {
        throw new Error('回调地址缺少 code 或 state')
      }

      const redirectUri = `${parsed.origin}${parsed.pathname}`
      const { data } = await handleCodexOAuthCallbackMutation({
        variables: {
          code,
          state,
          redirectUri,
        },
      })

      const result = (data as any)?.handleCodexOAuthCallback
      if (!result?.oauthInfo?.refreshToken) {
        throw new Error('授权返回数据不完整')
      }

      setOauthResult({
        email: result.email,
        refreshToken: result.oauthInfo.refreshToken,
        quota: result.quota,
      })
      setValidation((prev) => ({ ...prev, oauthError: undefined }))
    } catch (error) {
      setOauthResult(null)
      setValidation((prev) => ({
        ...prev,
        oauthError: error instanceof Error ? error.message : '完成授权失败',
      }))
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
            {mode === 'add'
              ? '配置您的 AI 模型提供商信息'
              : '修改模型提供商配置信息'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-4 overflow-y-auto py-4 pr-1">
          {/* 提供商选择 - 仅添加模式 */}
          {mode === 'add' && (
            <div className="space-y-2">
              <Label htmlFor="provider">
                提供商 <span className="text-destructive">*</span>
              </Label>
                <Select
                  value={provider}
                  onValueChange={(value) => setProvider(value as UiProviderType)}
                >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="选择提供商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KIMI">Kimi</SelectItem>
                  <SelectItem value="ZHIPU">Zhipu</SelectItem>
                  <SelectItem value="OPENAI">OpenAI</SelectItem>
                  <SelectItem value="CODEX">Codex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 配置名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              配置名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {validation.nameError && (
              <p className="text-sm text-destructive">{validation.nameError}</p>
            )}
          </div>

          {/* 显示提供商信息 */}
          {mode === 'edit' && (
            <div className="space-y-2">
              <Label>提供商</Label>
              <p className="text-sm text-muted-foreground">
                {PROVIDER_NAMES[provider]}
              </p>
            </div>
          )}

          {/* API Key 字段 - 仅当使用 API Key 时显示 */}
          {!isCodexProvider(provider) && (
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
                <p className="text-sm text-destructive">
                  {validation.apiKeyError}
                </p>
              )}
            </div>
          )}

          {/* Codex OAuth 说明 */}
          {isCodexProvider(provider) && (
            <div className="space-y-2">
              <Label>OAuth 授权</Label>
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleStartCodexOAuth}
                  disabled={initiatingOAuth || completingOAuth}
                >
                  {initiatingOAuth ? '跳转中...' : '去授权'}
                </Button>
                <Textarea
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                  placeholder="把授权完成后的浏览器地址粘贴到这里"
                  rows={3}
                />
                <Button
                  type="button"
                  onClick={handleCompleteCodexOAuth}
                  disabled={!callbackUrl.trim() || completingOAuth}
                >
                  {completingOAuth ? '处理中...' : '完成授权'}
                </Button>

                {oauthState && (
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    已生成授权状态，请完成浏览器授权后粘贴回调地址。
                  </p>
                )}

                {oauthResult && (
                  <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <p>授权邮箱：{oauthResult.email}</p>
                    {oauthResult.quota && (
                      <p>
                        配额：{oauthResult.quota.used}/{oauthResult.quota.total}
                      </p>
                    )}
                  </div>
                )}

                {validation.oauthError && (
                  <p className="text-sm text-destructive">{validation.oauthError}</p>
                )}
              </div>
            </div>
          )}

          {/* Base URL - Kimi/Zhipu 禁用编辑，OpenAI 可选编辑 */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl">
              Base URL（可选）
            </Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={DEFAULT_BASE_URLS[provider]}
            />
            {validation.baseUrlError && (
              <p className="text-sm text-destructive">
                {validation.baseUrlError}
              </p>
            )}
          </div>

          {/* 启用状态 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">启用此配置</Label>
            <Switch
              id="enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="default">设为默认配置</Label>
            <Switch
              id="default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || initiatingOAuth || completingOAuth}
          >
            {saving ? '保存中...' : mode === 'add' ? '添加' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
