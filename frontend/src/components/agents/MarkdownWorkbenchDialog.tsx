import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, FilePenLine, LayoutPanelLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface MarkdownWorkbenchDialogProps {
  open: boolean
  title?: string
  value: string
  subtitle?: string
  wordCount?: number
  onValueChange: (value: string) => void
  onOpenChange: (open: boolean) => void
}

type WorkbenchMode = 'split' | 'edit' | 'preview'

function MarkdownPreview({ value }: { value: string }) {
  if (!value.trim()) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
        右侧会实时渲染 Markdown 预览，支持标题、列表、代码块、表格和引用。
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto rounded-2xl border bg-background/80 p-6">
      <article className="max-w-none text-sm leading-7 text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="mb-4 text-3xl font-semibold tracking-tight">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-8 border-b pb-2 text-2xl font-semibold tracking-tight">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-3 mt-6 text-lg font-semibold">{children}</h3>
            ),
            p: ({ children }) => <p className="mb-4 text-sm leading-7">{children}</p>,
            ul: ({ children }) => (
              <ul className="mb-4 list-disc space-y-2 pl-5 text-sm leading-7">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm leading-7">{children}</ol>
            ),
            li: ({ children }) => <li className="marker:text-muted-foreground">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="mb-4 rounded-r-xl border-l-2 border-primary/30 bg-muted/40 px-4 py-3 text-muted-foreground">
                {children}
              </blockquote>
            ),
            code: ({ className, children }) => {
              const isBlock = Boolean(className)
              if (isBlock) {
                return (
                  <code className="block overflow-x-auto rounded-xl bg-zinc-950 px-4 py-3 text-xs text-zinc-50">
                    {children}
                  </code>
                )
              }
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  {children}
                </code>
              )
            },
            pre: ({ children }) => <pre className="mb-4">{children}</pre>,
            table: ({ children }) => (
              <div className="mb-4 overflow-x-auto rounded-xl border">
                <table className="min-w-full border-collapse text-sm">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border-b bg-muted/50 px-3 py-2 text-left font-medium">{children}</th>
            ),
            td: ({ children }) => <td className="border-b px-3 py-2 align-top">{children}</td>,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-4"
              >
                {children}
              </a>
            ),
          }}
        >
          {value}
        </ReactMarkdown>
      </article>
    </div>
  )
}

export function MarkdownWorkbenchDialog({
  open,
  title,
  value,
  subtitle,
  wordCount,
  onValueChange,
  onOpenChange,
}: MarkdownWorkbenchDialogProps) {
  const [mode, setMode] = useState<WorkbenchMode>('split')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-[95vw] max-w-[95vw] overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/20 p-0 shadow-2xl">
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="border-b bg-background/85 px-6 py-5 backdrop-blur-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2 text-left">
                <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                  <LayoutPanelLeft className="h-5 w-5" />
                  {title || 'Prompt 阅读屏'}
                </DialogTitle>
                {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {typeof wordCount === 'number' ? (
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {wordCount} words
                  </Badge>
                ) : null}
                <Button
                  variant={mode === 'split' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('split')}
                >
                  <LayoutPanelLeft className="h-4 w-4" />
                  默认
                </Button>
                <Button
                  variant={mode === 'edit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('edit')}
                >
                  <FilePenLine className="h-4 w-4" />
                  仅编辑
                </Button>
                <Button
                  variant={mode === 'preview' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('preview')}
                >
                  <Eye className="h-4 w-4" />
                  仅预览
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 px-4 pb-4 pt-3 lg:px-6 lg:pb-6 lg:pt-4">
            <div
              className={cn(
                'grid h-full min-h-0 gap-4',
                mode === 'split' ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-1',
              )}
            >
              {(mode === 'split' || mode === 'edit') && (
                <section className="flex min-h-0 flex-col rounded-3xl border bg-background/90 shadow-sm">
                <div className="min-h-0 flex-1 p-4">
                  <Textarea
                    value={value}
                    onChange={(event) => onValueChange(event.target.value)}
                    className="h-full min-h-[320px] resize-none border-0 bg-transparent font-mono text-sm leading-6 shadow-none focus-visible:ring-0"
                    placeholder="# 角色定位\n\n你是...\n\n## 工作原则\n- 先分析\n- 再执行"
                  />
                </div>
                </section>
              )}

              {(mode === 'split' || mode === 'preview') && (
                <section className="flex min-h-0 flex-col rounded-3xl border bg-muted/20 shadow-sm">
                <div className="min-h-0 flex-1 p-4">
                  <MarkdownPreview value={value} />
                </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
