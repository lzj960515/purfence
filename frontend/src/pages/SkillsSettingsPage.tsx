import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleDashed, RefreshCw, Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  getDesktopSkillsCatalog,
  installDesktopSkill,
  type DesktopSkillItem,
} from '@/lib/desktop-skills'

function SkillCard(props: {
  item: DesktopSkillItem
  installed?: boolean
  busy?: boolean
  onInstall?: (item: DesktopSkillItem) => void
}) {
  const { item, installed = false, busy = false, onInstall } = props

  return (
    <Card className="border-muted/70 shadow-none">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="truncate text-base font-medium">{item.name}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {item.description || '无描述'}
          </p>
        </div>
        {installed ? (
          <div className="text-muted-foreground text-xs">已安装</div>
        ) : (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onInstall?.(item)}
            className="shrink-0"
          >
            {busy ? <CircleDashed className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="ml-1">安装</span>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function SkillsSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [installingName, setInstallingName] = useState<string | null>(null)
  const [installed, setInstalled] = useState<DesktopSkillItem[]>([])
  const [recommended, setRecommended] = useState<DesktopSkillItem[]>([])

  const fetchCatalog = useCallback(async () => {
    const catalog = await getDesktopSkillsCatalog()
    setInstalled(catalog.installed)
    setRecommended(catalog.recommended)
  }, [])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        await fetchCatalog()
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [fetchCatalog])

  const dedupedRecommended = useMemo(() => {
    const installedSet = new Set(installed.map((item) => item.name.toLowerCase()))
    return recommended.filter((item) => !installedSet.has(item.name.toLowerCase()))
  }, [installed, recommended])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchCatalog()
    } finally {
      setRefreshing(false)
    }
  }

  const handleInstall = async (item: DesktopSkillItem) => {
    setInstallingName(item.name)
    try {
      const result = await installDesktopSkill({
        name: item.name,
        source: item.source === 'online' ? 'online' : 'builtin',
        command: item.command,
      })

      toast({
        title: result.success ? '安装成功' : '安装失败',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })

      await fetchCatalog()
    } catch (error) {
      toast({
        title: '安装失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setInstallingName(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-6">
        <h1 className="text-2xl font-medium tracking-tight">Skills</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          管理桌面端 Skills。上方已安装，下方推荐可一键安装，安装后自动从推荐移除。
        </p>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing || loading}>
          {refreshing ? <CircleDashed className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-1">刷新</span>
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">已安装</h2>
        {loading ? (
          <Card>
            <CardContent className="text-muted-foreground p-4 text-sm">加载中...</CardContent>
          </Card>
        ) : installed.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground p-4 text-sm">暂无已安装 skills</CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {installed.map((item) => (
              <SkillCard key={`installed-${item.name}`} item={item} installed />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <h2 className="text-lg font-medium">推荐</h2>
        </div>
        {loading ? null : dedupedRecommended.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground p-4 text-sm">
              暂无推荐 skills。
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {dedupedRecommended.map((item) => (
              <SkillCard
                key={`recommended-${item.source}-${item.name}`}
                item={item}
                busy={installingName === item.name}
                onInstall={handleInstall}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
