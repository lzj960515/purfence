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

  async summarizeHistory(
    userId: string,
    conversationId: string,
    options?: GetMessagesOptions,
  ) {
    const sessions = await AgentConversationSession.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
    if (_.isEmpty(sessions)) {
      const messages = await this.getMessages(userId, conversationId, options);
      return this.formatHistorySummary(messages as any[]);
    }

    const result: Awaited<ReturnType<typeof this.formatHistorySummary>> = [];
    for (const session of sessions) {
      const messages = await this.getMessages(userId, session.id, options);
      const formattedMessages = this.formatHistorySummary(messages as any[]);
      result.push(...formattedMessages);
    }
    return result;
  }

  async loadToolCallDetails(
    userId: string,
    conversationId: string,
    toolCallIds: string[],
  ) {
    const uniqueToolCallIds = _.uniq(
      toolCallIds.map((id) => id.trim()).filter(Boolean),
    );
    const sessions = await AgentConversationSession.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    if (_.isEmpty(sessions)) {
      const messages = await this.getMessages(userId, conversationId);
      return this.formatToolCallDetails(
        conversationId,
        messages as any[],
        uniqueToolCallIds,
      );
    }

    const result: Awaited<ReturnType<typeof this.formatToolCallDetails>> = [];
    for (const session of sessions) {
      const messages = await this.getMessages(userId, session.id);
      const details = this.formatToolCallDetails(
        session.id,
        messages as any[],
        uniqueToolCallIds,
      );
      result.push(...details);
    }

    const detailsById = new Map(result.map((item) => [item.toolCallId, item]));
    return uniqueToolCallIds.map((toolCallId) => ({
      toolCallId,
      detail: detailsById.get(toolCallId) ?? null,
    }));
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

  private formatHistorySummary(
    messages: UIMessage<{ createdAt?: Date; isBridgeMessage?: boolean }>[],
  ) {
    const result: {
      id: string;
      role: 'ai' | 'user';
      type: 'text' | 'tool_call';
      text?: string;
      toolName?: string;
      toolCallId?: string;
      createdAt?: Date;
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
            role: message.role === 'assistant' ? 'ai' : 'user',
            type: 'text',
            text: part.text,
            createdAt: message.metadata?.createdAt,
          });
        }

        if (part.type.startsWith('tool-')) {
          const toolPart = part as ToolUIPart<{
            [k: string]: { input: unknown; output: { value?: unknown } };
          }>;
          result.push({
            id: toolPart.toolCallId,
            role: message.role === 'assistant' ? 'ai' : 'user',
            type: 'tool_call',
            toolName: part.type.replace(/^tool-/, ''),
            toolCallId: toolPart.toolCallId,
            createdAt: message.metadata?.createdAt,
          });
        }

        index += 1;
      }
    }

    return result;
  }

  private formatToolCallDetails(
    conversationId: string,
    messages: UIMessage<{ createdAt?: Date; isBridgeMessage?: boolean }>[],
    toolCallIds: string[],
  ) {
    const requestedToolCallIds = new Set(toolCallIds);
    const result: {
      toolCallId: string;
      toolName: string;
      input: unknown;
      output: unknown;
      status?: 'error';
      createdAt?: Date;
    }[] = [];

    for (const message of messages) {
      if (message.metadata?.isBridgeMessage) {
        continue;
      }

      for (const part of message.parts) {
        if (!part.type.startsWith('tool-')) {
          continue;
        }

        const toolPart = part as ToolUIPart<{
          [k: string]: { input: unknown; output: { value?: unknown } };
        }>;
        if (!requestedToolCallIds.has(toolPart.toolCallId)) {
          continue;
        }

        result.push({
          toolCallId: toolPart.toolCallId,
          toolName: part.type.replace(/^tool-/, ''),
          input: toolPart.input,
          output: toolPart.output?.value,
          status: (toolPart.output?.value as { error?: unknown } | undefined)
            ?.error
            ? 'error'
            : undefined,
          createdAt: message.metadata?.createdAt,
        });
      }
    }

    return result;
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
