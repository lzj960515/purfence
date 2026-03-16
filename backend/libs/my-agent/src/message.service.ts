import { MyUtil } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { AgentArtifact } from '@src/purfence/artifact/agent-artifact.ai.entity';
import { extractText, GetMessagesOptions, Memory } from '@voltagent/core';
import { type ToolUIPart, type UIMessage } from 'ai';
import _ from 'lodash';
import { AgentConversationSession } from './agent-conversation-sessions.entity';
import { MyModel } from './model';
import { bridgePrompt } from './prompt';
import type { ChatOptions } from './types';

interface MessageFormatOptions {
  includeToolResults?: boolean;
  includeArtifact?: boolean;
}

@Injectable()
export class MessageService {
  constructor(private readonly memory: Memory) {}

  async getMessages(
    userId: string,
    conversationId: string,
    options?: GetMessagesOptions,
  ) {
    return this.memory.getMessages(userId, conversationId, options);
  }

  async deleteConversation(conversationId: string) {
    return this.memory.deleteConversation(conversationId);
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
    const messages = await this.memory.getMessages(userId, conversationId);
    const lastMessage = _.last(messages);
    return extractText(lastMessage);
  }

  extractText(messages: UIMessage[]) {
    return _.chain(messages)
      .map((it) => {
        return {
          role: it.role,
          text: extractText(it),
        };
      })
      .value();
  }

  extractRawText(messages: UIMessage[]) {
    return _.chain(messages)
      .map((it) => {
        return extractText(it);
      })
      .join('')
      .value();
  }

  isSessionFull(session: AgentConversationSession, myModel: MyModel) {
    const threshold = 0.8;
    const limit = myModel.tokenLimit();
    return session?.totalTokens >= limit * threshold;
  }

  async buildBridgeMessage(
    userId: string,
    sessionId: string,
    summary: string,
    message?: ChatOptions['message'],
  ) {
    // 取所有的历史消息中的 user 文本
    const messages = await this.memory.getMessages(userId, sessionId, {
      roles: ['user'],
    });
    const userMessages = messages.map((m) => extractText(m));

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
        return input;
      }
    }
    throw new Error('Invalid input, only support string or UIMessage[]');
  }

  private async formatMessage(
    conversationId: string,
    messages: UIMessage<{ createdAt: Date; isBridgeMessage?: boolean }>[],
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
      if (message.metadata?.isBridgeMessage) {
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
            createdAt: message.metadata?.createdAt,
          });
        }
        if (part.type === 'file') {
          result.push({
            id: `${message.id}-${index}`,
            role: roleMap[message.role],
            type: 'file',
            mediaType: part.mediaType,
            content: part.url,
            createdAt: message.metadata?.createdAt,
          });
        }
        if (part.type === 'reasoning') {
          result.push({
            id: `${message.id}-${index}`,
            role: roleMap[message.role],
            type: 'thinking',
            content: part.text,
            createdAt: message.metadata?.createdAt,
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
            createdAt: message.metadata?.createdAt,
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
            createdAt: message.metadata?.createdAt,
          });
        }
        index++;
      }
    }
    return result;
  }
}
