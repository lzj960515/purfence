import { MyAgentService } from '@app/my-agent';
import { SlackService } from '@app/slack';
import { Log } from '@nest-mods/log';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App } from '@slack/bolt';
import { MessageElement } from '@slack/web-api/dist/types/response/ConversationsRepliesResponse';
import { AgenticAiConversation } from '@src/agentic-ai/agentic-ai-conversation.ai.entity';
import { AgenticAiType } from '@src/agentic-ai/agentic-ai.enum';
import { Store } from '@src/pietra-v2/store.v2.entity';
import _ from 'lodash';
import { AgentPromptService } from '../prompt/agent-prompt.service';
import { SlackConfig } from './slack-config.ai.entity';
import { AgentArtifact } from '../artifact/agent-artifact.ai.entity';
import { In } from 'typeorm';
import {
  AgentArtifactContent,
  AgentArtifactFileContent,
  AgentArtifactImageContent,
  AgentArtifactType,
} from '../artifact/agent-artifact-content.dto';

type AppMentionEvent = {
  type: 'app_mention';
  channel: string;
  ts: string;
  text?: string;
  thread_ts?: string;
  user?: string;
  bot_id?: string;
};

type SlackMessageEvent = {
  type: 'message';
  channel: string;
  ts: string;
  text?: string;
  user?: string;
  subtype?: string;
  bot_id?: string;
  channel_type?: string;
  thread_ts?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAppMentionEvent(event: unknown): event is AppMentionEvent {
  if (!isRecord(event)) return false;
  if (event.type !== 'app_mention') return false;
  return typeof event.channel === 'string' && typeof event.ts === 'string';
}

function isSlackMessageEvent(event: unknown): event is SlackMessageEvent {
  if (!isRecord(event)) return false;
  if (event.type !== 'message') return false;
  return typeof event.channel === 'string' && typeof event.ts === 'string';
}

@Injectable()
export class SlackHandlerService implements OnModuleInit, OnModuleDestroy {
  @Log() private logger: Logger;

  private app: App | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly agentPromptService: AgentPromptService,
    private readonly myAgentService: MyAgentService,
    private readonly slackService: SlackService,
  ) {}

  async onModuleInit() {
    const token = this.config.get<string>('slack.botToken');
    const appToken = this.config.get<string>('slack.appToken');
    if (!token || !appToken) {
      this.logger.warn(
        'SLACK_BOT_TOKEN or SLACK_APP_TOKEN is not set, Slack Bolt (Socket Mode) will not be started',
      );
      return;
    }
    this.app = new App({
      token,
      appToken,
      socketMode: true,
    });

    this.app.event('app_mention', async ({ event, client }) => {
      if (!isAppMentionEvent(event)) return;

      try {
        await this.handleAppMention({
          channelId: event.channel,
          threadTs: event.thread_ts ?? event.ts,
          ts: event.ts,
          text: event.text,
        });
      } catch (err: any) {
        this.logger.error(
          `Slack app_mention handler failed: ${err?.message || err}`,
          err?.stack,
        );
      }
    });

    this.app.event('message', async ({ event, say }) => {
      if (!isSlackMessageEvent(event)) return;

      if (event.subtype) return;
      if (event.bot_id) return;
      if (event.channel_type !== 'im') return;

      await say({
        markdown_text: 'not implemented',
      });
    });
    this.logger.log('Slack Bolt (Socket Mode) starting...');
    this.app.start();
    this.logger.log('Slack Bolt (Socket Mode) started');
  }

  async onModuleDestroy() {
    await this.app?.stop();
  }

  async handleAppMention(args: {
    channelId: string;
    threadTs: string;
    ts: string;
    text: string;
  }) {
    const { channelId, threadTs, ts, text } = args;

    const query = this.cleanMentionText(text);
    if (!query) return;

    const messages = await this.fetchMessages({
      channelId,
      threadTs,
      ts,
    });
    const input = _.isEmpty(messages)
      ? { question: query }
      : { question: query, context: messages };

    const { storeId, conversationId, agent, context } = await this.createAgent(
      channelId,
      threadTs,
      query,
    );

    const resp = await agent.generateText(JSON.stringify(input), {
      userId: storeId,
      conversationId,
      context,
    });

    const artifacts = await AgentArtifact.find({
      where: {
        storeId,
        threadId: conversationId,
        conversationId,
        type: In([AgentArtifactType.IMAGE, AgentArtifactType.FILE]),
      },
      select: {
        id: true,
        type: true,
        content: true,
      },
    });

    await this.replySlack({
      channelId,
      threadTs,
      markdown: resp.text,
      artifacts: _.map(artifacts, (artifact) => artifact.content),
    });
  }

  private async findConversation(params: {
    storeId: string;
    threadTs: string;
    query: string;
  }) {
    const { storeId, threadTs, query } = params;
    const existing = await AgenticAiConversation.findOne({
      where: { storeId, slackMessageTs: threadTs },
    });
    if (existing) return existing;

    return await AgenticAiConversation.create({
      storeId,
      type: AgenticAiType.ASK_AI,
      summary: 'Slack thread',
      message: query,
      beginAt: new Date(),
      slackMessageTs: threadTs,
    }).save();
  }

  private async fetchMessages(params: {
    channelId: string;
    threadTs: string;
    ts: string;
  }) {
    const { channelId, threadTs, ts } = params;
    const resp = await this.slackService.getMessages({
      channelId,
      threadTs,
      ts,
    });
    if (_.isEmpty(resp.messages)) return [];
    const messages = this.sliceMessage(resp.messages);
    if (_.isEmpty(messages)) return [];
    return this.formatMessage(messages);
  }

  private async formatMessage(messages: MessageElement[]) {
    let content = '';

    for (const m of messages) {
      const user = await this.slackService.getUser(m.user);
      content += `[${user}(${m.user})]: ${m.text}\n`;
    }

    return content;
  }

  private async createAgent(
    channelId: string,
    threadTs: string,
    query: string,
  ) {
    const slackConfig = await SlackConfig.findOne({
      where: {
        channelId,
      },
    });
    if (slackConfig) {
      const storeId = slackConfig.storeId;
      const conversation = await this.findConversation({
        storeId,
        threadTs,
        query,
      });

      const agentOptions = await this.agentPromptService.loadAgentOptions(
        AgenticAiType.ASK_AI,
        storeId,
        conversation.id,
        query,
      );

      const agent = this.myAgentService.createAgent(agentOptions);
      const storeV1Id = await Store.findOne({
        select: {
          id: true,
          v1Id: true,
        },
        where: {
          id: storeId,
        },
      });
      return {
        storeId,
        conversationId: conversation.id,
        agent,
        context: { storeId, storeV1Id: storeV1Id?.v1Id },
      };
    }

    const agent = this.myAgentService.createAgent({
      name: 'pietra-bot',
      prompt:
        'You are Pietra Bot in Slack. Reply concisely and use markdown formatting. If you cannot perform an action, ask a clarifying question.',
      tools: [
        'web-search',
        'webBrowser',
        'viewImageContent',
        'python_interpreter',
      ],
    });
    return {
      storeId: 'pietra-bot',
      conversationId: `${channelId}:${threadTs}`,
      agent,
      context: { 'pietra-bot': true },
    };
  }

  private async replySlack(params: {
    channelId: string;
    threadTs: string;
    markdown: string;
    artifacts: AgentArtifactContent[];
  }) {
    const { channelId, threadTs, markdown, artifacts } = params;

    const resp = await this.slackService.postMarkdownMessage({
      channel: channelId,
      threadTs,
      markdown,
      artifacts,
    });
    return resp?.ts;
  }

  private cleanMentionText(text?: string) {
    return (text || '').replace(/^(?:\s*<@[^>]+>\s*)+/, '').trim();
  }

  private sliceMessage(messages: MessageElement[]) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m?.bot_id) {
        return messages.slice(i + 1);
      }
    }
    return messages;
  }
}
