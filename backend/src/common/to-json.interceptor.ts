import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

/**
 * 尝试调用`toJson`方法, 将实体类转换成`POJO`
 *
 * 当`GRAPHQL_MOCKS=true`时, 直接返回的单独的实体类会被不明原因调用`remove`方法.
 * 所以这个拦截器可以把返回值中有`toJson`方法的对象都调用一次, 转换成一般对象.
 * 有`remove`方法的实体类都有`toJson`方法.
 */
@Injectable()
export class ToJsonInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next
      .handle()
      .pipe(map((o) => (typeof o?.toJSON === 'function' ? o.toJSON() : o)));
  }
}
