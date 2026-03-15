import { io, type Socket } from 'socket.io-client';
import { getBackendBaseUrl } from './backend';

/**
 * 创建 Socket.io 客户端连接到后端 /agent 命名空间
 * @returns Socket 实例
 */
export function createAgentSocket(): Socket {
  const backendBaseUrl = getBackendBaseUrl();
  return io(`${backendBaseUrl}/agent`, {
    reconnection: true,
    reconnectionDelayMax: 10000,
  });
}

/** Socket 连接状态 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/** 消息类型 */
export type MessageType = 'user' | 'ai' | 'thinking' | 'tool';

/** 聊天消息 */
export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  toolName?: string;
  toolResult?: unknown;
  progress?: string; // 工具执行进度内容（不持久化）
  error?: string;
  // 从后端返回的额外字段
  role?: 'ai' | 'user';
  status?: 'error';
  artifact?: ChatArtifact[];
  createdAt?: string | Date;
  /** 用户发送的图片路径 */
  imageUrl?: string;
}

export type ArtifactKind = 'IMAGE' | 'FILE';

export type ArtifactFileType = 'PDF' | 'DOCX' | 'XLSX' | 'UNKNOWN';

export interface ChatArtifact {
  id: string;
  type: ArtifactKind;
  toolCallId?: string;
  toolName?: string;
  content: {
    type: ArtifactKind;
    url?: string;
    fileType?: ArtifactFileType | string;
    fileUrl?: string;
    filename?: string;
  };
}

/** 工具定义 */
export interface Tool {
  name: string;
  description: string;
}

/** Socket 事件参数 */
export interface SessionOpenArgs {
  threadId: string;
}

export interface ChatArgs {
  threadId: string;
  query: string;
  tools?: string[];
  model?: string;
  agentId?: string;
  imageUrl?: string;
}

/** chat_execution 事件参数 - 用于继续执行指定的 Execution */
export interface ChatExecutionArgs {
  /** 消息内容 */
  message: string;
  /** 会话 ID（用于消息历史） */
  conversationId: string;
  /** Agent 类型：tianji（天机调度）或 tianfu（天府评估） */
  agent: 'tianji' | 'tianfu';
  /** 要继续执行的 Execution ID */
  executionId: string;
  agentId?: string;
}

/** Execution 执行阶段 */
export type ExecutionStage = 'tianji' | 'tianfu';

/** Agent 类型（用于选择器） */
export type AgentType = 'tianji' | 'tianfu';

/** Agent 选项 */
export interface AgentOption {
  value: AgentType;
  label: string;
  description: string;
}

/** 预定义的 Agent 选项列表 */
export const AGENT_OPTIONS: AgentOption[] = [
  {
    value: 'tianji',
    label: '天机',
    description: '调度、分配任务',
  },
  {
    value: 'tianfu',
    label: '天府',
    description: '评估、规划下一步',
  },
];
