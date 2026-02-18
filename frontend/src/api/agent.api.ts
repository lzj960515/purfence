import type { Tool } from '@/lib/socket-agent';
import type { ChatArtifact } from '@/lib/socket-agent';
import { getBackendBaseUrl } from '@/lib/backend';

/** 获取可用工具列表 */
export async function fetchTools(): Promise<Tool[]> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(`${backendBaseUrl}/api/agent/tools`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tools: ${response.statusText}`);
  }
  return response.json();
}

/** 后端返回的对话格式 */
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/** 获取对话列表 */
export async function fetchConversations(): Promise<Conversation[]> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(`${backendBaseUrl}/api/agent/conversations`);
  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.statusText}`);
  }
  return response.json();
}

/** 后端返回的历史消息格式 */
interface HistoryMessage {
  id: string;
  role: 'ai' | 'user';
  type: 'text' | 'file' | 'thinking' | 'tool_text' | 'tool_result';
  content: string;
  toolName?: string;
  artifact?: ChatArtifact[];
  createdAt: string;
}

/** 获取对话历史消息 */
export async function fetchConversationMessages(
  threadId: string,
): Promise<HistoryMessage[]> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(
    `${backendBaseUrl}/api/agent/conversations/${threadId}/messages`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }
  return response.json();
}

/** 删除对话 */
export async function deleteConversation(threadId: string): Promise<void> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(`${backendBaseUrl}/api/agent/conversations/${threadId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete conversation: ${response.statusText}`);
  }
}
