import { RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UpdateStatus } from '@/hooks/useUpdate'

interface UpdateButtonProps {
  status: UpdateStatus
  onClick: () => void
  className?: string
  collapsed?: boolean
}

export function UpdateButton({
  status,
  onClick,
  className,
  collapsed = false,
}: UpdateButtonProps) {
  if (status === 'idle' || status === 'checking') {
    return null
  }

  const isDownloading = status === 'downloading'
  const isDownloaded = status === 'downloaded'

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size={collapsed ? 'icon' : 'sm'}
        onClick={onClick}
        className={cn(
          'gap-2 text-xs',
          collapsed && 'h-8 w-8 p-0',
          isDownloaded && 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300',
          isDownloading && 'text-blue-600 dark:text-blue-400'
        )}
      >
        {isDownloading ? (
          <>
            <Download className="h-3.5 w-3.5 animate-pulse" />
            {!collapsed && <span>下载中...</span>}
          </>
        ) : isDownloaded ? (
          <>
            <RefreshCw className="h-3.5 w-3.5" />
            {!collapsed && <span>重启更新</span>}
          </>
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5" />
            {!collapsed && <span>有新版本</span>}
          </>
        )}
      </Button>
      {(status === 'available' || status === 'downloaded') && !collapsed && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px] font-bold"
        >
          !
        </Badge>
      )}
    </div>
  )
}
