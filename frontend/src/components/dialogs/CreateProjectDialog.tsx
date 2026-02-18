import { useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: {
    name?: string | null
    slug: string
    description?: string | null
    externalPath?: string | null
  }) => void
  loading?: boolean
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreate,
  loading = false,
}: CreateProjectDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('create')

  // 创建模式状态
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  // 导入模式状态
  const [externalPath, setExternalPath] = useState('')
  const [importSlug, setImportSlug] = useState('')

  const canCreate = name.trim().length > 0 && slug.trim().length > 0
  const canImport = externalPath.trim().length > 0 && importSlug.trim().length > 0

  const handleCreate = () => {
    if (!canCreate) return
    onCreate({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
    })
    resetForm()
  }

  const handleImport = () => {
    if (!canImport) return
    onCreate({
      name: null,
      slug: importSlug.trim(),
      description: null,
      externalPath: externalPath.trim(),
    })
    resetForm()
  }

  const resetForm = () => {
    setName('')
    setSlug('')
    setDescription('')
    setExternalPath('')
    setImportSlug('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  // 从名称自动生成 slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64)
  }

  const handleNameChange = (value: string) => {
    setName(value)
    // 如果 slug 还没填，自动填充
    if (!slug) {
      setSlug(generateSlug(value))
    }
  }

  const getFolderNameFromPath = (path: string) => {
    return path
      .replace(/\\/g, '/')
      .replace(/\/$/, '')
      .split('/')
      .pop() || ''
  }

  const handlePickExternalPath = async () => {
    if (!isTauri()) {
      toast({
        title: '当前环境不支持',
        description: '请选择桌面版后再使用文件夹选择功能。',
        variant: 'destructive',
      })
      return
    }

    try {
      const { open } = await import('@tauri-apps/plugin-dialog')
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择本地项目目录',
      })

      if (typeof selected !== 'string') {
        return
      }

      setExternalPath(selected)

      if (!importSlug.trim()) {
        setImportSlug(generateSlug(getFolderNameFromPath(selected)))
      }
    } catch (error) {
      toast({
        title: '选择失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新建项目</DialogTitle>
          <DialogDescription>
            创建新项目或导入本地已有项目。
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">创建新项目</TabsTrigger>
            <TabsTrigger value="import">导入现有项目</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">项目名称</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="例如：个人知识库"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-slug">
                英文标识 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="例如：my-knowledge-base"
              />
              <p className="text-xs text-muted-foreground">
                用于项目目录名，只能用小写字母、数字和连字符
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">项目描述（可选）</Label>
              <Textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="一句话描述你想做的事情"
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-path">
                本地项目路径 <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-3">
                <Input
                  id="project-path"
                  value={externalPath}
                  placeholder="请选择已有项目目录"
                  readOnly
                  className="flex-1"
                  autoFocus
                />
                <Button type="button" variant="outline" onClick={handlePickExternalPath}>
                  选择文件夹
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                请选择项目的绝对路径，我们将通过软连接引用该目录，并自动分析项目信息。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-slug">
                英文标识 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="import-slug"
                value={importSlug}
                onChange={(e) => setImportSlug(e.target.value)}
                placeholder="例如：my-project"
              />
              <p className="text-xs text-muted-foreground">
                用于项目目录名，只能用小写字母、数字和连字符
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          {activeTab === 'create' ? (
            <Button disabled={!canCreate || loading} onClick={handleCreate}>
              {loading ? '创建中…' : '创建'}
            </Button>
          ) : (
            <Button disabled={!canImport || loading} onClick={handleImport}>
              {loading ? '导入中…' : '导入'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
