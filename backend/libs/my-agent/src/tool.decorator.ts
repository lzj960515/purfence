import { applyDecorators, Logger } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { ToolOptions, ToolSchema } from '@voltagent/core';
import _ from 'lodash';
import { z } from 'zod';

const logger = new Logger('ToolDecorator');

export interface MyAgentToolOptions<
  T extends ToolSchema = ToolSchema,
  O extends ToolSchema | undefined = undefined,
> extends Partial<Omit<ToolOptions<T, O>, 'execute'>> {
  /**
   * @deprecated
   * @see ToolOptions.parameters
   */
  schema?: Record<string, z.ZodTypeAny>;
  interrupt?: any;
}

export const ToolWatermark = DiscoveryService.createDecorator();
export const ToolOpt = Reflector.createDecorator<MyAgentToolOptions>({
  key: 'MY_AGENT_TOOL_OPTIONS',
});

export function Tool<
  T extends ToolSchema = ToolSchema,
  O extends ToolSchema | undefined = undefined,
>(options?: MyAgentToolOptions<T, O>) {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<ToolOptions<T, O>['execute']>,
  ) => {
    options = _.defaults(options, {
      name: String(propertyKey),
      description: String(propertyKey),
      parameters: options.parameters || z.object(options.schema || {}),
    } as ToolOptions);
    delete options.schema;
    // Mark the class as a tools host by applying the watermark decorator
    const ctor = typeof target === 'function' ? target : target.constructor;
    applyDecorators(ToolWatermark())(ctor);
    applyDecorators(ToolOpt(options as any))(target, propertyKey, descriptor);
  };
}
