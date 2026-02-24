import { Log } from '@nest-mods/log';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DiscoveryService,
  MetadataScanner,
  ModuleRef,
  Reflector,
} from '@nestjs/core';
import { tool as aiTool, type Tool as AITool } from 'ai';
import _ from 'lodash';
import { z } from 'zod';
import { LlmService } from './llm.service';
import { ToolOpt, ToolWatermark, type ToolDefinition } from './tool.decorator';
import type { ModelOptions, MyAgentModuleOptions, Providers } from './types';

// ============================================================================
// Toolkit 类型定义（替代 @voltagent/core 的 Toolkit）
// ============================================================================

export interface Toolkit {
  name: string;
  description?: string;
  tools: AITool[];
}

// ============================================================================
// MCP 工具类型
// ============================================================================

interface MCPClient {
  callTool(params: { name: string; arguments?: any }): Promise<any>;
  listTools(): Promise<{ tools: Array<{ name: string; description?: string; inputSchema?: any }> }>;
}

// ============================================================================
// ToolsService - 管理 Agent 工具
// ============================================================================

@Injectable()
export class ToolsService implements OnModuleInit {
  constructor(
    private moduleRef: ModuleRef,
    private reflector: Reflector,
    private metadataScanner: MetadataScanner,
    private discoveryService: DiscoveryService,
    private configService: ConfigService,
    private llmService: LlmService,
  ) {}

  @Log() private logger: Logger;
  private tools = new Map<string, AITool>();
  private toolKits = new Map<string, Toolkit>();
  private toolsInKitsMap = new Map<string, string[]>();
  private mcpClients = new Map<string, MCPClient>();

  private readonly defaultServerTools = {
    webSearch: {
      openai: this.llmService.createOpenaiTool(({ webSearch }) => webSearch()),
      anthropic: this.llmService.createAnthropicTool(({ webSearch_20250305 }) =>
        webSearch_20250305({ maxUses: 5 }),
      ),
      gemini: this.llmService.createGeminiTool(({ googleSearch }) =>
        googleSearch({}),
      ),
    },
  } satisfies Record<
    string,
    Partial<Record<Providers, { description?: string }>>
  >;

  /**
   * 获取工具列表（AI SDK 格式）
   */
  getTools(tools: string[], model?: ModelOptions['model']): AITool[] {
    return _.chain(tools)
      .map((toolName) => {
        const provider = this.llmService.getProviderByModel(model);
        const serverTool = this.getServerTool(
          toolName as keyof typeof this.defaultServerTools,
          provider,
        );
        if (serverTool) return serverTool;

        const tool = this.getLocalTools([toolName])[0];
        if (tool) return tool;

        const toolKit = this.toolKits.get(toolName);
        if (toolKit) return toolKit.tools;

        throw new Error(`Tool with name ${toolName} not found`);
      })
      .flatten()
      .compact()
      .value() as AITool[];
  }

  /**
   * 获取所有工具信息
   */
  getAllTools() {
    const tools = Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: (tool as any).description || name,
      tags: [],
    }));
    const toolKits = Array.from(this.toolKits.entries()).map(([name, kit]) => ({
      name,
      description: kit.description || name,
      tags: [],
    }));
    const toolNames = _.keys(this.defaultServerTools).map((name) => ({
      name,
      description: name,
      tags: [],
    }));
    return [...tools, ...toolKits, ...toolNames];
  }

  /**
   * 获取所有本地工具
   */
  getAllLocalTools() {
    return Array.from(this.tools.values());
  }

  /**
   * 获取单个本地工具
   */
  getLocalTool(name: string) {
    return this.tools.get(name);
  }

  /**
   * 获取工具包
   */
  getToolKit(name: string) {
    return this.toolKits.get(name);
  }

  /**
   * 模块初始化
   */
  async onModuleInit() {
    await this.registerMcpTools();
    this.scanAndRegisterTools();
    this.createToolKits();
    // 注意：createReasoningTools 已被移除，AI SDK 自动处理推理
    this.logger.debug('ToolsService initialized');
  }

  private getServerTool<
    N extends keyof typeof this.defaultServerTools,
    P extends keyof (typeof this.defaultServerTools)[N],
  >(toolName: N, provider: P) {
    return this.defaultServerTools?.[toolName]?.[provider];
  }

  private getLocalTools(tools: string[]) {
    return _.map(tools, (tool) => this.tools.get(tool)).filter(Boolean);
  }

  // =========================================================================
  // MCP 工具注册
  // =========================================================================

  private async registerMcpTools() {
    const mcpServers = this.config.mcpServers || {};

    for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
      try {
        // 动态导入 MCP SDK
        const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
        const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

        const transport = new StdioClientTransport({
          command: serverConfig.command,
          args: serverConfig.args,
          env: serverConfig.env,
        });

        const client = new Client({ name: 'my-agent', version: '1.0.0' });
        await client.connect(transport);

        this.mcpClients.set(serverName, client as any);

        // 获取并注册工具
        const toolsResponse = await (client as any).listTools();

        for (const mcpTool of toolsResponse.tools || []) {
          if (this.tools.has(mcpTool.name)) {
            this.logger.warn(
              `MCPTool with name ${mcpTool.name} is already registered. Skipping MCP tool.`,
            );
            continue;
          }

          // 将 MCP 工具包装为 AI SDK 工具
          const mcpToolDef: any = {
            description: mcpTool.description || '',
            parameters: this.convertMCPSchemaToZod(mcpTool.inputSchema),
          };
          // 只有在参数不是 any 时才添加 execute
          if (mcpTool.inputSchema) {
            mcpToolDef.execute = async (args: any) => {
              const result = await (client as any).callTool({
                name: mcpTool.name,
                arguments: args,
              });
              return result;
            };
          }
          const wrappedTool = aiTool(mcpToolDef);

          this.tools.set(mcpTool.name, wrappedTool);
          this.logger.debug(`Registered MCP tool: ${mcpTool.name}`);
          this.addToToolsInKitsMap(mcpTool.name, [serverName]);
        }
      } catch (error) {
        this.logger.error(`Failed to register MCP server ${serverName}:`, error.message);
      }
    }
  }

  /**
   * 将 MCP JSON Schema 转换为 Zod schema
   * 简化实现，实际可能需要更复杂的转换
   */
  private convertMCPSchemaToZod(schema: any): any {
    if (!schema) return z.any();

    // 简化处理：返回 any 类型
    // 实际实现应该根据 JSON Schema 构建对应的 Zod schema
    return z.any();
  }

  // =========================================================================
  // 本地工具注册
  // =========================================================================

  private scanAndRegisterTools() {
    const wrappers = this.discoveryService.getProviders({
      metadataKey: ToolWatermark.KEY,
    });

    for (const wrapper of wrappers) {
      const provider = this.moduleRef.get(wrapper.token, { strict: false });
      const methodNames = this.metadataScanner.getAllMethodNames(provider);

      for (const methodName of methodNames) {
        const options = this.reflector.get(ToolOpt, provider[methodName]);

        if (options) {
          if (this.tools.has(options.name)) {
            this.logger.warn(
              `Tool with name ${options.name} is already registered. Skipping ${wrapper.name}#${methodName}.`,
            );
            continue;
          }

          // 使用 AI SDK 的 tool 函数创建工具
          const hasParameters = options.parameters &&
            !(options.parameters instanceof z.ZodObject && Object.keys(options.parameters.shape || {}).length === 0);

          const toolConfig: any = {
            description: options.description || options.name,
            parameters: hasParameters ? options.parameters : z.object({}),
          };

          // 只有在有参数时才添加 execute
          if (hasParameters) {
            toolConfig.execute = async (args: any, context: any) => {
              return provider[methodName].call(provider, args, {
                toolCallId: context.toolCallId,
                messages: context.messages,
                abortSignal: context.abortSignal,
              });
            };
          }

          const aiToolDef = aiTool(toolConfig);

          this.tools.set(options.name, aiToolDef);
          this.logger.debug(
            `Registered tool: ${options.name} from ${wrapper.name}#${methodName}`,
          );

          if (!_.isEmpty(options.tags)) {
            this.addToToolsInKitsMap(options.name, options.tags);
          }
        }
      }
    }
  }

  private addToToolsInKitsMap(toolName: string, tags: string[]) {
    for (const tag of tags) {
      if (!this.toolsInKitsMap.has(tag)) {
        this.toolsInKitsMap.set(tag, []);
      }
      this.toolsInKitsMap.get(tag)!.push(toolName);
    }
  }

  // =========================================================================
  // 工具包创建
  // =========================================================================

  private createToolKits() {
    for (const [name, toolNames] of this.toolsInKitsMap.entries()) {
      const { tools, ...toolKitOptions } =
        _.find(this.config.toolKits, {
          name,
        }) || {};

      const allToolNames = _.chain(toolNames)
        .concat(tools)
        .compact()
        .uniq()
        .value();

      const toolkitTools = this.getLocalTools(allToolNames);

      const toolkit: Toolkit = {
        name,
        description: (toolKitOptions as any).description || name,
        tools: toolkitTools,
      };

      this.toolKits.set(name, toolkit);
      this.logger.debug(
        `Created tool kit: ${name} with tools: ${allToolNames.join()}`,
      );
    }
  }

  private get config() {
    return this.configService.get<MyAgentModuleOptions>('my-agent');
  }
}
