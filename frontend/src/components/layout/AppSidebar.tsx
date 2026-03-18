import {
  Bot,
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
  useAgentConversationsQuery,
  useDeleteOneAgentConversationMutation,
} from '@/graphql/__generated__/hooks'
import logoPng from '@/assets/purfence-logo.png'
import { useUpdate } from '@/hooks/useUpdate'
import { UpdateDialog } from '@/components/update'
import { ErrorBoundary } from '@/components/error'

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
    title: 'Agents',
    url: '/agents',
    icon: Bot,
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

  const [historyExpanded, setHistoryExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY)
      return saved ? JSON.parse(saved) : true
    } catch {
      return true
    }
  })

  // Update functionality
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const {
    status: updateStatus,
    updateInfo,
    downloadProgress,
    error: updateError,
    startDownload,
    dismissUpdate,
    installAndRestart,
    skipVersion,
  } = useUpdate()

  // Auto-open dialog when update is available
  useEffect(() => {
    if (updateStatus === 'available' || updateStatus === 'downloaded') {
      const timeoutId = window.setTimeout(() => {
        setUpdateDialogOpen(true)
      }, 0)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }
  }, [updateStatus])

  const {
    data: conversationData,
    loading: loadingConversations,
    refetch: refetchConversations,
  } = useAgentConversationsQuery({
    variables: {
      filter: { userId: { eq: 'purfence' } },
      paging: { limit: 20, offset: 0 },
      sorting: [{ field: 'updatedAt', direction: 'DESC' }],
    },
    pollInterval: 5000,
    fetchPolicy: 'network-only',
  })

  const conversations = conversationData?.agentConversations?.nodes ?? []

  const [deleteConversationMutation] = useDeleteOneAgentConversationMutation({
    onError: (error) => {
      console.error('Failed to delete conversation:', error)
    },
  })

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
    navigate('/agent?source=new')
  }

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversationMutation({
        variables: {
          input: { id: convId },
        },
      })
      await refetchConversations()
      if (activeThreadId === convId) {
        navigate('/agent?source=new')
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e)
    }
  }

  const toggleHistoryExpanded = () => {
    setHistoryExpanded((prev: boolean) => !prev)
  }

  return (
    <>
      <Sidebar>
        <SidebarContent>
          {/* Logo Section */}
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 py-4">
              <button
                type="button"
                className={cn(
                  'flex items-center gap-2 group relative',
                  collapsed && 'cursor-pointer',
                )}
                onClick={() => collapsed && setCollapsed(false)}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ' ') && collapsed) {
                    event.preventDefault()
                    setCollapsed(false)
                  }
                }}
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
                {!collapsed && (
                  <span className="text-sm font-semibold">紫微垣</span>
                )}
              </button>
              {!collapsed && (
                <SidebarTrigger className="h-8 w-8" />
              )}
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
                        type="button"
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
                type="button"
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
                              onClick={() =>
                                navigate(`/agent?thread=${conv.id}&source=history`)
                              }
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="truncate">
                                {conv.title || '新对话'}
                              </div>
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

      {/* Update Dialog */}
      <ErrorBoundary
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg p-6 max-w-sm mx-4 shadow-lg">
              <h3 className="text-lg font-semibold mb-2">更新提示</h3>
              <p className="text-muted-foreground mb-4">
                检测到新版本，但更新弹窗加载失败。请稍后重试或手动检查更新。
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUpdateDialogOpen(false)}
                  className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        }
      >
        <UpdateDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          status={updateStatus}
          updateInfo={updateInfo}
          downloadProgress={downloadProgress}
          error={updateError}
          onConfirm={startDownload}
          onCancel={dismissUpdate}
          onInstallAndRestart={installAndRestart}
          onSkipVersion={() => {
            if (updateInfo?.version) {
              skipVersion(updateInfo.version)
            }
          }}
        />
      </ErrorBoundary>
    </>
  )
}
