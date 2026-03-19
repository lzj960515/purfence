import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import type { MCPConfiguration, Toolkit } from '@voltagent/core';
import { UIMessage } from 'ai';
import z from 'zod';

type MCPServers = ConstructorParameters<typeof MCPConfiguration>[0]['servers'];
type Models = OpenAIResponsesProviderOptions | AnthropicProviderOptions;

export interface MyAgentModuleOptions {
  headers?: Record<string, string>;
  models?: Record<string, Models>;
  toolKits?: (Omit<Toolkit, 'tools'> & { tools?: string[] })[];
  mcpServers?: MCPServers;
}

export type KnowledgeBaseAttachment = {
  name: string;
  description: string;
  resourceType: 'pdf' | 'web' | 'docx' | 'doc';
  resource: string;
};

export interface IndexedKnowledgeBaseOptions {
  name?: string;
  description?: string;
  indexName: string;
  namespace: string;
  filter?: any;
  publicKb?: IndexedKnowledgeBaseOptions;
}

export interface ModelVariantOptions {
  thinking?: {
    type: 'enabled' | 'disabled' | 'adaptive';
    budgetTokens?: number;
  };
  reasoningSummary?: string;
  reasoningEffort?: string;
  [key: string]: any;
}

export interface ModelOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  provider: Providers;
  proxyUrl?: string;
  variants?: ModelVariantOptions;
}

export interface AgentModelOptions {
  default: ModelOptions;
  fallbacks: ModelOptions[];
}
export interface AgentOptions {
  name: string;
  description?: string;
  prompt?: string;
  tools?: (string | { description?: string })[];
  memory?: false | 'in-memory';
  skills?: string[];
}

export interface ChatOptions {
  message: string | UIMessage[];
  userId?: string;
  conversationId?: string;
  context?: Record<string, any>;
  agentModelOptions?: AgentModelOptions;
}

export interface GenerateTextOutputOptions<T extends z.ZodType> {
  prompt: string;
  schema: T;
}

export type Providers = 'openai' | 'anthropic' | 'google' | 'openai-compatible';
