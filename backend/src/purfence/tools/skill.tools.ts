import { Tool } from '@app/my-agent';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ToolExecuteOptions } from '@voltagent/core';
import { loadSkill } from '@app/my-agent/utils/skill-loader.util';
@Injectable()
export class SkillTools {
  constructor() {}

  @Tool({
    name: 'Skill',
    description: `Execute a skill within the main conversation
      When users ask you to perform tasks, check if any of the available skills match. Skills provide specialized capabilities and domain knowledge.

      How to invoke:
      - Use this tool with the skill name and optional arguments
      - Examples:
        - skill: "pdf" - invoke the pdf skill

      Important:
      - Available skills are listed in skill-reminder messages in the conversation
      - When a skill matches the user's request, this is a BLOCKING REQUIREMENT: invoke the relevant Skill tool BEFORE generating any other response about the task
      - NEVER mention a skill without actually calling this tool
      - Do not invoke a skill that is already running`,
    parameters: z.object({
      name: z.string().describe('The skill name. E.g., "pdf"'),
    }),
  })
  async skill({ name }: { name: string }, options: ToolExecuteOptions) {
    const skill = loadSkill(name);
    //   The following skills are available for use with the Skill tool:  加到system prompt里面
    return [
      {
        type: 'text',
        text: `Launching skill: ${name}`,
      },
      {
        type: 'text',
        text: `Base directory for this skill: ${skill.location}`,
      },
      {
        type: 'text',
        text: skill.content,
      },
    ];
  }
}
