import { useState, useEffect } from 'react';
import {
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchConversations, type Conversation } from '@/api/agent.api';

interface ConversationSidebarProps {
  currentThreadId: string;
  onNewChat: () => void;
  onSelectConversation: (threadId: string) => void;
  onDeleteConversation?: (threadId: string) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function ConversationSidebar({
  currentThreadId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  connectionStatus,
}: ConversationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 从后端加载历史对话列表
  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await fetchConversations();
      setConversations(data);
    } catch (e) {
      console.error('Failed to load conversations:', e);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 当发送消息后，重新加载对话列表（更新排序和时间）
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const handle = setInterval(() => {
        loadConversations();
      }, 5000); // 每 5 秒刷新一次
      return () => clearInterval(handle);
    }
  }, [connectionStatus]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDeleteConversation) {
      onDeleteConversation(id);
    }
    // 从列表中移除
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300 ease-out',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-3 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm">对话历史</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 shrink-0 transition-transform',
            isCollapsed && 'mx-auto',
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-2">
        <Button
          onClick={onNewChat}
          className={cn(
            'w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25',
            isCollapsed ? 'px-2' : '',
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="text-sm">新建对话</span>}
        </Button>
      </div>

      {/* Connection Status */}
      <div className={cn('px-3 pb-2', isCollapsed ? 'flex justify-center' : '')}>
        <div
          className={cn(
            'flex items-center gap-2 rounded-full px-2 py-1 text-xs',
            connectionStatus === 'connected'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : connectionStatus === 'connecting'
                ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                : connectionStatus === 'error'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'bg-muted text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full animate-pulse',
              connectionStatus === 'connected'
                ? 'bg-green-500'
                : connectionStatus === 'connecting'
                  ? 'bg-yellow-500'
                  : connectionStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-muted-foreground',
            )}
          />
          {!isCollapsed && (
            <span>
              {connectionStatus === 'connected'
                ? '已连接'
                : connectionStatus === 'connecting'
                  ? '连接中'
                  : connectionStatus === 'error'
                    ? '错误'
                    : '未连接'}
            </span>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {isLoading ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            加载中...
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            暂无对话
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'group flex items-center gap-2 rounded-lg transition-all hover:bg-accent min-w-0',
                currentThreadId === conv.id
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {/* 对话按钮 */}
              <button
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg p-2 text-left transition-all min-w-0',
                  isCollapsed ? 'justify-center flex-1' : 'flex-1',
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{conv.title || '新对话'}</div>
                  </div>
                )}
              </button>

              {/* 删除按钮 */}
              {!isCollapsed && onDeleteConversation && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => handleDelete(e, conv.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{conversations.length} 条对话</span>
          </div>
        </div>
      )}
    </div>
  );
}
