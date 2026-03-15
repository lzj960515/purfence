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
import type { ChatAnyArgs, ChatExecutionArgs } from './agent.args';
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

  handleConnection(@ConnectedSocket() _client: Socket) {
    void _client;
    // No authentication required
  }

  handleDisconnect(@ConnectedSocket() _client: Socket) {
    void _client;
  }

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
  sessionTerminate(
    @ConnectedSocket() client: Socket,
    @MessageBody('threadId') threadId: string,
  ) {
    if (!this.myAgentService.sessionTerminate(threadId)) {
      this.nsp.serverSideEmit('session_terminate', { threadId });
    }
  }

  @SubscribeMessage('chat')
  async handleChatAny(
    @ConnectedSocket() _client: Socket,
    @MessageBody()
    args: ChatAnyArgs,
  ) {
    const { threadId, query, agentId, imageUrl } = args;

    await this.purfenceAgentService.streamAgent({
      userId: 'purfence',
      threadId,
      query,
      agentId,
      imageUrl,
    });
  }
}
