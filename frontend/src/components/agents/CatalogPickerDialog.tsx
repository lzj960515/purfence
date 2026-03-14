import { useMemo, useState } from 'react'
import { Check, Search, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export interface CatalogOption {
  name: string
  description: string
}

interface CatalogPickerDialogProps {
  open: boolean
  title: string
  searchPlaceholder: string
  selectedItems: string[]
  options: CatalogOption[]
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSelectedItemsChange: (items: string[]) => void
}

export function CatalogPickerDialog({
  open,
  title,
  searchPlaceholder,
  selectedItems,
  options,
  loading = false,
  onOpenChange,
  onSelectedItemsChange,
}: CatalogPickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOptions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) return options
    return options.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword),
    )
  }, [options, searchQuery])

  const toggleItem = (itemName: string) => {
    if (selectedItems.includes(itemName)) {
      onSelectedItemsChange(selectedItems.filter((item) => item !== itemName))
      return
    }
    onSelectedItemsChange([...selectedItems, itemName])
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSearchQuery('')
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectedItemsChange([])}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            清空全部
          </Button>
          <span className="text-muted-foreground">
            已选择 {selectedItems.length} / {options.length}
          </span>
        </div>

        <div className="min-h-[320px] flex-1 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              加载中...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              没有找到匹配项
            </div>
          ) : (
            filteredOptions.map((item) => {
              const selected = selectedItems.includes(item.name)
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => toggleItem(item.name)}
                  className={selected
                    ? 'w-full rounded-xl border border-primary bg-primary/10 p-3 text-left transition-all'
                    : 'w-full rounded-xl border border-border bg-background p-3 text-left transition-all hover:bg-accent'}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={selected ? 'default' : 'outline'}>
                          {item.name}
                        </Badge>
                        {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('')
              onOpenChange(false)
            }}
          >
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
