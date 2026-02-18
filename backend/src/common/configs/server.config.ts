import { registerAs } from '@nestjs/config';
import process from 'node:process';

export default registerAs('server', () => {
  const port = +process.env.SERVER_PORT || 1016;
  const APP_ENV = process.env.APP_ENV || 'development';
  return {
    APP_ENV,
    shortEnv: APP_ENV.substring(0, 1).toUpperCase(),
    isProduction: APP_ENV === 'production',
    port,
    url: process.env.CI_ENVIRONMENT_URL || `http://localhost:${port}`,
    name: process.env.npm_package_name || 'nas-gs-api',
    version: process.env.npm_package_version || '0.1.0',
    commitHash: process.env.CI_COMMIT_SHORT_SHA || 'no-git',
  };
});
