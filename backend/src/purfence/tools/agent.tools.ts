import { Tool } from '@app/my-agent';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Agent } from '../agent/agent.entity';
import { ModelConfig } from '../type';
import { ToolExecuteOptions } from '@voltagent/core';
import { id } from 'zod/v4/locales';

const createAgentSchema = z.object({
  name: z.string(),
  instructions: z.string(),
  description: z.string(),
  parentId: z.string().optional(),
  global: z.boolean().default(false),
  tools: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  modelConfig: z
    .object({
      default: z.object({
        id: z.string(),
        model: z.string(),
      }),
      fallbacks: z.array(z.object({ id: z.string(), model: z.string() })),
    })
    .optional(),
});

const updateAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  changeDescription: z.string(),
  instructions: z
    .object({
      oldStr: z.string(),
      newStr: z.string(),
    })
    .optional(),
  description: z.string(),
  parentId: z.string().optional(),
  global: z.boolean().default(false),
  tools: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  modelConfig: z
    .object({
      default: z.object({
        id: z.string(),
        model: z.string(),
      }),
      fallbacks: z.array(z.object({ id: z.string(), model: z.string() })),
    })
    .optional(),
});

@Injectable()
export class AgentTools {
  constructor() {}

  @Tool({
    name: 'agentsList',
    description: 'List all available agents.',
    parameters: z.object({}),
  })
  async agentsList() {
    const agents = await Agent.find();
    return {
      total: agents.length,
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
      })),
    };
  }

  @Tool({
    name: 'agentDetails',
    description: 'Get details of an agent.',
    parameters: z.object({
      id: z.string(),
    }),
  })
  async agentDetails({ id }: { id: string }) {
    const agent = await Agent.findOneOrFail({ where: { id } });
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      instructions: agent.instructions,
      parentId: agent.parentId,
      global: agent.global,
      tools: agent.tools,
      skills: agent.skills,
      modelConfig: agent.modelConfig,
    };
  }

  @Tool({
    name: 'agentCreate',
    description: 'Create a new agent.',
    parameters: createAgentSchema,
  })
  async agentCreate(args: z.output<typeof createAgentSchema>) {
    const agent = await Agent.create({
      ...args,
    }).save();

    return `Agent created successfully: ${agent.id}`;
  }

  @Tool({
    name: 'agentUpdate',
    description: 'Update an agent.',
    parameters: updateAgentSchema,
  })
  async agentUpdate(args: z.output<typeof updateAgentSchema>) {
    const {
      id,
      name,
      instructions,
      description,
      parentId,
      global,
      tools,
      skills,
      modelConfig,
      changeDescription,
    } = args;
    const agent = await Agent.findOneOrFail({ where: { id } });

    if (instructions) {
      const oldStr = instructions.oldStr;
      const newStr = instructions.newStr;
      // 替换文本，先检查oldStr是否存在，不存在则抛出错误
      if (!agent.instructions.includes(oldStr)) {
        throw new Error(`oldStr not found in instructions: ${oldStr}`);
      }
      // 替换文本
      agent.instructions = agent.instructions.replace(oldStr, newStr);
    }
    agent.name = name;
    agent.description = description;
    agent.parentId = parentId;
    agent.global = global;
    agent.tools = tools;
    agent.skills = skills;
    agent.modelConfig = modelConfig;
    agent.changeDescription = changeDescription;
    await agent.save();
    return `Agent updated successfully: ${id}`;
  }

  @Tool({
    name: 'agentDelete',
    description: 'Delete an agent.',
    parameters: z.object({
      id: z.string(),
    }),
  })
  async agentDelete({ id }: { id: string }) {
    const result = await Agent.delete(id);
    if (result.affected === 0) {
      return `Agent not found: ${id}`;
    }
    return `Agent deleted successfully`;
  }
}
