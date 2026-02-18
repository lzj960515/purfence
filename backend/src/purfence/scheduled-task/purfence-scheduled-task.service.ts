import { MyUtil } from '@app/shared';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CronJob } from 'cron';
import { PurfenceScheduledTaskCreateInput } from './purfence-scheduled-task-create.input';
import { PurfenceScheduledTaskUpdateInput } from './purfence-scheduled-task-update.input';
import { PurfenceScheduledTask } from './purfence-scheduled-task.entity';
import {
  PurfenceScheduledTaskKind,
  PurfenceScheduledTaskLastStatus,
} from './purfence-scheduled-task.enum';
import { PurfenceAgentService } from '../agent.service';

type ScheduledHandle =
  | { type: 'cron'; handle: CronJob }
  | { type: 'timeout'; handle: NodeJS.Timeout };

@Injectable()
export class PurfenceScheduledTaskService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PurfenceScheduledTaskService.name);
  private readonly handles = new Map<string, ScheduledHandle>();
  private readonly runningTaskIds = new Set<string>();

  constructor(
    private readonly purfenceAgentService: PurfenceAgentService,
  ) {}

  async onModuleInit() {
    await this.reloadEnabledTasks();
  }

  async onModuleDestroy() {
    this.clearAllHandles();
  }

  async createTask(input: PurfenceScheduledTaskCreateInput) {
    const payload = this.normalizeInput(input);

    const task = PurfenceScheduledTask.create({
      ...payload,
      enabled: input.enabled ?? true,
      nextRunAt:
        payload.kind === PurfenceScheduledTaskKind.one_time ? payload.runAt : undefined,
    });
    await task.save();

    if (task.enabled) {
      await this.registerTask(task);
    }

    return task;
  }

  async updateTask(id: string, update: PurfenceScheduledTaskUpdateInput) {
    const task = await PurfenceScheduledTask.findOneOrFail({ where: { id } });
    const merged = this.normalizeInput({
      name: update.name ?? task.name,
      prompt: update.prompt ?? task.prompt,
      kind: update.kind ?? task.kind,
      cronExpr: update.cronExpr ?? task.cronExpr,
      runAt:
        update.runAt === undefined
          ? task.runAt?.toISOString()
          : update.runAt,
      enabled: update.enabled ?? task.enabled,
      slackAppConfigId: update.slackAppConfigId ?? task.slackAppConfigId,
      slackChannelId: update.slackChannelId ?? task.slackChannelId,
    });

    task.name = merged.name;
    task.prompt = merged.prompt;
    task.kind = merged.kind;
    task.cronExpr = merged.cronExpr;
    task.runAt = merged.runAt;
    task.enabled = update.enabled ?? task.enabled;
    task.slackAppConfigId = merged.slackAppConfigId;
    task.slackChannelId = merged.slackChannelId;
    task.nextRunAt =
      task.enabled && task.kind === PurfenceScheduledTaskKind.one_time
        ? task.runAt
        : undefined;

    await task.save();

    this.clearHandle(task.id);
    if (task.enabled) {
      await this.registerTask(task);
    }

    return task;
  }

  async deleteTask(id: string) {
    this.clearHandle(id);
    await PurfenceScheduledTask.delete({ id });
    return id;
  }

  async runTaskNow(id: string) {
    return this.executeTask(id, 'manual');
  }

  async reloadEnabledTasks() {
    const tasks = await PurfenceScheduledTask.find({ where: { enabled: true } });
    for (const task of tasks) {
      await this.registerTask(task);
    }
  }

  private async registerTask(task: PurfenceScheduledTask) {
    if (task.kind === PurfenceScheduledTaskKind.recurring) {
      const timezone = this.getSystemTimeZone();
      const job = new CronJob(
        task.cronExpr!,
        () => {
          void this.executeTask(task.id, 'scheduled');
        },
        null,
        true,
        timezone,
      );

      const nextRunAt = this.toDate(job.nextDate());
      await PurfenceScheduledTask.update(task.id, { nextRunAt });
      this.handles.set(task.id, { type: 'cron', handle: job });
      return;
    }

    if (!task.runAt) {
      return;
    }

    const delayMs = task.runAt.getTime() - Date.now();
    if (delayMs <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      void this.executeTask(task.id, 'scheduled');
    }, delayMs);

    this.handles.set(task.id, { type: 'timeout', handle: timeout });
  }

  private clearHandle(taskId: string) {
    const handle = this.handles.get(taskId);
    if (!handle) return;

    if (handle.type === 'cron') {
      handle.handle.stop();
    } else {
      clearTimeout(handle.handle);
    }

    this.handles.delete(taskId);
  }

  private clearAllHandles() {
    for (const taskId of this.handles.keys()) {
      this.clearHandle(taskId);
    }
  }

  private async executeTask(
    taskId: string,
    trigger: 'scheduled' | 'manual',
  ) {
    if (this.runningTaskIds.has(taskId)) {
      this.logger.warn(`Scheduled task is already running: ${taskId}`);
      return null;
    }

    this.runningTaskIds.add(taskId);
    const threadId = MyUtil.uuid();

    try {
      const task = await PurfenceScheduledTask.findOneOrFail({
        where: { id: taskId },
      });

      if (!task.enabled && trigger !== 'manual') {
        return null;
      }

      await this.purfenceAgentService.streamTianxiang({
        threadId,
        query: task.prompt,
        context: this.buildStreamContext(task, trigger),
      });

      const now = new Date();
      const nextRunAt =
        task.kind === PurfenceScheduledTaskKind.one_time
          ? undefined
          : this.computeNextRecurringRunAt(task.cronExpr);
      await PurfenceScheduledTask.update(task.id, {
        runCount: task.runCount + 1,
        lastRunAt: now,
        lastStatus: PurfenceScheduledTaskLastStatus.success,
        lastError: undefined,
        nextRunAt,
        enabled:
          task.kind === PurfenceScheduledTaskKind.one_time ? false : task.enabled,
      });

      if (task.kind === PurfenceScheduledTaskKind.one_time) {
        this.clearHandle(task.id);
      }

      return threadId;
    } catch (error) {
      const task = await PurfenceScheduledTask.findOne({ where: { id: taskId } });
      if (task) {
        const now = new Date();
        const nextRunAt =
          task.kind === PurfenceScheduledTaskKind.one_time
            ? undefined
            : this.computeNextRecurringRunAt(task.cronExpr);
        await PurfenceScheduledTask.update(task.id, {
          runCount: task.runCount + 1,
          lastRunAt: now,
          lastStatus: PurfenceScheduledTaskLastStatus.failed,
          lastError: error instanceof Error ? error.message : String(error),
          nextRunAt,
          enabled:
            task.kind === PurfenceScheduledTaskKind.one_time
              ? false
              : task.enabled,
        });
      }
      throw error;
    } finally {
      this.runningTaskIds.delete(taskId);
    }
  }

  private normalizeInput(input: {
    name: string;
    prompt: string;
    kind: PurfenceScheduledTaskKind;
    cronExpr?: string;
    runAt?: string;
    enabled?: boolean;
    slackAppConfigId?: string;
    slackChannelId?: string;
  }) {
    const name = input.name.trim();
    const prompt = input.prompt.trim();
    const slackAppConfigId = input.slackAppConfigId?.trim() || undefined;
    const slackChannelId = input.slackChannelId?.trim() || undefined;

    if (Boolean(slackAppConfigId) !== Boolean(slackChannelId)) {
      throw new Error(
        'slackAppConfigId and slackChannelId must be provided together',
      );
    }

    if (input.kind === PurfenceScheduledTaskKind.recurring) {
      const cronExpr = input.cronExpr?.trim();
      if (!cronExpr) {
        throw new Error('cronExpr is required for recurring task');
      }
      return {
        name,
        prompt,
        kind: input.kind,
        cronExpr,
        runAt: undefined,
        slackAppConfigId,
        slackChannelId,
      };
    }

    if (!input.runAt) {
      throw new Error('runAt is required for one-time task');
    }

    const runAt = new Date(input.runAt);
    if (Number.isNaN(runAt.getTime())) {
      throw new Error('runAt is invalid');
    }

    return {
      name,
      prompt,
      kind: input.kind,
      cronExpr: undefined,
      runAt,
      slackAppConfigId,
      slackChannelId,
    };
  }

  private buildStreamContext(
    task: Pick<PurfenceScheduledTask, 'id' | 'slackAppConfigId' | 'slackChannelId'>,
    trigger: 'scheduled' | 'manual',
  ) {
    const context: Record<string, unknown> = {
      trigger,
      scheduledTaskId: task.id,
    };

    if (task.slackAppConfigId && task.slackChannelId) {
      context.event = 'purfence.scheduled-task.stream-ended';
      context.slackAppConfigId = task.slackAppConfigId;
      context.slackChannelId = task.slackChannelId;
    }

    return context;
  }

  private computeNextRecurringRunAt(cronExpr?: string) {
    const job = new CronJob(
      cronExpr!,
      () => undefined,
      null,
      false,
      this.getSystemTimeZone(),
    );
    return this.toDate(job.nextDate());
  }

  private toDate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }
    if (
      value &&
      typeof value === 'object' &&
      'toJSDate' in value &&
      typeof (value as { toJSDate: () => Date }).toJSDate === 'function'
    ) {
      return (value as { toJSDate: () => Date }).toJSDate();
    }
    return new Date(value as string);
  }

  private getSystemTimeZone() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || 'UTC';
  }
}
