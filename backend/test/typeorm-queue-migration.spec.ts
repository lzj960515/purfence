import { DataSource } from 'typeorm';
import { CommonService } from '../src/common/common.service';
import { PurfenceEventListenerService } from '../src/purfence/purfence-event-listener.service';
import { PurfenceExecution } from '../src/purfence/purfence-execution.entity';
import { ExecutionStage, PurfenceStatus } from '../src/purfence/purfence-status.enum';
import { MyQueue } from '../libs/my-queue/src/my-queue.entity';
import { MyQueueJob } from '../libs/my-queue/src/my-queue-job.entity';
import { MyQueueJobStatus } from '../libs/my-queue/src/my-queue-job-status.enum';
import { MyQueueService } from '../libs/my-queue/src/my-queue.service';

describe('MyQueue behavior', () => {
  let dataSource: DataSource;
  let queueService: MyQueueService;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      entities: [MyQueue, MyQueueJob, PurfenceExecution],
    });
    await dataSource.initialize();
    MyQueue.useDataSource(dataSource);
    MyQueueJob.useDataSource(dataSource);
    PurfenceExecution.useDataSource(dataSource);
    queueService = new MyQueueService();
  });

  afterEach(async () => {
    await PurfenceExecution.createQueryBuilder().delete().execute();
    await MyQueueJob.createQueryBuilder().delete().execute();
    await MyQueue.createQueryBuilder().delete().execute();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('creates queue and inherits queue attempts when addJob is called', async () => {
    const jobId = await queueService.addJob(
      'issue-queue',
      { issueId: 'issue-1' },
      { maxConcurrency: 2, attempts: 3 },
    );

    const queue = await MyQueue.findOneOrFail({ where: { name: 'issue-queue' } });
    const job = await MyQueueJob.findOneOrFail({ where: { id: jobId } });

    expect(queue.maxConcurrency).toBe(2);
    expect(queue.attempts).toBe(3);
    expect(job.attempts).toBe(3);
    expect(job.runCount).toBe(0);
    expect(job.status).toBe(MyQueueJobStatus.pending);
  });

  it('updates queue options on addJob when queue already exists', async () => {
    await queueService.addJob('issue-queue', { issueId: 'issue-1' }, { attempts: 1 });
    await queueService.addJob(
      'issue-queue',
      { issueId: 'issue-2' },
      { maxConcurrency: 4, attempts: 5, isPaused: true },
    );

    const queue = await MyQueue.findOneOrFail({ where: { name: 'issue-queue' } });
    expect(queue.maxConcurrency).toBe(4);
    expect(queue.attempts).toBe(5);
    expect(queue.isPaused).toBe(true);
  });

  it('keeps existing queue concurrency when addJob options omit concurrency', async () => {
    await queueService.addJob(
      'issue-queue',
      { issueId: 'issue-1' },
      { maxConcurrency: 4, attempts: 2 },
    );

    await queueService.addJob('issue-queue', { issueId: 'issue-2' }, { delayMs: 1000 });

    const queue = await MyQueue.findOneOrFail({ where: { name: 'issue-queue' } });
    expect(queue.maxConcurrency).toBe(4);
    expect(queue.attempts).toBe(2);
  });

  it('uses default concurrency 3 for newly created queue', async () => {
    await queueService.addJob('issue-queue', { issueId: 'issue-default' });

    const queue = await MyQueue.findOneOrFail({ where: { name: 'issue-queue' } });
    expect(queue.maxConcurrency).toBe(3);
  });

  it('dispatches pending jobs and marks them running', async () => {
    const emitSpy = jest
      .spyOn(CommonService, 'emitAsync')
      .mockResolvedValue([true]);

    await queueService.addJob(
      'issue-queue',
      { issueId: 'issue-1' },
      { maxConcurrency: 1, attempts: 1 },
    );
    await queueService.addJob(
      'issue-queue',
      { issueId: 'issue-2' },
      { maxConcurrency: 1, attempts: 1 },
    );

    await (queueService as any).dispatch();

    const runningJobs = await MyQueueJob.find({
      where: { status: MyQueueJobStatus.running },
    });
    const pendingJobs = await MyQueueJob.find({
      where: { status: MyQueueJobStatus.pending },
    });

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(runningJobs).toHaveLength(1);
    expect(runningJobs[0].runCount).toBe(1);
    expect(pendingJobs).toHaveLength(1);

    emitSpy.mockRestore();
  });

  it('ack and nack finalize running jobs', async () => {
    const emitSpy = jest
      .spyOn(CommonService, 'emitAsync')
      .mockResolvedValue([true]);

    const ackJobId = await queueService.addJob(
      'issue-queue',
      { issueId: 'issue-ack' },
      { maxConcurrency: 2 },
    );
    const nackJobId = await queueService.addJob(
      'issue-queue',
      { issueId: 'issue-nack' },
      { maxConcurrency: 2 },
    );

    await (queueService as any).dispatch();

    await queueService.ack(ackJobId);
    await queueService.nack({ jobId: nackJobId, reason: 'failed' });

    const acked = await MyQueueJob.findOneOrFail({ where: { id: ackJobId } });
    const nacked = await MyQueueJob.findOneOrFail({ where: { id: nackJobId } });

    expect(acked.status).toBe(MyQueueJobStatus.succeeded);
    expect(nacked.status).toBe(MyQueueJobStatus.failed);
    expect(nacked.errorMessage).toBe('failed');

    emitSpy.mockRestore();
  });

  it('nacks malformed execution-queue payload in event listener', async () => {
    const nackSpy = jest.spyOn(queueService, 'nack').mockResolvedValue({
      jobId: 'job-1',
      status: MyQueueJobStatus.failed,
    });

    const listener = new PurfenceEventListenerService(
      { execute: jest.fn(), evaluateAndScheduleNextStep: jest.fn() } as never,
      { initProjectFilesystem: jest.fn() } as never,
      { startIssue: jest.fn(), createIssue: jest.fn() } as never,
      queueService,
    );

    await listener.handleExecutionQueueDispatch('job-1', { foo: 'bar' });
    expect(nackSpy).toHaveBeenCalledWith({
      jobId: 'job-1',
      reason: 'execution-queue payload is missing executionId',
    });
    nackSpy.mockRestore();
  });

  it('acks queue job on agent on-end success for evaluation stream-ended', async () => {
    const ackSpy = jest.spyOn(queueService, 'ack').mockResolvedValue({
      jobId: 'job-success',
      status: MyQueueJobStatus.succeeded,
    });
    await PurfenceExecution.create({
      id: 'exe-success',
      projectId: 'project-1',
      issueId: 'issue-1',
      queueJobId: 'job-success',
      status: PurfenceStatus.running,
      stage: ExecutionStage.tianfu,
    }).save();

    const listener = new PurfenceEventListenerService(
      { execute: jest.fn(), evaluateAndScheduleNextStep: jest.fn() } as never,
      { initProjectFilesystem: jest.fn() } as never,
      { startIssue: jest.fn(), createIssue: jest.fn() } as never,
      queueService,
    );

    await listener.handleAgentOnEndSuccess({
      conversationId: 'exe-success',
      context: {
        executionId: 'exe-success',
        event: 'purfence.evaluation.stream-ended',
      },
    });

    expect(ackSpy).toHaveBeenCalledWith('job-success');
    ackSpy.mockRestore();
  });

  it('nacks queue job on agent on-end failure by execution lookup', async () => {
    const nackSpy = jest.spyOn(queueService, 'nack').mockResolvedValue({
      jobId: 'job-failed',
      status: MyQueueJobStatus.failed,
    });
    await PurfenceExecution.create({
      id: 'exe-failed',
      projectId: 'project-1',
      issueId: 'issue-1',
      queueJobId: 'job-failed',
      status: PurfenceStatus.running,
      stage: ExecutionStage.tianji,
    }).save();

    const listener = new PurfenceEventListenerService(
      { execute: jest.fn(), evaluateAndScheduleNextStep: jest.fn() } as never,
      { initProjectFilesystem: jest.fn() } as never,
      { startIssue: jest.fn(), createIssue: jest.fn() } as never,
      queueService,
    );

    await listener.handleAgentOnEndFailure({
      conversationId: 'exe-failed',
      context: {
        executionId: 'exe-failed',
        event: 'purfence.execution.evaluate',
      },
      error: new Error('agent failed'),
    });

    expect(nackSpy).toHaveBeenCalledWith({
      jobId: 'job-failed',
      reason: 'agent failed',
    });
    nackSpy.mockRestore();
  });

  it('nacks queue job when execution execute handler throws before onEnd', async () => {
    const nackSpy = jest.spyOn(queueService, 'nack').mockResolvedValue({
      jobId: 'job-execute-error',
      status: MyQueueJobStatus.failed,
    });
    await PurfenceExecution.create({
      id: 'exe-throw',
      projectId: 'project-1',
      issueId: 'issue-1',
      queueJobId: 'job-execute-error',
      status: PurfenceStatus.running,
      stage: ExecutionStage.tianji,
    }).save();

    const listener = new PurfenceEventListenerService(
      {
        execute: jest.fn().mockRejectedValue(new Error('no default model')),
        evaluateAndScheduleNextStep: jest.fn(),
      } as never,
      { initProjectFilesystem: jest.fn() } as never,
      { startIssue: jest.fn(), createIssue: jest.fn() } as never,
      queueService,
    );

    await listener.handleExecutionExecute({ executionId: 'exe-throw' });

    expect(nackSpy).toHaveBeenCalledWith({
      jobId: 'job-execute-error',
      reason: 'no default model',
    });
    nackSpy.mockRestore();
  });

  it('fails stale running jobs after 1 hour timeout check', async () => {
    const emitSpy = jest
      .spyOn(CommonService, 'emitAsync')
      .mockResolvedValue([true]);

    const jobId = await queueService.addJob(
      'issue-queue',
      { issueId: 'issue-timeout' },
      { maxConcurrency: 1, attempts: 1 },
    );

    await (queueService as any).dispatch();

    const baseNow = Date.now();
    jest.useFakeTimers().setSystemTime(new Date(baseNow + 2 * 60 * 60 * 1000));
    try {
      await (queueService as any).checkStaleRunningJobs();

      const job = await MyQueueJob.findOneOrFail({ where: { id: jobId } });
      expect(job.status).toBe(MyQueueJobStatus.failed);
      expect(job.errorMessage).toBe('running timeout: exceeded 1 hour');
    } finally {
      jest.useRealTimers();
    }

    emitSpy.mockRestore();
  });
});
