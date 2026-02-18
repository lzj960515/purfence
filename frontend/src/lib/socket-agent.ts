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
  providerName?: string;
  imageUrl?: string;
}
