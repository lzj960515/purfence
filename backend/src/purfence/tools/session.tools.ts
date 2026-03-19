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
    description:
      'Create or resume an agent conversation and run its initial task either synchronously or in the background.',
    parameters: z.object({
      agentId: z.string().min(1).describe('Target agent ID'),
      title: z
        .string()
        .trim()
        .min(1)
        .describe('A short (3-5 word) description of the task'),
      task: z
        .string()
        .min(1)
        .describe('Initial task/message for the spawned agent'),
      sessionId: z
        .string()
        .min(1)
        .optional()
        .describe('Reuse an existing child session'),
      background: z
        .boolean()
        .default(false)
        .describe(
          'Run in the background instead of waiting for the full text reply',
        ),
    }),
  })
  async sessionsSpawn(
    args: {
      agentId: string;
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
