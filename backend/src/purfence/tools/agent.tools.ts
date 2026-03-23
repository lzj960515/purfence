import { Tool } from '@app/my-agent';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Agent } from '../agent/agent.entity';

const modelConfigSchema = z
  .object({
    default: z
      .object({
        id: z
          .string()
          .describe('Default provider/model configuration ID to use first'),
        model: z
          .string()
          .describe(
            'Default model name to use first, such as gpt-5 or claude-sonnet',
          ),
      })
      .describe('Primary model used for normal execution'),
    fallbacks: z
      .array(
        z.object({
          id: z.string().describe('Fallback provider/model configuration ID'),
          model: z.string().describe('Fallback model name'),
        }),
      )
      .describe(
        'Ordered fallback models to try if the default model is unavailable',
      ),
  })
  .describe(
    'Optional per-agent model override. Omit to use the global model configuration',
  );

const createAgentSchema = z.object({
  name: z.string().describe('Unique agent name used to identify the agent'),
  instructions: z
    .string()
    .describe(
      'Full system instructions or prompt that defines how the agent should behave',
    ),
  description: z
    .string()
    .describe(
      'Short human-readable summary of the agent purpose and responsibilities',
    ),
  parentId: z
    .string()
    .optional()
    .describe(
      'Optional parent agent ID used to build agent hierarchy and sibling discovery',
    ),
  global: z
    .boolean()
    .default(false)
    .describe(
      'Set to true to make this agent available globally to other agents',
    ),
  tools: z
    .array(z.string())
    .optional()
    .describe(
      'Optional allowlist of tool names. Omit to allow the agent to use all tools',
    ),
  skills: z
    .array(z.string())
    .optional()
    .describe(
      'Optional allowlist of skill names. Omit to allow the agent to use all skills',
    ),
  modelConfig: modelConfigSchema.optional(),
});

const updateInstructionsSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z
      .literal('replace')
      .describe('Replace one exact instruction segment'),
    oldStr: z
      .string()
      .min(1)
      .describe(
        'Exact existing text to find inside the current instructions. Must be non-empty.',
      ),
    newStr: z
      .string()
      .describe(
        'Replacement text that will overwrite the matched instruction segment.',
      ),
  }),
  z.object({
    mode: z.literal('append').describe('Append new content to the end'),
    content: z
      .string()
      .min(1)
      .describe(
        'New instruction content to append to the end of the current instructions. Must be non-empty.',
      ),
  }),
  z.object({
    mode: z
      .literal('rewrite')
      .describe('Rewrite the entire instructions field'),
    content: z
      .string()
      .min(1)
      .describe(
        'Complete new instructions content that will replace the existing instructions. Must be non-empty.',
      ),
  }),
]);

const updateAgentSchema = z.object({
  id: z.string().describe('Agent ID to update'),
  name: z
    .string()
    .optional()
    .describe('Optional new unique agent name. Omit to keep the current name'),
  changeDescription: z
    .string()
    .nullable()
    .optional()
    .describe(
      'Optional short summary of what changed. Used for history and audit records. Pass null to clear it.',
    ),
  instructions: updateInstructionsSchema
    .optional()
    .describe(
      'Optional instructions edit operation. Supports exact replace, append to the end, or full rewrite.',
    ),
  description: z
    .string()
    .nullable()
    .optional()
    .describe(
      'Optional new human-readable description. Omit to keep the current description, or pass null to clear it.',
    ),
  parentId: z
    .string()
    .nullable()
    .optional()
    .describe(
      'Optional new parent agent ID. Omit to keep the current hierarchy, or pass null to remove the parent.',
    ),
  global: z
    .boolean()
    .optional()
    .describe(
      'Optional global visibility flag. Omit to keep the current value',
    ),
  tools: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      'Optional replacement tool allowlist. Omit to keep the current tool configuration, or pass null to clear it and fall back to all tools.',
    ),
  skills: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      'Optional replacement skill allowlist. Omit to keep the current skill configuration, or pass null to clear it and fall back to all skills.',
    ),
  modelConfig: modelConfigSchema
    .nullable()
    .optional()
    .describe(
      'Optional replacement model configuration. Omit to keep the current model settings, or pass null to fall back to the global model configuration.',
    ),
});

@Injectable()
export class AgentTools {
  @Tool({
    name: 'agentsList',
    description:
      'List all available agents as a lightweight summary including hierarchy metadata. Use this for discovery and org-tree reconstruction before create, update, delegation, or delete; use agentDetails when you need full instructions or configuration.',
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
        parentId: agent.parentId,
        global: agent.global,
      })),
    };
  }

  @Tool({
    name: 'agentDetails',
    description:
      'Get the full configuration of a single agent, including instructions, tools, skills, and modelConfig. Call agentsList first if you do not know the agent id, and call this before agentUpdate to avoid stale patches.',
    parameters: z.object({
      id: z.string().describe('Agent ID to inspect'),
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
    description:
      'Create a brand new agent with its own prompt, visibility, allowed tools or skills, and optional model override. If you are not sure whether a similar agent already exists or what name to use, call agentsList first; if the agent already exists, use agentUpdate instead.',
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
    description:
      'Update an existing agent when you need to rename it, change metadata or visibility, replace tool, skill, or model settings, or modify its instructions. Omitted fields stay unchanged, nullable fields can be cleared with null, tools or skills or modelConfig are full replacements rather than merges, and instructions require an explicit replace, append, or rewrite mode; replace still fails unless oldStr matches exactly.',
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
      switch (instructions.mode) {
        case 'append': {
          const currentInstructions = agent.instructions ?? '';
          const separator = currentInstructions.trim().length > 0 ? '\n\n' : '';
          agent.instructions = `${currentInstructions}${separator}${instructions.content}`;
          break;
        }
        case 'rewrite': {
          agent.instructions = instructions.content;
          break;
        }
        case 'replace': {
          // 替换文本，先检查oldStr是否存在，不存在则抛出错误
          if (!agent.instructions?.includes(instructions.oldStr)) {
            throw new Error(
              `oldStr not found in instructions: ${instructions.oldStr}`,
            );
          }
          // 替换文本
          agent.instructions = agent.instructions.replace(
            instructions.oldStr,
            instructions.newStr,
          );
          break;
        }
      }
    }

    if (name !== undefined) {
      agent.name = name;
    }
    if (description !== undefined) {
      agent.description = description;
    }
    if (parentId !== undefined) {
      agent.parentId = parentId;
    }
    if (global !== undefined) {
      agent.global = global;
    }
    if (tools !== undefined) {
      agent.tools = tools;
    }
    if (skills !== undefined) {
      agent.skills = skills;
    }
    if (modelConfig !== undefined) {
      agent.modelConfig = modelConfig;
    }
    if (changeDescription !== undefined) {
      agent.changeDescription = changeDescription;
    }

    await agent.save();
    return `Agent updated successfully: ${id}`;
  }

  @Tool({
    name: 'agentDelete',
    description:
      'Delete an agent by id when you are sure the target record should be removed. Prefer agentDetails first if you want to confirm the target, and use agentUpdate instead when you only need to change configuration.',
    parameters: z.object({
      id: z.string().describe('Agent ID to delete'),
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
