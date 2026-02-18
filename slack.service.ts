import { Injectable, Logger } from '@nestjs/common';
import type { KnownBlock, Block as SlackBlock } from '@slack/types';
import { WebClient } from '@slack/web-api';
import { IncomingWebhook } from '@slack/webhook';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  AgentArtifactContent,
  AgentArtifactFileContent,
  AgentArtifactImageContent,
  AgentArtifactType,
} from '@src/agent/artifact/agent-artifact-content.dto';
import _ from 'lodash';
import { marked } from 'marked';

type SlackMarkdownBlock = {
  type: 'markdown';
  text: string;
  block_id?: string;
};

type SlackRawTextCell = {
  type: 'raw_text';
  text: string;
};

type SlackRichTextCell = {
  type: 'rich_text';
  elements: Array<{
    type: 'rich_text_section';
    elements: Array<{ type: 'text'; text: string; style?: { bold?: boolean } }>;
  }>;
};

type SlackTableBlock = {
  type: 'table';
  rows: Array<Array<SlackRawTextCell | SlackRichTextCell>>;
  column_settings?: Array<{
    align?: 'left' | 'center' | 'right';
    is_wrapped?: boolean;
  } | null>;
  block_id?: string;
};

export type SlackPostMarkdownMessageInput = {
  channel: string;
  threadTs?: string;
  markdown: string;
  header?: string;
  footerButton?: {
    text: string;
    url: string;
  };
  artifacts?: AgentArtifactContent[];
  unfurlLinks?: boolean;
  unfurlMedia?: boolean;
};

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(private readonly web: WebClient) {}

  async getUser(userId: string) {
    const u = await this.web.users.info({ user: userId });
    return u.user?.name || userId;
  }

  async postMarkdownMessage(input: SlackPostMarkdownMessageInput) {
    const {
      channel,
      markdown,
      threadTs,
      footerButton,
      unfurlLinks,
      unfurlMedia,
      header,
      artifacts,
    } = input;
    const { blocks, fallbackText, fallbackMarkdown } =
      this.renderMarkdown(markdown);

    const blocksWithHeader = this.addHeader(blocks, header);
    const blocksWithArtifacts = await this.getArtifactBlocks({
      channel,
      threadTs,
      blocks: blocksWithHeader,
      artifacts,
    });
    const blocksWithFooter = this.addFooter(blocksWithArtifacts, footerButton);

    const res = await this.postChat({
      channel,
      text: fallbackText,
      blocks: blocksWithFooter,
      unfurl_links: unfurlLinks,
      unfurl_media: unfurlMedia,
      thread_ts: threadTs,
    });

    if (res?.ok && res.ts) {
      return { ok: true, ts: res.ts };
    }

    const fallbackRes = await this.postChat({
      channel,
      text: fallbackText,
      blocks: this.buildFallbackBlocks({
        fallbackMarkdown,
        footerButton,
      }),
      unfurl_links: unfurlLinks,
      unfurl_media: unfurlMedia,
      thread_ts: threadTs,
    });

    if (fallbackRes?.ok && fallbackRes.ts) {
      return { ok: true, ts: fallbackRes.ts };
    }

    // Preserve previous behavior: return Slack's response object on failure.
    return fallbackRes ?? res ?? { ok: false };
  }

  async getMessages(params: {
    channelId: string;
    threadTs: string;
    ts: string;
  }) {
    const { channelId, threadTs, ts } = params;
    return await this.web.conversations.replies({
      channel: channelId,
      ts: threadTs,
      latest: ts,
      inclusive: false,
      limit: 200,
    });
  }

  private buildHeaderBlock(header: string) {
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text: header,
      },
    };
  }

  private buildFooterBlock(footerButton: { text: string; url: string }) {
    return {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: footerButton.text, emoji: true },
          url: footerButton.url,
        },
      ],
    };
  }

  private buildArtifactsBlock(artifacts: AgentArtifactContent[]) {
    return artifacts.map((artifact) => {
      switch (artifact.type) {
        case AgentArtifactType.IMAGE:
          return {
            type: 'image',
            image_url: artifact.url,
            alt_text: 'image',
          };
        case AgentArtifactType.FILE:
          return {
            type: 'markdown',
            text: `[${artifact.filename}](${artifact.fileUrl})`,
          };
      }
    });
  }

  private async getArtifactBlocks(params: {
    channel: string;
    threadTs?: string;
    blocks: Array<
      KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
    >;
    artifacts?: AgentArtifactContent[];
  }) {
    const { channel, threadTs, blocks, artifacts } = params;
    const artifactList = artifacts || [];
    if (_.isEmpty(artifactList)) return blocks;

    const artifactBlocks: Array<
      KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
    > = [];

    for (const artifact of artifactList) {
      try {
        if (artifact.type === AgentArtifactType.IMAGE) {
          const imageBlocks = await this.buildImageArtifactBlocks({
            channel,
            threadTs,
            artifact,
          });
          artifactBlocks.push(...imageBlocks);
          continue;
        }

        if (artifact.type === AgentArtifactType.FILE) {
          const fileBlocks = await this.buildFileArtifactBlocks({
            channel,
            threadTs,
            artifact,
          });
          artifactBlocks.push(...fileBlocks);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to process artifact for Slack blocks`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    if (_.isEmpty(artifactBlocks)) return blocks;
    return _.concat(blocks, { type: 'divider' }, artifactBlocks);
  }

  private async buildImageArtifactBlocks(params: {
    channel: string;
    threadTs?: string;
    artifact: AgentArtifactImageContent;
  }): Promise<Array<KnownBlock | SlackBlock | SlackMarkdownBlock>> {
    const { channel, threadTs, artifact } = params;
    if (!this.isLocalFilePath(artifact.url)) {
      return [
        {
          type: 'image',
          image_url: artifact.url,
          alt_text: 'image',
        },
      ];
    }

    const uploaded = await this.uploadLocalFileToSlack({
      channel,
      threadTs,
      localPath: artifact.url,
      filenameHint: path.basename(artifact.url),
      title: path.basename(artifact.url),
    });

    return [
      {
        type: 'image',
        title: {
          type: 'plain_text',
          text: uploaded.filename,
        },
        slack_file: {
          id: uploaded.fileId,
        },
        alt_text: uploaded.filename,
      },
    ];
  }

  private async buildFileArtifactBlocks(params: {
    channel: string;
    threadTs?: string;
    artifact: AgentArtifactFileContent;
  }): Promise<Array<KnownBlock | SlackBlock | SlackMarkdownBlock>> {
    const { channel, threadTs, artifact } = params;

    await this.uploadLocalFileToSlack({
      channel,
      threadTs,
      localPath: artifact.fileUrl,
      filenameHint: artifact.filename,
      title: artifact.filename,
    });

    return [];
  }

  private isLocalFilePath(filePath: string) {
    return !/^https?:\/\//i.test(filePath);
  }

  private normalizeFilename(input: string) {
    const trimmed = String(input || '').trim();
    if (!trimmed) return 'artifact';
    const parsed = path.basename(trimmed);
    return parsed || 'artifact';
  }

  private async uploadLocalFileToSlack(params: {
    channel: string;
    threadTs?: string;
    localPath: string;
    filenameHint: string;
    title?: string;
  }) {
    const { channel, threadTs, localPath, filenameHint, title } = params;
    const fileBytes = await this.readArtifactBytes(localPath);
    const filename = this.normalizeFilename(filenameHint || localPath);

    const uploadResp = await this.web.files.getUploadURLExternal({
      filename,
      length: fileBytes.length,
    });

    if (!uploadResp.ok || !uploadResp.upload_url || !uploadResp.file_id) {
      throw new Error(
        `files.getUploadURLExternal failed: ${uploadResp.error || 'unknown error'}`,
      );
    }

    const uploadResult = await fetch(uploadResp.upload_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: fileBytes,
    });

    if (!uploadResult.ok) {
      throw new Error(
        `Slack file upload failed with status ${uploadResult.status}`,
      );
    }

    const completeResp = await this.web.files.completeUploadExternal({
      files: [
        {
          id: uploadResp.file_id,
          title: this.normalizeFilename(title || filename),
        },
      ],
      channel_id: channel,
      thread_ts: threadTs,
    });

    if (!completeResp.ok) {
      throw new Error(
        `files.completeUploadExternal failed: ${completeResp.error || 'unknown error'}`,
      );
    }

    const uploadedFile = completeResp.files?.[0];
    return {
      fileId: uploadResp.file_id,
      filename,
      permalink: uploadedFile?.permalink,
    };
  }

  private async readArtifactBytes(filePath: string) {
    if (this.isLocalFilePath(filePath)) {
      return readFile(filePath);
    }

    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch artifact url with status ${response.status}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async sendToWebhook(params: {
    webhookUrl: string;
    markdown: string;
    footerButton?: { text: string; url: string };
    header?: string;
    artifacts?: AgentArtifactContent[];
  }) {
    const { webhookUrl, markdown, footerButton, header, artifacts } = params;
    const { blocks, fallbackText, fallbackMarkdown } =
      this.renderMarkdown(markdown);
    const blocksWithHeader = this.addHeader(blocks, header);
    const blocksWithArtifacts = this.addArtifacts(blocksWithHeader, artifacts);
    const blocksWithFooter = this.addFooter(blocksWithArtifacts, footerButton);

    const webhook = new IncomingWebhook(webhookUrl);

    const ok = await this.sendHook(webhook, {
      text: fallbackText,
      blocks: blocksWithFooter,
    });
    if (ok) return;

    await this.sendHook(webhook, {
      text: fallbackText,
      blocks: this.buildFallbackBlocks({
        fallbackMarkdown,
        footerButton,
      }),
    });
  }

  private renderMarkdown(markdown: string): {
    blocks: Array<
      KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
    >;
    fallbackText: string;
    fallbackMarkdown: string;
  } {
    const fallbackMarkdown = trunc(markdown, 12000);
    const fallbackText = trunc(fallbackMarkdown, 2000);

    const blocks = markdownToBlocks(fallbackMarkdown);
    return { blocks, fallbackText, fallbackMarkdown };
  }

  private addHeader(
    blocks: Array<KnownBlock | SlackBlock | SlackMarkdownBlock>,
    header?: string,
  ): Array<KnownBlock | SlackBlock | SlackMarkdownBlock>;
  private addHeader(
    blocks: Array<
      KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
    >,
    header?: string,
  ): Array<KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock>;
  private addHeader(
    blocks: Array<
      KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
    >,
    header?: string,
  ) {
    if (!header) return blocks;
    return [this.buildHeaderBlock(header), { type: 'divider' }, ...blocks];
  }

  private addFooter(
    blocks: Array<KnownBlock | SlackBlock | SlackMarkdownBlock>,
    footerButton?: { text: string; url: string },
  ): Array<KnownBlock | SlackBlock | SlackMarkdownBlock>;
  private addFooter(
    blocks: Array<
      KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
    >,
    footerButton?: { text: string; url: string },
  ): Array<KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock>;
  private addFooter(
    blocks: Array<
      KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
    >,
    footerButton?: { text: string; url: string },
  ) {
    if (!footerButton) return blocks;
    return _.concat(blocks, this.buildFooterBlock(footerButton), {
      type: 'divider',
    });
  }

  private addArtifacts(
    blocks: Array<KnownBlock | SlackBlock | SlackMarkdownBlock>,
    artifacts?: AgentArtifactContent[],
  ): Array<KnownBlock | SlackBlock | SlackMarkdownBlock>;
  private addArtifacts(
    blocks: Array<
      KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
    >,
    artifacts?: AgentArtifactContent[],
  ): Array<KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock>;
  private addArtifacts(
    blocks: Array<
      KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
    >,
    artifacts?: AgentArtifactContent[],
  ) {
    if (!artifacts || _.isEmpty(artifacts)) return blocks;
    return _.concat(
      blocks,
      { type: 'divider' },
      this.buildArtifactsBlock(artifacts),
    );
  }

  private buildFallbackBlocks(params: {
    fallbackMarkdown: string;
    footerButton?: { text: string; url: string };
  }): Array<KnownBlock | SlackBlock | SlackMarkdownBlock> {
    const { fallbackMarkdown, footerButton } = params;
    return this.addFooter(
      [{ type: 'markdown', text: fallbackMarkdown }],
      footerButton,
    );
  }

  private async postChat(args: {
    channel: string;
    text: string;
    blocks: Array<
      KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
    >;
    thread_ts?: string;
    unfurl_links?: boolean;
    unfurl_media?: boolean;
  }) {
    try {
      return await this.web.chat.postMessage(args);
    } catch (err) {
      this.logger.warn(
        `Slack postMessage threw; falling back to markdown-only`,
        err instanceof Error ? err.stack : undefined,
      );
      return null;
    }
  }

  private async sendHook(
    webhook: IncomingWebhook,
    payload: {
      text: string;
      blocks: Array<
        KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
      >;
    },
  ) {
    try {
      await webhook.send(payload);
      return true;
    } catch (err) {
      this.logger.warn(
        `Slack webhook.send threw; falling back to markdown-only`,
        err instanceof Error ? err.stack : undefined,
      );
      return false;
    }
  }
}

function trunc(markdown: string, maxLen: number) {
  if (markdown.length <= maxLen) return markdown;
  const marker = '\n\n...(truncated)';
  return markdown.slice(0, Math.max(0, maxLen - marker.length)) + marker;
}

type MarkedTableCell = { text: string };
type MarkedTableToken = {
  type: 'table';
  raw: string;
  header: MarkedTableCell[];
  rows: MarkedTableCell[][];
};

function isMarkedTableToken(token: unknown): token is MarkedTableToken {
  if (!token || typeof token !== 'object') return false;
  const t = token as Record<string, unknown>;
  if (t.type !== 'table') return false;
  return Array.isArray(t.header) && Array.isArray(t.rows);
}

function cellText(text: string) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tableBlock(token: MarkedTableToken): SlackTableBlock {
  const header = token.header.map((c) => cellText(c.text));
  const body = token.rows.map((r) => r.map((c) => cellText(c.text)));

  const headerRow: SlackRichTextCell[] = header.map((t) => ({
    type: 'rich_text',
    elements: [
      {
        type: 'rich_text_section',
        elements: [{ type: 'text', text: t || ' ', style: { bold: true } }],
      },
    ],
  }));

  const bodyRows: SlackRawTextCell[][] = body.map((r) =>
    r.map((t) => ({ type: 'raw_text', text: t || ' ' })),
  );

  return {
    type: 'table',
    rows: [headerRow, ...bodyRows],
  };
}

function tokRaw(token: unknown): string | null {
  if (!_.isObjectLike(token)) return null;
  const raw = (token as Record<string, unknown>).raw;
  return _.isString(raw) ? raw : null;
}

function pushMd(
  blocks: Array<KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock>,
  buffer: string,
) {
  const text = _.trim(buffer);
  if (!text) return;
  blocks.push({ type: 'markdown', text });
}

function markdownToBlocks(
  markdown: string,
): Array<KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock> {
  const tokens = marked.lexer(markdown, { gfm: true });

  type State = {
    blocks: Array<
      KnownBlock | SlackBlock | SlackMarkdownBlock | SlackTableBlock
    >;
    buffer: string;
    didEmitTable: boolean;
  };

  const initial: State = { blocks: [], buffer: '', didEmitTable: false };

  const state = _.reduce(
    tokens,
    (s, tok) => {
      if (isMarkedTableToken(tok)) {
        // Slack table blocks are finicky (and docs say one per message). Emit at
        // most one table; subsequent tables are kept as markdown raw content.
        if (s.didEmitTable) {
          s.buffer += tok.raw;
          return s;
        }

        pushMd(s.blocks, s.buffer);
        s.buffer = '';
        s.blocks.push(tableBlock(tok));
        s.didEmitTable = true;
        return s;
      }

      const raw = tokRaw(tok);
      if (raw) {
        s.buffer += raw;
      }
      return s;
    },
    initial,
  );

  pushMd(state.blocks, state.buffer);

  if (_.isEmpty(state.blocks)) {
    return [{ type: 'markdown', text: _.trim(markdown) }];
  }
  return state.blocks;
}
