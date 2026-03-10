import { Check, Circle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type EnvironmentKey = 'workspace' | 'provider'

interface ChecklistStatus {
  installed: boolean
  detail?: string
}

interface EnvironmentChecklistProps {
  workspace: ChecklistStatus
  provider: ChecklistStatus
  busy?: boolean
  onConfigureProvider: () => void
  onConfigureWorkspace: () => void
  onLater?: () => void
  onDone?: () => void
  compact?: boolean
  embedded?: boolean
}

interface ChecklistItem {
  key: EnvironmentKey
  title: string
  detail: string
  installed: boolean
  actionable: boolean
  disabled: boolean
  actionLabel: string
  action: () => void
  helperText: string
}

function StatusIcon({ installed }: { installed: boolean }) {
  if (installed) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 ring-1 ring-sky-200">
        <Check className="h-4 w-4 text-sky-600" strokeWidth={2.8} />
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
      <Circle className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.2} />
    </div>
  )
}

export function EnvironmentChecklist({
  workspace,
  provider,
  busy = false,
  onConfigureProvider,
  onConfigureWorkspace,
  onLater,
  onDone,
  compact = false,
  embedded = false,
}: EnvironmentChecklistProps) {
  const items: ChecklistItem[] = [
    {
      key: 'workspace',
      title: '工作目录',
      detail: workspace.detail || '',
      installed: workspace.installed,
      actionable: !workspace.installed,
      disabled: busy,
      actionLabel: '立即配置',
      action: onConfigureWorkspace,
      helperText: '项目与工作区的存储根目录',
    },
    {
      key: 'provider',
      title: '模型提供商',
      detail: provider.detail || '',
      installed: provider.installed,
      actionable: !provider.installed,
      disabled: busy,
      actionLabel: '立即配置',
      action: onConfigureProvider,
      helperText: '用于 AI 对话与安装辅助',
    },
  ]

  const nextItem = items.find((item) => item.actionable && !item.disabled)
  const installedCount = items.filter((item) => item.installed).length

  const listBody = (
    <>
      <div className="space-y-2">
        <div className="rounded-xl border border-slate-200/90 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
            <div className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" />
              Desktop Setup
            </div>
            <span>{installedCount}/{items.length}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${(installedCount / items.length) * 100}%` }}
            />
          </div>
        </div>

        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              'rounded-xl border px-4 py-3 transition-all',
              item.installed
                ? 'border-sky-200/80 bg-sky-50/60'
                : 'border-slate-200 bg-white/90 hover:border-slate-300 hover:bg-slate-50/50',
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <StatusIcon installed={item.installed} />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.helperText}</p>
                  {!item.installed && item.detail ? (
                    <p className="text-xs text-slate-500/90">{item.detail}</p>
                  ) : null}
                </div>
              </div>

              {item.actionable && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={item.action}
                  disabled={item.disabled}
                  className="border-slate-300 bg-white shadow-sm hover:bg-slate-50"
                >
                  {item.actionLabel}
                </Button>
              )}
            </div>

          </div>
        ))}
      </div>

      {!compact && (
        <div className="flex justify-end gap-2 pt-2">
          {workspace.installed && provider.installed ? (
            <Button
              onClick={onDone}
              disabled={busy}
              className="border-0 bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.95)] hover:from-sky-500 hover:to-indigo-500"
            >
              OK
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onLater}
                disabled={busy}
              >
                稍后
              </Button>
              <Button
                onClick={() => nextItem?.action()}
                disabled={busy || !nextItem}
              >
                开始配置
              </Button>
            </>
          )}
        </div>
      )}
    </>
  )

  return (
    <>
      {embedded ? (
        <div className="space-y-4">{listBody}</div>
      ) : (
        <Card className="w-full rounded-2xl border-slate-200 bg-white/90 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-slate-900">环境准备</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">{listBody}</CardContent>
        </Card>
      )}

    </>
  )
}
