import {
  FolderKanban,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Settings,
  PanelLeft,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  deleteConversation,
  fetchConversations,
  type Conversation,
} from '@/api/agent.api'
import logoPng from '@/assets/purfence-logo.png'

const SIDEBAR_STATE_KEY = 'sidebar-history-expanded'

const items = [
  {
    title: '新建对话',
    url: '/agent',
    icon: Plus,
    action: 'new-chat',
  },
  {
    title: '项目列表',
    url: '/projects',
    icon: FolderKanban,
  },
  {
    title: '设置',
    url: '/settings',
    icon: Settings,
  },
]

export function AppSidebar() {
  const { collapsed, setCollapsed } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(() => {
    // 从 localStorage 读取展开/折叠状态
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY)
      return saved ? JSON.parse(saved) : true
    } catch {
      return true
    }
  })

  const loadConversations = async () => {
    setLoadingConversations(true)
    try {
      const data = await fetchConversations()
      setConversations(data)
    } catch (e) {
      console.error('Failed to load conversations:', e)
      setConversations([])
    } finally {
      setLoadingConversations(false)
    }
  }

  useEffect(() => {
    loadConversations()
    const handle = setInterval(() => {
      loadConversations()
    }, 5000)
    return () => clearInterval(handle)
  }, [])

  // 持久化展开/折叠状态
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(historyExpanded))
    } catch (e) {
      console.error('Failed to save sidebar state:', e)
    }
  }, [historyExpanded])

  const activeThreadId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('thread') || ''
  }, [location.search])

  const handleNewChat = () => {
    const newThreadId = crypto.randomUUID()
    navigate(`/agent?thread=${newThreadId}`)
  }

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversation(convId)
      setConversations((prev) => prev.filter((c) => c.id !== convId))
    } catch (e) {
      console.error('Failed to delete conversation:', e)
    }
  }

  const toggleHistoryExpanded = () => {
    setHistoryExpanded((prev: boolean) => !prev)
  }

  return (
    <Sidebar>
      <SidebarContent>
        {/* Logo Section */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 py-4">
            <div 
              className={cn(
                "flex items-center gap-2 group relative",
                collapsed && "cursor-pointer"
              )}
              onClick={() => collapsed && setCollapsed(false)}
            >
              <div
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg flex-shrink-0 transition-all',
                  collapsed && 'bg-sidebar-accent',
                )}
              >
                <img
                  src={logoPng}
                  alt="Purfence"
                  className={cn(
                    'h-full w-full object-cover transition-opacity',
                    collapsed && 'opacity-100 group-hover:opacity-0',
                  )}
                />
                {collapsed ? (
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <PanelLeft className="h-5 w-5 text-sidebar-primary" />
                  </span>
                ) : (
                  <span className="sr-only">Purfence</span>
                )}
              </div>
              {!collapsed && <span className="text-sm font-semibold">紫微垣</span>}
            </div>
            {!collapsed && <SidebarTrigger className="h-8 w-8" />}
          </div>
        </SidebarGroup>

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.action === 'new-chat' ? (
                    <button
                      onClick={handleNewChat}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                        collapsed && 'justify-center px-2',
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && item.title}
                    </button>
                  ) : (
                    <SidebarMenuButton
                      href={item.url}
                      icon={item.icon}
                      isActive={location.pathname === item.url}
                    >
                      {item.title}
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 历史对话 - 可展开/折叠 */}
        {!collapsed && (
          <SidebarGroup className="flex-1 overflow-hidden flex flex-col">
            <button
              onClick={toggleHistoryExpanded}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground justify-start"
            >
              <span className="text-sm">历史对话</span>
              {historyExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {historyExpanded && (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {/* Conversation List */}
              <SidebarGroupContent className="flex-1 overflow-hidden flex flex-col min-h-0">
                {loadingConversations ? (
                  <div className="px-2 py-2 text-xs text-muted-foreground">
                    加载中...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-muted-foreground">
                    暂无对话
                  </div>
                ) : (
                  <div className="overflow-y-auto pr-1 space-y-1 max-h-[calc(100vh-300px)]">
                    {conversations.slice(0, 20).map((conv) => (
                      <div
                        key={conv.id}
                        className={cn(
                          'group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                          activeThreadId === conv.id
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/agent?thread=${conv.id}`)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="truncate">{conv.title || '新对话'}</div>
                        </button>

                        <button
                          type="button"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md hover:bg-background/60 shrink-0"
                          onClick={() => handleDeleteConversation(conv.id)}
                          aria-label="删除对话"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </SidebarGroupContent>
            </div>
          )}
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
