import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  ArrowLeftRight,
  BrainCircuit,
  CircleDashed,
  History,
  PencilLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { DeleteConfirmDialog } from '@/components/settings/DeleteConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  GET_AGENT_HISTORIES,
  ROLLBACK_AGENT_HISTORY,
} from '@/api/agent.graphql'
import {
  type AgentInput,
  type AgentItem,
  type AgentModelConfig,
  useAgents,
} from '@/hooks/useAgents'
import { useProviderConfigs } from '@/hooks/useProviderConfigs'
import {
  type AgentHistoryItem,
  fetchSkills,
  fetchTools,
} from '@/api/agent.api'
import {
  CatalogPickerDialog,
  type CatalogOption,
} from '@/components/agents/CatalogPickerDialog'
import { MarkdownWorkbenchDialog } from '@/components/agents/MarkdownWorkbenchDialog'

type FormState = {
  id?: string
  name: string
  description: string
  changeDescription: string
  instructions: string
  tags: string[]
  tools: string[]
  skills: string[]
  modelConfig?: AgentModelConfig
}

type FallbackDraft = {
  key: string
  id: string
  model: string
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  changeDescription: '',
  instructions: '',
  tags: [],
  tools: [],
  skills: [],
}

const AgentVersionDiffDialog = lazy(async () => {
  const module = await import('@/components/agents/AgentVersionDiffDialog')
  return { default: module.AgentVersionDiffDialog }
})

function makeFallbackKey() {
  return `fallback-${crypto.randomUUID()}`
}

function agentToForm(agent?: AgentItem | null): FormState {
  if (!agent) {
    return EMPTY_FORM
  }

  return {
    id: agent.id,
    name: agent.name,
    description: agent.description || '',
    changeDescription: '',
    instructions: agent.instructions || '',
    tags: agent.tags || [],
    tools: agent.tools || [],
    skills: agent.skills || [],
    modelConfig: agent.modelConfig,
  }
}

function formToInput(form: FormState, fallbacks: FallbackDraft[]): AgentInput {
  return {
    name: form.name,
    description: form.description,
    changeDescription: form.changeDescription,
    instructions: form.instructions,
    tags: form.tags,
    tools: form.tools,
    skills: form.skills,
    modelConfig: form.modelConfig?.default.id
      ? {
          default: form.modelConfig.default,
          fallbacks: fallbacks
            .map((item) => ({ id: item.id, model: item.model }))
            .filter((item) => item.id && item.model.trim()),
        }
      : undefined,
  }
}

export function AgentsPage() {
  const { toast } = useToast()
  const {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refetchItems,
  } = useAgents()
  const { configs: providerConfigs, loading: providersLoading } = useProviderConfigs()

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [tagDraft, setTagDraft] = useState('')
  const [toolPickerOpen, setToolPickerOpen] = useState(false)
  const [skillPickerOpen, setSkillPickerOpen] = useState(false)
  const [markdownOpen, setMarkdownOpen] = useState(false)
  const [deletingAgent, setDeletingAgent] = useState<AgentItem | null>(null)
  const [toolOptions, setToolOptions] = useState<CatalogOption[]>([])
  const [skillOptions, setSkillOptions] = useState<CatalogOption[]>([])
  const [catalogsLoading, setCatalogsLoading] = useState(false)
  const [fallbacks, setFallbacks] = useState<FallbackDraft[]>([])
  const [historyItems, setHistoryItems] = useState<AgentHistoryItem[]>([])
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([])
  const [diffDialogOpen, setDiffDialogOpen] = useState(false)
  const [rollbackTarget, setRollbackTarget] = useState<AgentHistoryItem | null>(null)
  const [rollbacking, setRollbacking] = useState(false)

  const activeProviders = useMemo(
    () => providerConfigs.filter((config) => config.isActive),
    [providerConfigs],
  )

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery(GET_AGENT_HISTORIES, {
    variables: { agentId: selectedAgentId ?? '' },
    skip: isCreating || !selectedAgentId || !historyDialogOpen,
    fetchPolicy: 'network-only',
  })

  const [rollbackHistoryMutation] = useMutation(ROLLBACK_AGENT_HISTORY)

  const selectedAgent = useMemo(
    () => items.find((item) => item.id === selectedAgentId) ?? null,
    [items, selectedAgentId],
  )

  useEffect(() => {
    if (isCreating) return

    if (!selectedAgentId && items.length > 0) {
      setSelectedAgentId(items[0].id)
      return
    }

    if (selectedAgentId && !items.some((item) => item.id === selectedAgentId)) {
      setSelectedAgentId(items[0]?.id || null)
    }
  }, [isCreating, items, selectedAgentId])

  useEffect(() => {
    if (isCreating) {
      setForm(EMPTY_FORM)
      setFallbacks([])
      return
    }

    const nextForm = agentToForm(selectedAgent)
    setForm(nextForm)
    setFallbacks(
      (selectedAgent?.modelConfig?.fallbacks || []).map((item) => ({
        key: makeFallbackKey(),
        id: item.id,
        model: item.model,
      })),
    )
  }, [isCreating, selectedAgent])

  useEffect(() => {
    let mounted = true
    const loadCatalogs = async () => {
      setCatalogsLoading(true)
      try {
        const [tools, skills] = await Promise.all([fetchTools(), fetchSkills()])
        if (!mounted) return
        setToolOptions(tools)
        setSkillOptions(skills)
      } catch (catalogError) {
        if (!mounted) return
        toast({
          title: '目录加载失败',
          description:
            catalogError instanceof Error ? catalogError.message : '无法加载 tools / skills',
          variant: 'destructive',
        })
      } finally {
        if (mounted) {
          setCatalogsLoading(false)
        }
      }
    }

    void loadCatalogs()
    return () => {
      mounted = false
    }
  }, [toast])

  const instructionsWordCount = useMemo(() => {
    return form.instructions.trim() ? form.instructions.trim().split(/\s+/).length : 0
  }, [form.instructions])

  const leftCompareVersion = useMemo(
    () => historyItems.find((item) => item.id === selectedHistoryIds[0]) ?? null,
    [historyItems, selectedHistoryIds],
  )

  const rightCompareVersion = useMemo(
    () => historyItems.find((item) => item.id === selectedHistoryIds[1]) ?? null,
    [historyItems, selectedHistoryIds],
  )

  const canCompare = selectedHistoryIds.length === 2 && !!leftCompareVersion && !!rightCompareVersion

  useEffect(() => {
    if (isCreating || !selectedAgentId || !historyDialogOpen) {
      setHistoryItems([])
      setSelectedHistoryIds([])
      return
    }

    const versions = historyData?.agentHistories?.nodes ?? []
    setHistoryItems(versions)
    setSelectedHistoryIds((current) =>
      current.filter((id) => versions.some((item: AgentHistoryItem) => item.id === id)).slice(0, 2),
    )
  }, [historyData, historyDialogOpen, isCreating, selectedAgentId])

  useEffect(() => {
    if (!historyError) {
      return
    }

    toast({
      title: '版本记录加载失败',
      description: historyError.message,
      variant: 'destructive',
    })
  }, [historyError, toast])

  const createNewAgent = () => {
    setIsCreating(true)
    setSelectedAgentId(null)
    setTagDraft('')
  }

  const cancelCreate = () => {
    setIsCreating(false)
    setTagDraft('')
  }

  const addTag = () => {
    const nextTag = tagDraft.trim()
    if (!nextTag || form.tags.includes(nextTag)) return
    setForm((prev) => ({ ...prev, tags: [...prev.tags, nextTag] }))
    setTagDraft('')
  }

  const removeTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((item) => item !== tag),
    }))
  }

  const updateModelDefault = (field: 'id' | 'model', value: string) => {
    setForm((prev) => ({
      ...prev,
      modelConfig: {
        default: {
          id: field === 'id' ? value : prev.modelConfig?.default.id || '',
          model: field === 'model' ? value : prev.modelConfig?.default.model || '',
        },
        fallbacks: prev.modelConfig?.fallbacks || [],
      },
    }))
  }

  const clearDefaultModel = () => {
    setForm((prev) => ({
      ...prev,
      modelConfig: prev.modelConfig
        ? {
            default: {
              id: '',
              model: '',
            },
            fallbacks: prev.modelConfig.fallbacks,
          }
        : undefined,
    }))
  }

  const addFallback = () => {
    setFallbacks((prev) => [...prev, { key: makeFallbackKey(), id: '', model: '' }])
  }

  const updateFallback = (key: string, field: 'id' | 'model', value: string) => {
    setFallbacks((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    )
  }

  const removeFallback = (key: string) => {
    setFallbacks((prev) => prev.filter((item) => item.key !== key))
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({
        title: '请填写名称',
        description: 'Agent 名称不能为空。',
        variant: 'destructive',
      })
      return false
    }

    setIsSaving(true)

    try {
      const payload = formToInput(form, fallbacks)
      if (isCreating) {
        const created = await createItem(payload)
        setIsCreating(false)
        setSelectedAgentId(created.id)
        setForm((prev) => ({ ...prev, changeDescription: '' }))
        toast({ title: '创建成功', description: '新的 Agent 已加入主菜单管理列表。' })
      } else if (form.id) {
        await updateItem(form.id, payload)
        if (historyDialogOpen) {
          await refetchHistory({ agentId: form.id })
        }
        setForm((prev) => ({ ...prev, changeDescription: '' }))
        toast({ title: '保存成功', description: 'Agent 配置已更新。' })
      }
      return true
    } catch (saveError) {
      toast({
        title: '保存失败',
        description: saveError instanceof Error ? saveError.message : '请稍后重试',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const openSaveDialog = () => {
    if (!form.name.trim()) {
      toast({
        title: '请填写名称',
        description: 'Agent 名称不能为空。',
        variant: 'destructive',
      })
      return
    }

    setSaveDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingAgent) return

    try {
      await deleteItem(deletingAgent.id)
      toast({ title: '删除成功', description: `Agent「${deletingAgent.name}」已删除。` })
      if (selectedAgentId === deletingAgent.id) {
        setSelectedAgentId(null)
      }
      setDeletingAgent(null)
      setIsCreating(false)
    } catch (deleteError) {
      toast({
        title: '删除失败',
        description: deleteError instanceof Error ? deleteError.message : '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  const handleRollback = async () => {
    if (!selectedAgentId || !rollbackTarget) return

    setRollbacking(true)
    try {
      await rollbackHistoryMutation({
        variables: {
          agentId: selectedAgentId,
          historyId: rollbackTarget.id,
          changeDescription:
            form.changeDescription.trim() || `回滚到 v${rollbackTarget.version}`,
        },
      })

      const refreshedItems = await refetchItems()
      if (historyDialogOpen) {
        const historyResult = await refetchHistory({ agentId: selectedAgentId })
        const versions = historyResult.data?.agentHistories?.nodes ?? []
        setHistoryItems(versions)
        setSelectedHistoryIds([])
      }

      const refreshedAgent = refreshedItems?.find((item: AgentItem) => item.id === selectedAgentId)
      if (refreshedAgent) {
        setForm(agentToForm(refreshedAgent))
        setFallbacks(
          (refreshedAgent.modelConfig?.fallbacks || []).map((item: AgentModelConfig['fallbacks'][number]) => ({
            key: makeFallbackKey(),
            id: item.id,
            model: item.model,
          })),
        )
      }

      setForm((prev) => ({ ...prev, changeDescription: '' }))
      setRollbackTarget(null)
      toast({
        title: '回滚成功',
        description: `已将 Agent 回滚到 v${rollbackTarget.version} 的配置，并生成新的当前版本。`,
      })
    } catch (rollbackError) {
      toast({
        title: '回滚失败',
        description: rollbackError instanceof Error ? rollbackError.message : '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setRollbacking(false)
    }
  }

  const openDiffDialog = () => {
    if (!canCompare) {
      toast({
        title: '请选择两个不同版本',
        description: '需要先从版本列表中选择左右两个不同版本，才能开始对比。',
        variant: 'destructive',
      })
      return
    }

    setDiffDialogOpen(true)
  }

  const toggleHistorySelection = (historyId: string, checked: boolean) => {
    setSelectedHistoryIds((current) => {
      if (checked) {
        if (current.includes(historyId)) {
          return current
        }

        return [...current, historyId].slice(-2)
      }

      return current.filter((id) => id !== historyId)
    })
  }

  const openHistoryDialog = () => {
    setSelectedHistoryIds([])
    setHistoryDialogOpen(true)
  }

  const currentAgentLabel = isCreating ? '新 Agent 草稿' : selectedAgent?.name || '未选择 Agent'

  return (
    <div className="grid h-full min-h-0 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col rounded-[28px] border-2 border-border/80 bg-gradient-to-b from-card via-card to-muted/30 shadow-sm">
        <div className="border-b px-5 py-5">
          <div className="flex items-center gap-3">
            <Button className="flex-1 gap-2" onClick={createNewAgent}>
              <Plus className="h-4 w-4" />
              新建 Agent
            </Button>
            <Button variant="outline" size="icon" onClick={() => void refetchItems()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
              加载 Agent 列表...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-background/70 px-4 py-10 text-center text-sm text-muted-foreground">
              请点击添加按钮创建你的第一个 Agent。
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const active = !isCreating && item.id === selectedAgentId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsCreating(false)
                      setSelectedAgentId(item.id)
                    }}
                    className={active
                      ? 'w-full rounded-2xl border-2 border-primary/60 bg-primary/10 px-4 py-4 text-left shadow-sm transition-all'
                      : 'w-full rounded-2xl border border-border/80 bg-background px-4 py-4 text-left shadow-sm transition-all hover:border-border hover:bg-background'}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{item.name}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(item.tags || []).slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="rounded-full">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      <section className="min-h-0 overflow-y-auto rounded-[32px] border-2 border-border/80 bg-gradient-to-br from-background via-background to-muted/20 shadow-sm">
        <div className="flex min-h-full flex-col">
          <div className="border-b px-6 py-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">{currentAgentLabel}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isCreating && selectedAgent ? (
                  <Button variant="outline" className="gap-2" onClick={openHistoryDialog}>
                    <History className="h-4 w-4" />
                    版本记录
                  </Button>
                ) : null}
                {!isCreating && selectedAgent ? (
                  <Button
                    variant="outline"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => setDeletingAgent(selectedAgent)}
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </Button>
                ) : null}
                {isCreating ? (
                  <Button variant="outline" onClick={cancelCreate}>
                    取消新建
                  </Button>
                ) : null}
                <Button className="gap-2" onClick={openSaveDialog} disabled={isSaving}>
                  <PencilLine className="h-4 w-4" />
                  {isSaving ? '保存中...' : isCreating ? '创建 Agent' : '保存修改'}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6 px-6 py-6">
            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                加载失败：{error.message}
              </div>
            ) : null}

            <div className="space-y-6">
              <div className="space-y-6">
                <Card className="overflow-hidden border-2 border-border/80 shadow-none">
                  <CardContent className="space-y-6 p-6">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                      <div className="space-y-2">
                        <Label htmlFor="agent-name">名称</Label>
                        <Input
                          id="agent-name"
                          value={form.name}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                          placeholder="例如：PR Reviewer / Research Planner / Delivery Captain"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agent-tags">访问标签</Label>
                        <div className="flex gap-2">
                          <Input
                            id="agent-tags"
                            value={tagDraft}
                            onChange={(event) => setTagDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ',') {
                                event.preventDefault()
                                addTag()
                              }
                            }}
                            placeholder="输入后回车，例如 reviewer"
                          />
                          <Button variant="outline" onClick={addTag}>
                            添加
                          </Button>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">
                          相同标签的 Agent 可以互相通信；如果留空，表示所有 Agent 都可以给它发消息。
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="agent-description">简介</Label>
                      <Textarea
                        id="agent-description"
                        value={form.description}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                        className="min-h-[96px]"
                        placeholder="用 2-4 句话描述这个 Agent 在组织里负责什么、适合参与哪些任务。"
                      />
                    </div>

                    <div className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-muted/20 p-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">系统提示词</div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          提示词通过 Markdown 阅读屏维护，适合写角色设定、行为准则、输出风格和协作协议。
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {instructionsWordCount} words
                        </Badge>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setMarkdownOpen(true)}>
                          <PencilLine className="h-4 w-4" />
                          编辑
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {form.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="inline-flex"
                        >
                          <Badge variant="outline" className="rounded-full px-3 py-1 hover:border-destructive/40 hover:text-destructive">
                            #{tag}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                  <Card className="border-2 border-border/80 shadow-none">
                    <CardContent className="space-y-4 p-6">
                      <div className="space-y-3 rounded-2xl border border-border/80 bg-background/90 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Wrench className="h-4 w-4" />
                              Tools
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              留空即默认可用全部工具。
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setToolPickerOpen(true)}>
                            选择 Tools
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {form.tools.length > 0 ? (
                            form.tools.map((tool) => (
                              <Badge key={tool} variant="outline" className="rounded-full px-3 py-1">
                                {tool}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">当前使用全部工具。</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-border/80 bg-background/90 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <BrainCircuit className="h-4 w-4" />
                              Skills
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              留空即默认可用全部 Skills。
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setSkillPickerOpen(true)}>
                            选择 Skills
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {form.skills.length > 0 ? (
                            form.skills.map((skill) => (
                              <Badge key={skill} variant="outline" className="rounded-full px-3 py-1">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">当前使用全部 Skills。</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-border/80 shadow-none">
                    <CardContent className="space-y-4 p-6">
                      <div>
                        <div className="text-sm font-medium">模型路由</div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          为当前 Agent 指定默认模型和失败时的 fallback 顺序。
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/90 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">默认模型</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              留空表示使用全局模型配置。
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          <div className="flex items-center gap-2">
                            <Select
                              value={form.modelConfig?.default.id || ''}
                              onValueChange={(value) => updateModelDefault('id', value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder={providersLoading ? '加载提供商中...' : '选择默认提供商'} />
                              </SelectTrigger>
                              <SelectContent>
                                {activeProviders.map((provider) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    {provider.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {form.modelConfig?.default.id || form.modelConfig?.default.model ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                onClick={clearDefaultModel}
                                aria-label="清空默认模型"
                                title="清空默认模型"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                          <Input
                            value={form.modelConfig?.default.model || ''}
                            onChange={(event) => updateModelDefault('model', event.target.value)}
                            placeholder="例如 gpt-5.4 / claude-sonnet-4 / deepseek-chat"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">Fallbacks</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              当默认模型失败时依次尝试的备选路由。
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={addFallback}>
                            <Plus className="h-4 w-4" />
                            添加 fallback
                          </Button>
                        </div>

                        {fallbacks.length === 0 ? (
                          <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                            暂无 fallback，默认模型会独立承担请求。
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {fallbacks.map((fallback, index) => (
                              <div key={fallback.key} className="rounded-2xl border bg-background/80 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                  <Badge variant="secondary">Fallback #{index + 1}</Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => removeFallback(fallback.key)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid gap-3">
                                  <Select
                                    value={fallback.id}
                                    onValueChange={(value) => updateFallback(fallback.key, 'id', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="选择备用提供商" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {activeProviders.map((provider) => (
                                        <SelectItem key={provider.id} value={provider.id}>
                                          {provider.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    value={fallback.model}
                                    onChange={(event) =>
                                      updateFallback(fallback.key, 'model', event.target.value)
                                    }
                                    placeholder="备用模型名称"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      <CatalogPickerDialog
        open={toolPickerOpen}
        title="选择 Tools"
        searchPlaceholder="搜索 tool 名称或描述..."
        selectedItems={form.tools}
        options={toolOptions}
        loading={catalogsLoading}
        onOpenChange={setToolPickerOpen}
        onSelectedItemsChange={(tools) => setForm((prev) => ({ ...prev, tools }))}
      />

      <CatalogPickerDialog
        open={skillPickerOpen}
        title="选择 Skills"
        searchPlaceholder="搜索 skill 名称或描述..."
        selectedItems={form.skills}
        options={skillOptions}
        loading={catalogsLoading}
        onOpenChange={setSkillPickerOpen}
        onSelectedItemsChange={(skills) => setForm((prev) => ({ ...prev, skills }))}
      />

      <MarkdownWorkbenchDialog
        open={markdownOpen}
        title={form.name ? `${form.name} · 系统提示词` : 'Agent 系统提示词'}
        subtitle="使用 Markdown 写角色设定、行为准则、输出风格和协作协议。"
        wordCount={instructionsWordCount}
        value={form.instructions}
        onValueChange={(instructions) => setForm((prev) => ({ ...prev, instructions }))}
        onOpenChange={setMarkdownOpen}
      />

      <DeleteConfirmDialog
        open={!!deletingAgent}
        configName={deletingAgent?.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeletingAgent(null)}
      />

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{isCreating ? '创建 Agent 前填写变更说明' : '保存修改前填写变更说明'}</DialogTitle>
            <DialogDescription>
              这段说明会写入当前版本记录，方便后续查看历史、回滚和比对。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="agent-save-change-description">变更说明</Label>
            <Textarea
              id="agent-save-change-description"
              value={form.changeDescription}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, changeDescription: event.target.value }))
              }
              className="min-h-[120px]"
              placeholder="简要描述本次修改的目的，例如：收紧工具权限、调整系统提示词、切换默认模型。"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)} disabled={isSaving}>
              取消
            </Button>
            <Button
              onClick={async () => {
                const saved = await handleSave()
                if (saved) {
                  setSaveDialogOpen(false)
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '确认保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="h-[82vh] max-w-[960px] overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>版本记录</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3 border-b bg-muted/20 px-6 py-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                已选 {selectedHistoryIds.length}/2
              </Badge>
            </div>
            <Button type="button" variant="default" className="gap-2" onClick={openDiffDialog} disabled={!canCompare}>
              <ArrowLeftRight className="h-4 w-4" />
              对比版本
            </Button>
          </div>
          <div className="h-full overflow-y-auto px-6 py-5">
            {historyLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                正在加载版本记录...
              </div>
            ) : historyItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                当前还没有可展示的版本记录。
              </div>
            ) : (
              <div className="space-y-3 pb-6">
                {historyItems.map((history, index) => {
                  const isCurrent = index === 0
                  const isChecked = selectedHistoryIds.includes(history.id)

                  return (
                    <div
                      key={history.id}
                      className={isChecked
                        ? 'flex cursor-pointer gap-4 rounded-2xl border-2 border-primary/50 bg-primary/5 p-4 transition-colors'
                        : 'flex cursor-pointer gap-4 rounded-2xl border border-border/80 bg-background/90 p-4 transition-colors hover:border-border hover:bg-muted/20'}
                    >
                      <label
                        htmlFor={`history-select-${history.id}`}
                        className="flex flex-1 cursor-pointer gap-4"
                      >
                        <Checkbox
                          id={`history-select-${history.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => toggleHistorySelection(history.id, checked === true)}
                          aria-label={`选择版本 v${history.version}`}
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={isCurrent ? 'default' : 'secondary'}>v{history.version}</Badge>
                            {isCurrent ? <Badge variant="outline">当前</Badge> : null}
                            <span className="text-sm text-muted-foreground">
                              {new Date(history.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm font-medium">{history.name}</div>
                          {history.changeDescription ? (
                            <p className="text-sm text-muted-foreground">{history.changeDescription}</p>
                          ) : null}
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>Tools: {(history.tools || []).length || '全部'}</span>
                            <span>Skills: {(history.skills || []).length || '全部'}</span>
                            <span>Tags: {(history.tags || []).length || '开放'}</span>
                          </div>
                        </div>
                      </label>
                      {!isCurrent ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 self-start"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            setRollbackTarget(history)
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                          回滚到此版本
                        </Button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rollbackTarget} onOpenChange={(open) => !open && setRollbackTarget(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>确认回滚版本</DialogTitle>
            <DialogDescription>
              {rollbackTarget
                ? `确认将当前 Agent 回滚到 v${rollbackTarget.version} 吗？回滚会生成一个新的当前版本记录。`
                : '请选择要回滚的版本。'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackTarget(null)} disabled={rollbacking}>
              取消
            </Button>
            <Button onClick={() => void handleRollback()} disabled={rollbacking}>
              {rollbacking ? '回滚中...' : '确认回滚'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Suspense fallback={null}>
        <AgentVersionDiffDialog
          open={diffDialogOpen}
          leftVersion={leftCompareVersion}
          rightVersion={rightCompareVersion}
          onOpenChange={setDiffDialogOpen}
        />
      </Suspense>
    </div>
  )
}
