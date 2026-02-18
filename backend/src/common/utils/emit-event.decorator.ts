import { MyUtil } from '@app/shared';
import { CommonService } from '../common.service';

export function EmitEvent(event: string): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const originalMethod = descriptor.value as (...args: any[]) => any;
    descriptor.value = async function (...args) {
      try {
        const result = await originalMethod.apply(this, args);
        CommonService.emit(event, result);
        return result;
      } catch (e) {
        throw e;
      }
    };

    // restore metadata
    MyUtil.copyMetadata(originalMethod, descriptor.value);
  };
}
