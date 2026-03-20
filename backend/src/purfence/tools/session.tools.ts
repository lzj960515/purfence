import { Tool } from '@app/my-agent';
import { Injectable } from '@nestjs/common';
import { ToolExecuteOptions } from '@voltagent/core';
import { z } from 'zod';
import { SessionToolsService } from './session-tools.service';

const sessionsListSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe('Fuzzy match conversation titles with SQL LIKE'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  agentId: z.string().trim().min(1).optional(),
  currentConversationOnly: z
    .boolean()
    .default(false)
    .describe(
      'When true, only return sessions whose parentConversationId matches options.conversationId',
    ),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

const sessionsHistorySchema = z.object({
  sessionId: z.string().trim().min(1),
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0),
});

const sessionToolDetailsSchema = z.object({
  sessionId: z.string().trim().min(1),
  toolCallIds: z.array(z.string().trim().min(1)).min(1),
});

@Injectable()
export class SessionTools {
  constructor(private readonly sessionToolsService: SessionToolsService) {}

  @Tool({
    name: 'agentsList',
    description: 'List configured agents available in this Purfence instance.',
    parameters: z.object({}),
  })
  async agentsList() {
    return this.sessionToolsService.listAgents();
  }

  @Tool({
    name: 'sessionsList',
    description:
      'List conversation records with optional title fuzzy search, agent filtering, pagination, and sorting.',
    parameters: sessionsListSchema,
  })
  async sessionsList(
    args: {
      title?: string;
      limit: number;
      offset: number;
      agentId?: string;
      currentConversationOnly: boolean;
      sortBy: 'createdAt' | 'updatedAt' | 'title';
      sortOrder: 'ASC' | 'DESC';
    },
    options: ToolExecuteOptions,
  ) {
    return this.sessionToolsService.listSessions({ ...args, options });
  }

  @Tool({
    name: 'sessionsHistory',
    description:
      'Load session history summary. Returns only user text, ai text, and ai tool-call summary items.',
    parameters: sessionsHistorySchema,
  })
  async sessionsHistory(
    args: {
      sessionId: string;
      limit: number;
      offset: number;
    },
    options: ToolExecuteOptions,
  ) {
    return this.sessionToolsService.getSessionHistory({ ...args, options });
  }

  @Tool({
    name: 'sessionToolDetails',
    description:
      'Load tool-call details for a session by toolCallId array, including tool input and tool result.',
    parameters: sessionToolDetailsSchema,
  })
  async sessionToolDetails(
    args: {
      sessionId: string;
      toolCallIds: string[];
    },
    options: ToolExecuteOptions,
  ) {
    return this.sessionToolsService.getToolCallDetails({ ...args, options });
  }

  @Tool({
    name: 'sessionsSpawn',
    description: `Launch a new agent to handle complex, multi-step tasks autonomously.
  The sessionsSpawn tool launches specialized agents (subprocesses) that autonomously handle complex tasks. Each agent type has specific capabilities and tools available to it.

  Available agents are listed in agent-reminder messages in the conversation.

  When to Use
    Use this tool proactively whenever:
    - The user explicitly asks to use an agent
    - A task is complex enough that it would benefit from parallel work by multiple agents
    (e.g., building a full-stack feature with frontend and backend work, refactoring
  a codebase while keeping tests passing, implementing a multi-step project with
  research, planning, and coding phases)

  Usage notes:
    - Always include a short description (3-5 words) summarizing what the agent will do
    - Launch multiple agents concurrently whenever possible, to maximize performance;
      to do that, use a single message with multiple tool uses
    - You can optionally run agents in the background using the background parameter.
      When an agent runs in the background, you will be automatically notified when it
      completes — do NOT sleep, poll, or proactively check on its progress. Continue with
      other work or respond to the user instead.
    - When the agent is done, it will return a single message back to you
    - The result returned by the agent is not visible to the user
    - You should send a text message back to the user with a concise summary

  Foreground vs background:
    - Use foreground (default) when you need the agent's results before you can proceed
      - e.g., research agents whose findings inform your next steps
    - Use background when you have genuinely independent work to do in parallel

  Continuing agents:
    - To continue a previously spawned agent, use sessionsSpawn tool again with the same agent name and sessionId.
      The agent resumes with its full context preserved.
    - Each Agent invocation starts fresh — provide a complete task description.

  Providing clear prompts:
    - Provide clear, detailed prompts so the agent can work autonomously and return
      exactly the information you need.
    - Clearly tell the agent whether you expect it to write code or just do research
      (search, file reads, web fetches, etc.), since it is not aware of the user's intent

  Trusting results:
    - The agent's outputs should generally be trusted

  Proactive usage:
    - If the agent description mentions that it should be used proactively, then try
      your best to use it without the user having to ask for it first. Use your judgement.
  `,
    parameters: z.object({
      name: z.string().min(1).describe('Target agent name'),
      title: z
        .string()
        .trim()
        .min(1)
        .describe('A short (3-5 word) description of the task'),
      task: z.string().min(1).describe('The task for the agent to perform'),
      sessionId: z
        .string()
        .min(1)
        .optional()
        .describe('Reuse an existing child session'),
      background: z
        .boolean()
        .default(false)
        .describe(
          'Set to true to run the agent in the background. You will be notified when it completes.',
        ),
    }),
  })
  async sessionsSpawn(
    args: {
      name: string;
      title: string;
      task: string;
      sessionId?: string;
      background: boolean;
    },
    options: ToolExecuteOptions,
  ) {
    return this.sessionToolsService.spawnSession({ ...args, options });
  }

  @Tool({
    name: 'sessionStatus',
    description: 'Show whether a session is currently running or idle.',
    parameters: z.object({
      sessionId: z.string().trim().min(1),
    }),
  })
  async sessionStatus(
    args: { sessionId: string },
    options: ToolExecuteOptions,
  ) {
    return this.sessionToolsService.getSessionStatus({ ...args, options });
  }

  @Tool({
    name: 'killSession',
    description: 'Terminate a running session by sessionId.',
    parameters: z.object({
      sessionId: z.string().min(1),
    }),
  })
  killSession(args: { sessionId: string }) {
    return this.sessionToolsService.killSession(args.sessionId);
  }
}
