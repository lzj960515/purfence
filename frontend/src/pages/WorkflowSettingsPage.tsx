import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import {
  ArrowLeft,
  Settings,
  Loader2,
  GitBranch,
  Users,
  Zap,
  Shield,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  GET_WORKFLOW_CONFIG_OR_DEFAULT,
  CONFIGURE_WORKFLOW,
  type WorkflowMode,
  type WorkflowConfig,
  DEFAULT_WORKFLOW_CONFIG,
} from '@/api/workflow.graphql'

const modeConfig: Record<WorkflowMode, {
  label: string
  description: string
  icon: React.ReactNode
  color: string
}> = {
  STANDALONE: {
    label: '单机模式',
    description: '适合个人开发，全流程自动化执行',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-blue-600',
  },
  COLLABORATIVE: {
    label: '协作模式',
    description: '适合团队开发，需要人工审查后合并',
    icon: <Users className="h-5 w-5" />,
    color: 'text-purple-600',
  },
}

function WorkflowSettingsForm({
  initialConfig,
  projectId,
  onSaveComplete,
}: {
  initialConfig: WorkflowConfig
  projectId: string
  onSaveComplete: () => void
}) {
  const { toast } = useToast()
  const [configureWorkflow, { loading: saving }] = useMutation(CONFIGURE_WORKFLOW)

  // Form state - initialized from props
  const [mode, setMode] = useState<WorkflowMode>(initialConfig.mode as WorkflowMode)
  const [autoCreateIssue, setAutoCreateIssue] = useState(initialConfig.autoCreateIssue)
  const [autoMerge, setAutoMerge] = useState(initialConfig.autoMerge)
  const [autoPush, setAutoPush] = useState(initialConfig.autoPush)
  const [requireManualApproval, setRequireManualApproval] = useState(initialConfig.requireManualApproval)

  // Handle mode change - auto-adjust settings
  const handleModeChange = (newMode: WorkflowMode) => {
    setMode(newMode)
    if (newMode === 'COLLABORATIVE') {
      setAutoMerge(false)
      setAutoPush(false)
      setRequireManualApproval(true)
    } else {
      setAutoMerge(true)
      setAutoPush(true)
      setRequireManualApproval(false)
    }
  }

  const handleSave = async () => {
    try {
      await configureWorkflow({
        variables: {
          input: {
            projectId,
            config: {
              mode,
              autoCreateIssue,
              autoMerge,
              autoPush,
              requireManualApproval,
            },
          },
        },
      })

      toast({
        title: '保存成功',
        description: '工作流配置已更新',
      })

      onSaveComplete()
    } catch (error) {
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  const handleReset = () => {
    setMode(DEFAULT_WORKFLOW_CONFIG.mode as WorkflowMode)
    setAutoCreateIssue(DEFAULT_WORKFLOW_CONFIG.autoCreateIssue)
    setAutoMerge(DEFAULT_WORKFLOW_CONFIG.autoMerge)
    setAutoPush(DEFAULT_WORKFLOW_CONFIG.autoPush)
    setRequireManualApproval(DEFAULT_WORKFLOW_CONFIG.requireManualApproval)
  }

  const currentModeConfig = modeConfig[mode]
  const hasChanges =
    initialConfig.mode !== mode ||
    initialConfig.autoCreateIssue !== autoCreateIssue ||
    initialConfig.autoMerge !== autoMerge ||
    initialConfig.autoPush !== autoPush ||
    initialConfig.requireManualApproval !== requireManualApproval

  return (
    <>
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            工作流模式
          </CardTitle>
          <CardDescription>
            选择适合您的工作流模式，不同模式有不同的自动化程度
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={mode} onValueChange={(value) => handleModeChange(value as WorkflowMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(modeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span className={config.color}>{config.icon}</span>
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mode Description */}
          <div className={`rounded-lg border p-4 ${
            mode === 'COLLABORATIVE'
              ? 'border-purple-200 bg-purple-50 dark:border-purple-900/50 dark:bg-purple-900/20'
              : 'border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20'
          }`}>
            <div className="flex items-start gap-3">
              <div className={currentModeConfig.color}>
                {currentModeConfig.icon}
              </div>
              <div>
                <div className="font-medium">{currentModeConfig.label}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {currentModeConfig.description}
                </div>
                {mode === 'STANDALONE' && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <ul className="list-disc list-inside space-y-1">
                      <li>自动创建 Issue（可选）</li>
                      <li>完成后自动合并到主分支</li>
                      <li>合并后自动推送到远程仓库</li>
                    </ul>
                  </div>
                )}
                {mode === 'COLLABORATIVE' && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <ul className="list-disc list-inside space-y-1">
                      <li>完成后进入待审批状态</li>
                      <li>需要手动合并和推送</li>
                      <li>支持发起 MR/PR 进行代码审查</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            自动化设置
          </CardTitle>
          <CardDescription>
            微调工作流的行为，切换模式会自动调整这些设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Create Issue */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoCreateIssue" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                自动创建 Issue
              </Label>
              <p className="text-xs text-muted-foreground">
                启用后，天机团队会自动创建 Purfence Issue
              </p>
            </div>
            <Switch
              id="autoCreateIssue"
              checked={autoCreateIssue}
              onCheckedChange={setAutoCreateIssue}
            />
          </div>

          <Separator />

          {/* Auto Merge */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoMerge" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                自动合并
              </Label>
              <p className="text-xs text-muted-foreground">
                启用后，Issue 完成时自动合并到主分支
              </p>
            </div>
            <Switch
              id="autoMerge"
              checked={autoMerge}
              onCheckedChange={setAutoMerge}
            />
          </div>

          <Separator />

          {/* Auto Push */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoPush" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                自动推送
              </Label>
              <p className="text-xs text-muted-foreground">
                启用后，合并后自动推送到远程仓库
              </p>
            </div>
            <Switch
              id="autoPush"
              checked={autoPush}
              onCheckedChange={setAutoPush}
            />
          </div>

          <Separator />

          {/* Require Manual Approval */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requireManualApproval" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                需要人工审批
              </Label>
              <p className="text-xs text-muted-foreground">
                启用后，Issue 完成时进入待审批状态，需要手动操作
              </p>
            </div>
            <Switch
              id="requireManualApproval"
              checked={requireManualApproval}
              onCheckedChange={setRequireManualApproval}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">当前配置摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              模式: {currentModeConfig.label}
            </Badge>
            <Badge variant={autoCreateIssue ? 'default' : 'secondary'}>
              {autoCreateIssue ? '✓' : '✗'} 自动创建
            </Badge>
            <Badge variant={autoMerge ? 'default' : 'secondary'}>
              {autoMerge ? '✓' : '✗'} 自动合并
            </Badge>
            <Badge variant={autoPush ? 'default' : 'secondary'}>
              {autoPush ? '✓' : '✗'} 自动推送
            </Badge>
            <Badge variant={requireManualApproval ? 'default' : 'secondary'}>
              {requireManualApproval ? '✓' : '✗'} 人工审批
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={handleReset}>
          重置为默认
        </Button>
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          保存配置
        </Button>
      </div>
    </>
  )
}

export function WorkflowSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  // Get config
  const { data: configData, loading: configLoading, refetch } = useQuery<{
    workflowConfigOrDefault: WorkflowConfig
  }>(GET_WORKFLOW_CONFIG_OR_DEFAULT, {
    variables: { projectId: projectId ?? '' },
    skip: !projectId,
    fetchPolicy: 'network-only',
  })

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const config = configData?.workflowConfigOrDefault

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight">工作流配置</h2>
          <p className="text-sm text-muted-foreground">
            配置 Issue 处理的工作流模式和行为
          </p>
        </div>
      </div>

      <Separator />

      {config && projectId && (
        <WorkflowSettingsForm
          key={config.id || 'new'}
          initialConfig={config}
          projectId={projectId}
          onSaveComplete={() => refetch()}
        />
      )}
    </div>
  )
}
