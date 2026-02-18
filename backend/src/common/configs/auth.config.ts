import { AuthModuleOptions } from '@nest-mods/auth';
import { registerAs } from '@nestjs/config';
import yn from 'yn';
import { BcryptPasswordEncoder } from '../utils/bcrypt-password-encoder';

export default registerAs('auth', () => {
  const thisApp =
    process.env.AUTH_THIS_APP || process.env.npm_package_name || 'app';
  const forApps = process.env.AUTH_FOR_APPS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) || [thisApp];

  return {
    secret: process.env.AUTH_SECRET || 'secret',
    thisApp,
    forApps,
    session: true,
    expiresIn: process.env.AUTH_EXPIRES_IN || '31 days',
    su: process.env.AUTH_SU || 'root',
    suRoles: ['ADMIN'],
    ignoreJti: yn(process.env.AUTH_IGNORE_JTI),
    passwordEncoder: BcryptPasswordEncoder.getInstance(),
    loadUserBySub: async () => null,
  } satisfies AuthModuleOptions;
});
