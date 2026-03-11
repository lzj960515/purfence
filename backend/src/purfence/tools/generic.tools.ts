import { Tool } from '@app/my-agent';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { GenericToolsService } from './generic-tools.service';

const readResultSchema = z.object({
  kind: z.enum(['file', 'directory']),
  path: z.string(),
  cwd: z.string(),
  content: z.string(),
  offset: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalLines: z.number().int().min(0),
  truncated: z.boolean(),
  nextOffset: z.number().int().min(1).nullable(),
});

const writeResultSchema = z.object({
  path: z.string(),
  cwd: z.string(),
  bytesWritten: z.number().int().min(0),
  linesWritten: z.number().int().min(0),
});

const editResultSchema = z.object({
  path: z.string(),
  cwd: z.string(),
  occurrencesFound: z.number().int().min(0),
  occurrencesReplaced: z.number().int().min(0),
  firstChangedLine: z.number().int().min(1).nullable(),
  bytesWritten: z.number().int().min(0),
});

const processResultSchema = z.object({
  status: z.enum(['running', 'completed', 'failed', 'killed']),
  sessionId: z.string(),
  command: z.string().optional(),
  cwd: z.string().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  pid: z.number().int().nullable().optional(),
  exitCode: z.number().int().nullable().optional(),
  exitSignal: z.string().nullable().optional(),
  output: z.string().optional(),
  truncated: z.boolean().optional(),
  waitMs: z.number().int().min(0).optional(),
});

@Injectable()
export class GenericTools {
  constructor(private readonly genericToolsService: GenericToolsService) {}

  @Tool({
    name: 'read',
    description:
      'Read a text file or directory. Relative paths resolve from the current server process directory or the provided cwd.',
    parameters: z.object({
      path: z.string().min(1).describe('File or directory path'),
      cwd: z
        .string()
        .min(1)
        .optional()
        .describe('Optional working directory used to resolve relative paths'),
      offset: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe('1-based line offset for pagination'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(2000)
        .optional()
        .describe('Maximum number of lines to return (default 200)'),
    }),
    outputSchema: readResultSchema,
  })
  async read(args: {
    path: string;
    cwd?: string;
    offset?: number;
    limit?: number;
  }) {
    return this.genericToolsService.readText({
      filePath: args.path,
      cwd: args.cwd,
      offset: args.offset,
      limit: args.limit,
    });
  }

  @Tool({
    name: 'write',
    description:
      'Create or overwrite a UTF-8 text file. Parent directories are created automatically.',
    parameters: z.object({
      path: z.string().min(1).describe('File path'),
      cwd: z
        .string()
        .min(1)
        .optional()
        .describe('Optional working directory used to resolve relative paths'),
      content: z.string().describe('Full UTF-8 file content to write'),
    }),
    outputSchema: writeResultSchema,
  })
  async write(args: { path: string; cwd?: string; content: string }) {
    return this.genericToolsService.writeText({
      filePath: args.path,
      cwd: args.cwd,
      content: args.content,
    });
  }

  @Tool({
    name: 'edit',
    description:
      'Replace exact text inside a UTF-8 file. By default the old text must match exactly once; use replaceAll or expectedOccurrences for explicit multi-match edits.',
    parameters: z.object({
      path: z.string().min(1).describe('File path'),
      cwd: z
        .string()
        .min(1)
        .optional()
        .describe('Optional working directory used to resolve relative paths'),
      oldText: z.string().min(1).describe('Exact text to replace'),
      newText: z.string().describe('Replacement text'),
      replaceAll: z
        .boolean()
        .optional()
        .describe(
          'Replace every match instead of requiring a single exact match',
        ),
      expectedOccurrences: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
          'Safety check: require an exact number of matches before writing',
        ),
    }),
    outputSchema: editResultSchema,
  })
  async edit(args: {
    path: string;
    cwd?: string;
    oldText: string;
    newText: string;
    replaceAll?: boolean;
    expectedOccurrences?: number;
  }) {
    return this.genericToolsService.editText({
      filePath: args.path,
      cwd: args.cwd,
      oldText: args.oldText,
      newText: args.newText,
      replaceAll: args.replaceAll,
      expectedOccurrences: args.expectedOccurrences,
    });
  }

  @Tool({
    name: 'exec',
    description:
      'Run a shell command. The command can complete in the foreground or continue in the background and be managed with the process tool.',
    parameters: z.object({
      command: z.string().min(1).describe('Shell command to execute'),
      cwd: z
        .string()
        .min(1)
        .optional()
        .describe('Optional working directory used to run the command'),
      env: z
        .record(z.string(), z.string())
        .optional()
        .describe(
          'Optional environment variable overrides (PATH override is not allowed)',
        ),
      background: z
        .boolean()
        .optional()
        .describe(
          'Return immediately and manage the process with the process tool',
        ),
      yieldMs: z
        .number()
        .int()
        .min(10)
        .max(120000)
        .optional()
        .describe(
          'Wait this long before backgrounding if the command is still running',
        ),
      timeoutMs: z
        .number()
        .int()
        .min(1)
        .max(7200000)
        .optional()
        .describe('Maximum runtime before the command is terminated'),
    }),
    outputSchema: processResultSchema,
  })
  async exec(args: {
    command: string;
    cwd?: string;
    env?: Record<string, string>;
    background?: boolean;
    yieldMs?: number;
    timeoutMs?: number;
  }) {
    return this.genericToolsService.exec({
      command: args.command,
      cwd: args.cwd,
      env: args.env,
      background: args.background,
      yieldMs: args.yieldMs,
      timeoutMs: args.timeoutMs,
    });
  }

  @Tool({
    name: 'process',
    description:
      'Manage background exec sessions: list, poll, read logs, write to stdin, stop, or remove finished session records.',
    parameters: z.object({
      action: z.enum(['list', 'poll', 'log', 'write', 'kill', 'remove']),
      sessionId: z
        .string()
        .min(1)
        .optional()
        .describe('Required for every action except list'),
      waitMs: z
        .number()
        .int()
        .min(0)
        .max(120000)
        .optional()
        .describe(
          'For poll: wait for fresh output or exit up to this many milliseconds',
        ),
      offset: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe('For log: 1-based line offset'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(2000)
        .optional()
        .describe('For log: max lines to return'),
      data: z.string().optional().describe('For write: data to send to stdin'),
      eof: z
        .boolean()
        .optional()
        .describe('For write: close stdin after writing'),
    }),
  })
  async process(args: {
    action: 'list' | 'poll' | 'log' | 'write' | 'kill' | 'remove';
    sessionId?: string;
    waitMs?: number;
    offset?: number;
    limit?: number;
    data?: string;
    eof?: boolean;
  }) {
    switch (args.action) {
      case 'list':
        return this.genericToolsService.listProcesses();
      case 'poll':
        if (!args.sessionId) throw new Error('sessionId is required for poll');
        return this.genericToolsService.pollProcess({
          sessionId: args.sessionId,
          waitMs: args.waitMs,
        });
      case 'log':
        if (!args.sessionId) throw new Error('sessionId is required for log');
        return this.genericToolsService.readProcessLog({
          sessionId: args.sessionId,
          offset: args.offset,
          limit: args.limit,
        });
      case 'write':
        if (!args.sessionId) throw new Error('sessionId is required for write');
        if (args.data === undefined)
          throw new Error('data is required for write');
        return this.genericToolsService.writeProcessInput({
          sessionId: args.sessionId,
          data: args.data,
          eof: args.eof,
        });
      case 'kill':
        if (!args.sessionId) throw new Error('sessionId is required for kill');
        return this.genericToolsService.killProcess(args.sessionId);
      case 'remove':
        if (!args.sessionId)
          throw new Error('sessionId is required for remove');
        return this.genericToolsService.removeProcess(args.sessionId);
    }
  }
}
