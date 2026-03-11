import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { Dirent } from 'node:fs';
import {
  mkdir,
  readFile,
  readdir,
  realpath,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_READ_OFFSET = 1;
const DEFAULT_READ_LIMIT = 200;
const MAX_READ_LIMIT = 2000;
const MAX_TEXT_FILE_BYTES = 5 * 1024 * 1024;
const DEFAULT_PROCESS_WAIT_MS = 0;
const MAX_PROCESS_WAIT_MS = 120_000;
const DEFAULT_EXEC_YIELD_MS = 10_000;
const MIN_EXEC_YIELD_MS = 10;
const MAX_EXEC_YIELD_MS = 120_000;
const DEFAULT_EXEC_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_EXEC_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const DEFAULT_OUTPUT_MAX_CHARS = 200_000;
const DEFAULT_PENDING_MAX_CHARS = 32_000;
const PROCESS_TTL_MS = 30 * 60 * 1000;
const PROCESS_CLEANUP_INTERVAL_MS = 60 * 1000;
const DEFAULT_LOG_LIMIT = 200;

type ResolvedPaths = {
  basePath: string;
  cwdPath: string;
  displayCwd: string;
};

type TextSlice = {
  content: string;
  offset: number;
  limit: number;
  totalLines: number;
  truncated: boolean;
  nextOffset: number | null;
};

type RunningStatus = 'running';
type FinishedStatus = 'completed' | 'failed' | 'killed';
type ProcessSessionStatus = RunningStatus | FinishedStatus;

type ProcessSnapshot = {
  sessionId: string;
  command: string;
  cwd: string;
  status: ProcessSessionStatus;
  startedAt: string;
  endedAt: string | null;
  pid: number | null;
  exitCode: number | null;
  exitSignal: string | null;
  truncated: boolean;
  backgrounded: boolean;
};

type FinishedProcessResult = {
  status: FinishedStatus;
  sessionId: string;
  command: string;
  cwd: string;
  startedAt: string;
  endedAt: string;
  pid: number | null;
  exitCode: number | null;
  exitSignal: string | null;
  output: string;
  truncated: boolean;
};

type RunningProcessResult = {
  status: RunningStatus;
  sessionId: string;
  command: string;
  cwd: string;
  startedAt: string;
  pid: number | null;
  output: string;
  truncated: boolean;
};

type ProcessSession = {
  id: string;
  command: string;
  cwd: string;
  child: ChildProcess;
  pid: number | null;
  startedAt: number;
  endedAt: number | null;
  exitCode: number | null;
  exitSignal: string | null;
  status: ProcessSessionStatus;
  backgrounded: boolean;
  output: string;
  pendingOutput: string;
  truncated: boolean;
  maxOutputChars: number;
  maxPendingChars: number;
  timedOut: boolean;
  stopRequested: boolean;
  killTimer: NodeJS.Timeout | null;
  timeoutTimer: NodeJS.Timeout | null;
  updates: EventEmitter;
  completion: Promise<void>;
  resolveCompletion: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toIso(timestamp: number | null) {
  return timestamp === null ? null : new Date(timestamp).toISOString();
}

function hasNullByte(buffer: Buffer) {
  return buffer.includes(0);
}

function ensureTextBuffer(buffer: Buffer, filePath: string) {
  if (hasNullByte(buffer)) {
    throw new Error(`File is binary and cannot be read as text: ${filePath}`);
  }
}

function normalizeInputPath(inputPath: string) {
  const normalized = inputPath.trim();
  if (!normalized) {
    throw new Error('path is required');
  }
  if (normalized.includes('\0')) {
    throw new Error('path contains null byte');
  }
  return normalized;
}

function buildLineSlice(lines: string[], offset?: number, limit?: number) {
  const safeOffset = Math.max(
    DEFAULT_READ_OFFSET,
    Math.floor(offset ?? DEFAULT_READ_OFFSET),
  );
  const safeLimit = clamp(
    Math.floor(limit ?? DEFAULT_READ_LIMIT),
    1,
    MAX_READ_LIMIT,
  );
  const startIndex = safeOffset - 1;
  const selected = lines.slice(startIndex, startIndex + safeLimit);
  const nextOffset =
    startIndex + selected.length < lines.length
      ? safeOffset + selected.length
      : null;
  return {
    content: selected
      .map((line, index) => `${safeOffset + index}: ${line}`)
      .join('\n'),
    offset: safeOffset,
    limit: safeLimit,
    totalLines: lines.length,
    truncated: nextOffset !== null,
    nextOffset,
  } satisfies TextSlice;
}

function splitTextLines(content: string) {
  return content.length === 0 ? [] : content.split(/\r?\n/);
}

function countOccurrences(content: string, needle: string) {
  if (!needle) {
    throw new Error('oldText must not be empty');
  }
  let count = 0;
  let cursor = 0;
  while (true) {
    const index = content.indexOf(needle, cursor);
    if (index === -1) {
      return count;
    }
    count += 1;
    cursor = index + needle.length;
  }
}

function firstLineFromIndex(content: string, index: number) {
  if (index < 0) {
    return null;
  }
  return content.slice(0, index).split(/\r?\n/).length;
}

function normalizeEnvValue(value: unknown, key: string) {
  if (typeof value !== 'string') {
    throw new Error(`env.${key} must be a string`);
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    throw new Error(`env key is invalid: ${key}`);
  }
  if (key.toUpperCase() === 'PATH') {
    throw new Error('env.PATH override is not allowed');
  }
  return value;
}

function drainPendingOutput(session: ProcessSession) {
  const output = session.pendingOutput;
  session.pendingOutput = '';
  return output;
}

function tailString(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }
  return value.slice(value.length - maxChars);
}

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

@Injectable()
export class GenericToolsService implements OnModuleDestroy {
  private readonly logger = new Logger(GenericToolsService.name);
  private readonly sessions = new Map<string, ProcessSession>();
  private readonly finishedSessions = new Map<string, ProcessSession>();
  private readonly cleanupTimer = setInterval(
    () => this.pruneFinishedSessions(),
    PROCESS_CLEANUP_INTERVAL_MS,
  );

  constructor() {
    this.cleanupTimer.unref?.();
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
    for (const session of this.sessions.values()) {
      this.terminateSession(session, 'module-shutdown');
      session.child.removeAllListeners();
    }
    this.sessions.clear();
    this.finishedSessions.clear();
  }

  async readText(params: {
    filePath: string;
    cwd?: string;
    offset?: number;
    limit?: number;
  }) {
    const paths = await this.resolvePaths(params.cwd);
    const resolved = await this.resolveExistingPath(
      paths.cwdPath,
      params.filePath,
    );
    const targetStat = await stat(resolved.absolutePath);

    if (targetStat.isDirectory()) {
      const entries = await readdir(resolved.absolutePath, {
        withFileTypes: true,
      });
      const lines = this.formatDirectoryEntries(entries);
      const slice = buildLineSlice(lines, params.offset, params.limit);
      return {
        kind: 'directory' as const,
        path: resolved.displayPath,
        cwd: paths.displayCwd,
        content: slice.content,
        offset: slice.offset,
        limit: slice.limit,
        totalLines: slice.totalLines,
        truncated: slice.truncated,
        nextOffset: slice.nextOffset,
      };
    }

    if (!targetStat.isFile()) {
      throw new Error(
        `Only regular files and directories are supported: ${resolved.displayPath}`,
      );
    }
    if (targetStat.size > MAX_TEXT_FILE_BYTES) {
      throw new Error(
        `File is too large to read as text (${targetStat.size} bytes, max ${MAX_TEXT_FILE_BYTES})`,
      );
    }

    const buffer = await readFile(resolved.absolutePath);
    ensureTextBuffer(buffer, resolved.displayPath);
    const lines = splitTextLines(buffer.toString('utf-8'));
    const slice = buildLineSlice(lines, params.offset, params.limit);

    return {
      kind: 'file' as const,
      path: resolved.displayPath,
      cwd: paths.displayCwd,
      content: slice.content,
      offset: slice.offset,
      limit: slice.limit,
      totalLines: slice.totalLines,
      truncated: slice.truncated,
      nextOffset: slice.nextOffset,
    };
  }

  async writeText(params: { filePath: string; content: string; cwd?: string }) {
    const paths = await this.resolvePaths(params.cwd);
    const resolved = this.resolveWritablePath(paths.cwdPath, params.filePath);
    await mkdir(path.dirname(resolved.absolutePath), { recursive: true });
    await writeFile(resolved.absolutePath, params.content, 'utf-8');
    return {
      path: resolved.displayPath,
      cwd: paths.displayCwd,
      bytesWritten: Buffer.byteLength(params.content, 'utf-8'),
      linesWritten: params.content.split(/\r?\n/).length,
    };
  }

  async editText(params: {
    filePath: string;
    oldText: string;
    newText: string;
    cwd?: string;
    replaceAll?: boolean;
    expectedOccurrences?: number;
  }) {
    const paths = await this.resolvePaths(params.cwd);
    const resolved = await this.resolveExistingPath(
      paths.cwdPath,
      params.filePath,
    );
    const buffer = await readFile(resolved.absolutePath);
    ensureTextBuffer(buffer, resolved.displayPath);
    const previousContent = buffer.toString('utf-8');
    const matchCount = countOccurrences(previousContent, params.oldText);

    if (matchCount === 0) {
      throw new Error(`oldText was not found in ${resolved.displayPath}`);
    }
    if (
      params.expectedOccurrences !== undefined &&
      matchCount !== params.expectedOccurrences
    ) {
      throw new Error(
        `expectedOccurrences=${params.expectedOccurrences}, but found ${matchCount} matches`,
      );
    }
    if (!params.replaceAll && matchCount !== 1) {
      throw new Error(
        `Found ${matchCount} matches. Set replaceAll=true or expectedOccurrences to edit safely.`,
      );
    }

    const firstMatchIndex = previousContent.indexOf(params.oldText);
    const nextContent = params.replaceAll
      ? previousContent.split(params.oldText).join(params.newText)
      : previousContent.replace(params.oldText, params.newText);
    await writeFile(resolved.absolutePath, nextContent, 'utf-8');

    return {
      path: resolved.displayPath,
      cwd: paths.displayCwd,
      occurrencesFound: matchCount,
      occurrencesReplaced: params.replaceAll ? matchCount : 1,
      firstChangedLine: firstLineFromIndex(previousContent, firstMatchIndex),
      bytesWritten: Buffer.byteLength(nextContent, 'utf-8'),
    };
  }

  async exec(params: {
    command: string;
    cwd?: string;
    env?: Record<string, string>;
    background?: boolean;
    yieldMs?: number;
    timeoutMs?: number;
  }): Promise<RunningProcessResult | FinishedProcessResult> {
    if (!params.command.trim()) {
      throw new Error('command is required');
    }

    const paths = await this.resolvePaths(params.cwd);
    const cwdStat = await stat(paths.cwdPath).catch(() => null);
    if (!cwdStat?.isDirectory()) {
      throw new Error(
        `cwd does not exist or is not a directory: ${paths.displayCwd || '.'}`,
      );
    }
    const env = this.buildCommandEnv(params.env);
    const session = this.createSession(params.command, paths.cwdPath);
    const detached = process.platform !== 'win32';
    const child = spawn(params.command, {
      cwd: paths.cwdPath,
      env,
      shell: true,
      detached,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    session.child = child;
    session.pid = child.pid ?? null;
    this.sessions.set(session.id, session);
    this.attachSessionListeners(session);
    this.attachTimeout(session, params.timeoutMs);

    const backgroundRequested = params.background === true;
    if (backgroundRequested) {
      session.backgrounded = true;
      return this.buildRunningResult(session, drainPendingOutput(session));
    }

    const yieldMs =
      params.yieldMs === undefined
        ? DEFAULT_EXEC_YIELD_MS
        : clamp(
            Math.floor(params.yieldMs),
            MIN_EXEC_YIELD_MS,
            MAX_EXEC_YIELD_MS,
          );
    const completedInWindow = await Promise.race([
      session.completion.then(() => true),
      new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), yieldMs);
        timer.unref?.();
      }),
    ]);

    if (completedInWindow) {
      return this.buildFinishedResult(session, session.output);
    }

    session.backgrounded = true;
    return this.buildRunningResult(session, drainPendingOutput(session));
  }

  listProcesses() {
    this.pruneFinishedSessions();
    const running = Array.from(this.sessions.values()).map((session) =>
      this.buildSnapshot(session),
    );
    const finished = Array.from(this.finishedSessions.values()).map((session) =>
      this.buildSnapshot(session),
    );
    const items = [...running, ...finished].sort((a, b) =>
      a.startedAt < b.startedAt ? 1 : a.startedAt > b.startedAt ? -1 : 0,
    );
    return {
      items,
      total: items.length,
      summary:
        items
          .map((item) => `${item.sessionId} ${item.status} ${item.command}`)
          .join('\n') || 'No running or recent processes.',
    };
  }

  async pollProcess(params: { sessionId: string; waitMs?: number }) {
    const session = this.getSessionOrThrow(params.sessionId);
    let output = drainPendingOutput(session);
    if (session.status === 'running' && !output) {
      const waitMs = clamp(
        Math.floor(params.waitMs ?? DEFAULT_PROCESS_WAIT_MS),
        0,
        MAX_PROCESS_WAIT_MS,
      );
      if (waitMs > 0) {
        await this.waitForSessionUpdate(session, waitMs);
        output = drainPendingOutput(session);
      }
    }

    if (session.status === 'running') {
      return {
        ...this.buildRunningResult(session, output),
        waitMs: clamp(
          Math.floor(params.waitMs ?? DEFAULT_PROCESS_WAIT_MS),
          0,
          MAX_PROCESS_WAIT_MS,
        ),
      };
    }

    return this.buildFinishedResult(session, output || session.output);
  }

  readProcessLog(params: {
    sessionId: string;
    offset?: number;
    limit?: number;
  }) {
    const session = this.getSessionOrThrow(params.sessionId);
    const lines = splitTextLines(session.output);
    const slice = buildLineSlice(
      lines,
      params.offset ?? 1,
      params.limit ?? DEFAULT_LOG_LIMIT,
    );
    return {
      sessionId: session.id,
      status: session.status,
      command: session.command,
      cwd: session.cwd,
      content: slice.content,
      offset: slice.offset,
      limit: slice.limit,
      totalLines: slice.totalLines,
      truncated: slice.truncated,
      nextOffset: slice.nextOffset,
    };
  }

  async writeProcessInput(params: {
    sessionId: string;
    data: string;
    eof?: boolean;
  }) {
    const session = this.sessions.get(params.sessionId);
    if (!session || session.status !== 'running') {
      throw new Error(
        `No running process found for sessionId=${params.sessionId}`,
      );
    }
    const stdin = session.child.stdin;
    if (!stdin || stdin.destroyed) {
      throw new Error(
        `stdin is not writable for sessionId=${params.sessionId}`,
      );
    }
    await new Promise<void>((resolve, reject) => {
      stdin.write(params.data, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    if (params.eof) {
      stdin.end();
    }
    return {
      sessionId: session.id,
      status: session.status,
      bytesWritten: Buffer.byteLength(params.data, 'utf-8'),
      eof: params.eof ?? false,
    };
  }

  killProcess(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`No running process found for sessionId=${sessionId}`);
    }
    session.stopRequested = true;
    this.terminateSession(session, 'manual-stop');
    return {
      sessionId: session.id,
      status: 'running' as const,
      command: session.command,
      cwd: session.cwd,
      startedAt: new Date(session.startedAt).toISOString(),
      pid: session.pid,
      output: drainPendingOutput(session),
      truncated: session.truncated,
    };
  }

  removeProcess(sessionId: string) {
    this.pruneFinishedSessions();
    const running = this.sessions.get(sessionId);
    if (running) {
      running.stopRequested = true;
      running.backgrounded = false;
      this.terminateSession(running, 'remove-running-session');
      this.sessions.delete(sessionId);
    }
    const finished = this.finishedSessions.get(sessionId);
    if (finished) {
      this.finishedSessions.delete(sessionId);
    }
    if (!running && !finished) {
      throw new Error(`Process session not found: ${sessionId}`);
    }
    return { sessionId, removed: true };
  }

  private async resolvePaths(cwd?: string) {
    const basePath = await realpath(process.cwd());
    const cwdPath = await this.resolveCwdPath(basePath, cwd);
    return {
      basePath,
      cwdPath,
      displayCwd: cwd ?? '',
    } satisfies ResolvedPaths;
  }

  private async resolveCwdPath(basePath: string, cwd?: string) {
    if (!cwd) {
      return basePath;
    }
    const normalized = normalizeInputPath(cwd);
    const candidate = path.isAbsolute(normalized)
      ? path.resolve(normalized)
      : path.resolve(basePath, normalized);
    const candidateStat = await stat(candidate).catch(() => null);
    if (!candidateStat?.isDirectory()) {
      throw new Error(`cwd does not exist or is not a directory: ${cwd}`);
    }
    return candidate;
  }

  private async resolveExistingPath(cwdPath: string, inputPath: string) {
    const normalized = normalizeInputPath(inputPath);
    const absolutePath = path.isAbsolute(normalized)
      ? path.resolve(normalized)
      : path.resolve(cwdPath, normalized);
    const resolvedPath = await realpath(absolutePath);
    return {
      absolutePath: resolvedPath,
      displayPath: inputPath,
    };
  }

  private resolveWritablePath(cwdPath: string, inputPath: string) {
    const normalized = normalizeInputPath(inputPath);
    const absolutePath = path.isAbsolute(normalized)
      ? path.resolve(normalized)
      : path.resolve(cwdPath, normalized);
    return {
      absolutePath,
      displayPath: inputPath,
    };
  }

  private formatDirectoryEntries(entries: Dirent[]) {
    return entries
      .map((entry) => `${entry.name}${entry.isDirectory() ? '/' : ''}`)
      .sort((left, right) => left.localeCompare(right));
  }

  private buildCommandEnv(overrides?: Record<string, string>) {
    const env = { ...process.env } as Record<string, string>;
    for (const [key, value] of Object.entries(overrides ?? {})) {
      env[key] = normalizeEnvValue(value, key);
    }
    return env;
  }

  private createSession(command: string, cwd: string): ProcessSession {
    const deferred = createDeferred();
    return {
      id: randomUUID(),
      command,
      cwd,
      child: null as unknown as ChildProcess,
      startedAt: Date.now(),
      endedAt: null,
      exitCode: null,
      exitSignal: null,
      status: 'running',
      backgrounded: false,
      output: '',
      pendingOutput: '',
      truncated: false,
      maxOutputChars: DEFAULT_OUTPUT_MAX_CHARS,
      maxPendingChars: DEFAULT_PENDING_MAX_CHARS,
      timedOut: false,
      stopRequested: false,
      killTimer: null,
      timeoutTimer: null,
      updates: new EventEmitter(),
      completion: deferred.promise,
      resolveCompletion: deferred.resolve,
      pid: null,
    };
  }

  private attachSessionListeners(session: ProcessSession) {
    const stdout = session.child.stdout;
    const stderr = session.child.stderr;
    stdout?.setEncoding('utf-8');
    stderr?.setEncoding('utf-8');
    stdout?.on('data', (chunk: string) => this.appendOutput(session, chunk));
    stderr?.on('data', (chunk: string) => this.appendOutput(session, chunk));
    session.child.on('error', (error) => {
      this.appendOutput(session, `\n[spawn error] ${error.message}\n`);
      session.stopRequested = false;
      this.finalizeSession(session, 1, null);
    });
    session.child.on('close', (exitCode, signal) => {
      this.finalizeSession(session, exitCode, signal);
    });
  }

  private attachTimeout(session: ProcessSession, timeoutMs?: number) {
    const effectiveTimeout = clamp(
      Math.floor(timeoutMs ?? DEFAULT_EXEC_TIMEOUT_MS),
      1,
      MAX_EXEC_TIMEOUT_MS,
    );
    session.timeoutTimer = setTimeout(() => {
      session.timedOut = true;
      this.terminateSession(session, 'timeout');
    }, effectiveTimeout);
    session.timeoutTimer.unref?.();
  }

  private appendOutput(session: ProcessSession, chunk: string) {
    if (!chunk) {
      return;
    }
    session.output = tailString(session.output + chunk, session.maxOutputChars);
    session.pendingOutput = tailString(
      session.pendingOutput + chunk,
      session.maxPendingChars,
    );
    if (session.output.length >= session.maxOutputChars) {
      session.truncated = true;
    }
    if (session.pendingOutput.length >= session.maxPendingChars) {
      session.truncated = true;
    }
    session.updates.emit('update');
  }

  private finalizeSession(
    session: ProcessSession,
    exitCode: number | null,
    exitSignal: NodeJS.Signals | number | null,
  ) {
    if (session.status !== 'running') {
      return;
    }
    if (session.timeoutTimer) {
      clearTimeout(session.timeoutTimer);
      session.timeoutTimer = null;
    }
    if (session.killTimer) {
      clearTimeout(session.killTimer);
      session.killTimer = null;
    }

    session.endedAt = Date.now();
    session.exitCode = exitCode;
    session.exitSignal = exitSignal === null ? null : String(exitSignal);
    session.status = this.resolveFinishedStatus(session, exitCode);
    session.resolveCompletion();
    session.updates.emit('update');

    this.sessions.delete(session.id);
    if (session.backgrounded) {
      this.finishedSessions.set(session.id, session);
    }
  }

  private resolveFinishedStatus(
    session: ProcessSession,
    exitCode: number | null,
  ): FinishedStatus {
    if (session.stopRequested) {
      return 'killed';
    }
    if (session.timedOut) {
      return 'failed';
    }
    return exitCode === 0 ? 'completed' : 'failed';
  }

  private terminateSession(session: ProcessSession, reason: string) {
    if (session.status !== 'running') {
      return;
    }
    try {
      if (
        process.platform !== 'win32' &&
        typeof session.child.pid === 'number'
      ) {
        process.kill(-session.child.pid, 'SIGTERM');
      } else {
        session.child.kill('SIGTERM');
      }
    } catch (error) {
      this.logger.debug(
        `[generic-tools] failed to send SIGTERM (${reason}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    session.killTimer = setTimeout(() => {
      if (session.status !== 'running') {
        return;
      }
      try {
        if (
          process.platform !== 'win32' &&
          typeof session.child.pid === 'number'
        ) {
          process.kill(-session.child.pid, 'SIGKILL');
        } else {
          session.child.kill('SIGKILL');
        }
      } catch (error) {
        this.logger.debug(
          `[generic-tools] failed to send SIGKILL (${reason}): ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }, 5_000);
    session.killTimer.unref?.();
  }

  private buildSnapshot(session: ProcessSession): ProcessSnapshot {
    return {
      sessionId: session.id,
      command: session.command,
      cwd: session.cwd,
      status: session.status,
      startedAt: new Date(session.startedAt).toISOString(),
      endedAt: toIso(session.endedAt),
      pid: session.child.pid ?? null,
      exitCode: session.exitCode,
      exitSignal: session.exitSignal,
      truncated: session.truncated,
      backgrounded: session.backgrounded,
    };
  }

  private buildRunningResult(
    session: ProcessSession,
    output: string,
  ): RunningProcessResult {
    return {
      status: 'running',
      sessionId: session.id,
      command: session.command,
      cwd: session.cwd,
      startedAt: new Date(session.startedAt).toISOString(),
      pid: session.child.pid ?? null,
      output,
      truncated: session.truncated,
    };
  }

  private buildFinishedResult(
    session: ProcessSession,
    output: string,
  ): FinishedProcessResult {
    return {
      status: session.status as FinishedStatus,
      sessionId: session.id,
      command: session.command,
      cwd: session.cwd,
      startedAt: new Date(session.startedAt).toISOString(),
      endedAt: new Date(session.endedAt ?? Date.now()).toISOString(),
      pid: session.child.pid ?? null,
      exitCode: session.exitCode,
      exitSignal: session.exitSignal,
      output,
      truncated: session.truncated,
    };
  }

  private getSessionOrThrow(sessionId: string) {
    this.pruneFinishedSessions();
    const session =
      this.sessions.get(sessionId) ?? this.finishedSessions.get(sessionId);
    if (!session) {
      throw new Error(`Process session not found: ${sessionId}`);
    }
    return session;
  }

  private async waitForSessionUpdate(session: ProcessSession, waitMs: number) {
    await new Promise<void>((resolve) => {
      const onUpdate = () => {
        cleanup();
        resolve();
      };
      const cleanup = () => {
        session.updates.off('update', onUpdate);
        clearTimeout(timer);
      };
      const timer = setTimeout(() => {
        cleanup();
        resolve();
      }, waitMs);
      timer.unref?.();
      session.updates.on('update', onUpdate);
    });
  }

  private pruneFinishedSessions() {
    const cutoff = Date.now() - PROCESS_TTL_MS;
    for (const [sessionId, session] of this.finishedSessions.entries()) {
      if ((session.endedAt ?? 0) < cutoff) {
        this.finishedSessions.delete(sessionId);
      }
    }
  }
}
