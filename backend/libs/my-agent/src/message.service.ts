import { MyUtil } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { type ToolUIPart, type UIMessage } from 'ai';
import _ from 'lodash';
import { AgentConversationSession } from './agent-conversation-sessions.ai.entity';
import { bridgePrompt } from './prompt';
import type { ChatOptions } from './types';
import { MyAgent } from './my-agent';
import { AgentArtifact } from '@src/purfence/artifact/agent-artifact.ai.entity';
import {
  MemoryStorageService,
  GetMessagesOptions,
} from './memory-storage.service';

interface MessageFormatOptions {
  includeToolResults?: boolean;
  includeArtifact?: boolean;
}

@Injectable()
export class MessageService {
  constructor(private readonly memoryStorage: MemoryStorageService) {}

  async getMessages(
    userId: string,
    conversationId: string,
    options?: GetMessagesOptions,
  ) {
    return this.memoryStorage.getMessages(userId, conversationId, options);
  }

  async updateConversationTitle(conversationId: string, title: string) {
    return this.memoryStorage.updateConversation(conversationId, {
      title,
    });
  }

  async loadHistoryMessages(
    userId: string,
    conversationId: string,
    options?: GetMessagesOptions,
    formatOptions?: MessageFormatOptions,
  ) {
    const sessions = await AgentConversationSession.find({
      where: {
        conversationId,
      },
    });
    if (_.isEmpty(sessions)) {
      const messages = await this.getMessages(userId, conversationId, options);

      return await this.formatMessage(conversationId, messages, formatOptions);
    }

    const result: Awaited<ReturnType<typeof this.formatMessage>> = [];
    for (const session of sessions) {
      const messages = await this.getMessages(userId, session.id, options);
      const formattedMessages = await this.formatMessage(
        session.id,
        messages,
        formatOptions,
      );
      result.push(...formattedMessages);
    }
    return result;
  }

  async latestTextMessage(userId: string, conversationId: string) {
    const messages = await this.memoryStorage.getMessages(userId, conversationId);
    const lastMessage = _.last(messages);
    return this.extractTextFromUIMessage(lastMessage);
  }

  async deleteConversation(conversationId: string) {
    return this.memoryStorage.deleteConversation(conversationId);
  }

  extractText(messages: UIMessage[]) {
    return _.chain(messages)
      .map((it) => {
        return {
          role: it.role,
          text: this.extractTextFromUIMessage(it),
        };
      })
      .value();
  }

  extractRawText(messages: UIMessage[]) {
    return _.chain(messages)
      .map((it) => {
        return this.extractTextFromUIMessage(it);
      })
      .join('')
      .value();
  }

  /**
   * 从 UIMessage 中提取文本内容
   */
  private extractTextFromUIMessage(message: UIMessage | undefined): string {
    if (!message) return '';
    return message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('');
  }

  async isSessionFull(session: AgentConversationSession, myAgent: MyAgent) {
    const myModel = myAgent.getMyModel();
    const threshold = 0.8;
    const limit = myModel.tokenLimit();
    return session?.totalTokens >= limit * threshold;
  }

  async countTokens(session: AgentConversationSession, myAgent: MyAgent) {
    const uiMessages = await this.memoryStorage.getMessages(
      session.userId,
      session.id,
    );
    if (_.isEmpty(uiMessages)) {
      return false;
    }
    const systemMessage = myAgent.getInstructions();
    if (systemMessage && typeof systemMessage === 'string') {
      uiMessages.unshift({
        id: MyUtil.uuid(),
        role: 'system',
        parts: [{ type: 'text', text: systemMessage }],
      } as UIMessage);
    }

    // 使用 AI SDK 的 countTokens 或估算
    return await myAgent
      .getMyModel()
      .countTokens?.(uiMessages as any, myAgent.getTools());
  }

  async buildBridgeMessage(
    userId: string,
    sessionId: string,
    summary: string,
    message?: ChatOptions['message'],
  ) {
    // 取所有的历史消息中的 user 文本
    const messages = await this.memoryStorage.getMessages(userId, sessionId, {
      roles: ['user'],
    });
    const userMessages = messages.map((m) => this.extractTextFromUIMessage(m));

    const bridge = bridgePrompt(userMessages, summary);
    const bridgeMessage: UIMessage = {
      id: MyUtil.uuid(),
      role: 'user',
      parts: [{ type: 'text', text: bridge }],
      metadata: {
        isBridgeMessage: true,
      },
    };
    if (message) {
      return [bridgeMessage, ...this.toUIMessages(message)];
    }

    return [bridgeMessage];
  }

  private toUIMessages(input: ChatOptions['message']): UIMessage[] {
    if (_.isString(input)) {
      return [
        {
          id: MyUtil.uuid(),
          role: 'user',
          parts: [{ type: 'text', text: input }],
        },
      ];
    }

    if (_.isArray(input) && !_.isEmpty(input)) {
      const first = input[0];
      if ('parts' in first) {
        return input as UIMessage[];
      }
    }
    throw new Error('Invalid input, only support string or UIMessage[]');
  }

  private async formatMessage(
    conversationId: string,
    messages: UIMessage[],
    options: MessageFormatOptions,
  ) {
    options = _.defaults(options, {
      includeToolResults: true,
      includeArtifact: true,
    });
    const roleMap = {
      assistant: 'ai',
      user: 'user',
    };
    const result: {
      id: string;
      role: 'ai' | 'user';
      type: 'text' | 'file' | 'thinking' | 'tool_text' | 'tool_result';
      content: any;
      createdAt: Date;
      [k: string]: any;
    }[] = [];
    for (const message of messages) {
      if ((message.metadata as any)?.isBridgeMessage) {
        continue;
      }
      let index = 0;
      for (const part of message.parts) {
        if (part.type === 'text') {
          result.push({
            id: `${message.id}-${index}`,
            role: roleMap[message.role],
            type: part.type,
            content: part.text,
            createdAt: (message.metadata as any)?.createdAt,
          });
        }
        if (part.type === 'file') {
          result.push({
            id: `${message.id}-${index}`,
            role: roleMap[message.role],
            type: 'file',
            mediaType: part.mediaType,
            content: part.url,
            createdAt: (message.metadata as any)?.createdAt,
          });
        }
        if (part.type === 'reasoning') {
          result.push({
            id: `${message.id}-${index}`,
            role: roleMap[message.role],
            type: 'thinking',
            content: part.text,
            createdAt: (message.metadata as any)?.createdAt,
          });
        }
        if (options.includeToolResults && part.type.startsWith('tool-')) {
          const toolName = part.type.replace(/^tool-/, '');
          const toolPart = part as ToolUIPart<{
            [k: string]: {
              input: any;
              output: { value?: { type: string; error?: Error } };
            };
          }>;
          result.push({
            id: toolPart.toolCallId,
            role: roleMap[message.role],
            type: 'tool_text',
            content: toolName,
            createdAt: (message.metadata as any)?.createdAt,
          });

          const artifact = options.includeArtifact
            ? await AgentArtifact.find({
                where: {
                  toolCallId: toolPart.toolCallId,
                  conversationId,
                },
              })
            : undefined;

          result.push({
            id: toolPart.toolCallId,
            role: roleMap[message.role],
            type: 'tool_result',
            toolName: toolName,
            toolCallId: toolPart.toolCallId,
            content: toolPart.output?.value,
            status: toolPart.output?.value?.error ? 'error' : undefined,
            artifact,
            createdAt: (message.metadata as any)?.createdAt,
          });
        }
        index++;
      }
    }
    return result;
  }
}
