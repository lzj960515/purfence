import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Paperclip, ArrowUp, Square, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentOption {
  id: string
  name: string
}

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void
  onStop: () => void
  disabled?: boolean
  isSending?: boolean
  isFirstMessage?: boolean
  agentOptions?: AgentOption[]
  selectedAgentId?: string
  onAgentIdChange?: (agentId: string) => void
  /** 待发送图片 */
  pendingImage?: File | null
  /** 待发送图片变化回调 */
  onPendingImageChange?: (file: File | null) => void
}

export function ChatInputArea({
  onSendMessage,
  onStop,
  disabled = false,
  isSending = false,
  isFirstMessage = false,
  agentOptions = [],
  selectedAgentId,
  onAgentIdChange,
  pendingImage: externalPendingImage,
  onPendingImageChange,
}: ChatInputAreaProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 使用外部 pendingImage 状态
  const pendingImage = externalPendingImage ?? null
  const setPendingImage = (file: File | null) => {
    onPendingImageChange?.(file)
  }
  const imagePreview = useMemo(
    () => (pendingImage ? URL.createObjectURL(pendingImage) : null),
    [pendingImage],
  )

  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleSend = () => {
    const content = value.trim()
    if (!content || disabled || isSending) {
      return
    }
    onSendMessage(content)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  // Handle image paste
  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault()
        const file = item.getAsFile()
        if (file) {
          handleImageSelect(file)
        }
        break
      }
    }
  }

  // Handle image selection
  const handleImageSelect = (file: File) => {
    setPendingImage(file)
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setPendingImage(null)
  }

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file)
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ''
  }

  // Trigger file input click
  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-in-out w-full px-4",
        isFirstMessage
          ? "w-full max-w-2xl mx-auto"
          : "max-w-3xl mx-auto py-4"
      )}
    >
      <div
        className={cn(
          "relative flex flex-col gap-2 rounded-3xl border bg-background px-4 pb-3 pt-3 shadow-sm transition-all focus-within:ring-1 focus-within:ring-ring/20 focus-within:border-ring/50 hover:shadow-md",
          isFirstMessage ? "min-h-[120px] shadow-md border-muted-foreground/10" : "min-h-[52px]"
        )}
      >
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative inline-flex items-center gap-2 mb-2">
            <div className="relative rounded-lg overflow-hidden border border-border/50">
              <img
                src={imagePreview}
                alt="Selected"
                className="max-h-[120px] max-w-[200px] object-contain"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/90 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            requestAnimationFrame(resizeTextarea)
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={isFirstMessage ? "推进项目或者处理任何事情" : "随便做点什么吧..."}
          className={cn(
            "min-h-[40px] w-full resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-base placeholder:text-muted-foreground/50",
            isFirstMessage ? "text-lg pt-2" : "py-1"
          )}
          rows={1}
          style={{ maxHeight: '200px' }}
        />

        <div className="flex items-center justify-between mt-auto pt-2">
          {/* Left Actions */}
          <div className="flex items-center gap-1 -ml-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              title="Attach file"
              onClick={handleAttachClick}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {agentOptions.length > 0 && selectedAgentId ? (
              <Select
                value={selectedAgentId}
                onValueChange={(agentId) => onAgentIdChange?.(agentId)}
                disabled={disabled || isSending}
              >
                <SelectTrigger className="h-8 w-auto min-w-[120px] rounded-full border-0 bg-muted px-3 text-sm font-medium text-foreground shadow-none hover:bg-muted/80 focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {agentOptions.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {isSending ? (
              <Button
                onClick={onStop}
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/90 shrink-0"
              >
                <Square className="h-3 w-3 fill-current" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!value.trim() || disabled}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all duration-200 shrink-0",
                  value.trim()
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 cursor-not-allowed"
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
