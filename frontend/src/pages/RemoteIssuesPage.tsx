import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Loader2,
  ExternalLink,
  CheckSquare,
  Download,
  Tag,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  GET_REMOTE_REPOSITORY_CONFIG,
  GET_REMOTE_ISSUES,
  GET_IMPORTED_REMOTE_ISSUES,
  IMPORT_REMOTE_ISSUE,
  type RemoteIssue,
} from '@/api/remote-git.graphql'

const stateColors: Record<string, string> = {
  open: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  merged: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

export function RemoteIssuesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set())
  const [importingIssues, setImportingIssues] = useState<Set<string>>(new Set())

  // Queries
  const { data: configData, loading: configLoading } = useQuery(GET_REMOTE_REPOSITORY_CONFIG, {
    variables: { projectId: projectId ?? '' },
    skip: !projectId,
    fetchPolicy: 'network-only',
  })

  const {
    data: remoteIssuesData,
    loading: issuesLoading,
    refetch: refetchIssues,
  } = useQuery<{
    remoteIssues: RemoteIssue[]
  }>(GET_REMOTE_ISSUES, {
    variables: { projectId: projectId ?? '' },
    skip: !projectId || !configData?.remoteRepositoryConfig,
    fetchPolicy: 'network-only',
  })

  const { data: importedData, refetch: refetchImported } = useQuery<{
    importedRemoteIssues: Array<{ id: string; remoteIssueData?: { remoteIssueId?: string } | null }>
  }>(GET_IMPORTED_REMOTE_ISSUES, {
    variables: { projectId: projectId ?? '' },
    skip: !projectId,
    fetchPolicy: 'network-only',
  })

  // Mutations
  const [importRemoteIssue] = useMutation(IMPORT_REMOTE_ISSUE)

  // Derived state
  const config = configData?.remoteRepositoryConfig
  const importedIssueIds = useMemo(
    () => new Set(
      importedData?.importedRemoteIssues
        ?.map((issue) => issue.remoteIssueData?.remoteIssueId)
        .filter(Boolean) as string[] ?? []
    ),
    [importedData]
  )

  // Filter issues - include the remoteIssues derivation inside useMemo
  const filteredIssues = useMemo(() => {
    const remoteIssues = remoteIssuesData?.remoteIssues ?? []
    return remoteIssues.filter((issue) => {
      // State filter
      if (stateFilter !== 'all' && issue.state.toLowerCase() !== stateFilter) {
        return false
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          issue.title.toLowerCase().includes(query) ||
          issue.description?.toLowerCase().includes(query) ||
          issue.labels.some((label) => label.toLowerCase().includes(query))
        )
      }
      return true
    })
  }, [remoteIssuesData, stateFilter, searchQuery])

  // Handlers
  const handleSelectIssue = (issueId: string) => {
    const newSelected = new Set(selectedIssues)
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId)
    } else {
      newSelected.add(issueId)
    }
    setSelectedIssues(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIssues.size === filteredIssues.length) {
      setSelectedIssues(new Set())
    } else {
      setSelectedIssues(new Set(filteredIssues.map((issue) => issue.remoteIssueId)))
    }
  }

  const handleImportIssue = async (issue: RemoteIssue) => {
    if (!projectId) return

    setImportingIssues((prev) => new Set(prev).add(issue.remoteIssueId))

    try {
      await importRemoteIssue({
        variables: {
          input: {
            projectId,
            remoteIssueId: issue.remoteIssueId,
          },
        },
      })

      toast({
        title: '导入成功',
        description: `已导入 Issue #${issue.remoteIssueNumber}: ${issue.title}`,
      })

      await Promise.all([refetchImported()])
      // Remove from selected if present
      setSelectedIssues((prev) => {
        const newSet = new Set(prev)
        newSet.delete(issue.remoteIssueId)
        return newSet
      })
    } catch (error) {
      toast({
        title: '导入失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setImportingIssues((prev) => {
        const newSet = new Set(prev)
        newSet.delete(issue.remoteIssueId)
        return newSet
      })
    }
  }

  const handleBatchImport = async () => {
    if (!projectId || selectedIssues.size === 0) return

    const issuesToImport = filteredIssues.filter((issue) =>
      selectedIssues.has(issue.remoteIssueId) && !importedIssueIds.has(issue.remoteIssueId)
    )

    if (issuesToImport.length === 0) {
      toast({
        title: '无可导入的 Issue',
        description: '选中的 Issue 已全部导入',
        variant: 'destructive',
      })
      return
    }

    let successCount = 0
    let failCount = 0

    for (const issue of issuesToImport) {
      try {
        await importRemoteIssue({
          variables: {
            input: {
              projectId,
              remoteIssueId: issue.remoteIssueId,
            },
          },
        })
        successCount++
      } catch {
        failCount++
      }
    }

    if (successCount > 0) {
      toast({
        title: '批量导入完成',
        description: `成功导入 ${successCount} 个 Issue${failCount > 0 ? `，失败 ${failCount} 个` : ''}`,
      })
    }

    setSelectedIssues(new Set())
    await refetchImported()
  }

  const handleRefresh = async () => {
    await refetchIssues()
    toast({
      title: '刷新成功',
      description: '已获取最新的远程 Issue 列表',
    })
  }

  // Loading states
  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // No config
  if (!config) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-semibold tracking-tight">远程 Issue</h2>
        </div>
        <Separator />
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              请先配置远程仓库
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate(`/projects/${projectId}/settings/remote`)}
            >
              前往配置
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <h2 className="text-2xl font-semibold tracking-tight">远程 Issue</h2>
          <p className="text-sm text-muted-foreground">
            从 {config.type === 'GITLAB' ? 'GitLab' : 'GitHub'} 同步和导入 Issue
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={issuesLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${issuesLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <Separator />

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索 Issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="open">打开</SelectItem>
            <SelectItem value="closed">关闭</SelectItem>
          </SelectContent>
        </Select>
        {selectedIssues.size > 0 && (
          <Button onClick={handleBatchImport}>
            <Download className="mr-2 h-4 w-4" />
            导入选中 ({selectedIssues.size})
          </Button>
        )}
      </div>

      {/* Issues List */}
      {issuesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredIssues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || stateFilter !== 'all'
                ? '没有找到匹配的 Issue'
                : '远程仓库暂无 Issue'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={selectedIssues.size === filteredIssues.length && filteredIssues.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              全选 ({filteredIssues.length} 个 Issue)
            </span>
          </div>

          {/* Issue Cards */}
          {filteredIssues.map((issue) => {
            const isImported = importedIssueIds.has(issue.remoteIssueId)
            const isSelected = selectedIssues.has(issue.remoteIssueId)
            const isImporting = importingIssues.has(issue.remoteIssueId)

            return (
              <Card
                key={issue.remoteIssueId}
                className={`transition-colors ${
                  isImported
                    ? 'bg-muted/30'
                    : isSelected
                      ? 'border-primary bg-primary/5'
                      : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected || isImported}
                      disabled={isImported}
                      onCheckedChange={() => handleSelectIssue(issue.remoteIssueId)}
                      className="mt-1"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {/* Title */}
                          <div className="flex items-center gap-2">
                            <a
                              href={issue.remoteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline flex items-center gap-1"
                            >
                              <span className="text-muted-foreground">#{issue.remoteIssueNumber}</span>
                              <span>{issue.title}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {/* State */}
                            <Badge
                              variant="secondary"
                              className={stateColors[issue.state.toLowerCase()] || ''}
                            >
                              {issue.state}
                            </Badge>

                            {/* Labels */}
                            {issue.labels.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3 text-muted-foreground" />
                                {issue.labels.slice(0, 3).map((label) => (
                                  <Badge key={label} variant="outline" className="text-xs">
                                    {label}
                                  </Badge>
                                ))}
                                {issue.labels.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{issue.labels.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Date */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(issue.updatedAt).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Description preview */}
                          {issue.description && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {issue.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {isImported ? (
                            <Badge variant="secondary">
                              <CheckSquare className="mr-1 h-3 w-3" />
                              已导入
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => handleImportIssue(issue)}
                              disabled={isImporting}
                            >
                              {isImporting ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="mr-1 h-3 w-3" />
                              )}
                              导入
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
