#!/usr/bin/env node

/**
 * Purfence 发布脚本
 *
 * 功能：
 * 1. 版本号管理（同步更新 package.json, Cargo.toml, tauri.conf.json）
 * 2. Git 标签创建
 * 3. 发布前检查
 * 4. 推送标签触发 CI/CD 自动构建
 *
 * 使用方式：
 *   npm run release <version>     # 例如: npm run release 0.4.16
 *   npm run release v0.4.16       # 带 v 前缀也可以
 *   node scripts/release.mjs <version> [--dry-run] [--no-push]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const repoRoot = process.cwd();
const rootPackagePath = resolve(repoRoot, 'package.json');
const tauriConfPath = resolve(repoRoot, 'src-tauri', 'tauri.conf.json');
const cargoTomlPath = resolve(repoRoot, 'src-tauri', 'Cargo.toml');

// 解析参数
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldPush = !args.includes('--no-push');
const inputVersion = args.find(arg => !arg.startsWith('--'));

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  if (isDryRun) {
    log(`[DRY-RUN] ${description}: ${command}`, 'yellow');
    return '';
  }
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✓ ${description}`, 'green');
    return output.trim();
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
    throw error;
  }
}

function validateVersion(version) {
  const normalized = version.startsWith('v') ? version.slice(1) : version;
  const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

  if (!semverPattern.test(normalized)) {
    log(`Invalid version: ${version}`, 'red');
    log('Expected format: 0.4.16 or v0.4.16 (supports prerelease/build metadata)', 'yellow');
    process.exit(1);
  }

  return normalized;
}

function getCurrentVersions() {
  // 读取当前版本
  const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
  const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf8'));
  const cargoToml = readFileSync(cargoTomlPath, 'utf8');
  const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];

  return {
    root: rootPackage.version,
    tauri: tauriConf.version,
    cargo: cargoVersion,
  };
}

function updateVersions(newVersion) {
  log(`\n📝 Updating versions to ${newVersion}...`, 'blue');

  // 1. 更新根 package.json
  if (!isDryRun) {
    const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
    rootPackage.version = newVersion;
    writeFileSync(rootPackagePath, `${JSON.stringify(rootPackage, null, 2)}\n`);
    log('  ✓ Updated package.json', 'green');
  } else {
    log('  [DRY-RUN] Would update package.json', 'yellow');
  }

  // 2. 更新 tauri.conf.json
  if (!isDryRun) {
    const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf8'));
    tauriConf.version = newVersion;
    writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`);
    log('  ✓ Updated src-tauri/tauri.conf.json', 'green');
  } else {
    log('  [DRY-RUN] Would update tauri.conf.json', 'yellow');
  }

  // 3. 更新 Cargo.toml
  if (!isDryRun) {
    const cargoToml = readFileSync(cargoTomlPath, 'utf8');
    const updatedCargoToml = cargoToml.replace(
      /^version\s*=\s*"[^"]+"\s*$/m,
      `version = "${newVersion}"`
    );
    writeFileSync(cargoTomlPath, updatedCargoToml);
    log('  ✓ Updated src-tauri/Cargo.toml', 'green');
  } else {
    log('  [DRY-RUN] Would update Cargo.toml', 'yellow');
  }
}

function checkGitStatus() {
  log('\n🔍 Checking git status...', 'blue');

  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    log('✗ Working directory has uncommitted changes:', 'red');
    console.log(status);
    log('\nPlease commit or stash changes before releasing.', 'yellow');
    process.exit(1);
  }
  log('  ✓ Working directory is clean', 'green');

  // 检查是否在 main/master 分支
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  if (branch !== 'main' && branch !== 'master') {
    log(`⚠ Warning: You are on branch '${branch}', not 'main' or 'master'`, 'yellow');
    log('  Continue? (y/N)', 'yellow');

    // 在 dry-run 模式下跳过交互
    if (isDryRun) {
      log('  [DRY-RUN] Skipping interactive prompt', 'yellow');
      return;
    }

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('', (answer) => {
      readline.close();
      if (answer.toLowerCase() !== 'y') {
        process.exit(0);
      }
    });
  }
}

function checkTagExists(tagName) {
  log('\n🔍 Checking if tag exists...', 'blue');

  try {
    execSync(`git rev-parse ${tagName}`, { encoding: 'utf8', stdio: 'pipe' });
    log(`✗ Tag ${tagName} already exists!`, 'red');
    process.exit(1);
  } catch {
    log(`  ✓ Tag ${tagName} does not exist`, 'green');
  }
}

function createRelease(newVersion) {
  const tagName = `v${newVersion}`;

  log(`\n🚀 Creating release ${tagName}...`, 'blue');

  // 1. 创建 Git commit
  if (!isDryRun) {
    execCommand(
      `git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml`,
      'Staging version files'
    );
    execCommand(
      `git commit -m "chore: bump version to ${tagName}"`,
      `Creating version commit`
    );
  } else {
    log('  [DRY-RUN] Would create git commit', 'yellow');
  }

  // 2. 创建 tag
  execCommand(
    `git tag -a ${tagName} -m "Release ${tagName}"`,
    `Creating annotated tag ${tagName}`
  );

  // 3. 推送 commit 和 tag
  if (shouldPush) {
    execCommand(`git push origin HEAD`, 'Pushing commit to remote');
    execCommand(`git push origin ${tagName}`, `Pushing tag ${tagName} to remote`);

    log(`\n✅ Release ${tagName} created successfully!`, 'green');
    log('\n📱 GitHub Actions will automatically:', 'blue');
    log('  1. Build macOS DMG', 'reset');
    log('  2. Build Windows MSI', 'reset');
    log('  3. Create GitHub Release', 'reset');
    log(`  4. Upload artifacts to: https://github.com/OWNER/REPO/releases/tag/${tagName}`, 'reset');
  } else {
    log(`\n✅ Tag ${tagName} created locally!`, 'green');
    log('  Run `git push origin HEAD --tags` to push to remote and trigger CI/CD', 'yellow');
  }
}

function main() {
  if (!inputVersion) {
    log('Usage: npm run release <version> [--dry-run] [--no-push]', 'red');
    log('Example: npm run release 0.4.16', 'yellow');
    process.exit(1);
  }

  const newVersion = validateVersion(inputVersion);
  const currentVersions = getCurrentVersions();

  log('\n📦 Purfence Release Script', 'blue');
  log('━'.repeat(50), 'reset');

  if (isDryRun) {
    log('🌵 DRY-RUN MODE - No changes will be made', 'yellow');
  }

  log(`\nCurrent versions:`, 'blue');
  log(`  Root package.json: ${currentVersions.root}`, 'reset');
  log(`  Tauri (tauri.conf.json): ${currentVersions.tauri}`, 'reset');
  log(`  Cargo.toml: ${currentVersions.cargo}`, 'reset');
  log(`\nTarget version: ${newVersion}`, 'blue');

  // 执行发布流程
  checkGitStatus();
  checkTagExists(`v${newVersion}`);
  updateVersions(newVersion);
  createRelease(newVersion);
}

main();
