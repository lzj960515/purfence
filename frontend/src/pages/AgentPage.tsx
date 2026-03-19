import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useCreateOneAgentConversationMutation } from '@/graphql/__generated__/hooks';
import { MessageList } from '@/components/agent/MessageList';
import { ChatInputArea } from '@/components/agent/ChatInputArea';
import { useSocketAgent } from '@/hooks/useSocketAgent';
import { GET_AGENTS } from '@/api/agent.graphql';
import { fetchConversationMessages, uploadImage } from '@/api/agent.api';
import type { ChatMessage } from '@/lib/socket-agent';

type AgentListNode = {
  id: string;
  name?: string | null;
};

type AgentsQueryData = {
  agents?: {
    nodes: AgentListNode[];
  };
};

export function AgentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [threadId, setThreadId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [pendingFirstMessage, setPendingFirstMessage] = useState<ChatMessage | null>(null);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const autoSentThreadRef = useRef<string>('');
  const creatingThreadPromiseRef = useRef<Promise<string | null> | null>(null);
  const openingThreadRef = useRef('');
  const { data: agentsData } = useQuery<AgentsQueryData>(GET_AGENTS, {
    fetchPolicy: 'network-only',
  });

  // 待发送图片状态
  const [pendingImage, setPendingImage] = useState<File | null>(null);

  const agentOptions = (agentsData?.agents?.nodes || [])
    .filter((agent): agent is { id: string; name: string } => {
      return typeof agent.id === 'string' && typeof agent.name === 'string' && agent.name.length > 0;
    })
    .map((agent) => ({ id: agent.id, name: agent.name }));

  const [createConversation] = useCreateOneAgentConversationMutation({
    onError: (error) => {
      console.error('Failed to create conversation:', error);
    },
  });

  const effectiveSelectedAgentId = agentOptions.some((agent) => agent.id === selectedAgentId)
    ? selectedAgentId
    : (agentOptions[0]?.id ?? '');

  const {
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
  } = useSocketAgent();

  const renderedMessages = messages.length > 0
    ? messages
    : pendingFirstMessage
      ? [pendingFirstMessage]
      : messages;

  // 页面加载时自动连接
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // 加载历史消息
  const loadHistoryMessages = useCallback(async (conversationId: string) => {
    try {
      const historyMessages = await fetchConversationMessages(conversationId);

      // 转换后端格式到前端格式，需要合并 tool_text 和 tool_result
      const convertedMessages: ChatMessage[] = [];
      const toolResultMap = new Map<string, { toolName: string; content: unknown; createdAt: string | Date }>();
      let turnArtifacts = new Map<string, NonNullable<ChatMessage['artifact']>[number]>();

      for (const msg of historyMessages) {
        if (msg.role === 'user' && turnArtifacts.size > 0) {
          convertedMessages.push({
            id: `artifact-${crypto.randomUUID()}`,
            type: 'ai',
            content: '',
            artifact: Array.from(turnArtifacts.values()),
            timestamp: new Date(msg.createdAt),
          });
          turnArtifacts = new Map();
        }

        if (msg.type === 'tool_text') {
          // 遇到 tool_text，先收集，等待 tool_result
          toolResultMap.set(msg.id, {
            toolName: msg.content,  // tool_text 的 content 是工具名
            content: null,
            createdAt: msg.createdAt,
          });
        } else if (msg.type === 'tool_result') {
          if (Array.isArray(msg.artifact) && msg.artifact.length > 0) {
            msg.artifact.forEach((artifact) => {
              turnArtifacts.set(artifact.id, artifact);
            });
          }

          // 遇到 tool_result，更新之前收集的信息或创建新条目
          const existing = toolResultMap.get(msg.id);
          toolResultMap.set(msg.id, {
            toolName: existing?.toolName || msg.toolName!,
            content: msg.content,
            createdAt: msg.createdAt,
          });
          // 立即添加合并后的工具消息
          const toolData = toolResultMap.get(msg.id)!;
          convertedMessages.push({
            id: msg.id,
            type: 'tool',
            content: `调用工具: ${toolData.toolName}`,
            timestamp: new Date(toolData.createdAt),
            toolName: toolData.toolName,
            toolResult: toolData.content,
          });
          toolResultMap.delete(msg.id);
        } else {
          // 其他消息直接添加
          let type: ChatMessage['type'] = msg.type as ChatMessage['type'];
          if (msg.type === 'text' && msg.role === 'ai') {
            type = 'ai';
          } else if (msg.type === 'text' && msg.role === 'user') {
            type = 'user';
          }

          convertedMessages.push({
            id: msg.id,
            type,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            toolName: msg.toolName,
          });
        }
      }

      if (turnArtifacts.size > 0) {
        convertedMessages.push({
          id: `artifact-${crypto.randomUUID()}`,
          type: 'ai',
          content: '',
          artifact: Array.from(turnArtifacts.values()),
          timestamp: new Date(),
        });
      }

      setMessages(convertedMessages);
    } catch (e) {
      console.error('Failed to load history:', e as unknown);
      // 加载失败时清空消息
      setMessages([]);
    }
  }, [setMessages]);

  // 从 URL 参数中提取需要的值，避免整个 searchParams 对象作为依赖
  const threadFromUrl = searchParams.get('thread');
  const sourceFromUrl = searchParams.get('source');
  const prefillFromUrl = searchParams.get('prefill') || '';
  const autoSendFromUrl = searchParams.get('autoSend') === '1';

  const ensureThreadId = useCallback(async () => {
    if (threadId) {
      return threadId;
    }

    if (creatingThreadPromiseRef.current) {
      return creatingThreadPromiseRef.current;
    }

    const promise = createConversation({
      variables: {
        input: {
          userId: 'purfence',
        },
      },
    })
      .then(({ data }) => {
        const newThreadId = data?.createOneAgentConversation?.id;
        if (!newThreadId) {
          return null;
        }

        openingThreadRef.current = newThreadId;
        setThreadId(newThreadId);
        sessionOpen({ threadId: newThreadId });
        setSearchParams({ thread: newThreadId, source: 'new' }, { replace: true });
        return newThreadId;
      })
      .finally(() => {
        creatingThreadPromiseRef.current = null;
      });

    creatingThreadPromiseRef.current = promise;
    return promise;
  }, [threadId, createConversation, sessionOpen, setSearchParams]);

  useEffect(() => {
    if (connectionState !== 'connected') return;

    if (threadFromUrl && sourceFromUrl === 'history') {
      if (threadFromUrl === threadId) {
        return;
      }

      clearMessages();

      if (threadId) {
        sessionClose({ threadId });
      }

      const timeoutId = window.setTimeout(() => {
        setThreadId(threadFromUrl);
        sessionOpen({ threadId: threadFromUrl });
        void loadHistoryMessages(threadFromUrl);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };

    }

    if (threadFromUrl && sourceFromUrl === 'new') {
      if (threadFromUrl === threadId || threadFromUrl === openingThreadRef.current) {
        if (threadFromUrl === openingThreadRef.current) {
          openingThreadRef.current = '';
        }
        return;
      }

      const timeoutId = window.setTimeout(() => {
        setThreadId(threadFromUrl);
        sessionOpen({ threadId: threadFromUrl });
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    if (!threadFromUrl && threadId && threadId !== openingThreadRef.current) {
      clearMessages();
      setPendingFirstMessage(null);
      setIsStartingConversation(false);
      sessionClose({ threadId });
      autoSentThreadRef.current = '';
      const timeoutId = window.setTimeout(() => {
        setThreadId('');
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [
    connectionState,
    sourceFromUrl,
    threadId,
    threadFromUrl,
    sessionOpen,
    sessionClose,
    clearMessages,
    loadHistoryMessages,
  ]);

  useEffect(() => {
    if (messages.length === 0) return;

    setPendingFirstMessage(null);
    setIsStartingConversation(false);
  }, [messages.length]);

  // 发送消息
  const handleSendMessage = useCallback(
    async (query: string) => {
      const isFirstMessageForNewConversation = !threadId && messages.length === 0;

      if (isFirstMessageForNewConversation) {
        setIsStartingConversation(true);
        setPendingFirstMessage({
          id: `pending-${crypto.randomUUID()}`,
          type: 'user',
          content: query,
          timestamp: new Date(),
        });
      }

      const activeThreadId = await ensureThreadId();
      if (!activeThreadId) {
        setPendingFirstMessage(null);
        setIsStartingConversation(false);
        return;
      }

      let imageUrl: string | undefined;

      // 如果有待发送图片，先上传
      if (pendingImage) {
        try {
          const result = await uploadImage(pendingImage, activeThreadId);
          imageUrl = result.path;
        } catch (e) {
          console.error('Failed to upload image:', e as unknown);
          // 上传失败继续发送消息（不带图片）
        }
      }

      sendMessage({
        threadId: activeThreadId,
        query,
        agentId: effectiveSelectedAgentId || undefined,
        imageUrl,
      });

      setPendingImage(null);
    },
    [
      ensureThreadId,
      sendMessage,
      effectiveSelectedAgentId,
      messages.length,
      pendingImage,
      threadId,
    ],
  );

  // 停止生成
  const handleStop = useCallback(() => {
    if (threadId) {
      sessionTerminate(threadId);
    }
  }, [threadId, sessionTerminate]);

  const shouldShowCenteredInput =
    sourceFromUrl !== 'history' &&
    renderedMessages.length === 0 &&
    !isStartingConversation;

  useEffect(() => {
    if (!autoSendFromUrl || !prefillFromUrl) return;
    if (connectionState !== 'connected') return;
    const autoSendToken =
      sourceFromUrl === 'new' ? `new:${prefillFromUrl}` : threadId;
    if (!autoSendToken) return;
    if (autoSentThreadRef.current === autoSendToken) return;
    if (renderedMessages.length > 0) return;

    const timeoutId = window.setTimeout(() => {
      autoSentThreadRef.current = autoSendToken;
      void handleSendMessage(prefillFromUrl);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    autoSendFromUrl,
    prefillFromUrl,
    connectionState,
    sourceFromUrl,
    threadId,
    renderedMessages.length,
    handleSendMessage,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background font-sans relative">
      {shouldShowCenteredInput ? (
        <div className="flex flex-col items-center justify-center h-full w-full px-4 pb-48 animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-8 text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-medium text-foreground tracking-tight">
              你想做些什么？
            </h1>
          </div>
          
          <ChatInputArea
            onSendMessage={handleSendMessage}
            onStop={handleStop}
            disabled={connectionState !== 'connected'}
            isSending={isSending}
            isFirstMessage={true}
            agentOptions={agentOptions}
            selectedAgentId={effectiveSelectedAgentId}
            onAgentIdChange={setSelectedAgentId}
            pendingImage={pendingImage}
            onPendingImageChange={setPendingImage}
          />
          
          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards">
             {["Write code", "Analyze data", "Brainstorm ideas", "Summarize text"].map((action) => (
               <button 
                 key={action}
                 type="button"
                 onClick={() => handleSendMessage(action)}
                 className="px-4 py-2 bg-muted/50 hover:bg-muted rounded-full text-sm text-muted-foreground transition-colors cursor-pointer"
               >
                 {action}
               </button>
             ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto min-h-0 z-0 scroll-smooth">
            <MessageList messages={renderedMessages} />
          </div>

          <div className="shrink-0 z-10 bg-background/95 backdrop-blur-sm">
            <ChatInputArea
              onSendMessage={handleSendMessage}
              onStop={handleStop}
              disabled={connectionState !== 'connected'}
              isSending={isSending}
              isFirstMessage={false}
              agentOptions={agentOptions}
              selectedAgentId={effectiveSelectedAgentId}
              onAgentIdChange={setSelectedAgentId}
              pendingImage={pendingImage}
              onPendingImageChange={setPendingImage}
            />
          </div>
        </>
      )}
    </div>
  );
}
