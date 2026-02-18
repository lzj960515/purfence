import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface DeleteIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  issueTitle?: string
  loading?: boolean
}

export function DeleteIssueDialog({
  open,
  onOpenChange,
  onConfirm,
  issueTitle,
  loading = false,
}: DeleteIssueDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            确认删除需求
          </DialogTitle>
          <DialogDescription>
            此操作不可撤销。删除后，该需求及其关联的执行记录将无法恢复。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            您即将删除需求：
            <span className="font-medium text-foreground ml-1">
              {issueTitle || '未命名需求'}
            </span>
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '删除中…' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
