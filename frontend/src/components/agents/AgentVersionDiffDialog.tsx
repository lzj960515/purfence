import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AgentHistoryItem } from '@/api/agent.api'

type DiffFieldKey =
  | 'name'
  | 'description'
  | 'instructions'
  | 'parentId'
  | 'global'
  | 'tools'
  | 'skills'
  | 'modelConfig'

const DIFF_FIELDS: Array<{ key: DiffFieldKey; label: string }> = [
  { key: 'name', label: '名称' },
  { key: 'description', label: '简介' },
  { key: 'instructions', label: '系统提示词' },
  { key: 'parentId', label: '直属上级' },
  { key: 'global', label: '全局角色' },
  { key: 'tools', label: 'Tools' },
  { key: 'skills', label: 'Skills' },
  { key: 'modelConfig', label: '模型路由' },
]

interface AgentVersionDiffDialogProps {
  open: boolean
  leftVersion?: AgentHistoryItem | null
  rightVersion?: AgentHistoryItem | null
  onOpenChange: (open: boolean) => void
}

function stringifyDiffValue(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (value == null) {
    return ''
  }

  return JSON.stringify(value, null, 2)
}

export function AgentVersionDiffDialog({
  open,
  leftVersion,
  rightVersion,
  onOpenChange,
}: AgentVersionDiffDialogProps) {
  const ready = !!leftVersion && !!rightVersion

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[88vh] w-[96vw] max-w-[96vw] overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>版本对比</DialogTitle>
          <DialogDescription>
            {ready
              ? `对比 v${leftVersion.version} 与 v${rightVersion.version} 的 Agent 配置差异。`
              : '请选择两个版本后进行对比。'}
          </DialogDescription>
        </DialogHeader>

        <div className="h-full overflow-y-auto px-6 py-5">
          {!ready ? (
            <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              请选择两个不同版本进行对比。
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {DIFF_FIELDS.map((field) => (
                <section key={field.key} className="overflow-hidden rounded-2xl border border-border/80">
                  <div className="border-b bg-muted/30 px-4 py-3 text-sm font-medium">
                    {field.label}
                  </div>
                  <div className="overflow-x-auto">
                    <ReactDiffViewer
                      oldValue={stringifyDiffValue(leftVersion[field.key])}
                      newValue={stringifyDiffValue(rightVersion[field.key])}
                      splitView={true}
                      showDiffOnly={false}
                      compareMethod={DiffMethod.LINES}
                      leftTitle={`v${leftVersion.version}`}
                      rightTitle={`v${rightVersion.version}`}
                    />
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
