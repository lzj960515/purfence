import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  FileText,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import type { PurfenceStatus } from '@/graphql/__generated__/types'

export interface Issue {
  id: string
  projectId: string
  title: string
  description: string
  status: PurfenceStatus
  latestExecutionId?: string | null
  createdAt: string
  updatedAt: string
  projectName?: string
}

interface IssueTableProps {
  issues: Issue[]
  loading?: boolean
  pagination?: {
    total: number
    limit: number
    offset: number
    onPageChange: (offset: number) => void
  }
  onDelete?: (issue: Issue) => void
}

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

export function IssueTable({ issues, loading, pagination, onDelete }: IssueTableProps) {
  const navigate = useNavigate()

  const currentPage = pagination ? Math.floor(pagination.offset / pagination.limit) + 1 : 1
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1

  const handlePageClick = (page: number) => {
    if (pagination) {
      pagination.onPageChange((page - 1) * pagination.limit)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <div className="text-sm text-muted-foreground">暂无需求</div>
        <div className="mt-1 text-xs text-muted-foreground/70">点击右上角「新建需求」创建第一个需求</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>需求标题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>所属项目</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow
                key={issue.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/issues/${issue.id}`)}
              >
                <TableCell className="font-medium">{issue.title}</TableCell>
                <TableCell>{getStatusBadge(issue.status)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {issue.projectName ?? issue.projectId}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(issue.createdAt), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/issues/${issue.id}`)
                      }}
                      >
                        查看详情
                      </DropdownMenuItem>
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(issue)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除需求
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
          <div className="text-sm text-muted-foreground">
            第 {currentPage}/{totalPages} 页 · {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)}/{pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageClick(currentPage - 1)}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageClick(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-muted-foreground">每页</span>
              <span className="text-sm font-medium">{pagination.limit}</span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-muted-foreground">跳转</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                defaultValue={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value)
                  if (page >= 1 && page <= totalPages && page !== currentPage) {
                    handlePageClick(page)
                  }
                }}
                className="w-16 h-8 px-2 text-sm border rounded-md text-center"
              />
              <span className="text-sm text-muted-foreground">去</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
