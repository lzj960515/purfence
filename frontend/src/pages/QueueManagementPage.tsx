import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApolloClient } from '@apollo/client'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { MY_QUEUE_STATS_QUERY } from '@/api/queue.graphql'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  useCreateMyQueueJobMutation,
  useDeleteMyQueueJobMutation,
  useMyQueueJobsQuery,
  useMyQueuesQuery,
  useUpdateMyQueueMutation,
  type MyQueueJobStatus,
} from '@/graphql/__generated__/hooks'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type JobStatusFilter = MyQueueJobStatus | 'all'

type QueueStats = {
  total: number
  pending: number
  running: number
  succeeded: number
  failed: number
}

const EMPTY_STATS: QueueStats = {
  total: 0,
  pending: 0,
  running: 0,
  succeeded: 0,
  failed: 0,
}

const STATUS_LABELS: Record<JobStatusFilter, string> = {
  all: '全部',
  pending: '等待中',
  running: '处理中',
  succeeded: '已成功',
  failed: '已失败',
}

const STATUS_VARIANTS: Record<
  MyQueueJobStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  running: 'default',
  succeeded: 'outline',
  failed: 'destructive',
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}

function renderJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function QueueManagementPage() {
  const { queueId } = useParams<{ queueId?: string }>()
  const navigate = useNavigate()
  const client = useApolloClient()
  const { toast } = useToast()

  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('all')
  const [jobsPage, setJobsPage] = useState(1)
  const [maxConcurrencyInput, setMaxConcurrencyInput] = useState('3')
  const [queueStats, setQueueStats] = useState<Record<string, QueueStats>>({})
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>({})

  const jobsLimit = 10

  const {
    data: queuesData,
    loading: queuesLoading,
    error: queuesError,
    refetch: refetchQueues,
  } = useMyQueuesQuery({
    variables: {
      paging: { offset: 0, limit: 50 },
      filter: {},
      sorting: [{ field: 'createdAt', direction: 'ASC' }],
    },
    fetchPolicy: 'cache-and-network',
  })

  const queues = queuesData?.myQueues.nodes ?? []
  const selectedQueue = useMemo(
    () => (queueId ? queues.find((queue) => queue.id === queueId) ?? null : null),
    [queues, queueId],
  )

  const jobsOffset = (jobsPage - 1) * jobsLimit
  const {
    data: jobsData,
    loading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useMyQueueJobsQuery(
    selectedQueue
      ? {
          variables: {
            paging: { offset: jobsOffset, limit: jobsLimit },
            filter: {
              queueId: { eq: selectedQueue.id },
              ...(statusFilter === 'all' ? {} : { status: { eq: statusFilter } }),
            },
            sorting: [
              { field: 'createdAt', direction: 'DESC' },
              { field: 'id', direction: 'DESC' },
            ],
          },
          fetchPolicy: 'cache-and-network',
        }
      : {
          skip: true,
          variables: {
            paging: { offset: 0, limit: jobsLimit },
            filter: {},
            sorting: [{ field: 'createdAt', direction: 'DESC' }],
          },
        },
  )

  const [updateMyQueue, { loading: updatingQueue }] = useUpdateMyQueueMutation()
  const [createMyQueueJob, { loading: retrying }] = useCreateMyQueueJobMutation()
  const [deleteMyQueueJob, { loading: deleting }] = useDeleteMyQueueJobMutation()

  const jobs = jobsData?.myQueueJobs.nodes ?? []
  const jobsTotal = jobsData?.myQueueJobs.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(jobsTotal / jobsLimit))
  const selectedQueueStats = selectedQueue ? queueStats[selectedQueue.id] ?? EMPTY_STATS : EMPTY_STATS

  const loadQueueStats = useCallback(
    async (queueIds: string[]) => {
      if (!queueIds.length) {
        setQueueStats({})
        return
      }

      const entries = await Promise.all(
        queueIds.map(async (id) => {
          const result = await client.query({
            query: MY_QUEUE_STATS_QUERY,
            variables: { queueId: id },
            fetchPolicy: 'network-only',
          })
          const data = result.data as {
            total: { totalCount: number }
            pending: { totalCount: number }
            running: { totalCount: number }
            succeeded: { totalCount: number }
            failed: { totalCount: number }
          }
          return [
            id,
            {
              total: data.total.totalCount,
              pending: data.pending.totalCount,
              running: data.running.totalCount,
              succeeded: data.succeeded.totalCount,
              failed: data.failed.totalCount,
            },
          ] as const
        }),
      )

      setQueueStats(Object.fromEntries(entries))
    },
    [client],
  )

  useEffect(() => {
    void loadQueueStats(queues.map((queue) => queue.id))
  }, [queues, loadQueueStats])

  useEffect(() => {
    if (!selectedQueue) {
      return
    }
    setMaxConcurrencyInput(String(selectedQueue.maxConcurrency))
  }, [selectedQueue])

  const refreshAll = async () => {
    const queueResult = await refetchQueues()
    const refreshedQueues = queueResult.data?.myQueues.nodes ?? []
    if (selectedQueue) {
      await refetchJobs()
    }
    await loadQueueStats(refreshedQueues.map((queue) => queue.id))
  }

  const updateQueuePatch = async (patch: { isPaused?: boolean; maxConcurrency?: number }) => {
    if (!selectedQueue) {
      return
    }
    await updateMyQueue({
      variables: {
        input: {
          id: selectedQueue.id,
          update: patch,
        },
      },
    })
  }

  const toggleQueuePause = async () => {
    if (!selectedQueue) {
      return
    }
    try {
      await updateQueuePatch({ isPaused: !selectedQueue.isPaused })
      await refreshAll()
    } catch (error) {
      toast({
        title: '更新队列失败',
        description: toErrorMessage(error, '请稍后重试'),
        variant: 'destructive',
      })
    }
  }

  const saveMaxConcurrency = async () => {
    if (!selectedQueue) {
      return
    }
    const parsed = Number.parseInt(maxConcurrencyInput, 10)
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast({
        title: '并发设置无效',
        description: '请输入大于等于 1 的整数',
        variant: 'destructive',
      })
      return
    }
    try {
      await updateQueuePatch({ maxConcurrency: parsed })
      await refreshAll()
    } catch (error) {
      toast({
        title: '更新并发失败',
        description: toErrorMessage(error, '请稍后重试'),
        variant: 'destructive',
      })
    }
  }

  const toggleExpandJob = (jobId: string) => {
    setExpandedJobIds((previous) => ({ ...previous, [jobId]: !previous[jobId] }))
  }

  const retryJob = async (jobId: string) => {
    if (!selectedQueue) {
      return
    }
    const job = jobs.find((item) => item.id === jobId)
    if (!job) {
      return
    }
    try {
      await createMyQueueJob({
        variables: {
          input: {
            myQueueJob: {
              queueId: job.queueId,
              queueName: job.queueName,
              data: job.data,
              attempts: selectedQueue.attempts,
              availableAt: new Date().toISOString(),
            },
          },
        },
      })
      await deleteMyQueueJob({ variables: { input: { id: jobId } } })
      await refreshAll()
    } catch (error) {
      toast({
        title: '重试失败',
        description: toErrorMessage(error, '请稍后重试'),
        variant: 'destructive',
      })
    }
  }

  const removeJob = async (jobId: string) => {
    try {
      await deleteMyQueueJob({ variables: { input: { id: jobId } } })
      await refreshAll()
    } catch (error) {
      toast({
        title: '删除失败',
        description: toErrorMessage(error, '请稍后重试'),
        variant: 'destructive',
      })
    }
  }

  const renderQueueList = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">队列列表</CardTitle>
      </CardHeader>
      <CardContent>
        {queuesLoading && queues.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : queuesError ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {queuesError.message}
          </div>
        ) : queues.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>暂无可用队列</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {queues.map((queue) => {
              const stats = queueStats[queue.id] ?? EMPTY_STATS
              return (
                <button
                  key={queue.id}
                  type="button"
                  onClick={() => navigate(`/settings/queue/${queue.id}`)}
                  className="rounded-lg border p-4 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-base">{queue.name}</div>
                    <Badge variant={queue.isPaused ? 'secondary' : 'default'}>
                      {queue.isPaused ? '已暂停' : '运行中'}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>并发上限 {queue.maxConcurrency}</span>
                    <span>重试上限 {queue.attempts}</span>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    等待中 {stats.pending} · 处理中 {stats.running} · 已成功 {stats.succeeded} · 已失败 {stats.failed}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderQueueDetail = () => {
    if (queuesLoading && !selectedQueue) {
      return (
        <Card>
          <CardContent className="py-10 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )
    }

    if (!selectedQueue) {
      return (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            队列不存在或已被删除
          </CardContent>
        </Card>
      )
    }

    return (
      <>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate('/settings/queue')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg">队列详情：{selectedQueue.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={maxConcurrencyInput}
                  onChange={(event) => setMaxConcurrencyInput(event.target.value)}
                  className="h-8 w-24"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void saveMaxConcurrency()}
                  disabled={updatingQueue}
                >
                  保存并发
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void toggleQueuePause()}
                  disabled={updatingQueue}
                >
                  {selectedQueue.isPaused ? (
                    <Play className="mr-2 h-4 w-4" />
                  ) : (
                    <Pause className="mr-2 h-4 w-4" />
                  )}
                  {selectedQueue.isPaused ? '恢复队列' : '暂停队列'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">等待中</p><p className="mt-2 text-2xl font-semibold">{selectedQueueStats.pending}</p></CardContent></Card>
              <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">处理中</p><p className="mt-2 text-2xl font-semibold">{selectedQueueStats.running}</p></CardContent></Card>
              <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">已成功</p><p className="mt-2 text-2xl font-semibold">{selectedQueueStats.succeeded}</p></CardContent></Card>
              <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">已失败</p><p className="mt-2 text-2xl font-semibold">{selectedQueueStats.failed}</p></CardContent></Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">任务列表</CardTitle>
              <div className="flex items-center gap-2">
                {(Object.keys(STATUS_LABELS) as JobStatusFilter[]).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setStatusFilter(status)
                      setJobsPage(1)
                    }}
                  >
                    {STATUS_LABELS[status]}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {jobsError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {jobsError.message}
              </div>
            ) : jobsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>暂无任务</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-[1fr_120px_160px_160px_50px] gap-3 border-b bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  <div>任务 ID</div>
                  <div>状态</div>
                  <div>创建时间</div>
                  <div>最后更新时间</div>
                  <div className="text-right">展开</div>
                </div>
                {jobs.map((job) => {
                  const expanded = !!expandedJobIds[job.id]
                  return (
                    <div key={job.id} className="border-b last:border-b-0">
                      <button
                        type="button"
                        className="grid w-full grid-cols-[1fr_120px_160px_160px_50px] items-center gap-3 px-4 py-3 text-left hover:bg-muted/20"
                        onClick={() => toggleExpandJob(job.id)}
                      >
                        <div className="truncate font-mono text-sm">{job.id}</div>
                        <Badge variant={STATUS_VARIANTS[job.status]}>{STATUS_LABELS[job.status]}</Badge>
                        <div className="text-sm text-muted-foreground">{formatDate(job.createdAt)}</div>
                        <div className="text-sm text-muted-foreground">{formatDate(job.updatedAt)}</div>
                        <div className="flex justify-end">
                          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                        </div>
                      </button>
                      {expanded && (
                        <div className="grid gap-4 border-t bg-muted/20 px-4 py-3 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">任务数据</p>
                            <pre className="mt-2 overflow-auto rounded-md bg-background p-3 text-xs">
                              {renderJson(job.data)}
                            </pre>
                          </div>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p><span className="font-medium">队列：</span>{job.queueName}</p>
                            <p><span className="font-medium">计划执行时间：</span>{formatDate(job.availableAt)}</p>
                            <p><span className="font-medium">开始处理时间：</span>{job.runningAt ? formatDate(job.runningAt) : '--'}</p>
                            <p><span className="font-medium">完成时间：</span>{job.completedAt ? formatDate(job.completedAt) : '--'}</p>
                            <p><span className="font-medium">尝试次数：</span>{job.runCount}/{job.attempts}</p>
                            {job.errorMessage && <p><span className="font-medium text-destructive">失败原因：</span>{job.errorMessage}</p>}
                            <div className="pt-2">
                              {job.status === 'failed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={retrying}
                                  onClick={() => void retryJob(job.id)}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />重试
                                </Button>
                              )}
                              {job.status !== 'running' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-2 text-destructive"
                                  disabled={deleting}
                                  onClick={() => void removeJob(job.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />删除
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {jobsTotal > jobsLimit && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">共 {jobsTotal} 条记录</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={jobsPage <= 1} onClick={() => setJobsPage((page) => page - 1)}>上一页</Button>
                  <span className="text-sm">{jobsPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={jobsPage >= totalPages} onClick={() => setJobsPage((page) => page + 1)}>下一页</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 border-b pb-6">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">队列管理</h1>
        <Button variant="outline" size="sm" onClick={() => void refreshAll()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>
      {queueId ? renderQueueDetail() : renderQueueList()}
    </div>
  )
}
