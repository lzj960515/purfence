import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { usePurfenceExecutionsQuery, usePurfenceIssueQuery } from '@/graphql/__generated__/hooks'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, FileText, FolderOpen, Play, RotateCcw, MessageSquare } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { PurfenceStatus } from '@/graphql/__generated__/types'
import { START_ISSUE_MUTATION } from '@/api/purfence.graphql'
import { useToast } from '@/hooks/use-toast'

const statusConfig: Record<
  PurfenceStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  open: { label: '待处理', variant: 'secondary' },
  running: { label: '执行中', variant: 'default' },
  needs_user: { label: '待用户', variant: 'outline' },
  needs_approval: { label: '待审批', variant: 'outline' },
  done: { label: '已完成', variant: 'default' },
  budget_exhausted: { label: '预算耗尽', variant: 'destructive' },
  failed: { label: '失败', variant: 'destructive' },
}

function getStatusBadge(status: PurfenceStatus) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [startIssueMutation, { loading: startingIssue }] = useMutation(START_ISSUE_MUTATION)

  const {
    data: issueData,
    loading: issueLoading,
    error: issueError,
    refetch: refetchIssue,
  } = usePurfenceIssueQuery({
    variables: { id: id ?? '' },
    skip: !id,
  })

  const {
    data: executionsData,
    loading: executionsLoading,
    refetch: refetchExecutions,
  } = usePurfenceExecutionsQuery({
    variables: {
      filter: { issueId: { eq: id ?? '' } },
      sorting: [{ field: 'createdAt', direction: 'DESC' }],
    },
    skip: !id,
  })

  const issue = issueData?.purfenceIssue
  const executions = executionsData?.purfenceExecutions?.nodes ?? []

  const handleStartIssue = async () => {
    if (!id) return

    try {
      await startIssueMutation({ variables: { id } })
      toast({
        title: '已开始处理',
        description: 'Issue 已进入执行流程。',
      })
      await Promise.all([refetchIssue(), refetchExecutions()])
    } catch (error) {
      toast({
        title: '启动失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  if (!id) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">无效的需求 ID</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (issueLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (issueError || !issue) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">加载失败</CardTitle>
          <CardDescription>{issueError?.message ?? '需求未找到'}</CardDescription>
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
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{issue.title}</h2>
            {getStatusBadge(issue.status)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {issue.status === 'running' || startingIssue ? (
            <Button variant="outline" disabled>
              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
              {startingIssue ? '启动中' : '执行中'}
            </Button>
          ) : (
            <Button onClick={handleStartIssue}>
              <Play className="mr-2 h-4 w-4" />
              开始处理
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Issue Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">需求信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {issue.description && (
              <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {issue.description}
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">需求 ID：</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">{issue.id}</code>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">项目 ID：</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">{issue.projectId}</code>
            </div>
            {issue.workdir && (
              <div className="flex items-center gap-3 text-sm">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">工作目录：</span>
                <span className="font-mono text-xs">{issue.workdir}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">创建时间：</span>
              <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true, locale: zhCN })}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">更新时间：</span>
              <span>{formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true, locale: zhCN })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">当前执行</CardTitle>
          </CardHeader>
          <CardContent>
            {issue.latestExecutionId ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">执行 ID：</span>
                  <code className="rounded bg-muted px-2 py-0.5 text-xs">{issue.latestExecutionId}</code>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">暂无执行记录</div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Executions List */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">执行历史</h3>
        {executionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">加载中...</div>
          </div>
        ) : executions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <RotateCcw className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <div className="text-sm text-muted-foreground">暂无执行记录</div>
              <div className="mt-1 text-xs text-muted-foreground/70">点击「开始处理」启动第一次执行</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {executions.map((execution) => {
              return (
                <Card
                  key={execution.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() => navigate(`/agent?thread=${execution.id}&source=history&issueId=${id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <code className="rounded bg-muted px-2 py-0.5 text-xs">{execution.id}</code>
                        {getStatusBadge(execution.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/agent?thread=${execution.id}&source=history&issueId=${id}`)
                          }}
                        >
                          <MessageSquare className="mr-1 h-3 w-3" />
                          对话
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(execution.createdAt), { addSuffix: true, locale: zhCN })}
                        </div>
                      </div>
                    </div>
                    {execution.goal && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{execution.goal}</p>
                    )}
                    {execution.error && (
                      <p className="mt-2 text-sm text-destructive line-clamp-2">{execution.error}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
