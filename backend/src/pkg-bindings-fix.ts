import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const localRequire = createRequire(__filename);

function isPkgRuntime() {
  return Boolean((process as any).pkg);
}

function getBundledSqliteAddonPath() {
  const execDir = dirname(process.execPath);
  const candidates = [
    resolve(execDir, 'node_sqlite3.node'),
    resolve(execDir, '..', 'Resources', 'binaries', 'node_sqlite3.node'),
  ];

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
}

function patchDlopenForSqliteAddon() {
  // In some pkg+ncc builds, sqlite3's bindings may still resolve to the extracted
  // ~/.cache/pkg/... addon. On hardened runtime macOS builds, that extracted file
  // can fail TeamID validation. Redirect dlopen to the signed app-bundled addon.
  const addonPath = getBundledSqliteAddonPath();
  if (!addonPath) return;

  if (process.env.APP_ENV === 'desktop') {
    try {
      process.stderr.write(`[purfence] sqlite addon path: ${addonPath}\n`);
    } catch {
      // ignore
    }
  }

  const proc = process as unknown as {
    dlopen?: (module: unknown, filename: string) => unknown;
  };
  const original = proc.dlopen;
  if (typeof original !== 'function') return;

  proc.dlopen = (module: unknown, filename: string) => {
    if (
      typeof filename === 'string' &&
      filename.endsWith('node_sqlite3.node')
    ) {
      return original(module, addonPath);
    }
    return original(module, filename);
  };
}

function patchTypeOrmSqliteLoader() {
  let platformTools: {
    load?: (name: string) => unknown;
    __purfenceSqlitePatched?: boolean;
  } | null = null;

  try {
    platformTools = localRequire(
      'typeorm/platform/PlatformTools',
    )?.PlatformTools;
  } catch {
    return;
  }

  if (!platformTools || typeof platformTools.load !== 'function') return;
  if (platformTools.__purfenceSqlitePatched) return;

  const originalLoad = platformTools.load.bind(platformTools);
  platformTools.load = (name: string) => {
    if (name === 'sqlite3') {
      return localRequire('sqlite3');
    }
    return originalLoad(name);
  };
  platformTools.__purfenceSqlitePatched = true;
}

function patchModuleLoadForSqlite() {
  let sqliteResolved: string | undefined;
  try {
    sqliteResolved = localRequire.resolve('sqlite3');
  } catch {
    return;
  }

  type ModuleLike = {
    _load?: (request: string, parent: unknown, isMain: boolean) => unknown;
    __purfenceSqliteLoadPatched?: boolean;
  };

  const mod = localRequire('module') as ModuleLike;
  if (typeof mod._load !== 'function') return;
  if (mod.__purfenceSqliteLoadPatched) return;

  const originalLoad = mod._load.bind(mod);
  mod._load = (request: string, parent: unknown, isMain: boolean) => {
    if (
      request === 'sqlite3' ||
      request.endsWith('/node_modules/sqlite3') ||
      request.endsWith('\\node_modules\\sqlite3')
    ) {
      return originalLoad(sqliteResolved, parent, isMain);
    }
    return originalLoad(request, parent, isMain);
  };
  mod.__purfenceSqliteLoadPatched = true;
}

export function patchBindingsForPkg() {
  if (!isPkgRuntime()) return;

  patchDlopenForSqliteAddon();
  patchModuleLoadForSqlite();
  patchTypeOrmSqliteLoader();

  let bindingsPath: string | undefined;
  try {
    bindingsPath = localRequire.resolve('bindings');
  } catch {
    return;
  }

  const cached = localRequire.cache?.[bindingsPath];
  const original: any = cached?.exports ?? localRequire('bindings');

  const fixed: any = function fixedBindings(name: any, opts?: any) {
    if (name === 'node_sqlite3.node') {
      const p = getBundledSqliteAddonPath();
      if (p) return localRequire(p);
    }

    return original(name, opts);
  };

  Object.assign(fixed, original);
  if (cached) cached.exports = fixed;
}

patchBindingsForPkg();
