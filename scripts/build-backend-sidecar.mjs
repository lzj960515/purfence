import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: false,
    ...opts,
  });

  if (res.error) {
    process.stderr.write(`\n[sidecar] failed to spawn ${cmd}: ${String(res.error)}\n`);
    process.exit(1);
  }
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function runNpx(args, opts = {}) {
  // On Windows, `npx.cmd` is a batch script; spawning it with `shell:false` can
  // fail (e.g. EINVAL) depending on Node + runner environment. Use cmd.exe.
  if (process.platform === 'win32') {
    const comspec = process.env.ComSpec || 'cmd.exe';
    run(comspec, ['/d', '/s', '/c', 'npx', ...args], opts);
    return;
  }

  run('npx', args, opts);
}

function assertSupported() {
  if (process.platform !== 'darwin' && process.platform !== 'win32') {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
  if (process.arch !== 'arm64' && process.arch !== 'x64') {
    throw new Error(`Unsupported arch: ${process.arch}`);
  }
}

assertSupported();

const repoRoot = process.cwd();
const packagingDir = resolve(repoRoot, 'packaging');
const nccOutDir = join(packagingDir, 'ncc');
const nccEntry = join(nccOutDir, 'index.js');
const outBinary = join(
  packagingDir,
  process.platform === 'win32' ? 'purfence-backend.exe' : 'purfence-backend',
);
const binariesDir = resolve(repoRoot, 'src-tauri', 'binaries');
const sqliteBuildDir = resolve(repoRoot, 'node_modules', 'sqlite3', 'build');
const sqliteReleaseAddon = join(sqliteBuildDir, 'Release', 'node_sqlite3.node');
const sqliteFlatAddon = join(sqliteBuildDir, 'node_sqlite3.node');
const builtinAgentsSrcDir = resolve(repoRoot, 'backend', 'src', 'purfence', 'agents');
const builtinAgentsOutDir = join(binariesDir, 'agents');
const claudeAgentSdkSrcDir = resolve(repoRoot, 'node_modules', '@anthropic-ai', 'claude-agent-sdk');
const claudeAgentSdkOutDir = join(binariesDir, 'claude-agent-sdk');

mkdirSync(packagingDir, { recursive: true });
mkdirSync(binariesDir, { recursive: true });

// Clean previous ncc output to avoid stale assets.
rmSync(nccOutDir, { recursive: true, force: true });

runNpx(['-y', '@vercel/ncc', 'build', 'backend/dist/main.js', '-o', nccOutDir]);

// pkg's snapshot fs can fail early on sqlite3's first probe path (`build/node_sqlite3.node`).
// Mirror Release addon to that path so pkg can include and resolve it.
try {
  copyFileSync(sqliteReleaseAddon, sqliteFlatAddon);
} catch {
  // ignore when sqlite3 addon is unavailable
}

let pkgTarget;
let tauriTriple;
if (process.platform === 'darwin') {
  pkgTarget = `node22-macos-${process.arch === 'arm64' ? 'arm64' : 'x64'}`;
  tauriTriple = process.arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
} else {
  pkgTarget = `node22-win-${process.arch === 'arm64' ? 'arm64' : 'x64'}`;
  tauriTriple = process.arch === 'arm64' ? 'aarch64-pc-windows-msvc' : 'x86_64-pc-windows-msvc';
}

runNpx(
  [
    '-y',
    '@yao-pkg/pkg',
    nccEntry,
    '-c',
    'packaging/pkg.config.json',
    '-t',
    pkgTarget,
    '--output',
    outBinary,
    '--no-bytecode',
    '--public-packages',
    '*',
    '--public',
  ],
  {
    env: {
      ...process.env,
      NO_COLOR: '1',
      FORCE_COLOR: '0',
    },
  },
);

if (process.platform !== 'win32') {
  chmodSync(outBinary, 0o755);
}

// Ensure sqlite3 native addon is available on disk for pkg runtime.
// In pkg, native .node modules cannot be loaded from the virtual /snapshot path.
const sqliteNodeAddon = join(nccOutDir, 'build', 'Release', 'node_sqlite3.node');
const sqliteNodeAddonOut = join(binariesDir, 'node_sqlite3.node');
try {
  copyFileSync(sqliteNodeAddon, sqliteNodeAddonOut);
  if (process.platform !== 'win32') {
    chmodSync(sqliteNodeAddonOut, 0o755);
  }
} catch {
  // ignore if addon is not present
}

if (existsSync(builtinAgentsSrcDir)) {
  rmSync(builtinAgentsOutDir, { recursive: true, force: true });
  cpSync(builtinAgentsSrcDir, builtinAgentsOutDir, { recursive: true });
}

if (existsSync(claudeAgentSdkSrcDir)) {
  rmSync(claudeAgentSdkOutDir, { recursive: true, force: true });
  cpSync(claudeAgentSdkSrcDir, claudeAgentSdkOutDir, { recursive: true });
}

const tauriSidecarPath = join(
  binariesDir,
  `purfence-backend-${tauriTriple}${process.platform === 'win32' ? '.exe' : ''}`,
);
copyFileSync(outBinary, tauriSidecarPath);
if (process.platform !== 'win32') {
  chmodSync(tauriSidecarPath, 0o755);
}

process.stdout.write(`\nSidecar ready: ${tauriSidecarPath}\n`);
