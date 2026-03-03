import { CacheService } from '@app/cache';
import { MyAgentService } from '@app/my-agent';
import { SocketService } from '@app/my-agent/socket.service';
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import type {
  ChatAnyArgs,
  ChatExecutionArgs,
  SseSocketArgs,
} from './agent.args';
import { PurfenceAgentService } from './agent.service';

@WebSocketGateway({
  namespace: 'agent',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class AgentGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(AgentGateway.name);

  @WebSocketServer()
  nsp: Namespace;

  constructor(
    private readonly myAgentService: MyAgentService,
    private readonly purfenceAgentService: PurfenceAgentService,
  ) {}

  afterInit() {
    SocketService.setNamespace(this.nsp);
    this.nsp.on('session_terminate', (threadId: string) => {
      this.myAgentService.sessionTerminate(threadId);
    });
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    // No authentication required
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {}

  @SubscribeMessage('session_open')
  async sessionOpen(
    @ConnectedSocket() client: Socket,
    @MessageBody('threadId') threadId: string,
  ) {
    this.logger.log(`sessionOpen threadId: ${threadId}`);
    await client.join(threadId);
    const state = await CacheService.cacheGet<{ streaming: boolean }>(
      `ai-agent:${threadId}`,
    );
    client.emit(state?.streaming ? 'stream_active' : 'session_ready', {
      threadId,
    });
  }

  @SubscribeMessage('session_close')
  async sessionClose(
    @ConnectedSocket() client: Socket,
    @MessageBody('threadId') threadId: string,
  ) {
    await client.leave(threadId);
  }

  @SubscribeMessage('session_terminate')
  async sessionTerminate(
    @ConnectedSocket() client: Socket,
    @MessageBody('threadId') threadId: string,
  ) {
    if (!this.myAgentService.sessionTerminate(threadId)) {
      this.nsp.serverSideEmit('session_terminate', { threadId });
    }
  }

  @SubscribeMessage('chat')
  async handleChatAny(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    args: ChatAnyArgs,
  ) {
    await this.chatAny(client, args);
  }

  private async chatAny(client: Socket, args: ChatAnyArgs) {
    const { threadId, query, providerName, imageUrl } = args;

    await this.purfenceAgentService.streamZiwei({
      threadId,
      query,
      providerName,
      imageUrl,
    });
  }

  /**
   * 处理 chat_execution 事件
   * 根据指定的 agent 类型（tianji/tianfu）继续执行 Execution
   */
  @SubscribeMessage('chat_execution')
  async handleChatExecution(
    @ConnectedSocket() client: Socket,
    @MessageBody() args: ChatExecutionArgs,
  ) {
    const { message, conversationId, agent, executionId, providerName } = args;

    this.logger.log(
      `chat_execution: executionId=${executionId}, agent=${agent}, conversationId=${conversationId}`,
    );

    await this.purfenceAgentService.streamExecutionAgent({
      threadId: conversationId,
      query: message,
      agent,
      executionId,
      providerName,
    });
  }
}
