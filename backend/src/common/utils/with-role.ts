import { AuthService } from '@nest-mods/auth';
import { ForbiddenException, Logger } from '@nestjs/common';
import { Extensions, FieldMiddleware } from '@nestjs/graphql';

const logger = new Logger('auth:with-role');

export function createWithRoleFieldMiddleware(
  service: AuthService,
): FieldMiddleware {
  return ({ context, info }, next) => {
    const user = context.req?.user;
    if (!info) return next();
    const name = info.fieldName;
    const {
      extensions: { roles },
    } = info.parentType.getFields()[name] as {
      extensions: { roles?: string[] };
    };

    if (!roles) return next();

    logger.verbose(
      `${
        user ? `${user.sub} with [${user.roles}]` : 'anonymous'
      } try to access field ${name} requires [${roles}]`,
    );
    const granted = service.canAccess(user, roles);
    if (granted) return next();
    throw new ForbiddenException(
      `当前用户无权访问字段[${info.parentType.name}.${name}]`,
    );
  };
}

export function WithRole(...roles: string[]) {
  return Extensions({ roles });
}
