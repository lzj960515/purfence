import { Log } from '@nest-mods/log';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DiscoveryService,
  MetadataScanner,
  ModuleRef,
  Reflector,
} from '@nestjs/core';
import {
  createReasoningTools,
  createTool,
  createToolkit,
  MCPConfiguration,
  Tool,
  Toolkit,
  ToolOptions,
} from '@voltagent/core';
import _ from 'lodash';
import { LlmService } from './llm.service';
import { ToolOpt, ToolWatermark } from './tool.decorator';
import type { ModelOptions, MyAgentModuleOptions, Providers } from './types';

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
  private tools = new Map<string, Tool>();
  private toolKits = new Map<string, Toolkit>();
  private toolsInKitsMap = new Map<string, string[]>();

  getTools(tools: string[], model?: ModelOptions['model']): any {
    return _.chain(tools)
      .map((toolName) => {
        const tool = this.getLocalTools([toolName])[0];
        if (tool) return tool;

        const toolKit = this.toolKits.get(toolName);
        if (toolKit) return toolKit;
        throw new Error(`Tool with name ${toolName} not found`);
      })
      .compact()
      .value();
  }

  getAllTools() {
    const tools = Array.from(this.tools.values());
    const toolKits = Array.from(this.toolKits.values());
    return _.chain(tools)
      .map(({ name, description, tags }) => ({ name, description, tags }))
      .concat(
        toolKits.map((kit) => ({
          name: kit.name,
          description: kit.description,
          tags: [],
        })),
      )
      .value();
  }

  getAllLocalTools() {
    return Array.from(this.tools.values());
  }

  getLocalTool(name: string) {
    return this.tools.get(name);
  }

  getToolKit(name: string) {
    return this.toolKits.get(name);
  }

  private getLocalTools(tools: string[]) {
    return _.map(tools, (tool) => this.tools.get(tool));
  }

  async onModuleInit() {
    await this.registerMcpTools();
    this.scanAndRegisterTools();
    this.createToolKits();
    const reasoningToolkit: Toolkit = createReasoningTools();
    this.toolKits.set('reasoning_tools', reasoningToolkit);
  }

  private async registerMcpTools() {
    const mcpConfig = new MCPConfiguration({ servers: this.config.mcpServers });

    const mcpTools = await mcpConfig.getTools();

    for (const mcpTool of mcpTools) {
      if (this.tools.has(mcpTool.name)) {
        this.logger.warn(
          `MCPTool with name ${mcpTool.name} is already registered. Skipping MCP tool.`,
        );
        continue;
      }
      this.tools.set(mcpTool.name, mcpTool);
      this.logger.debug(`Registered MCP tool: ${mcpTool.name}`);
    }

    const mcpToolSets = await mcpConfig.getToolsets();
    for (const [toolSetsName, toolSets] of Object.entries(mcpToolSets)) {
      for (const tool of toolSets.getTools()) {
        this.addToToolsInKitsMap(tool.name, [toolSetsName]);
      }
    }
  }

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

          const tool = createTool({
            ...(options as ToolOptions),
            execute: provider[methodName].bind(provider),
          });

          this.tools.set(options.name, tool);
          this.logger.debug(
            `Registered tool: ${options.name} from ${wrapper.name}#${methodName}`,
          );

          if (!_.isEmpty(tool.tags)) {
            this.addToToolsInKitsMap(options.name, tool.tags);
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
      this.toolsInKitsMap.get(tag).push(toolName);
    }
  }

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

      const toolKit = createToolkit({
        ...toolKitOptions,
        name: name,
        tools: this.getLocalTools(allToolNames),
      });
      this.toolKits.set(name, toolKit);
      this.logger.debug(
        `Created tool kit: ${name} with tools: ${allToolNames.join()}`,
      );
    }
  }

  private get config() {
    return this.configService.get<MyAgentModuleOptions>('my-agent');
  }
}
