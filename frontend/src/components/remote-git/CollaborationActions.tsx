import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  GitMerge,
  GitBranch,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
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
import { useToast } from '@/hooks/use-toast'
import {
  GET_WORKFLOW_CONFIG_OR_DEFAULT,
  MANUAL_MERGE_ISSUE,
  MANUAL_PUSH_ISSUE,
  type WorkflowConfig,
} from '@/api/workflow.graphql'
import type { PurfenceStatus } from '@/graphql/__generated__/types'

interface CollaborationActionsProps {
  issueId: string
  projectId: string
  issueStatus: PurfenceStatus
  remoteIssueData?: {
    remoteUrl?: string
    remoteIssueNumber?: number
  } | null
  onActionComplete?: () => void
}

const statusConfig: Record<
  PurfenceStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }
> = {
  open: { label: '待处理', variant: 'secondary', color: 'text-gray-600' },
  running: { label: '执行中', variant: 'default', color: 'text-blue-600' },
  needs_user: { label: '待用户', variant: 'outline', color: 'text-orange-600' },
  needs_approval: { label: '待审批', variant: 'outline', color: 'text-orange-600' },
  done: { label: '已完成', variant: 'default', color: 'text-green-600' },
  budget_exhausted: { label: '预算耗尽', variant: 'destructive', color: 'text-red-600' },
  failed: { label: '失败', variant: 'destructive', color: 'text-red-600' },
}

export function CollaborationActions({
  issueId,
  projectId,
  issueStatus,
  remoteIssueData,
  onActionComplete,
}: CollaborationActionsProps) {
  const { toast } = useToast()
  const [isMerging, setIsMerging] = useState(false)
  const [isPushing, setIsPushing] = useState(false)

  // Get workflow config
  const { data: workflowData } = useQuery<{
    workflowConfigOrDefault: WorkflowConfig
  }>(GET_WORKFLOW_CONFIG_OR_DEFAULT, {
    variables: { projectId },
    skip: !projectId,
    fetchPolicy: 'cache-first',
  })

  // Mutations
  const [manualMerge] = useMutation(MANUAL_MERGE_ISSUE)
  const [manualPush] = useMutation(MANUAL_PUSH_ISSUE)

  const workflowConfig = workflowData?.workflowConfigOrDefault
  const isCollaborativeMode = workflowConfig?.mode === 'COLLABORATIVE'
  const currentStatusConfig = statusConfig[issueStatus]
  const canMerge = issueStatus === 'needs_approval' || issueStatus === 'running'

  // Don't render if not in collaborative mode
  if (!isCollaborativeMode) {
    return null
  }

  const handleMerge = async () => {
    setIsMerging(true)

    try {
      const { data } = await manualMerge({
        variables: { issueId },
      })

      if (data?.manualMergeIssue) {
        toast({
          title: '合并成功',
          description: '已将分支合并到主分支',
        })
        onActionComplete?.()
      }
    } catch (error) {
      toast({
        title: '合并失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsMerging(false)
    }
  }

  const handlePush = async () => {
    setIsPushing(true)

    try {
      const { data } = await manualPush({
        variables: { issueId },
      })

      if (data?.manualPushIssue) {
        toast({
          title: '推送成功',
          description: '已将分支推送到远程仓库',
        })
        onActionComplete?.()
      }
    } catch (error) {
      toast({
        title: '推送失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsPushing(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          协作操作
        </CardTitle>
        <CardDescription>
          当前为协作模式，完成操作需要手动确认
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">当前状态</span>
          <Badge variant={currentStatusConfig.variant}>
            {currentStatusConfig.label}
          </Badge>
        </div>

        {/* Remote Issue Link */}
        {remoteIssueData?.remoteUrl && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">远程 Issue</span>
              <a
                href={remoteIssueData.remoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                #{remoteIssueData.remoteIssueNumber}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </>
        )}

        <Separator />

        {/* Workflow Status */}
        <div className="space-y-2">
          <div className="text-sm font-medium">工作流状态</div>
          <div className="flex items-center gap-2">
            {issueStatus === 'running' && (
              <>
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  正在执行中，请等待天机团队完成工作
                </span>
              </>
            )}
            {issueStatus === 'needs_approval' && (
              <>
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">
                  工作已完成，等待您的审批
                </span>
              </>
            )}
            {issueStatus === 'done' && (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  已完成
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {canMerge && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                onClick={handleMerge}
                disabled={isMerging}
                className="flex-1"
              >
                {isMerging ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GitMerge className="mr-2 h-4 w-4" />
                )}
                合并到主分支
              </Button>
              <Button
                variant="outline"
                onClick={handlePush}
                disabled={isPushing}
                className="flex-1"
              >
                {isPushing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GitBranch className="mr-2 h-4 w-4" />
                )}
                推送到远程
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              提示：合并和推送是独立操作，您可以选择先合并再推送，或只推送
            </p>
          </>
        )}

        {/* MR/PR Info */}
        {remoteIssueData?.remoteUrl && issueStatus === 'needs_approval' && (
          <>
            <Separator />
            <div className="rounded-md bg-muted/50 p-3">
              <div className="text-sm font-medium mb-1">发起 MR/PR</div>
              <p className="text-xs text-muted-foreground mb-2">
                如果您想通过 MR/PR 进行代码审查，请在远程仓库操作
              </p>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={remoteIssueData.remoteUrl.replace('/issues/', '/merge_requests/') || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  前往远程仓库
                </a>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
