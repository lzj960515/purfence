import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import { ArrowLeft, Link, Key, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  GET_REMOTE_REPOSITORY_CONFIG,
  CONFIGURE_REMOTE_REPOSITORY,
  TEST_REMOTE_REPOSITORY_CONNECTION,
  DELETE_REMOTE_REPOSITORY,
  type RemoteRepositoryType,
  type RemoteRepositoryConfig,
  type ConnectionTestResult,
} from '@/api/remote-git.graphql'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  connected: { label: '已连接', variant: 'default' },
  error: { label: '连接错误', variant: 'destructive' },
  expired: { label: 'Token 已过期', variant: 'destructive' },
}

export function RemoteRepositorySettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Form state
  const [repositoryType, setRepositoryType] = useState<RemoteRepositoryType>('GITLAB')
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [defaultBranch, setDefaultBranch] = useState('main')

  // Connection test state
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Get existing config
  const { data: configData, loading: configLoading, refetch } = useQuery<{
    remoteRepositoryConfig: RemoteRepositoryConfig | null
  }>(GET_REMOTE_REPOSITORY_CONFIG, {
    variables: { projectId: projectId ?? '' },
    skip: !projectId,
    fetchPolicy: 'network-only',
  })

  // Mutations
  const [configureRepository, { loading: saving }] = useMutation(CONFIGURE_REMOTE_REPOSITORY)
  const [testConnection, { loading: testing }] = useMutation(TEST_REMOTE_REPOSITORY_CONNECTION)
  const [deleteRepository, { loading: deleting }] = useMutation(DELETE_REMOTE_REPOSITORY)

  // Populate form when config is loaded
  useEffect(() => {
    const config = configData?.remoteRepositoryConfig
    if (config) {
      setRepositoryType(config.type as RemoteRepositoryType)
      setRepositoryUrl(config.url)
      setDefaultBranch(config.defaultBranch || 'main')
      // Token is not returned for security reasons
    }
  }, [configData])

  const handleTestConnection = async () => {
    if (!repositoryUrl || !accessToken) {
      toast({
        title: '请填写完整信息',
        description: '请填写仓库 URL 和 Access Token',
        variant: 'destructive',
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const { data } = await testConnection({
        variables: {
          input: {
            type: repositoryType,
            url: repositoryUrl,
            token: accessToken,
          },
        },
      })

      const result = data?.testRemoteRepositoryConnection
      setTestResult(result || null)

      if (result?.success) {
        toast({
          title: '连接成功',
          description: '已成功连接到远程仓库',
        })
      } else {
        toast({
          title: '连接失败',
          description: result?.error || '请检查 URL 和 Token 是否正确',
          variant: 'destructive',
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setTestResult({ success: false, error: errorMessage })
      toast({
        title: '连接失败',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    if (!projectId || !repositoryUrl || !accessToken) {
      toast({
        title: '请填写完整信息',
        description: '请填写仓库 URL 和 Access Token',
        variant: 'destructive',
      })
      return
    }

    try {
      await configureRepository({
        variables: {
          input: {
            projectId,
            config: {
              type: repositoryType,
              url: repositoryUrl,
              token: accessToken,
              defaultBranch,
            },
          },
        },
      })

      toast({
        title: '保存成功',
        description: '远程仓库配置已保存',
      })

      setAccessToken('') // Clear token for security
      setTestResult(null)
      refetch()
    } catch (error) {
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!projectId) return

    try {
      await deleteRepository({
        variables: { projectId },
      })

      toast({
        title: '删除成功',
        description: '远程仓库配置已删除',
      })

      // Reset form
      setRepositoryUrl('')
      setAccessToken('')
      setDefaultBranch('main')
      setTestResult(null)
      refetch()
    } catch (error) {
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const existingConfig = configData?.remoteRepositoryConfig

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
          <h2 className="text-2xl font-semibold tracking-tight">远程仓库配置</h2>
          <p className="text-sm text-muted-foreground">
            配置 GitLab 或 GitHub 远程仓库集成
          </p>
        </div>
        {existingConfig && (
          <Badge variant={statusConfig[existingConfig.status]?.variant || 'secondary'}>
            {statusConfig[existingConfig.status]?.label || existingConfig.status}
          </Badge>
        )}
      </div>

      <Separator />

      {/* Existing Config Info */}
      {existingConfig && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">当前配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">仓库类型：</span>
              <Badge variant="outline">
                {existingConfig.type === 'GITLAB' ? 'GitLab' : 'GitHub'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">仓库 URL：</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">{existingConfig.url}</code>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">默认分支：</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">{existingConfig.defaultBranch}</code>
            </div>
            {existingConfig.lastSyncedAt && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">最后同步：</span>
                <span>{new Date(existingConfig.lastSyncedAt).toLocaleString()}</span>
              </div>
            )}
            {existingConfig.errorMessage && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {existingConfig.errorMessage}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>{existingConfig ? '更新配置' : '添加远程仓库'}</CardTitle>
          <CardDescription>
            {existingConfig
              ? '更新仓库配置时需要重新输入 Access Token'
              : '配置您的 GitLab 或 GitHub 仓库以启用远程 Issue 同步'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Repository Type */}
          <div className="space-y-2">
            <Label htmlFor="repositoryType">仓库类型</Label>
            <Select
              value={repositoryType}
              onValueChange={(value) => setRepositoryType(value as RemoteRepositoryType)}
            >
              <SelectTrigger id="repositoryType">
                <SelectValue placeholder="选择仓库类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GITLAB">GitLab</SelectItem>
                <SelectItem value="GITHUB">GitHub</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Repository URL */}
          <div className="space-y-2">
            <Label htmlFor="repositoryUrl">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                仓库 URL
              </div>
            </Label>
            <Input
              id="repositoryUrl"
              type="url"
              placeholder={repositoryType === 'GITLAB'
                ? 'https://gitlab.com/namespace/project'
                : 'https://github.com/owner/repo'}
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {repositoryType === 'GITLAB'
                ? '支持 GitLab.com 或自托管 GitLab 实例'
                : '仅支持 GitHub.com'}
            </p>
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="accessToken">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Access Token
              </div>
            </Label>
            <Input
              id="accessToken"
              type="password"
              placeholder={repositoryType === 'GITLAB'
                ? 'glpat-xxxxxxxxxxxxxxxxxxxx'
                : 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {repositoryType === 'GITLAB'
                ? '在 GitLab 设置 > Access Tokens 中创建，需要 api 或 read_api 权限'
                : '在 GitHub Settings > Developer settings > Personal access tokens 中创建，需要 repo 权限'}
            </p>
          </div>

          {/* Default Branch */}
          <div className="space-y-2">
            <Label htmlFor="defaultBranch">默认分支</Label>
            <Input
              id="defaultBranch"
              type="text"
              placeholder="main"
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
            />
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`rounded-md p-3 text-sm ${
              testResult.success
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>
                  {testResult.success ? '连接成功' : `连接失败: ${testResult.error}`}
                </span>
              </div>
              {testResult.permissions && testResult.permissions.length > 0 && (
                <div className="mt-2 text-xs">
                  权限: {testResult.permissions.join(', ')}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting || testing || !repositoryUrl || !accessToken}
              >
                {isTesting || testing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                测试连接
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {existingConfig && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除配置
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要删除远程仓库配置吗？已导入的 Issue 将保留，但会标记为未关联。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                        {deleting ? '删除中...' : '确认删除'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button onClick={handleSave} disabled={saving || !repositoryUrl || !accessToken}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {existingConfig ? '更新配置' : '保存配置'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
