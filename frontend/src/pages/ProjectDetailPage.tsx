import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  usePurfenceProjectQuery,
  usePurfenceIssuesQuery,
  useCreateOnePurfenceIssueMutation,
  useDeleteOnePurfenceIssueMutation,
} from '@/graphql/__generated__/hooks'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, FolderOpen, FileText, Plus } from 'lucide-react'
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
import { IssueTable, type Issue } from '@/components/tables/IssueTable'
import { CreateIssueDialog } from '@/components/dialogs/CreateIssueDialog'
import { DeleteIssueDialog } from '@/components/dialogs/DeleteIssueDialog'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState<Issue | null>(null)
  const [pageOffset, setPageOffset] = useState(0)
  const PAGE_LIMIT = 20

  const { data: projectData, loading: projectLoading, error: projectError } = usePurfenceProjectQuery({
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

  const project = projectData?.purfenceProject
  const issues = issuesData?.purfenceIssues?.nodes ?? []
  const totalCount = issuesData?.purfenceIssues?.totalCount ?? 0

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
          <CardHeader className="pb-3">
            <CardTitle className="text-base">项目 ID</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="rounded bg-muted px-2 py-1 text-xs">{project.id}</code>
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
