import { Download } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { DownloadProgress as DownloadProgressType } from '@/hooks/useUpdate'

interface DownloadProgressProps {
  progress: DownloadProgressType
  className?: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function DownloadProgress({ progress, className }: DownloadProgressProps) {
  const { downloaded, total, percentage } = progress

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Download className="h-4 w-4 animate-bounce" />
        <span>正在下载更新...</span>
      </div>

      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {formatBytes(downloaded)}
            {total && ` / ${formatBytes(total)}`}
          </span>
          <span>{percentage}%</span>
        </div>
      </div>
    </div>
  )
}
