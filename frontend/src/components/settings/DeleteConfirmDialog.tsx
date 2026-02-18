import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmDialogProps {
  open: boolean
  configName: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function DeleteConfirmDialog({
  open,
  configName,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>确认删除</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-700 dark:text-gray-300">
            确定要删除配置「<strong>{configName}</strong>」吗？
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            此操作无法撤销，删除后需要重新配置才能使用该提供商。
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? '删除中...' : '删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
