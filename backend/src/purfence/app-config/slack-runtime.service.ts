import { SocketService } from '@app/my-agent/socket.service';
import { MessageService } from '@app/my-agent';
import { Log } from '@nest-mods/log';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { App } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { AgentArtifactContent } from '../artifact/agent-artifact-content.dto';
import { PurfenceAgentService } from '../agent.service';
import { PurfenceAppConfigService } from './purfence-app-config.service';
import { PurfenceSlackService } from './purfence-slack.service';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

type SlackMessageEvent = {
  type: 'message';
  channel: string;
  ts: string;
  text?: string;
  subtype?: string;
  bot_id?: string;
  channel_type?: string;
  user?: string;
  thread_ts?: string;
};

type StreamPayload = {
  id?: string;
  message?: string;
  type?: string;
  content?: unknown;
  toolName?: string;
  status?: string;
  artifact?: Array<{ content?: AgentArtifactContent }>;
};

type ScheduledTaskStreamEndedEvent = {
  conversationId?: string;
  slackAppConfigId?: string;
  slackChannelId?: string;
};

type IssueCompletedStreamEndedEvent = {
  conversationId?: string;
  issueId?: string;
  projectId?: string;
  slackAppConfigId?: string;
  slackChannelId?: string;
};

function isSlackMessageEvent(event: unknown): event is SlackMessageEvent {
  if (!isRecord(event)) return false;
  if (event.type !== 'message') return false;
  return typeof event.channel === 'string' && typeof event.ts === 'string';
}

/**
 * Type definition for Slack block elements
 * Using a relaxed type to support custom block types like 'task_card' and 'markdown'
 * that are not in the standard @slack/types package
 */
type SlackBlock = {
  type: string;
  [key: string]: unknown;
};

type SlackSession = {
  app: App;
  channel: string;
  threadTs: string;
  currentType: string;
  markdownBuffer: string;
  taskMessageTs: Map<string, string>;
  createdAt: number;
};

@Injectable()
export class SlackRuntimeService implements OnModuleInit, OnModuleDestroy {
  @Log() private readonly logger: Logger;

  /**
   * Maximum number of concurrent sessions to prevent memory exhaustion
   */
  private readonly MAX_CONCURRENT_SESSIONS = 10;

  /**
   * Session timeout in milliseconds (5 minutes)
   * Sessions older than this will be cleaned up
   */
  private readonly SESSION_TIMEOUT_MS = 5 * 60 * 1000;

  private app: App | null = null;
  private reloadChain: Promise<void> = Promise.resolve();
  private activeSessions = new Map<string, SlackSession>();

  constructor(
    private readonly appConfigService: PurfenceAppConfigService,
    private readonly purfenceAgentService: PurfenceAgentService,
    private readonly messageService: MessageService,
    private readonly purfenceSlackService: PurfenceSlackService,
  ) {}

  async onModuleInit() {
    await this.reload();
  }

  async onModuleDestroy() {
    await this.stop();
  }

  /**
   * Cleans up sessions that have exceeded the timeout limit.
   * This prevents orphaned sessions from accumulating and causing memory leaks.
   */
  private cleanupTimedOutSessions(): void {
    const now = Date.now();
    const timedOutSessionIds: string[] = [];

    for (const [conversationId, session] of this.activeSessions) {
      if (now - session.createdAt > this.SESSION_TIMEOUT_MS) {
        timedOutSessionIds.push(conversationId);
      }
    }

    for (const conversationId of timedOutSessionIds) {
      this.activeSessions.delete(conversationId);
      this.logger.warn(
        `Cleaned up timed-out session: conversationId=${conversationId}`,
      );

      // Attempt to unregister the stream mirror, but don't wait for it
      SocketService.unregisterStreamMirror(conversationId).catch((error) => {
        this.logger.error(
          `Failed to unregister stream mirror for timed-out session ${conversationId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    }

    if (timedOutSessionIds.length > 0) {
      this.logger.log(
        `Cleaned up ${timedOutSessionIds.length} timed-out session(s)`,
      );
    }
  }

  @OnEvent('purfence.app-config.changed')
  onAppConfigChanged() {
    this.requestReload();
  }

  @OnEvent('purfence.scheduled-task.stream-ended')
  @OnEvent('purfence.evaluation.stream-ended')
  async onScheduledTaskStreamEnded(payload: ScheduledTaskStreamEndedEvent) {
    const conversationId = payload.conversationId?.trim();
    const slackAppConfigId = payload.slackAppConfigId?.trim();
    const slackChannelId = payload.slackChannelId?.trim();

    this.logger.log(
      `Handling stream-ended event: conversationId=${conversationId}, channelId=${slackChannelId ? '[REDACTED]' : 'undefined'}`,
    );

    if (!conversationId || !slackAppConfigId || !slackChannelId) {
      this.logger.debug('Missing required Slack notification fields, skipping');
      return;
    }

    try {
      const config =
        await this.appConfigService.getSlackRuntimeConfigById(slackAppConfigId);
      if (!config) {
        this.logger.warn(`Slack config not found: ${slackAppConfigId}`);
        return;
      }

      const finalText = await this.messageService.latestTextMessage(
        'purfence',
        conversationId,
      );
      if (!finalText) {
        this.logger.warn(`No final message found for conversation: ${conversationId}`);
        return;
      }

      await this.postMarkdownByToken(config.botToken, slackChannelId, finalText);
      this.logger.log(`Slack notification sent successfully to channel`);
    } catch (error) {
      this.logger.error(
        `Failed to send Slack notification: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent('purfence.issue-completed.stream-ended')
  async onIssueCompletedStreamEnded(payload: IssueCompletedStreamEndedEvent) {
    const conversationId = payload.conversationId?.trim();
    const issueId = payload.issueId?.trim();
    const slackAppConfigId = payload.slackAppConfigId?.trim();
    const slackChannelId = payload.slackChannelId?.trim();

    this.logger.log(
      `Handling issue-completed event: issueId=${issueId}, conversationId=${conversationId}`,
    );

    if (!conversationId || !slackAppConfigId || !slackChannelId) {
      this.logger.debug('Missing required Slack notification fields, skipping');
      return;
    }

    try {
      const config =
        await this.appConfigService.getSlackRuntimeConfigById(slackAppConfigId);
      if (!config) {
        this.logger.warn(`Slack config not found: ${slackAppConfigId}`);
        return;
      }

      const finalText = await this.messageService.latestTextMessage(
        'purfence',
        conversationId,
      );
      if (!finalText) {
        this.logger.warn(`No final message found for conversation: ${conversationId}`);
        return;
      }

      // 添加 Issue 完成的格式化前缀
      const message = issueId
        ? `✅ *Issue 完成*\n\n${finalText}`
        : finalText;

      await this.postMarkdownByToken(config.botToken, slackChannelId, message);
      this.logger.log(`Issue completion Slack notification sent successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send Issue completion Slack notification: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  requestReload() {
    this.reloadChain = this.reloadChain
      .then(() => this.reload())
      .catch((error) => {
        this.logger.error(
          `Failed to reload Slack runtime: ${error.message}`,
          error.stack,
        );
      });
  }

  private async reload() {
    const config = await this.appConfigService.getSlackRuntimeConfig();
    if (!config) {
      await this.stop();
      return;
    }

    await this.start(
      config.botToken,
      config.appToken,
      config.providerName,
      config.appConfigId,
    );
  }

  private async start(
    botToken: string,
    appToken: string,
    providerName?: string,
    appConfigId?: string,
  ) {
    await this.stop();

    const app = new App({
      token: botToken,
      appToken,
      socketMode: true,
    });

    app.event('message', async ({ event }) => {
      if (!isSlackMessageEvent(event)) return;
      if (event.subtype) return;
      if (event.bot_id) return;
      if (event.channel_type !== 'im') return;

      const query = String(event.text || '').trim();
      if (!query) return;

      // Use message ts as conversationId and thread identifier
      const conversationId = event.ts;
      const threadTs = event.thread_ts ?? event.ts;

      // Check if this specific thread is already being processed
      if (this.activeSessions.has(conversationId)) {
        // This thread is already being processed, skip
        return;
      }

      // Clean up timed-out sessions before checking limit
      this.cleanupTimedOutSessions();

      // Check concurrent session limit
      if (this.activeSessions.size >= this.MAX_CONCURRENT_SESSIONS) {
        this.logger.warn(
          `Max concurrent sessions reached (${this.activeSessions.size}/${this.MAX_CONCURRENT_SESSIONS})`,
        );
        await this.postErrorBlock(
          app,
          event.channel,
          '当前并发会话过多，请稍后再试',
          threadTs,
        );
        return;
      }

      // Create new session with timestamp
      const session: SlackSession = {
        app,
        channel: event.channel,
        threadTs,
        currentType: '',
        markdownBuffer: '',
        taskMessageTs: new Map<string, string>(),
        createdAt: Date.now(),
      };
      this.activeSessions.set(conversationId, session);
      this.logger.log(`Created session: conversationId=${conversationId}, threadTs=${threadTs}`);

      // Send pre-reply in thread (non-critical, continue on failure)
      try {
        await app.client.chat.postMessage({
          channel: event.channel,
          text: '当前使用新会话中',
          thread_ts: threadTs,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send pre-reply: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Continue with processing - pre-reply is not critical
      }

      SocketService.registerStreamMirror(conversationId, {
        handle: async (streamEvent, payload) => {
          await this.handleMirrorEvent(conversationId, streamEvent, payload as StreamPayload);
        },
        close: async () => this.closeMirror(conversationId),
      });
      try {
        await this.purfenceAgentService.streamZiwei({
          threadId: conversationId,
          query,
          providerName,
          userId: event.user,
          context: {
            channel: 'slack',
            trigger: 'slack_dm',
            slackChannelId: event.channel,
            slackUserId: event.user,
            slackThreadTs: threadTs,
            slackAppConfigId: appConfigId,
          },
        });
      } catch (error) {
        await this.flushCurrentBlock(conversationId);
        await this.postErrorBlock(
          app,
          event.channel,
          error instanceof Error ? error.message : String(error),
          threadTs,
        );
        this.activeSessions.delete(conversationId);
        this.logger.log(`Removed session due to error: conversationId=${conversationId}`);

        // Safely unregister stream mirror with proper error handling
        try {
          await SocketService.unregisterStreamMirror(conversationId);
        } catch (cleanupError) {
          this.logger.error(
            `Failed to unregister stream mirror: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
          );
        }
      }
    });

    await app.start();
    this.app = app;
    this.logger.log('Slack Socket Mode started');
  }

  private async stop() {
    if (!this.app) return;
    await this.app.stop();
    this.app = null;
    this.logger.log('Slack Socket Mode stopped');
  }

  private async handleMirrorEvent(conversationId: string, streamEvent: string, payload: StreamPayload) {
    try {
      const session = this.activeSessions.get(conversationId);
      if (!session) return;

      const { app, channel, threadTs } = session;

      if (streamEvent === 'error') {
        await this.flushCurrentBlock(conversationId);
        await this.postErrorBlock(
          app,
          channel,
          String(payload.message || '执行失败'),
          threadTs,
        );
        return;
      }

      if (streamEvent === 'stream_done') {
        await this.flushCurrentBlock(conversationId);
        return;
      }

      if (streamEvent !== 'message') return;

      const type = String(payload.type || '');
      if (!type) return;

      if (session.currentType && session.currentType !== type) {
        await this.flushCurrentBlock(conversationId);
      }

      if (type === 'thinking' || type === 'text') {
        const content = String(payload.content || '');
        if (!content) return;
        session.currentType = type;
        session.markdownBuffer += content;
        return;
      }

      if (type === 'tool_text') {
        const taskId = String(payload.id || '');
        const title = String(payload.content || '');
        if (!taskId || !title) return;
        const messageTs = await this.postTaskCardStart(app, channel, taskId, title, threadTs);
        if (messageTs) {
          session.taskMessageTs.set(taskId, messageTs);
        }
        return;
      }

      if (type === 'tool_result') {
        const taskId = String(payload.id || '');
        const title = String(payload.toolName || '');
        if (!taskId || !title) return;
        const status = payload.status === 'error' ? 'error' : 'complete';
        await this.postTaskCardResult(app, channel, taskId, title, status, threadTs, session.taskMessageTs);

        const artifacts = this.extractArtifactContents(payload.artifact);
        if (artifacts.length > 0) {
          this.logger.debug(`Posting ${artifacts.length} artifact(s) for conversation ${conversationId}`);
          try {
            await this.purfenceSlackService.postArtifacts({
              client: app.client,
              channel,
              threadTs,
              artifacts,
            });
          } catch (error) {
            this.logger.error(
              `Failed to post artifacts: ${error instanceof Error ? error.message : String(error)}`,
            );
            // Continue processing - artifacts are not critical
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error in handleMirrorEvent for conversation ${conversationId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Clean up session on unhandled error
      this.activeSessions.delete(conversationId);
    }
  }

  private extractArtifactContents(
    artifactRows?: Array<{ content?: AgentArtifactContent }>,
  ) {
    if (!artifactRows || artifactRows.length === 0) {
      return [];
    }

    const result: AgentArtifactContent[] = [];
    for (const row of artifactRows) {
      if (row?.content) {
        result.push(row.content);
      }
    }
    return result;
  }

  private async closeMirror(conversationId: string) {
    const session = this.activeSessions.get(conversationId);
    if (!session) return;

    await this.flushCurrentBlock(conversationId);
    this.activeSessions.delete(conversationId);
    this.logger.log(`Closed and removed session: conversationId=${conversationId}`);
  }

  private async flushCurrentBlock(conversationId: string) {
    const session = this.activeSessions.get(conversationId);
    if (!session || !session.currentType) return;

    if (session.currentType === 'thinking' || session.currentType === 'text') {
      // 先不发thinking
      if (!session.markdownBuffer.trim() || session.currentType === 'thinking') {
        session.currentType = '';
        session.markdownBuffer = '';
        return;
      }

      try {
        await session.app.client.chat.postMessage({
          channel: session.channel,
          text: session.markdownBuffer,
          thread_ts: session.threadTs,
          blocks: [
            {
              type: 'markdown',
              text: session.markdownBuffer,
            },
          ] as SlackBlock[],
        });
      } catch (error) {
        this.logger.error(
          `Failed to flush current block: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Continue to reset the buffer even on error
      }

      session.currentType = '';
      session.markdownBuffer = '';
      return;
    }
  }

  private async postTaskCardStart(
    app: App,
    channel: string,
    taskId: string,
    title: string,
    threadTs: string,
  ) {
    try {
      const result = await app.client.chat.postMessage({
        channel,
        text: title,
        thread_ts: threadTs,
        blocks: [
          {
            type: 'task_card',
            task_id: taskId,
            title,
            status: 'in_progress',
          },
        ] as SlackBlock[],
      });

      return result?.ts ? String(result.ts) : undefined;
    } catch (error) {
      this.logger.error(
        `Failed to post task card start: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  private async postTaskCardResult(
    app: App,
    channel: string,
    taskId: string,
    title: string,
    status: 'complete' | 'error',
    threadTs: string,
    taskMessageTs: Map<string, string>,
  ) {
    const ts = taskMessageTs.get(taskId);
    if (!ts) {
      try {
        await app.client.chat.postMessage({
          channel,
          text: title,
          thread_ts: threadTs,
          blocks: [
            {
              type: 'task_card',
              task_id: taskId,
              title,
              status,
            },
          ] as SlackBlock[],
        });
      } catch (error) {
        this.logger.error(
          `Failed to post task card result: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      return;
    }

    try {
      await app.client.chat.update({
        channel,
        ts,
        text: title,
        blocks: [
          {
            type: 'task_card',
            task_id: taskId,
            title,
            status,
          },
        ] as SlackBlock[],
      });
    } catch (error) {
      this.logger.error(
        `Failed to update task card result: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    taskMessageTs.delete(taskId);
  }

  private async postErrorBlock(app: App, channel: string, message: string, threadTs?: string) {
    try {
      await app.client.chat.postMessage({
        channel,
        text: message,
        thread_ts: threadTs,
        blocks: [
          {
            type: 'markdown',
            text: message,
          },
        ] as SlackBlock[],
      });
    } catch (error) {
      this.logger.error(
        `Failed to post error block: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async postMarkdownByToken(
    botToken: string,
    channel: string,
    text: string,
  ) {
    const client = new WebClient(botToken);
    try {
      await client.chat.postMessage({
        channel,
        text,
        blocks: [
          {
            type: 'markdown',
            text,
          },
        ] as SlackBlock[],
      });
    } catch (error) {
      this.logger.error(
        `Failed to post markdown by token: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error; // Re-throw as this is called from event handlers that have their own error handling
    }
  }
}
