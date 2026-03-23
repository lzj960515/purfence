import type { Tool } from '@/lib/socket-agent';
import type { ChatArtifact } from '@/lib/socket-agent';
import { getBackendBaseUrl } from '@/lib/backend';

export interface SkillItem {
  name: string;
  description: string;
}

export interface AgentModelRoutePayload {
  id: string;
  model: string;
}

export interface AgentModelConfigPayload {
  default: AgentModelRoutePayload;
  fallbacks: AgentModelRoutePayload[];
}

export interface AgentHistoryItem {
  id: string;
  agentId: string;
  version: number;
  name: string;
  instructions?: string | null;
  description?: string | null;
  changeDescription?: string | null;
  parentId?: string | null;
  global: boolean;
  tools?: string[] | null;
  skills?: string[] | null;
  modelConfig?: AgentModelConfigPayload | null;
  createdAt: string;
  updatedAt: string;
}

/** 获取可用工具列表 */
export async function fetchTools(): Promise<Tool[]> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(`${backendBaseUrl}/api/agent/tools`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tools: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSkills(): Promise<SkillItem[]> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(`${backendBaseUrl}/api/agent/skills`);
  if (!response.ok) {
    throw new Error(`Failed to fetch skills: ${response.statusText}`);
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

/** 上传图片 */
export async function uploadImage(
  file: File,
  conversationId: string,
): Promise<{ success: boolean; path: string; url: string }> {
  const backendBaseUrl = getBackendBaseUrl();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conversationId', conversationId);

  const response = await fetch(`${backendBaseUrl}/api/agent/upload-image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}
