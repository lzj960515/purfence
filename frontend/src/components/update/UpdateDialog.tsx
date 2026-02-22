import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DownloadProgress } from './DownloadProgress'
import type { UpdateInfo, DownloadProgress as DownloadProgressType, UpdateStatus } from '@/hooks/useUpdate'

interface UpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: UpdateStatus
  updateInfo: UpdateInfo | null
  downloadProgress: DownloadProgressType | null
  error: string | null
  onConfirm: () => void
  onCancel: () => void
  onInstallAndRestart: () => void
}

export function UpdateDialog({
  open,
  onOpenChange,
  status,
  updateInfo,
  downloadProgress,
  error,
  onConfirm,
  onCancel,
  onInstallAndRestart,
}: UpdateDialogProps) {
  const isDownloading = status === 'downloading'
  const isDownloaded = status === 'downloaded'
  const hasError = status === 'error'

  const formatVersion = (version: string) => {
    return version.startsWith('v') ? version : `v${version}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasError ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                更新失败
              </>
            ) : isDownloaded ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                更新就绪
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                发现新版本
              </>
            )}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              {hasError && error && (
                <p className="text-destructive">{error}</p>
              )}
              {updateInfo && !hasError && !isDownloaded && (
                <>
                  <p>
                    <span className="font-medium">{formatVersion(updateInfo.version)}</span>
                    {' '}（当前版本：{formatVersion(updateInfo.currentVersion)}）
                  </p>
                  {updateInfo.pubDate && (
                    <p className="text-xs text-muted-foreground">
                      发布日期：{new Date(updateInfo.pubDate).toLocaleDateString('zh-CN')}
                    </p>
                  )}
                </>
              )}
              {isDownloaded && (
                <p>更新已下载完成，需要重启应用以完成安装。</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Release Notes */}
        {updateInfo?.releaseNotes && !isDownloading && !isDownloaded && (
          <div className="max-h-60 overflow-y-auto rounded-md border bg-muted/30 p-3">
            <h4 className="mb-2 text-sm font-medium">更新内容</h4>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans">
                {updateInfo.releaseNotes}
              </pre>
            </div>
          </div>
        )}

        {/* Download Progress */}
        {isDownloading && downloadProgress && (
          <DownloadProgress progress={downloadProgress} />
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {hasError && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                关闭
              </Button>
              <Button onClick={onConfirm}>重试</Button>
            </>
          )}

          {!hasError && !isDownloading && !isDownloaded && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                稍后提醒
              </Button>
              <Button onClick={onConfirm}>立即下载</Button>
            </>
          )}

          {isDownloading && (
            <>
              <Button variant="outline" onClick={onCancel}>
                取消
              </Button>
              <Button disabled>
                下载中...
              </Button>
            </>
          )}

          {isDownloaded && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                稍后重启
              </Button>
              <Button onClick={onInstallAndRestart}>
                重启并安装
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
