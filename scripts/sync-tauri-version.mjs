import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = process.cwd();
const tauriConfPath = resolve(repoRoot, 'src-tauri', 'tauri.conf.json');
const cargoTomlPath = resolve(repoRoot, 'src-tauri', 'Cargo.toml');

const input = process.argv[2];

if (!input) {
  process.stderr.write('Usage: node scripts/sync-tauri-version.mjs <version|tag>\n');
  process.exit(1);
}

const normalized = input.startsWith('v') ? input.slice(1) : input;
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!semverPattern.test(normalized)) {
  process.stderr.write(`Invalid version: ${input}\n`);
  process.stderr.write('Expected: 0.1.5 or v0.1.5 (supports prerelease/build metadata)\n');
  process.exit(1);
}

const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf8'));
tauriConf.version = normalized;
writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`);

const cargoToml = readFileSync(cargoTomlPath, 'utf8');
const packageVersionRegex = /^version\s*=\s*"[^"]+"\s*$/m;

if (!packageVersionRegex.test(cargoToml)) {
  process.stderr.write(`Could not find package version in ${cargoTomlPath}\n`);
  process.exit(1);
}

const updatedCargoToml = cargoToml.replace(packageVersionRegex, `version = "${normalized}"`);
writeFileSync(cargoTomlPath, updatedCargoToml);

process.stdout.write(`Synced desktop version to ${normalized}\n`);
