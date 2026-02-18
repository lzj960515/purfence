import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dirPath: string) {
  await mkdir(dirPath, { recursive: true });
}

export async function readText(filePath: string) {
  return readFile(filePath, 'utf-8');
}

export async function writeText(filePath: string, content: string) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, content, 'utf-8');
}

export async function pathExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function safeReaddir(dirPath: string) {
  try {
    return await readdir(dirPath);
  } catch {
    return [];
  }
}

export async function assertDirAccessible(dirPath: string) {
  const dirStat = await stat(dirPath).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`dir not accessible: ${dirPath}. ${message}`);
  });
  if (!dirStat.isDirectory()) {
    throw new Error(`not a directory: ${dirPath}`);
  }
}

export async function listFilesRecursive(
  rootDir: string,
  opts?: { ignoreDotfiles?: boolean },
) {
  await assertDirAccessible(rootDir);

  const ignoreDotfiles = opts?.ignoreDotfiles ?? true;
  const files: string[] = [];

  const walk = async (dir: string, relBase: string) => {
    const entries = await readdir(dir);
    for (const entry of entries) {
      if (ignoreDotfiles && entry.startsWith('.')) continue;
      const fullPath = path.join(dir, entry);
      const relPath = relBase ? `${relBase}/${entry}` : entry;
      const entryStat = await stat(fullPath);
      if (entryStat.isDirectory()) {
        await walk(fullPath, relPath);
      } else if (entryStat.isFile()) {
        files.push(relPath);
      }
    }
  };

  await walk(rootDir, '');
  files.sort((a, b) => a.localeCompare(b));
  return files;
}

export function assertSafeRelPath(relPath: string) {
  const normalized = relPath.replace(/\\/g, '/').trim();
  if (!normalized) {
    throw new Error('path is required');
  }
  if (normalized.startsWith('/')) {
    throw new Error('path must be relative');
  }
  if (normalized.includes('..')) {
    throw new Error('path must not contain ..');
  }
  if (normalized.includes('\0')) {
    throw new Error('path contains null byte');
  }
  return normalized;
}
