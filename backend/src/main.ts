import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import './pkg-bindings-fix';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import ms from 'ms';
import { BootstrapModule } from './bootstrap.module';
import serverConfig from './common/configs/server.config';

const logger = new Logger('main');

const localRequire = createRequire(__filename);

function normalizeDesktopPath() {
  if (process.env.APP_ENV !== 'desktop') return;

  const home = os.homedir();
  const existing = new Set((process.env.PATH ?? '').split(delimiter).filter(Boolean));

  const candidates =
    process.platform === 'win32'
      ? [
          join(home, 'AppData', 'Roaming', 'npm'),
          join(home, '.local', 'bin'),
          join(home, 'scoop', 'shims'),
        ]
      : [
          join(home, '.local', 'bin'),
          '/opt/homebrew/bin',
          '/usr/local/bin',
        ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      existing.add(candidate);
    }
  }

  process.env.PATH = Array.from(existing).join(delimiter);
}

function initFileLogging() {
  const logPath = process.env.PURFENCE_LOG_PATH;
  if (!logPath) return;

  try {
    mkdirSync(dirname(logPath), { recursive: true });
    const stream = createWriteStream(logPath, { flags: 'a' });

    type WriteFn = (...args: unknown[]) => boolean;

    // Tee stdout/stderr into a persistent file. Keep writes best-effort.
    const outWrite = process.stdout.write.bind(process.stdout) as unknown as WriteFn;
    const errWrite = process.stderr.write.bind(process.stderr) as unknown as WriteFn;

    const wrap = (orig: WriteFn): WriteFn => (...args) => {
      const chunk = args[0];
      try {
        if (typeof chunk === 'string' || chunk instanceof Uint8Array) {
          stream.write(chunk);
        }
      } catch {
        // ignore
      }
      return orig(...args);
    };

    const stdout = process.stdout as unknown as { write: WriteFn };
    const stderr = process.stderr as unknown as { write: WriteFn };
    stdout.write = wrap(outWrite);
    stderr.write = wrap(errWrite);

    process.stderr.write(`[purfence] logging to ${logPath}\n`);
  } catch (e) {
    // Do not fail the process if logging setup fails.
    try {
      process.stderr.write(`[purfence] failed to init log file: ${String(e)}\n`);
    } catch {
      // ignore
    }
  }
}

async function bootstrap() {
  normalizeDesktopPath();
  initFileLogging();

  // Ensure sqlite3 is loaded after pkg binding patches and file logging are set.
  localRequire('sqlite3');

  const app: NestExpressApplication = await NestFactory.create(
    BootstrapModule,
    { cors: true, rawBody: true },
  );

  // 使用默认的内存 WebSocket 适配器（单实例部署）

  // Keep backend routes under /api to avoid colliding with SPA routes.
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'graphql', method: RequestMethod.ALL },
      { path: '__health', method: RequestMethod.ALL },
      { path: 'favicon.ico', method: RequestMethod.GET },
    ],
  });

  const serverOptions: ConfigType<typeof serverConfig> = app
    .get(ConfigService)
    .get('server');

  app.useBodyParser('json', { limit: '100mb' });
  app.useBodyParser('urlencoded', { limit: '100mb', extended: true });
  app.enable('trust proxy');
  app.enableShutdownHooks();

  // SPA fallback: serve static/index.html for non-API GET routes.
  await app.init();
  const staticIndexPath = join(process.cwd(), 'static', 'index.html');
  if (existsSync(staticIndexPath)) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get(
      /^\/(?!api(?:\/|$)|graphql(?:\/|$)).*/,
      (_req: any, res: any) => res.sendFile(staticIndexPath),
    );
  }

  const port = serverOptions.port;
  const APP_ENV = serverOptions.APP_ENV;

  const server = await app.listen(port, () =>
    logger.warn(`server is listening at ${port} [${APP_ENV}]`),
  );
  server.keepAliveTimeout = ms('60s');
}

bootstrap().catch((e) => {
  logger.error('bootstrap fatal error:', e);
});
