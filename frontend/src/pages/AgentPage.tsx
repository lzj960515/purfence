import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageList } from '@/components/agent/MessageList';
import { ChatInputArea } from '@/components/agent/ChatInputArea';
import { useSocketAgent } from '@/hooks/useSocketAgent';
import { useProviderConfigs } from '@/hooks/useProviderConfigs';
import { fetchConversationMessages } from '@/api/agent.api';
import type { ChatMessage, AgentType } from '@/lib/socket-agent';

export function AgentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [threadId, setThreadId] = useState('');
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [selectedProviderName, setSelectedProviderName] = useState<string>('');
  const autoSentThreadRef = useRef<string>('');
  const { configs } = useProviderConfigs();

  // Execution 模式相关状态
  const [isExecutionMode, setIsExecutionMode] = useState(false);
  const [executionId, setExecutionId] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('tianji');

  const activeProviderOptions = configs
    .filter((config) => config.isEnabled)
    .map((config) => ({ name: config.name }));

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
    sendExecutionMessage,
    clearMessages,
    setMessages,
  } = useSocketAgent();

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
      if (convertedMessages.length > 0) {
        setIsFirstMessage(false);
      }
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
  // Execution 模式相关参数
  const executionIdFromUrl = searchParams.get('executionId');
  const agentFromUrl = searchParams.get('agent') as AgentType | null;

  // 解析 execution 模式参数
  useEffect(() => {
    if (sourceFromUrl === 'execution' && executionIdFromUrl) {
      setIsExecutionMode(true);
      setExecutionId(executionIdFromUrl);
      if (agentFromUrl && (agentFromUrl === 'tianji' || agentFromUrl === 'tianfu')) {
        setSelectedAgent(agentFromUrl);
      }
    } else {
      setIsExecutionMode(false);
      setExecutionId('');
    }
  }, [sourceFromUrl, executionIdFromUrl, agentFromUrl]);

  useEffect(() => {
    if (activeProviderOptions.length === 0) {
      setSelectedProviderName('');
      return;
    }

    if (
      selectedProviderName &&
      activeProviderOptions.some((provider) => provider.name === selectedProviderName)
    ) {
      return;
    }

    const defaultProvider =
      configs.find((config) => config.isEnabled && config.isDefault) ||
      configs.find((config) => config.isEnabled);

    setSelectedProviderName(defaultProvider?.name || activeProviderOptions[0].name);
  }, [activeProviderOptions, configs, selectedProviderName]);

  // 连接成功后创建并打开新会话（由 URL 参数驱动）
  useEffect(() => {
    if (connectionState !== 'connected') return;

    if (threadFromUrl) {
      if (threadFromUrl === threadId) return;

      // 1. 立即清空消息
      clearMessages();
      setIsFirstMessage(sourceFromUrl !== 'history');

      // 2. 关闭旧会话
      if (threadId) {
        sessionClose({ threadId });
      }

      // 3. 更新 threadId
      setThreadId(threadFromUrl);

      // 4. 打开新会话并加载历史
      sessionOpen({ threadId: threadFromUrl });
      void loadHistoryMessages(threadFromUrl);
      return;
    }

    if (!threadId) {
      const newThreadId = crypto.randomUUID();
      setThreadId(newThreadId);
      sessionOpen({ threadId: newThreadId });
      setSearchParams({ thread: newThreadId, source: 'new' }, { replace: true });
    }
  }, [
    connectionState,
    threadId,
    threadFromUrl,
    sourceFromUrl,
    setSearchParams,
    sessionOpen,
    sessionClose,
    clearMessages,
    loadHistoryMessages,
  ]);

  // 发送消息
  const handleSendMessage = useCallback(
    (query: string) => {
      if (!threadId) return;

      if (isExecutionMode && executionId) {
        // Execution 模式：使用 chat_execution 事件
        sendExecutionMessage({
          message: query,
          conversationId: threadId,
          agent: selectedAgent,
          executionId,
          providerName: selectedProviderName || undefined,
        });
      } else {
        // 普通模式：使用 chat 事件
        sendMessage({
          threadId,
          query,
          providerName: selectedProviderName || undefined,
        });
      }

      // 发送第一条消息后，输入框移至底部
      if (isFirstMessage) {
        setIsFirstMessage(false);
      }
    },
    [
      threadId,
      sendMessage,
      sendExecutionMessage,
      isFirstMessage,
      selectedProviderName,
      isExecutionMode,
      executionId,
      selectedAgent,
    ],
  );

  // 停止生成
  const handleStop = useCallback(() => {
    if (threadId) {
      sessionTerminate(threadId);
    }
  }, [threadId, sessionTerminate]);

  const shouldShowCenteredInput = sourceFromUrl !== 'history' && isFirstMessage;

  useEffect(() => {
    if (!autoSendFromUrl || !prefillFromUrl) return;
    if (connectionState !== 'connected') return;
    if (!threadId) return;
    if (autoSentThreadRef.current === threadId) return;
    if (messages.length > 0) return;

    autoSentThreadRef.current = threadId;
    handleSendMessage(prefillFromUrl);
  }, [
    autoSendFromUrl,
    prefillFromUrl,
    connectionState,
    threadId,
    messages.length,
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
            providerOptions={activeProviderOptions}
            selectedProviderName={selectedProviderName}
            onProviderChange={setSelectedProviderName}
            showAgentSelector={isExecutionMode}
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
          />
          
          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards">
             {["Write code", "Analyze data", "Brainstorm ideas", "Summarize text"].map((action) => (
               <button 
                 key={action}
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
            <MessageList messages={messages} />
          </div>

          <div className="shrink-0 z-10 bg-background/95 backdrop-blur-sm">
            <ChatInputArea
              onSendMessage={handleSendMessage}
              onStop={handleStop}
              disabled={connectionState !== 'connected'}
              isSending={isSending}
              isFirstMessage={false}
              providerOptions={activeProviderOptions}
              selectedProviderName={selectedProviderName}
              onProviderChange={setSelectedProviderName}
              showAgentSelector={isExecutionMode}
              selectedAgent={selectedAgent}
              onAgentChange={setSelectedAgent}
            />
          </div>
        </>
      )}
    </div>
  );
}
