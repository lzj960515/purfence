import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MyAgentService, MessageService } from '@app/my-agent';
import { Memory } from '@voltagent/core';
import type { Response } from 'express';
import { PurfenceConfig, ConfigKey } from './purfence-config/purfence-config.entity';
import { ensureDir } from '@src/common/utils/file.util';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

const USER_ID = 'purfence';

const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('agent')
export class AgentController {
  constructor(
    private readonly myAgentService: MyAgentService,
    private readonly messageService: MessageService,
  ) {}

  private get memory(): Memory {
    return (this.messageService as any).memory;
  }

  @Get('tools')
  getTools() {
    const tools = this.myAgentService.getTools();
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));
  }

  @Get('conversations')
  async getConversations() {
    const conversations = await this.memory.getConversationsByUserId(USER_ID, {
      limit: 20,
      orderBy: 'updated_at',
      orderDirection: 'DESC',
    });
    return conversations;
  }

  @Get('conversations/:threadId/messages')
  async getMessages(@Param('threadId') threadId: string) {
    const messages = await this.messageService.loadHistoryMessages(
      USER_ID,
      threadId,
      {},
    );
    return messages;
  }

  @Get('file')
  getFileByPath(@Query('path') filePath: string, @Res() res: Response) {
    if (!filePath) {
      throw new BadRequestException('path is required');
    }

    return res.sendFile(filePath);
  }

  @Delete('conversations/:threadId')
  async deleteConversation(@Param('threadId') threadId: string) {
    await this.messageService.deleteConversation(threadId);
    return { success: true };
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `Invalid file type. Allowed types: png, jpg, jpeg, gif, webp`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('conversationId') conversationId: string,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    if (!conversationId) {
      throw new BadRequestException('conversationId is required');
    }

    const projectsRootPath = await this.getProjectsRootPathOrThrow();

    // Build save path: ~/purfence/projects/images/<conversation-id>/
    const imagesDir = path.join(
      projectsRootPath,
      '..',
      'images',
      conversationId,
    );

    // Generate filename: YYYYMMDD-HHMMSS-<random>.<ext>
    const now = new Date();
    const timestamp =
      now.toISOString().slice(0, 10).replace(/-/g, '') +
      '-' +
      now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = randomBytes(4).toString('hex');
    const ext = path.extname(file.originalname) || '.png';
    const filename = `${timestamp}-${random}${ext}`;

    const filePath = path.join(imagesDir, filename);

    // Ensure directory exists and write file
    await ensureDir(imagesDir);
    await writeFile(filePath, file.buffer);

    // Return file path (frontend will construct URL)
    return {
      success: true,
      path: filePath,
    };
  }

  private async getProjectsRootPathOrThrow(): Promise<string> {
    const config = await PurfenceConfig.findOne({
      where: { key: ConfigKey.PROJECTS_ROOT_PATH },
    });
    const value = (config?.value as string | undefined)?.trim();
    if (!value) {
      throw new BadRequestException(
        'PROJECTS_ROOT_PATH is required. Please configure it in 基础配置.',
      );
    }
    return value;
  }
}
