import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

if (process.platform !== 'darwin') {
  process.exit(0);
}

const identity = process.env.APPLE_SIGNING_IDENTITY;
if (!identity) {
  process.exit(0);
}

const repoRoot = resolve(process.cwd());
const binariesDir = join(repoRoot, 'src-tauri', 'binaries');
const sidecarEntitlements = join(repoRoot, 'src-tauri', 'entitlements.sidecar.plist');
const filesToSign = [];

function collectSignableFiles(dirPath, result) {
  if (!existsSync(dirPath)) return;

  for (const entry of readdirSync(dirPath)) {
    const fullPath = join(dirPath, entry);
    const st = statSync(fullPath);

    if (st.isDirectory()) {
      collectSignableFiles(fullPath, result);
      continue;
    }

    const isNodeAddon = entry.endsWith('.node');
    const isExecutable = (st.mode & 0o111) !== 0;
    const isWindowsExe = entry.endsWith('.exe');
    if (isNodeAddon || isExecutable || isWindowsExe) {
      result.push(fullPath);
    }
  }
}

const sqliteAddon = join(binariesDir, 'node_sqlite3.node');
if (existsSync(sqliteAddon)) {
  filesToSign.push(sqliteAddon);
}

if (existsSync(binariesDir)) {
  for (const entry of readdirSync(binariesDir)) {
    if (entry.startsWith('purfence-backend-')) {
      filesToSign.push(join(binariesDir, entry));
    }
  }
}

for (const filePath of filesToSign) {
  const isSidecar = filePath.includes(`${binariesDir}/purfence-backend-`);
  const result = spawnSync(
    'codesign',
    [
      '--force',
      '--timestamp',
      '--options',
      'runtime',
      '--sign',
      identity,
      ...(isSidecar && existsSync(sidecarEntitlements)
        ? ['--entitlements', sidecarEntitlements]
        : []),
      filePath,
    ],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
