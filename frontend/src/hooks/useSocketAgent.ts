import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  createAgentSocket,
  type ChatArgs,
  type ChatArtifact,
  type ChatMessage,
  type ConnectionState,
  type SessionOpenArgs,
} from '@/lib/socket-agent';

// 后端返回的消息格式
interface SocketMessage {
  role: 'ai' | 'user';
  id: string;
  type: 'thinking' | 'text' | 'tool_text' | 'tool_result' | 'tool_progress' | 'interrupt';
  content: string;
  toolName?: string;
  status?: 'error';
  artifact?: ChatArtifact[];
}

interface ThreadEvent {
  threadId?: string;
}

const normalizeArtifacts = (artifact: unknown): ChatArtifact[] => {
  if (!Array.isArray(artifact)) {
    return [];
  }

  return artifact.filter(
    (item): item is ChatArtifact =>
      !!item && typeof item === 'object' && 'id' in item && 'type' in item && 'content' in item,
  );
};

interface UseSocketAgentReturn {
  connectionState: ConnectionState;
  isSending: boolean;
  messages: ChatMessage[];
  connect: () => void;
  disconnect: () => void;
  sessionOpen: (args: SessionOpenArgs) => void;
  sessionClose: (args: SessionOpenArgs) => void;
  sessionTerminate: (threadId: string) => void;
  sendMessage: (args: ChatArgs) => void;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useSocketAgent(): UseSocketAgentReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const pendingArtifactsRef = useRef<ChatArtifact[]>([]);
  const currentThreadIdRef = useRef<string>('');

  const isCurrentThreadEvent = useCallback((event?: ThreadEvent) => {
    if (!event?.threadId) return true;
    if (!currentThreadIdRef.current) return true;
    return event.threadId === currentThreadIdRef.current;
  }, []);

  // 连接
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setConnectionState('connecting');
    const socket = createAgentSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionState('connected');
    });

    socket.on('connect_error', () => {
      setConnectionState('error');
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socket.on('session_ready', (event?: ThreadEvent) => {
      if (!isCurrentThreadEvent(event)) return;
      setIsSending(false);
    });

    socket.on('stream_active', (event?: ThreadEvent) => {
      if (!isCurrentThreadEvent(event)) return;
      setIsSending(true);
    });

    socket.on('stream_started', (event?: ThreadEvent) => {
      if (!isCurrentThreadEvent(event)) return;
      // 流式传输开始
      setIsSending(true);
      pendingArtifactsRef.current = [];
    });

    socket.on('stream_done', (event?: ThreadEvent) => {
      if (!isCurrentThreadEvent(event)) return;
      // 流式传输结束
      setIsSending(false);
      if (pendingArtifactsRef.current.length > 0) {
        const artifacts = pendingArtifactsRef.current;
        setMessages((prev) => [
          ...prev,
          {
            id: `artifact-${crypto.randomUUID()}`,
            type: 'ai',
            content: '',
            artifact: artifacts,
            timestamp: new Date(),
          },
        ]);
      }
      pendingArtifactsRef.current = [];
    });

    // 处理后端的 message 事件
    socket.on('message', (data: SocketMessage) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];

        switch (data.type) {
          case 'thinking':
            // 思考内容，更新最后一条 thinking 消息或创建新消息
            if (lastMessage?.type === 'thinking' && lastMessage.id === data.id) {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + data.content },
              ];
            }
            return [
              ...prev,
              {
                id: data.id,
                type: 'thinking',
                content: data.content,
                timestamp: new Date(),
              },
            ];

          case 'text':
            // AI 回复文本，更新最后一条 ai 消息
            if (lastMessage?.type === 'ai' && lastMessage.id === data.id) {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + data.content },
              ];
            }
            return [
              ...prev,
              {
                id: data.id,
                type: 'ai',
                content: data.content,
                timestamp: new Date(),
              },
            ];

          case 'tool_text':
            // 工具调用开始
            return [
              ...prev,
              {
                id: data.id,
                type: 'tool',
                content: `调用工具: ${data.content}`,
                timestamp: new Date(),
                toolName: data.content,
              },
            ];

          case 'tool_result': {
            // 工具执行结果
            // content 可能是字符串或对象
            const incomingArtifacts = normalizeArtifacts(data.artifact);
            if (incomingArtifacts.length > 0) {
              const merged = [...pendingArtifactsRef.current, ...incomingArtifacts];
              const deduped = new Map<string, ChatArtifact>();
              merged.forEach((item) => {
                deduped.set(item.id, item);
              });
              pendingArtifactsRef.current = Array.from(deduped.values());
            }

            const existingToolIndex = prev.findIndex((msg) => msg.id === data.id);

            if (existingToolIndex !== -1) {
              return prev.map((msg, index) => {
                if (index === existingToolIndex) {
                  return {
                    ...msg,
                    toolResult: data.content,
                  };
                }
                return msg;
              });
            }

            const toolContent = data.content as string | { content?: string } | undefined;
            const contentStr =
              typeof toolContent === 'string'
                ? toolContent
                : (toolContent as { content?: string })?.content ?? JSON.stringify(toolContent ?? '');

            return [
              ...prev,
              {
                id: data.id,
                type: 'tool',
                content: `工具结果: ${contentStr.slice(0, 100)}${contentStr.length > 100 ? '...' : ''}`,
                timestamp: new Date(),
                toolName: data.toolName,
                toolResult: data.content,
              },
            ];
          }

          case 'tool_progress':
            // 工具执行进度，追加到对应的工具消息
            return prev.map((msg) => {
              if (msg.id === data.id) {
                return {
                  ...msg,
                  progress: (msg.progress || '') + data.content + '\n',
                };
              }
              return msg;
            });

          default:
            return prev;
        }
      });
    });

    socket.on('error', (data: { message: string }) => {
      let errorMessage = data.message;
      try {
        const parsed = JSON.parse(data.message);
        if (parsed && typeof parsed === 'object' && parsed.message) {
          errorMessage = parsed.message;
        }
      } catch {
        errorMessage = data.message;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'ai',
          content: '',
          timestamp: new Date(),
          error: errorMessage,
        },
      ]);
    });
  }, [isCurrentThreadEvent]);

  // 断开连接
  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnectionState('disconnected');
  }, []);

  // 打开会话
  const sessionOpen = useCallback(
    (args: SessionOpenArgs) => {
      currentThreadIdRef.current = args.threadId;
      setIsSending(false);
      socketRef.current?.emit('session_open', args);
    },
    [],
  );

  // 关闭会话
  const sessionClose = useCallback(
    (args: SessionOpenArgs) => {
      if (currentThreadIdRef.current === args.threadId) {
        setIsSending(false);
      }
      socketRef.current?.emit('session_close', args);
    },
    [],
  );

  // 终止会话（停止生成）
  const sessionTerminate = useCallback((threadId: string) => {
    socketRef.current?.emit('session_terminate', { threadId });
    setIsSending(false);
  }, []);

  // 发送消息
  const sendMessage = useCallback(
    (args: ChatArgs) => {
      pendingArtifactsRef.current = [];
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'user',
          content: args.query,
          timestamp: new Date(),
          imageUrl: args.imageUrl,
        },
      ]);

      socketRef.current?.emit('chat', args);
    },
    [],
  );

  // 清空消息
  const clearMessages = useCallback(() => {
    pendingArtifactsRef.current = [];
    setIsSending(false);
    setMessages([]);
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return {
    connectionState,
    isSending,
    messages,
    connect,
    disconnect,
    sessionOpen,
    sessionClose,
    sessionTerminate,
    sendMessage,
    clearMessages,
    setMessages,
  };
}
