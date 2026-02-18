import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { MyAgentService, MessageService } from '@app/my-agent';
import { Memory } from '@voltagent/core';
import type { Response } from 'express';

const USER_ID = 'purfence';

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
}
