import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { UIMessage } from 'ai';
import z from 'zod';

// ============================================================================
// MCP 服务器配置类型（替代 @voltagent/core 的 MCPConfiguration）
// ============================================================================

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export type MCPServers = Record<string, MCPServerConfig>;

type Models = OpenAIResponsesProviderOptions | AnthropicProviderOptions;

// ============================================================================
// Toolkit 类型（替代 @voltagent/core 的 Toolkit）
// ============================================================================

export interface Toolkit {
  name: string;
  description?: string;
  tools: any[];
}

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

export const SUPPORTED_MODELS = [
  'claude-sonnet-4-5',
  'openai',
  'codex',
  'gpt-5',
  'gpt-5-mini',
  'gemini',
  'gemini-3-pro-preview',
  'kimi',
  'glm-4.7',
] as const;

export type SupportedModel = (typeof SUPPORTED_MODELS)[number];

export interface ModelOptions {
  model?: SupportedModel;
  thinking?: boolean;
  configurationName?: string;
  apiKey?: string;
  baseUrl?: string;
  accessToken?: string;
  accountId?: string;
  proxyUrl?: string;
  provider?: string;
}

export interface AgentOptions {
  name: string;
  model?: ModelOptions['model'];
  modelOptions?: ModelOptions;
  prompt?: string;
  tools?: (string | { description?: string })[];
  subAgentsOptions?: AgentOptions[];
  memory?: false | 'in-memory';
}

export interface ChatOptions {
  message: string | UIMessage[];
  userId?: string;
  conversationId?: string;
  context?: Record<string, any>;
  modelOptions?: ModelOptions;
}

export interface GenerateTextOutputOptions<T extends z.ZodType> {
  prompt: string;
  schema: T;
}

export type Providers = 'openai' | 'anthropic' | 'gemini';

export const WorkflowParamSchema = z.union([
  z.object({
    type: z.literal('literal'),
    value: z.unknown(),
  }),
  z.object({
    type: z.literal('node'),
    nodeId: z.string(),
    value: z.string().optional(),
  }),
]);

export type WorkflowParam = z.infer<typeof WorkflowParamSchema>;

export const ToolNodeSchema = z.object({
  id: z.string(),
  type: z.literal('tool'),
  name: z.string().optional(),
  description: z.string().optional(),
  toolName: z.string(),
  params: z.record(z.string(), WorkflowParamSchema).optional(),
});

export type ToolNode = z.infer<typeof ToolNodeSchema>;

export const AgentNodeSchema = z.object({
  id: z.string(),
  type: z.literal('agent'),
  name: z.string().optional(),
  description: z.string().optional(),
  agent: z.object({
    name: z.string().optional(),
    model: z
      .enum(SUPPORTED_MODELS)
      .default('claude-sonnet-4-5')
      .describe(
        'Model identifier. Defaults to "claude-sonnet-4-5" when omitted.',
      ),
    prompt: z.string(),
  }),
  params: z.record(z.string(), WorkflowParamSchema).optional(),
  // When persisted as config, schema will typically be a JSON description,
  // not a live Zod schema instance.
  schema: z.unknown(),
});

export type AgentNode = z.infer<typeof AgentNodeSchema> & {
  agent: {
    name?: string;
    model?: ModelOptions['model'];
    prompt: string;
  };
};

export const WorkflowNodeSchema = z.object({
  preId: z.string().nullable().optional(),
  type: z.union([z.literal('start'), z.literal('end'), z.literal('normal')]),
  nextId: z.string().nullable().optional(),
  node: z.union([ToolNodeSchema, AgentNodeSchema]),
});

export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;

export const WorkflowConfigSchema = z.object({
  name: z.string(),
  nodes: z.array(WorkflowNodeSchema),
});

export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;

export interface WorkflowState {
  userId?: string;
  conversationId?: string;
  executionId?: string;
  context?: Map<string, unknown>;
}
