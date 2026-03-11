import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { GenericToolsService } from './generic-tools.service';

describe('GenericToolsService', () => {
  let service: GenericToolsService;
  let workspaceRoot: string;
  let cwdSpy: jest.SpyInstance<string, []>;

  beforeEach(async () => {
    workspaceRoot = await mkdtemp(
      path.join(os.tmpdir(), 'purfence-generic-tools-'),
    );
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(workspaceRoot);
    service = new GenericToolsService();
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    service.onModuleDestroy();
    await rm(workspaceRoot, { recursive: true, force: true });
  });

  it('reads files with numbered pagination', async () => {
    const filePath = path.join(workspaceRoot, 'notes.txt');
    await writeFile(filePath, 'alpha\nbeta\ngamma', 'utf-8');

    const result = await service.readText({
      filePath: 'notes.txt',
      offset: 2,
      limit: 2,
    });

    expect(result).toEqual({
      kind: 'file',
      path: 'notes.txt',
      cwd: '',
      content: '2: beta\n3: gamma',
      offset: 2,
      limit: 2,
      totalLines: 3,
      truncated: false,
      nextOffset: null,
    });
  });

  it('writes files using generic path semantics', async () => {
    const writeResult = await service.writeText({
      filePath: 'nested/output.txt',
      content: 'hello world',
    });

    expect(writeResult.path).toBe('nested/output.txt');
    expect(
      await readFile(path.join(workspaceRoot, 'nested', 'output.txt'), 'utf-8'),
    ).toBe('hello world');

    await service.writeText({
      filePath: '../escape.txt',
      content: 'outside nested cwd but valid generic path',
      cwd: 'nested',
    });

    expect(
      await readFile(path.join(workspaceRoot, 'escape.txt'), 'utf-8'),
    ).toBe('outside nested cwd but valid generic path');

    const subdir = path.join(workspaceRoot, 'absolute-cwd');
    await mkdir(subdir, { recursive: true });
    await service.writeText({
      filePath: 'inside.txt',
      content: 'resolved from absolute cwd',
      cwd: subdir,
    });

    expect(await readFile(path.join(subdir, 'inside.txt'), 'utf-8')).toBe(
      'resolved from absolute cwd',
    );
  });

  it('edits exactly one match by default', async () => {
    await writeFile(
      path.join(workspaceRoot, 'edit.txt'),
      'before\nafter\nafter',
      'utf-8',
    );

    await expect(
      service.editText({
        filePath: 'edit.txt',
        oldText: 'after',
        newText: 'done',
      }),
    ).rejects.toThrow('Found 2 matches');

    const result = await service.editText({
      filePath: 'edit.txt',
      oldText: 'after',
      newText: 'done',
      expectedOccurrences: 2,
      replaceAll: true,
    });

    expect(result.occurrencesFound).toBe(2);
    expect(result.occurrencesReplaced).toBe(2);
    expect(await readFile(path.join(workspaceRoot, 'edit.txt'), 'utf-8')).toBe(
      'before\ndone\ndone',
    );
  });

  it('backgrounds commands and manages them through process APIs', async () => {
    const command = `${JSON.stringify(process.execPath)} -e "process.stdout.write('start'); setTimeout(() => process.stdout.write(' end'), 80); setTimeout(() => process.exit(0), 140);"`;

    const execResult = await service.exec({
      command,
      yieldMs: 20,
    });

    expect(execResult.status).toBe('running');

    const runningSessionId = execResult.sessionId;
    const listResult = service.listProcesses();
    expect(
      listResult.items.some((item) => item.sessionId === runningSessionId),
    ).toBe(true);

    const firstPollResult = await service.pollProcess({
      sessionId: runningSessionId,
      waitMs: 500,
    });

    expect(firstPollResult.output).toContain('start');

    let pollResult = await service.pollProcess({
      sessionId: runningSessionId,
      waitMs: 500,
    });

    for (
      let attempt = 0;
      attempt < 5 && pollResult.status === 'running';
      attempt += 1
    ) {
      pollResult = await service.pollProcess({
        sessionId: runningSessionId,
        waitMs: 500,
      });
    }

    expect(pollResult.status).toBe('completed');
    expect(pollResult.output).toContain('end');

    const logResult = service.readProcessLog({ sessionId: runningSessionId });
    expect(logResult.content).toContain('1: start end');

    expect(service.removeProcess(runningSessionId)).toEqual({
      sessionId: runningSessionId,
      removed: true,
    });
  });
});
