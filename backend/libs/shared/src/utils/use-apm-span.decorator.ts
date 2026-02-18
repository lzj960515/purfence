import { MyUtil } from '@app/shared';
import {
  CONTROLLER_WATERMARK,
  INJECTABLE_WATERMARK,
} from '@nestjs/common/constants';
import { RESOLVER_NAME_METADATA } from '@nestjs/graphql';
import apm from 'elastic-apm-node';

function getSubtype(target: any) {
  if (
    Reflect.getMetadata(INJECTABLE_WATERMARK, target) ||
    Reflect.getMetadata('bull:module_queue', target)
  ) {
    return 'service';
  } else if (Reflect.getMetadata(RESOLVER_NAME_METADATA, target)) {
    return 'resolver';
  } else if (Reflect.getMetadata(CONTROLLER_WATERMARK, target)) {
    return 'controller';
  }
}

/**
 * UseApmSpan
 * @see apm.startSpan
 */
export function UseApmSpan(): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const spanName = `${target.constructor.name}#${String(propertyKey)}`;
    // eslint-disable-next-line @typescript-eslint/ban-types
    const fn = descriptor.value as Function;
    descriptor.value = async function (...args: any) {
      const span = apm.startSpan(
        spanName,
        'app',
        getSubtype(target.constructor),
        'invoke',
      );
      if (!span) {
        return await fn.apply(this, args);
      }
      try {
        span.outcome = 'success';
        return await fn.apply(this, args);
      } catch (e) {
        span.outcome = 'failure';
        throw e;
      } finally {
        span.end();
      }
    };

    MyUtil.copyMetadata(fn, descriptor.value);

    return descriptor;
  };
}
