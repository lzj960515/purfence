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

@Injectable()
export class SlackRuntimeService implements OnModuleInit, OnModuleDestroy {
  @Log() private readonly logger: Logger;

  private app: App | null = null;
  private reloadChain: Promise<void> = Promise.resolve();
  private isProcessing = false;

  private activeApp: App | null = null;
  private activeChannel: string | null = null;

  private currentType = '';
  private markdownBuffer = '';
  private taskMessageTs = new Map<string, string>();

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

      if (this.isProcessing) {
        await this.postErrorBlock(
          app,
          event.channel,
          '我还在处理上一条消息，请稍等一下。',
        );
        return;
      }
      this.isProcessing = true;
      this.activeApp = app;
      this.activeChannel = event.channel;
      this.resetStreamState();

      const threadId = event.channel;
      SocketService.registerStreamMirror(threadId, {
        handle: async (streamEvent, payload) => {
          await this.handleMirrorEvent(streamEvent, payload as StreamPayload);
        },
        close: async () => this.closeMirror(),
      });
      try {
        await this.purfenceAgentService.streamZiwei({
          threadId,
          query,
          providerName,
          userId: event.user,
          context: {
            channel: 'slack',
            trigger: 'slack_dm',
            slackChannelId: event.channel,
            slackUserId: event.user,
            slackThreadTs: event.thread_ts ?? event.ts,
            slackAppConfigId: appConfigId,
          },
        });
      } catch (error) {
        await this.postErrorBlock(
          app,
          event.channel,
          error instanceof Error ? error.message : String(error),
        );
        this.isProcessing = false;
        await SocketService.unregisterStreamMirror(threadId);
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

  private async handleMirrorEvent(streamEvent: string, payload: StreamPayload) {
    const app = this.activeApp;
    const channel = this.activeChannel;
    if (!app || !channel) return;

    if (streamEvent === 'error') {
      await this.flushCurrentBlock();
      await this.postErrorBlock(
        app,
        channel,
        String(payload.message || '执行失败'),
      );
      return;
    }

    if (streamEvent === 'stream_done') {
      await this.flushCurrentBlock();
      return;
    }

    if (streamEvent !== 'message') return;

    const type = String(payload.type || '');
    if (!type) return;

    if (this.currentType && this.currentType !== type) {
      await this.flushCurrentBlock();
    }

    if (type === 'thinking' || type === 'text') {
      const content = String(payload.content || '');
      if (!content) return;
      this.currentType = type;
      this.markdownBuffer += content;
      return;
    }

    if (type === 'tool_text') {
      const taskId = String(payload.id || '');
      const title = String(payload.content || '');
      if (!taskId || !title) return;
      await this.postTaskCardStart(app, channel, taskId, title);
      return;
    }

    if (type === 'tool_result') {
      const taskId = String(payload.id || '');
      const title = String(payload.toolName || '');
      if (!taskId || !title) return;
      const status = payload.status === 'error' ? 'error' : 'complete';
      await this.postTaskCardResult(app, channel, taskId, title, status);

      const artifacts = this.extractArtifactContents(payload.artifact);
      if (artifacts.length > 0) {
        console.log('artifacts', JSON.stringify(artifacts, null, 2));
        await this.purfenceSlackService.postArtifacts({
          client: app.client,
          channel,
          artifacts,
        });
      }
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

  private async closeMirror() {
    await this.flushCurrentBlock();
    this.resetStreamState();
    this.activeApp = null;
    this.activeChannel = null;
    this.isProcessing = false;
    this.taskMessageTs.clear();
  }

  private async flushCurrentBlock() {
    const app = this.activeApp;
    const channel = this.activeChannel;
    if (!app || !channel || !this.currentType) return;

    if (this.currentType === 'thinking' || this.currentType === 'text') {
      // 先不发thinking
      if (!this.markdownBuffer.trim() || this.currentType === 'thinking') {
        this.resetStreamState();
        return;
      }

      // const markdownText =
      //   this.currentType === 'thinking'
      //     ? this.markdownBuffer
      //         .split('\n')
      //         .map((line) => `> ${line}`)
      //         .join('\n')
      //     : this.markdownBuffer;
      await app.client.chat.postMessage({
        channel,
        text: this.markdownBuffer,
        blocks: [
          {
            type: 'markdown',
            text: this.markdownBuffer,
          },
        ] as any,
      });

      this.resetStreamState();
      return;
    }
  }

  private resetStreamState() {
    this.currentType = '';
    this.markdownBuffer = '';
  }

  private async postTaskCardStart(
    app: App,
    channel: string,
    taskId: string,
    title: string,
  ) {
    const result = await app.client.chat.postMessage({
      channel,
      text: title,
      blocks: [
        {
          type: 'task_card',
          task_id: taskId,
          title,
          status: 'in_progress',
        },
      ] as any,
    });

    if (result?.ts) {
      this.taskMessageTs.set(taskId, String(result.ts));
    }
  }

  private async postTaskCardResult(
    app: App,
    channel: string,
    taskId: string,
    title: string,
    status: 'complete' | 'error',
  ) {
    const ts = this.taskMessageTs.get(taskId);
    if (!ts) {
      await app.client.chat.postMessage({
        channel,
        text: title,
        blocks: [
          {
            type: 'task_card',
            task_id: taskId,
            title,
            status,
          },
        ] as any,
      });
      return;
    }

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
      ] as any,
    });
    this.taskMessageTs.delete(taskId);
  }

  private async postErrorBlock(app: App, channel: string, message: string) {
    await app.client.chat.postMessage({
      channel,
      text: message,
      blocks: [
        {
          type: 'markdown',
          text: message,
        },
      ] as any,
    });
  }

  private async postMarkdownByToken(
    botToken: string,
    channel: string,
    text: string,
  ) {
    const client = new WebClient(botToken);
    await client.chat.postMessage({
      channel,
      text,
      blocks: [
        {
          type: 'markdown',
          text,
        },
      ] as any,
    });
  }
}
