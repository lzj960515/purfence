import { Tool } from '@app/my-agent';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Like } from 'typeorm';
import { PurfenceScheduledTaskKind } from '../scheduled-task/purfence-scheduled-task.enum';
import { PurfenceScheduledTaskService } from '../scheduled-task/purfence-scheduled-task.service';
import { PurfenceIssueService } from '../purfence-issue.service';
import { PurfenceIssue } from '../purfence-issue.entity';
import { PurfenceProject } from '../purfence-project.entity';
import { PurfenceStatus } from '../purfence-status.enum';
import { AgentArtifact } from '../artifact/agent-artifact.ai.entity';
import { ToolExecuteOptions } from '@voltagent/core';
import {
  AgentArtifactFileType,
  AgentArtifactType,
} from '../artifact/agent-artifact-content.dto';

@Injectable()
export class PurfenceTools {
  constructor(
    private readonly issueService: PurfenceIssueService,
    private readonly scheduledTaskService: PurfenceScheduledTaskService,
  ) {}

  @Tool({
    name: 'createProject',
    description: `创建项目或导入现有本地项目（会在本地 projects 根目录初始化 repo）

注意：
- 导入项目（mode="import"）时，externalPath 参数必须使用绝对路径
- 不要使用相对路径（如 ~/project、../project）
- 路径必须指向实际存在的目录`,
    parameters: z
      .object({
        mode: z
          .enum(['create', 'import'])
          .describe('创建模式：create=新建项目；import=导入本地已有项目。'),
        name: z
          .string()
          .min(1)
          .max(128)
          .optional()
          .describe('项目名称（create 模式必填，import 模式可留空）'),
        slug: z
          .string()
          .min(1)
          .max(64)
          .regex(/^[a-z0-9-]+$/)
          .describe('项目英文标识（用于目录名，如 my-project）'),
        description: z.string().optional().describe('项目描述（可选）'),
        externalPath: z.string().min(1).optional()
          .describe(`本地已有项目的绝对路径（import 模式必填）。

⚠️ 必须使用绝对路径，格式要求：

macOS/Linux 示例：
- ✅ 正确：/Users/用户名/projects/my-project
- ❌ 错误：~/projects/my-project
- ❌ 错误：../my-project

Windows 示例：
- ✅ 正确：C:\\Users\\用户名\\projects\\my-project
- ✅ 正确：D:\\projects\\my-project
- ❌ 错误：~\\projects\\my-project
- ❌ 错误：..\\my-project

路径必须指向实际存在的目录。`),
        defaultBranch: z
          .string()
          .min(1)
          .max(32)
          .optional()
          .describe('默认主分支名（可选，默认 main）'),
      })
      .superRefine((value, ctx) => {
        const mode = value.mode;

        if (mode === 'create') {
          if (!value.name?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'name is required when mode=create',
              path: ['name'],
            });
          }

          if (value.externalPath) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'externalPath is only allowed when mode=import',
              path: ['externalPath'],
            });
          }
        }

        if (mode === 'import' && !value.externalPath?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'externalPath is required when mode=import',
            path: ['externalPath'],
          });
        }

        // 验证 import 模式的路径格式
        if (mode === 'import' && value.externalPath?.trim()) {
          const externalPath = value.externalPath.trim();

          // 检查是否包含 ~ 符号
          if (externalPath.includes('~')) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                '❌ 错误：请使用绝对路径，不要使用 ~ 符号。例如：/Users/用户名/project（macOS）或 C:\\Users\\用户名\\project（Windows）',
              path: ['externalPath'],
            });
          }

          // 检查是否是绝对路径（macOS/Linux 以 / 开头，Windows 以驱动器字母开头）
          const isAbsolute =
            externalPath.startsWith('/') || /^[A-Za-z]:/.test(externalPath);
          if (!isAbsolute) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                '❌ 错误：请使用绝对路径。例如：/Users/用户名/project（macOS）或 C:\\Users\\用户名\\project（Windows）',
              path: ['externalPath'],
            });
          }
        }
      }),
    outputSchema: z.object({
      id: z.string(),
      name: z.string().nullable(),
      slug: z.string(),
      description: z.string().nullable(),
      localRootPath: z.string(),
    }),
  })
  async createProject(args: {
    mode: 'create' | 'import';
    name?: string;
    slug: string;
    description?: string;
    externalPath?: string;
    defaultBranch?: string;
  }) {
    const mode = args.mode;

    const project = PurfenceProject.create({
      name: args.name,
      slug: args.slug,
      description: args.description,
      localRootPath: '',
      externalPath: mode === 'import' ? args.externalPath?.trim() : undefined,
      defaultBranch: args.defaultBranch,
    });
    await project.save();
    return {
      id: project.id,
      name: project.name ?? null,
      slug: project.slug,
      description: project.description ?? null,
      localRootPath: project.localRootPath,
    };
  }

  @Tool({
    name: 'searchProjects',
    description: '搜索/列出项目，用于选择 projectId',
    parameters: z.object({
      query: z.string().optional().describe('按名称/描述模糊搜索'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe('返回数量（1-50）'),
    }),
    outputSchema: z.object({
      items: z.array(
        z.object({
          id: z.string(),
          name: z.string().nullable(),
          description: z.string().nullable(),
          localRootPath: z.string(),
        }),
      ),
    }),
  })
  async searchProjects(args: { query?: string; limit?: number }) {
    const limit = Math.min(args.limit ?? 20, 50);
    const query = args.query?.trim();

    const where = query
      ? [{ name: Like(`%${query}%`) }, { description: Like(`%${query}%`) }]
      : undefined;

    const projects = await PurfenceProject.find({
      where,
      take: limit,
      order: { updatedAt: 'DESC' },
    });

    return {
      items: projects.map((p) => ({
        id: p.id,
        name: p.name ?? null,
        description: p.description ?? null,
        localRootPath: p.localRootPath,
      })),
    };
  }

  @Tool({
    name: 'updateProject',
    description: `更新项目信息（名称、描述、Slack 配置）

Slack 配置说明：
- slackAppConfigId: Slack App 配置 ID（从 PurfenceAppConfig 中获取）
- slackChannelId: Slack 频道 ID
- 两个参数必须同时提供或同时为空
- 配置后，Issue 完成时会自动发送通知到指定 Slack 频道`,
    parameters: z
      .object({
        projectId: z.string().min(1).describe('项目 ID'),
        name: z.string().min(1).max(128).optional().describe('项目名称'),
        description: z.string().optional().describe('项目描述'),
        slackAppConfigId: z
          .string()
          .optional()
          .describe('Slack App 配置 ID（用于发送通知）'),
        slackChannelId: z.string().optional().describe('Slack 频道 ID'),
      })
      .superRefine((value, ctx) => {
        const hasAppId = value.slackAppConfigId?.trim();
        const hasChannelId = value.slackChannelId?.trim();

        if (hasAppId && !hasChannelId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'slackChannelId is required when slackAppConfigId is provided',
            path: ['slackChannelId'],
          });
        }

        if (!hasAppId && hasChannelId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'slackAppConfigId is required when slackChannelId is provided',
            path: ['slackAppConfigId'],
          });
        }
      }),
    outputSchema: z.object({
      id: z.string(),
      name: z.string().nullable(),
      description: z.string().nullable(),
      slackAppConfigId: z.string().nullable(),
      slackChannelId: z.string().nullable(),
    }),
  })
  async updateProject(args: {
    projectId: string;
    name?: string;
    description?: string;
    slackAppConfigId?: string;
    slackChannelId?: string;
  }) {
    const project = await PurfenceProject.findOneOrFail({
      where: { id: args.projectId },
    });

    if (args.name !== undefined) {
      project.name = args.name;
    }
    if (args.description !== undefined) {
      project.description = args.description;
    }

    // 更新 Slack 配置（允许设置为空来清除）
    if (args.slackAppConfigId !== undefined) {
      project.slackAppConfigId = args.slackAppConfigId?.trim() || undefined;
    }
    if (args.slackChannelId !== undefined) {
      project.slackChannelId = args.slackChannelId?.trim() || undefined;
    }

    await project.save();

    return {
      id: project.id,
      name: project.name ?? null,
      description: project.description ?? null,
      slackAppConfigId: project.slackAppConfigId ?? null,
      slackChannelId: project.slackChannelId ?? null,
    };
  }

  @Tool({
    name: 'createIssue',
    description: '在指定项目下创建需求',
    parameters: z.object({
      projectId: z.string().min(1).describe('项目 ID'),
      title: z.string().min(1).max(256).describe('需求标题'),
      slug: z
        .string()
        .min(1)
        .max(48)
        .regex(/^[a-z0-9-]+$/)
        .describe('需求英文标识（用于目录名，如 feature-login）'),
      description: z.string().min(1).describe('需求描述'),
    }),
    outputSchema: z.object({
      id: z.string(),
      projectId: z.string(),
      title: z.string(),
      slug: z.string().nullable(),
      status: z.nativeEnum(PurfenceStatus),
      latestExecutionId: z.string().nullable(),
    }),
  })
  async createIssue(args: {
    projectId: string;
    title: string;
    slug: string;
    description: string;
  }) {
    const issue = await this.issueService.createIssue(args);
    return {
      id: issue.id,
      projectId: issue.projectId,
      title: issue.title,
      slug: issue.slug ?? null,
      status: issue.status,
      latestExecutionId: issue.latestExecutionId ?? null,
    };
  }

  @Tool({
    name: 'startIssue',
    description: '启动指定需求，创建并开始新的执行流程',
    parameters: z.object({
      issueId: z.string().min(1).describe('需求 ID'),
    }),
    outputSchema: z.object({
      issueId: z.string(),
      executionId: z.string(),
    }),
  })
  async startIssue(args: { issueId: string }) {
    const execution = await this.issueService.startIssue(args.issueId);
    return {
      issueId: args.issueId,
      executionId: execution.id,
    };
  }

  @Tool({
    name: 'searchIssues',
    description: '搜索/列出需求，用于选择 issueId（可按项目过滤）',
    parameters: z.object({
      projectId: z.string().optional().describe('按项目过滤'),
      query: z.string().optional().describe('按标题/描述模糊搜索'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe('返回数量（1-50）'),
    }),
    outputSchema: z.object({
      items: z.array(
        z.object({
          id: z.string(),
          projectId: z.string(),
          title: z.string(),
          status: z.nativeEnum(PurfenceStatus),
          latestExecutionId: z.string().nullable(),
        }),
      ),
    }),
  })
  async searchIssues(args: {
    projectId?: string;
    query?: string;
    limit?: number;
  }) {
    const limit = Math.min(args.limit ?? 20, 50);
    const query = args.query?.trim();

    const base = args.projectId ? { projectId: args.projectId } : {};
    const where = query
      ? [
          { ...base, title: Like(`%${query}%`) },
          { ...base, description: Like(`%${query}%`) },
        ]
      : base;

    const issues = await PurfenceIssue.find({
      where: where as any,
      take: limit,
      order: { updatedAt: 'DESC' },
    });

    return {
      items: issues.map((i) => ({
        id: i.id,
        projectId: i.projectId,
        title: i.title,
        status: i.status,
        latestExecutionId: i.latestExecutionId ?? null,
      })),
    };
  }

  @Tool({
    name: 'renderArtifacts',
    description:
      'Use this tool to present files/artifacts (images, pdf, docx, xlsx) directly in UI. Whenever your work involves showing a file to the user, call this tool instead of only describing file paths in text, so the conversation renders rich file cards/preview.',
    parameters: z.object({
      files: z
        .array(
          z.object({
            path: z.string(),
            type: z.enum(['image', 'pdf', 'docx', 'xlsx']),
          }),
        )
        .describe('文件路径列表'),
    }),
  })
  async renderArtifacts(
    args: {
      files: { path: string; type: 'image' | 'pdf' | 'docx' | 'xlsx' }[];
    },
    options: ToolExecuteOptions,
  ) {
    let imageCount = 0;
    let fileCount = 0;

    for (const file of args.files) {
      if (file.type === 'image') {
        imageCount += 1;
        await AgentArtifact.createWithContext(options, {
          type: AgentArtifactType.IMAGE,
          url: file.path,
        }).save();
      } else {
        fileCount += 1;
        await AgentArtifact.createWithContext(options, {
          type: AgentArtifactType.FILE,
          fileType:
            file.type === 'pdf'
              ? AgentArtifactFileType.PDF
              : file.type === 'docx'
                ? AgentArtifactFileType.DOCX
                : AgentArtifactFileType.XLSX,
          fileUrl: file.path,
          filename: file.path,
        }).save();
      }
    }

    return `已向用户展示 ${args.files.length} 个文件（图片 ${imageCount}，文档 ${fileCount}）。请不要在后续消息中重复罗列文件路径。`;
  }

  @Tool({
    name: 'createScheduledTask',
    description: `创建定时任务。支持 one_time（绝对执行时间 runAt）和 recurring（cronExpr）两种模式。任务触发时会自动发起一个新的 AI 对话并发送 prompt。

Slack 通知配置（可选）：
- slackAppConfigId: Slack App 配置 ID（用于发送通知）
- slackChannelId: Slack 频道 ID
- 两个参数必须同时提供或同时为空
- 如果不提供，会从上下文获取（向后兼容）
- 提供参数会覆盖上下文的值`,
    parameters: z
      .object({
        name: z.string().min(1).max(256).describe('任务名称'),
        prompt: z.string().min(1).describe('到点后发送给 AI 的提示词'),
        kind: z
          .enum(['one_time', 'recurring'])
          .describe('one_time=一次性任务；recurring=周期任务'),
        runAt: z
          .string()
          .optional()
          .describe(
            '一次性任务的绝对执行时间，推荐 ISO8601（kind=one_time 必填）',
          ),
        cronExpr: z
          .string()
          .optional()
          .describe('Cron 表达式（kind=recurring 必填，支持 5/6 段）'),
        slackAppConfigId: z
          .string()
          .optional()
          .describe('Slack App 配置 ID（可选，不提供则从上下文获取）'),
        slackChannelId: z
          .string()
          .optional()
          .describe('Slack 频道 ID（可选，不提供则从上下文获取）'),
      })
      .superRefine((value, ctx) => {
        const hasAppId = value.slackAppConfigId?.trim();
        const hasChannelId = value.slackChannelId?.trim();

        if (hasAppId && !hasChannelId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'slackChannelId is required when slackAppConfigId is provided',
            path: ['slackChannelId'],
          });
        }

        if (!hasAppId && hasChannelId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'slackAppConfigId is required when slackChannelId is provided',
            path: ['slackAppConfigId'],
          });
        }
      }),
    outputSchema: z.object({
      id: z.string(),
      name: z.string(),
      nextRunAt: z.string().nullable(),
      kind: z.enum(['one_time', 'recurring']),
    }),
  })
  async createScheduledTask(
    args: {
      name: string;
      prompt: string;
      kind: 'one_time' | 'recurring';
      runAt?: string;
      cronExpr?: string;
      slackAppConfigId?: string;
      slackChannelId?: string;
    },
    options: ToolExecuteOptions,
  ) {
    // 参数优先级：传入参数 > 上下文
    const slackAppConfigId =
      args.slackAppConfigId ??
      (options.context.get('slackAppConfigId') as string);
    const slackChannelId =
      args.slackChannelId ?? (options.context.get('slackChannelId') as string);

    if (args.kind === 'one_time') {
      if (!args.runAt?.trim()) {
        throw new Error('runAt is required when kind=one_time');
      }

      const task = await this.scheduledTaskService.createTask({
        name: args.name,
        prompt: args.prompt,
        kind: PurfenceScheduledTaskKind.one_time,
        runAt: args.runAt,
        enabled: true,
        slackAppConfigId,
        slackChannelId,
      });

      return {
        id: task.id,
        name: task.name,
        nextRunAt: task.nextRunAt ? task.nextRunAt.toISOString() : null,
        kind: args.kind,
      };
    }

    if (!args.cronExpr?.trim()) {
      throw new Error('cronExpr is required when kind=recurring');
    }

    const task = await this.scheduledTaskService.createTask({
      name: args.name,
      prompt: args.prompt,
      kind: PurfenceScheduledTaskKind.recurring,
      cronExpr: args.cronExpr,
      enabled: true,
      slackAppConfigId,
      slackChannelId,
    });

    return {
      id: task.id,
      name: task.name,
      nextRunAt: task.nextRunAt ? task.nextRunAt.toISOString() : null,
      kind: args.kind,
    };
  }

  @Tool({
    name: 'getCurrentTime',
    description:
      '获取当前本机时间与时区。用于把“30分钟后”这类自然语言转换成绝对时间 runAt。',
    parameters: z.object({}),
    outputSchema: z.object({
      nowIso: z.string(),
      nowLocal: z.string(),
      timeZone: z.string(),
      unixMs: z.number(),
    }),
  })
  getCurrentTime() {
    const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    return {
      nowIso: now.toISOString(),
      nowLocal: now.toLocaleString(),
      timeZone,
      unixMs: now.getTime(),
    };
  }
}
