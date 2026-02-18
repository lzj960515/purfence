import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { WebClient } from '@slack/web-api';
import {
  AgentArtifactContent,
  AgentArtifactFileContent,
  AgentArtifactImageContent,
  AgentArtifactType,
} from '../artifact/agent-artifact-content.dto';

@Injectable()
export class PurfenceSlackService {
  async postMarkdownMessage(params: {
    client: WebClient;
    channel: string;
    markdown: string;
  }) {
    const { client, channel, markdown } = params;
    return client.chat.postMessage({
      channel,
      text: markdown,
      mrkdwn: true,
    });
  }

  async postArtifacts(params: {
    client: WebClient;
    channel: string;
    threadTs?: string;
    artifacts: AgentArtifactContent[];
  }) {
    const { client, channel, threadTs, artifacts } = params;
    for (const artifact of artifacts) {
      if (artifact.type === AgentArtifactType.IMAGE) {
        await this.postImageArtifact({
          client,
          channel,
          threadTs,
          artifact,
        });
        continue;
      }
      if (artifact.type === AgentArtifactType.FILE) {
        await this.postFileArtifact({
          client,
          channel,
          threadTs,
          artifact,
        });
      }
    }
  }

  private async postImageArtifact(params: {
    client: WebClient;
    channel: string;
    threadTs?: string;
    artifact: AgentArtifactImageContent;
  }) {
    const { client, channel, threadTs, artifact } = params;
    console.log('artifact.url', artifact.url);
    if (this.isHttpUrl(artifact.url)) {
      await client.chat.postMessage({
        channel,
        thread_ts: threadTs,
        text: 'image',
        blocks: [
          {
            type: 'image',
            image_url: artifact.url,
            alt_text: 'image',
          },
        ] as any,
      });
      return;
    }
    console.log('artifact.url', artifact.url);

    const uploaded = await this.uploadFile({
      client,
      channel,
      threadTs,
      filePathOrUrl: artifact.url,
      filenameHint: path.basename(artifact.url),
      titleHint: path.basename(artifact.url),
    });
    console.log('uploaded', JSON.stringify(uploaded, null, 2));
    // await client.chat.postMessage({
    //   channel,
    //   thread_ts: threadTs,
    //   text: uploaded.filename,
    //   blocks: [
    //     {
    //       type: 'image',
    //       title: {
    //         type: 'plain_text',
    //         text: uploaded.filename,
    //       },
    //       slack_file: {
    //         id: uploaded.fileId,
    //       },
    //       alt_text: uploaded.filename,
    //     },
    //   ] as any,
    // });
  }

  private async postFileArtifact(params: {
    client: WebClient;
    channel: string;
    threadTs?: string;
    artifact: AgentArtifactFileContent;
  }) {
    const { client, channel, threadTs, artifact } = params;
    await this.uploadFile({
      client,
      channel,
      threadTs,
      filePathOrUrl: artifact.fileUrl,
      filenameHint: artifact.filename,
      titleHint: artifact.filename,
    });
  }

  private async uploadFile(params: {
    client: WebClient;
    channel: string;
    threadTs?: string;
    filePathOrUrl: string;
    filenameHint?: string;
    titleHint?: string;
  }) {
    const {
      client,
      channel,
      threadTs,
      filePathOrUrl,
      filenameHint,
      titleHint,
    } = params;
    const fileBytes = await this.readBytes(filePathOrUrl);
    const filename = this.normalizeFilename(filenameHint || filePathOrUrl);
    const upload = await client.files.getUploadURLExternal({
      filename,
      length: fileBytes.length,
    });
    console.log('upload', JSON.stringify(upload, null, 2));
    if (!upload.ok || !upload.upload_url || !upload.file_id) {
      throw new Error(
        `files.getUploadURLExternal failed: ${upload.error || 'unknown error'}`,
      );
    }

    const uploadResp = await fetch(upload.upload_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: fileBytes,
    });
    if (!uploadResp.ok) {
      throw new Error(`Slack upload failed with status ${uploadResp.status}`);
    }

    const complete = await client.files.completeUploadExternal({
      files: [
        {
          id: upload.file_id,
          title: this.normalizeFilename(titleHint || filename),
        },
      ],
      channel_id: channel,
      thread_ts: threadTs,
    });

    if (!complete.ok) {
      throw new Error(
        `files.completeUploadExternal failed: ${complete.error || 'unknown error'}`,
      );
    }

    return {
      fileId: upload.file_id,
      filename,
    };
  }

  private async readBytes(filePathOrUrl: string) {
    if (this.isHttpUrl(filePathOrUrl)) {
      const response = await fetch(filePathOrUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch file url with status ${response.status}`,
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    return readFile(filePathOrUrl);
  }

  private normalizeFilename(input: string) {
    const value = String(input || '').trim();
    if (!value) {
      return 'artifact';
    }
    const name = path.basename(value);
    return name || 'artifact';
  }

  private isHttpUrl(value: string) {
    return /^https?:\/\//i.test(value);
  }
}
