import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useProviderConfigs, type ProviderConfig } from '@/hooks/useProviderConfigs'
import { ProviderCard } from '@/components/settings/ProviderCard'
import { ProviderConfigDialog } from '@/components/settings/ProviderConfigDialog'
import { DeleteConfirmDialog } from '@/components/settings/DeleteConfirmDialog'
import { EmptyState } from '@/components/settings/EmptyState'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRefreshCodexTokenMutation } from '@/api/gen/graphql'

export function ProviderConfigPage() {
  const { toast } = useToast()
  const { configs, loading, error, addConfig, updateConfig, deleteConfig } =
    useProviderConfigs()
  const [refreshCodexTokenMutation] = useRefreshCodexTokenMutation()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ProviderConfig | null>(
    null
  )
  const [deletingConfig, setDeletingConfig] = useState<ProviderConfig | null>(
    null
  )

  // 处理保存
  const handleSave = async (
    data: Omit<ProviderConfig, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (editingConfig) {
        await updateConfig(editingConfig.id, data)
        toast({
          title: '成功',
          description: '配置已更新',
        })
      } else {
        const created = await addConfig(data)

        if (data.provider.toUpperCase() === 'CODEX') {
          await refreshCodexTokenMutation({
            variables: { configId: created.id },
          })
        }

        toast({
          title: '成功',
          description: '配置已添加',
        })
      }
      setIsAddDialogOpen(false)
      setEditingConfig(null)
    } catch (err) {
      toast({
        title: '错误',
        description: err instanceof Error ? err.message : '操作失败，请重试',
        variant: 'destructive',
      })
    }
  }

  // 处理删除
  const handleDelete = async () => {
    if (!deletingConfig) return

    try {
      await deleteConfig(deletingConfig.id)
      toast({
        title: '成功',
        description: '配置已删除',
      })
      setDeletingConfig(null)
    } catch (err) {
      toast({
        title: '错误',
        description: err instanceof Error ? err.message : '删除失败，请重试',
        variant: 'destructive',
      })
    }
  }

  // 处理切换启用状态
  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await updateConfig(id, { isEnabled: enabled })
      toast({
        title: '成功',
        description: enabled ? '配置已启用' : '配置已禁用',
      })
    } catch (err) {
      toast({
        title: '错误',
        description: err instanceof Error ? err.message : '操作失败，请重试',
        variant: 'destructive',
      })
    }
  }

  const handleToggleDefault = async (id: string, isDefault: boolean) => {
    try {
      await updateConfig(id, {
        isDefault,
        ...(isDefault ? { isEnabled: true } : {}),
      })
      toast({
        title: '成功',
        description: isDefault ? '已设置为默认配置' : '已取消默认配置',
      })
    } catch (err) {
      toast({
        title: '错误',
        description: err instanceof Error ? err.message : '操作失败，请重试',
        variant: 'destructive',
      })
    }
  }

  // 处理对话框取消
  const handleDialogCancel = () => {
    setIsAddDialogOpen(false)
    setEditingConfig(null)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
          <p>加载失败：{error.message}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            模型提供商
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            配置和管理您的 AI 模型 API 密钥
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          添加配置
        </Button>
      </div>

      {configs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <ProviderCard
              key={config.id}
              config={config}
              onEdit={setEditingConfig}
              onDelete={setDeletingConfig}
              onToggleEnabled={handleToggleEnabled}
              onToggleDefault={handleToggleDefault}
            />
          ))}
        </div>
      )}

      {/* 添加/编辑对话框 */}
      <ProviderConfigDialog
        open={isAddDialogOpen || !!editingConfig}
        mode={editingConfig ? 'edit' : 'add'}
        initialData={editingConfig || undefined}
        onSave={handleSave}
        onCancel={handleDialogCancel}
      />

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={!!deletingConfig}
        configName={deletingConfig?.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeletingConfig(null)}
      />
    </div>
  )
}
