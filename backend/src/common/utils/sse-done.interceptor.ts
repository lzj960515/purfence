import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import ms from 'ms';
import { finalize } from 'rxjs';

@Injectable()
export class SseDoneInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const response = context.switchToHttp().getResponse<Response>();

    // 创建心跳定时器
    const pingTimer = setInterval(() => {
      // 发送SSE注释作为心跳
      response.write(': ping\n\n');
    }, ms('5s'));

    return next.handle().pipe(
      // 留结束时发送[DONE]并清除心跳定时器
      finalize(() => {
        clearInterval(pingTimer);
        response.write('data: [DONE]\n\n');
      }),
    );
  }
}
