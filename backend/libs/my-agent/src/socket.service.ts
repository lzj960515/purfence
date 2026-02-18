import { CacheService } from '@app/cache';
import ms from 'ms';
import { finalize, Observable, tap } from 'rxjs';
import { Namespace } from 'socket.io';

type StreamMirror = {
  handle: (event: string, data: any) => Promise<void> | void;
  close?: () => Promise<void> | void;
};

export class SocketService {
  static namespace: Namespace;
  static workflowNamespace?: Namespace;
  static streamMirrors = new Map<string, StreamMirror>();
  static streamMirrorQueues = new Map<string, Promise<void>>();

  static setNamespace(nsp: Namespace) {
    SocketService.namespace = nsp;
  }

  static broadcast(threadId: string, event: string, data: any) {
    SocketService.namespace?.to(threadId).emit(event, data);

    const mirror = SocketService.streamMirrors.get(threadId);
    if (mirror) {
      const prev = SocketService.streamMirrorQueues.get(threadId);
      const chain = (prev || Promise.resolve())
        .catch(() => undefined)
        .then(() => Promise.resolve(mirror.handle(event, data)))
        .then(() => undefined)
        .catch((error) =>
          console.error('stream mirror error', error, event, data),
        );
      SocketService.streamMirrorQueues.set(threadId, chain);
    }
  }

  static registerStreamMirror(threadId: string, mirror: StreamMirror) {
    SocketService.streamMirrors.set(threadId, mirror);
  }

  static async unregisterStreamMirror(threadId: string) {
    const mirror = SocketService.streamMirrors.get(threadId);
    SocketService.streamMirrors.delete(threadId);
    const queue = SocketService.streamMirrorQueues.get(threadId);
    SocketService.streamMirrorQueues.delete(threadId);
    await queue?.catch(() => undefined);
    await mirror?.close?.();
  }

  static setWorkflowNamespace(nsp: Namespace) {
    SocketService.workflowNamespace = nsp;
  }

  static broadcastWorkflow(threadId: string, event: string, data: any) {
    SocketService.workflowNamespace.to(threadId).emit(event, data);
  }

  static async warpSocket(
    threadId: string,
    streamAny: () => Promise<Observable<any>> | Observable<any>,
  ) {
    const cacheKey = `ai-agent:${threadId}`;

    SocketService.broadcast(threadId, 'stream_started', { threadId });

    const heartbeat = async () => {
      await CacheService.cacheSet(
        cacheKey,
        {
          streaming: true,
        },
        ms('30s'),
      );
    };

    await heartbeat();

    const heartbeatTimer = setInterval(() => {
      void heartbeat();
    }, ms('15s'));

    try {
      const stream$ = await streamAny();

      return stream$
        .pipe(
          tap((event) => {
            SocketService.broadcast(threadId, 'message', event.data);
          }),
          finalize(() => {
            clearInterval(heartbeatTimer);
            void CacheService.cacheDel(cacheKey);
            SocketService.broadcast(threadId, 'stream_done', { threadId });
            void SocketService.unregisterStreamMirror(threadId);
          }),
        )
        .subscribe({
          error: (error) => {
            SocketService.broadcast(threadId, 'error', {
              message: (error as Error).message || String(error),
            });
          },
        });
    } catch (error) {
      SocketService.broadcast(threadId, 'error', {
        message: (error as Error).message || String(error),
      });
      clearInterval(heartbeatTimer);
      await CacheService.cacheDel(cacheKey);
      await SocketService.unregisterStreamMirror(threadId);
    }
  }
}
