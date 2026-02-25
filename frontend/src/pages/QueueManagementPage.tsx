import { useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  fetchQueueStats,
  pauseQueue,
  resumeQueue,
  clearQueue,
  fetchJobs,
  retryJob,
  deleteJob,
  type QueueStatus,
  type QueueStats,
  type JobInfo,
} from '@/api/queue.api';
import { cn } from '@/lib/utils';

type JobStatusFilter = 'pending' | 'running' | 'pending_retry' | 'failed' | 'all';

const STATUS_LABELS: Record<JobStatusFilter, string> = {
  all: '全部',
  pending: '等待中',
  running: '处理中',
  pending_retry: '重试中',
  failed: '已失败',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  running: 'default',
  pending_retry: 'outline',
  failed: 'destructive',
};

/**
 * Stat card component for displaying queue statistics
 */
function StatCard({
  title,
  value,
  icon,
  variant = 'default',
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'destructive' | 'success';
}) {
  const variantStyles = {
    default: 'bg-muted/50',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    destructive: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    success: 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    warning: 'text-yellow-600 dark:text-yellow-400',
    destructive: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400',
  };

  return (
    <Card className={cn('border', variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={iconStyles[variant]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

/**
 * Stats grid component
 */
function QueueStatsGrid({ stats }: { stats: QueueStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="等待中"
        value={stats.pending}
        icon={<Clock className="h-4 w-4" />}
        variant={stats.pending > 0 ? 'warning' : 'default'}
      />
      <StatCard
        title="重试中"
        value={stats.pending_retry}
        icon={<RefreshCw className="h-4 w-4" />}
        variant={stats.pending_retry > 0 ? 'warning' : 'default'}
      />
      <StatCard
        title="处理中"
        value={stats.running}
        icon={<Loader2 className="h-4 w-4 animate-spin" />}
        variant={stats.running > 0 ? 'success' : 'default'}
      />
      <StatCard
        title="已失败"
        value={stats.failed}
        icon={<XCircle className="h-4 w-4" />}
        variant={stats.failed > 0 ? 'destructive' : 'default'}
      />
    </div>
  );
}

/**
 * Queue controls component
 */
function QueueControls({
  isRunning,
  onToggle,
  onClear,
  isLoading,
  isClearing,
  concurrency,
}: {
  isRunning: boolean;
  onToggle: () => void;
  onClear: () => void;
  isLoading: boolean;
  isClearing: boolean;
  concurrency: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">状态：</span>
        <Badge variant={isRunning ? 'default' : 'secondary'}>
          {isRunning ? '运行中' : '已暂停'}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">并发数：</span>
        <Badge variant="outline">{concurrency}</Badge>
      </div>
      <div className="flex-1" />
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : isRunning ? (
          <Pause className="h-4 w-4 mr-2" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        {isLoading
          ? '处理中...'
          : isRunning
            ? '暂停队列'
            : '恢复队列'}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onClear}
        disabled={isClearing}
      >
        {isClearing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 mr-2" />
        )}
        {isClearing ? '清空中...' : '清空队列'}
      </Button>
    </div>
  );
}

/**
 * Job list component
 */
function JobList({
  jobs,
  loading,
  statusFilter,
  onStatusChange,
  onRetry,
  onDelete,
  total,
  page,
  limit,
  onPageChange,
}: {
  jobs: JobInfo[];
  loading: boolean;
  statusFilter: JobStatusFilter;
  onStatusChange: (status: JobStatusFilter) => void;
  onRetry: (jobId: number) => void;
  onDelete: (jobId: number) => void;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">任务列表</CardTitle>
          <div className="flex gap-1">
            {(Object.keys(STATUS_LABELS) as JobStatusFilter[]).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onStatusChange(status)}
                className="h-7 px-2 text-xs"
              >
                {STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>暂无任务</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_100px_150px_80px] gap-4 px-4 py-3 text-muted-foreground text-sm border-b bg-muted/30">
                <div>任务 ID</div>
                <div>Issue ID</div>
                <div>状态</div>
                <div>创建时间</div>
                <div>操作</div>
              </div>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="grid grid-cols-[1fr_1fr_100px_150px_80px] gap-4 px-4 py-3 items-center border-b last:border-b-0 hover:bg-muted/30"
                >
                  <div className="font-mono text-sm truncate">{job.id}</div>
                  <div className="font-mono text-sm truncate">{job.issueId}</div>
                  <div>
                    <Badge variant={STATUS_VARIANTS[job.status]}>
                      {STATUS_LABELS[job.status as JobStatusFilter]}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(job.createdAt).toLocaleString()}
                  </div>
                  <div className="flex gap-1">
                    {job.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onRetry(job.id)}
                        title="重试"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    {job.status !== 'running' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(job.id)}
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  共 {total} 条记录
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                  >
                    上一页
                  </Button>
                  <span className="flex items-center text-sm">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function QueueManagementPage() {
  const { toast } = useToast();
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch queue stats
  const loadStats = useCallback(async (showRefreshLoader = false) => {
    if (showRefreshLoader) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const status = await fetchQueueStats();
      setQueueStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载队列状态失败');
      toast({
        title: '加载失败',
        description: err instanceof Error ? err.message : '加载队列状态失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  // Fetch jobs
  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const result = await fetchJobs(
        statusFilter === 'all' ? undefined : statusFilter,
        jobsPage,
        jobsLimit,
      );
      setJobs(result.jobs);
      setJobsTotal(result.total);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  }, [statusFilter, jobsPage, jobsLimit]);

  // Initial load
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Load jobs when filter changes
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadStats(true);
      loadJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadStats, loadJobs]);

  // Handle pause/resume toggle
  const handleToggle = async () => {
    if (!queueStatus) return;

    setToggling(true);
    try {
      if (queueStatus.isRunning) {
        await pauseQueue();
        toast({
          title: '队列已暂停',
          description: '队列已暂停，正在处理的任务会继续完成。',
        });
      } else {
        await resumeQueue();
        toast({
          title: '队列已恢复',
          description: '队列已恢复运行。',
        });
      }
      await loadStats();
    } catch (err) {
      toast({
        title: queueStatus.isRunning ? '暂停失败' : '恢复失败',
        description: err instanceof Error ? err.message : '操作失败，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setToggling(false);
    }
  };

  // Handle clear queue
  const handleClear = async () => {
    setShowClearDialog(false);
    setClearing(true);
    try {
      const result = await clearQueue();
      toast({
        title: '队列已清空',
        description: result.message,
      });
      await loadStats();
      await loadJobs();
    } catch (err) {
      toast({
        title: '清空失败',
        description: err instanceof Error ? err.message : '操作失败，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setClearing(false);
    }
  };

  // Handle retry job
  const handleRetry = async (jobId: number) => {
    try {
      await retryJob(jobId);
      toast({
        title: '重试成功',
        description: '任务已重新加入队列',
      });
      await loadJobs();
      await loadStats();
    } catch (err) {
      toast({
        title: '重试失败',
        description: err instanceof Error ? err.message : '操作失败，请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // Handle delete job
  const handleDelete = async (jobId: number) => {
    setShowDeleteDialog(null);
    try {
      await deleteJob(jobId);
      toast({
        title: '删除成功',
        description: '任务已删除',
      });
      await loadJobs();
      await loadStats();
    } catch (err) {
      toast({
        title: '删除失败',
        description: err instanceof Error ? err.message : '操作失败，请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // Handle status filter change
  const handleStatusChange = (status: JobStatusFilter) => {
    setStatusFilter(status);
    setJobsPage(1);
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className="space-y-6">
        <div className="pb-6 border-b">
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            队列管理
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            管理 Issue 处理队列
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !queueStatus) {
    return (
      <div className="space-y-6">
        <div className="pb-6 border-b">
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            队列管理
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            管理 Issue 处理队列
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">加载失败</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => loadStats()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新加载
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-6 border-b flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            队列管理
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            管理 Issue 处理队列，监控任务执行状态
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadStats(true);
            loadJobs();
          }}
          disabled={refreshing}
        >
          <RefreshCw
            className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')}
          />
          {refreshing ? '刷新中...' : '刷新'}
        </Button>
      </div>

      {/* Stats Grid */}
      {queueStatus && (
        <div className="space-y-4">
          <QueueStatsGrid stats={queueStatus.stats} />
        </div>
      )}

      {/* Controls */}
      {queueStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">队列控制</CardTitle>
          </CardHeader>
          <CardContent>
            <QueueControls
              isRunning={queueStatus.isRunning}
              onToggle={handleToggle}
              onClear={() => setShowClearDialog(true)}
              isLoading={toggling}
              isClearing={clearing}
              concurrency={queueStatus.concurrency}
            />
          </CardContent>
        </Card>
      )}

      {/* Job List */}
      <JobList
        jobs={jobs}
        loading={jobsLoading}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        onRetry={handleRetry}
        onDelete={(jobId) => setShowDeleteDialog(jobId)}
        total={jobsTotal}
        page={jobsPage}
        limit={jobsLimit}
        onPageChange={setJobsPage}
      />

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认清空队列？</DialogTitle>
            <DialogDescription>
              此操作将清空所有等待中、重试中和已失败的任务。
              正在处理的任务会继续完成，不会被清除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              确认清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog !== null} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除任务？</DialogTitle>
            <DialogDescription>
              此操作将删除该任务，无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
