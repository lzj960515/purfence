import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  usePurfenceProjectQuery,
  usePurfenceIssuesQuery,
  useCreateOnePurfenceIssueMutation,
  useDeleteOnePurfenceIssueMutation,
} from '@/graphql/__generated__/hooks'
import { UPDATE_ONE_PURFENCE_PROJECT_MUTATION } from '@/api/purfence.graphql'
import { GET_APP_CONFIGS } from '@/api/app-config.graphql'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, FolderOpen, FileText, Plus, Bell, Pencil, Check } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { IssueTable, type Issue } from '@/components/tables/IssueTable'
import { CreateIssueDialog } from '@/components/dialogs/CreateIssueDialog'
import { DeleteIssueDialog } from '@/components/dialogs/DeleteIssueDialog'
import { useToast } from '@/hooks/use-toast'

type AppConfigItem = {
  id: string
  name: string
  type: string
  enabled: boolean
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState<Issue | null>(null)
  const [pageOffset, setPageOffset] = useState(0)
  const PAGE_LIMIT = 20

  // Slack 配置状态
  const [isEditingSlack, setIsEditingSlack] = useState(false)
  const [slackAppConfigId, setSlackAppConfigId] = useState('')
  const [slackChannelId, setSlackChannelId] = useState('')

  const { data: projectData, loading: projectLoading, error: projectError, refetch: refetchProject } = usePurfenceProjectQuery({
    variables: { id: id ?? '' },
    skip: !id,
  })

  const { data: issuesData, loading: issuesLoading, refetch } = usePurfenceIssuesQuery({
    variables: {
      paging: { limit: PAGE_LIMIT, offset: pageOffset },
      filter: { projectId: { eq: id ?? '' } },
      sorting: [{ field: 'createdAt', direction: 'DESC' }],
    },
    skip: !id,
  })

  // 获取 Slack App 列表
  const { data: appConfigData } = useQuery<{
    purfenceAppConfigs: {
      nodes: AppConfigItem[]
      totalCount: number
    }
  }>(GET_APP_CONFIGS, {
    fetchPolicy: 'network-only',
  })

  const [createIssue, { loading: creating }] = useCreateOnePurfenceIssueMutation({
    onCompleted: () => {
      setCreateDialogOpen(false)
      setPageOffset(0)
      refetch()
    },
    onError: (error) => {
      console.error('Failed to create issue:', error)
    },
  })

  const [deleteIssue, { loading: deleting }] = useDeleteOnePurfenceIssueMutation({
    onCompleted: () => {
      setDeleteDialogOpen(false)
      setIssueToDelete(null)
      refetch()
    },
    onError: (error) => {
      console.error('Failed to delete issue:', error)
    },
  })

  const [updateProject, { loading: updatingSlack }] = useMutation(UPDATE_ONE_PURFENCE_PROJECT_MUTATION, {
    onCompleted: () => {
      setIsEditingSlack(false)
      refetchProject()
      toast({
        title: '更新成功',
        description: 'Slack 通知配置已更新。',
      })
    },
    onError: (error) => {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const project = projectData?.purfenceProject
  const issues = issuesData?.purfenceIssues?.nodes ?? []
  const totalCount = issuesData?.purfenceIssues?.totalCount ?? 0

  // Slack App 列表
  const slackApps = (appConfigData?.purfenceAppConfigs?.nodes ?? [])
    .filter((item) => item.type?.toLowerCase() === 'slack' && item.enabled)
    .map((item) => ({
      id: item.id,
      name: item.name,
    }))

  // Augment issues with project name
  const issuesWithProjectName: Issue[] = issues.map(issue => ({
    ...issue,
    projectName: project?.name ?? undefined,
  }))

  // 处理分页变化
  const handlePageChange = (newOffset: number) => {
    setPageOffset(newOffset)
    refetch()
  }

  // 处理创建需求
  const handleCreateIssue = (title: string, slug: string, description: string) => {
    if (!id) return
    createIssue({
      variables: {
        input: {
          purfenceIssue: {
            projectId: id,
            title,
            slug,
            description,
          },
        },
      },
    })
  }

  // 处理删除需求
  const handleDeleteClick = (issue: Issue) => {
    setIssueToDelete(issue)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!issueToDelete) return
    deleteIssue({
      variables: {
        input: {
          id: issueToDelete.id,
        },
      },
    })
  }

  // 开始编辑 Slack 配置
  const handleStartEditSlack = () => {
    setSlackAppConfigId(project?.slackAppConfigId || '')
    setSlackChannelId(project?.slackChannelId || '')
    setIsEditingSlack(true)
  }

  // 取消编辑 Slack 配置
  const handleCancelEditSlack = () => {
    setIsEditingSlack(false)
    setSlackAppConfigId('')
    setSlackChannelId('')
  }

  // 保存 Slack 配置
  const handleSaveSlack = () => {
    // 验证：如果填写了其中一个，则必须同时填写另一个
    const hasApp = !!slackAppConfigId
    const hasChannel = !!slackChannelId.trim()
    if ((hasApp && !hasChannel) || (!hasApp && hasChannel)) {
      toast({
        title: '验证失败',
        description: 'Slack App 和 Channel ID 需要同时配置',
        variant: 'destructive',
      })
      return
    }

    if (!id) return

    updateProject({
      variables: {
        input: {
          id,
          update: {
            slackAppConfigId: hasApp ? slackAppConfigId : null,
            slackChannelId: hasChannel ? slackChannelId.trim() : null,
          },
        },
      },
    })
  }

  if (!id) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">无效的项目 ID</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (projectError || !project) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">加载失败</CardTitle>
          <CardDescription>{projectError?.message ?? '项目未找到'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/projects')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight">{project.name}</h2>
        </div>
      </div>

      <Separator />

      {/* Project Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">项目信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.description && (
              <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {project.description}
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">本地路径：</span>
              <span className="font-mono text-xs">{project.localRootPath || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">创建时间：</span>
              <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: zhCN })}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">需求数量：</span>
              <Badge variant="secondary">{totalCount}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Slack 通知配置
            </CardTitle>
            {!isEditingSlack && (
              <Button variant="ghost" size="icon" onClick={handleStartEditSlack}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditingSlack ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Slack App</Label>
                  <Select value={slackAppConfigId} onValueChange={setSlackAppConfigId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择 App（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      {slackApps.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slackChannelId">Slack Channel ID</Label>
                  <Input
                    id="slackChannelId"
                    value={slackChannelId}
                    onChange={(e) => setSlackChannelId(e.target.value)}
                    placeholder="C0123456789"
                  />
                  <p className="text-xs text-muted-foreground">
                    在 Slack 频道右键选择「复制链接」，从链接中获取 Channel ID
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelEditSlack}>
                    取消
                  </Button>
                  <Button onClick={handleSaveSlack} disabled={updatingSlack}>
                    {updatingSlack ? '保存中...' : '保存'}
                    <Check className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {project.slackAppConfigId && project.slackChannelId ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Slack App：</span>
                      <Badge variant="secondary">
                        {slackApps.find((a) => a.id === project.slackAppConfigId)?.name || '已配置'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Channel ID：</span>
                      <code className="rounded bg-muted px-2 py-0.5 text-xs">
                        {project.slackChannelId}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">
                      Issue 完成时会自动将结果推送到 Slack 频道
                    </p>
                  </>
                ) : (
                  <div className="text-muted-foreground">
                    未配置。点击右上角编辑按钮配置 Slack 通知。
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">项目需求</h3>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            新建需求
          </Button>
        </div>
        <IssueTable
          issues={issuesWithProjectName}
          loading={issuesLoading}
          pagination={{
            total: totalCount,
            limit: PAGE_LIMIT,
            offset: pageOffset,
            onPageChange: handlePageChange,
          }}
          onDelete={handleDeleteClick}
        />
      </div>

      <CreateIssueDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateIssue}
        loading={creating}
        projectName={project.name ?? undefined}
      />

      <DeleteIssueDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        issueTitle={issueToDelete?.title}
        loading={deleting}
      />
    </div>
  )
}
