# BullMQ processors（BaseProcessor / BaseRepeatProcessor）

这份文档来自对现有实现的整理，避免把 processor 约定散落在代码里。

相关实现：`src/common/bullmq/bullmq-base-processor.ts`

## 两类 processor

### 1) `BaseProcessor`

- 继承 `WorkerHost`
- 使用自定义 `@Process(...)` decorator，把 BullMQ `job.name` 映射到类方法
- **禁止 override `process()`**：构造函数会检查并在 override 时直接抛错
- 统一的错误处理：
  - APM transaction：`queueName[jobName]`
  - 失败时 `job.log(...)` 记录 trace id + 错误信息

**典型写法**

```typescript
import { Processor } from '@nestjs/bullmq';
import { Log } from '@nest-mods/log';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseProcessor, Process } from '../common/bullmq/bullmq-base-processor';

@Processor('queue-name')
export class MyProcessor extends BaseProcessor {
  @Log() logger: Logger;

  @Process('job-name')
  async handleMyJob(job: Job<{ someId: string }>) {
    const { someId } = job.data;
    // 处理逻辑
  }
}
```

- queue 注册：`@Processor('queue-name')`
- logger：`@Log() logger: Logger;`
- handler：`@Process('job-name')`

Purfence 模块当前采用事件驱动（`src/purfence/purfence-event-listener.service.ts`）替代 BullMQ processor，本仓库暂无 processor 示例文件。

### 3) Queue 注入（Resolver/Service 中使用）

在其他模块（如 Resolver）中向 Queue 添加 job 时，使用 `@InjectQueue` 装饰器注入：

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Resolver()
export class MyResolver {
  constructor(
    @InjectQueue('queue-name')
    private readonly queue: Queue,
  ) {}

  async someMethod() {
    await this.queue.add('job-name', { someData: 'value' });
  }
}
```

- 使用 `@InjectQueue('queue-name')` 装饰器注入指定的 Queue
- queue name 必须与 `@Processor()` 中注册的名称一致
- 添加 job：`queue.add(name, data, options?)`

示例参考：`src/purfence/purfence.resolver.ts`

### 2) `BaseRepeatProcessor`

- 继承 `BaseProcessor`，实现 `OnModuleInit`
- 在 `onModuleInit()` 里：
  - 获取 queue（`getQueueToken(this.worker.name)`）
  - 清理已有 repeatable jobs
  - 读取 `loadConfig()` 返回的 `{ enabled, cron, name? }`
  - 如果 `enabled=true`，向 queue 添加一个 repeat job：
    - name 固定为 `__default__`
    - repeat pattern 为 `cron`
    - attempts 来自 `this.attempts`

**关键约束**

- 必须定义一个默认 job handler：使用 `@Process()`（不带 name）
  - 如果缺失，会在启动时抛错：`You must define a default job...`

## 常见坑

- handler 名称要与 enqueue 的 `job.name` 一致（否则不会被调用）
- `BaseProcessor` 禁止 override `process()`；自定义逻辑请放在 job handler 里
- repeat processor 的默认 job name 是 `__default__`（来自 `@Process()` 的默认映射）

## 代码导航

- base 实现：`src/common/bullmq/bullmq-base-processor.ts`
- processor 示例：本仓库当前暂无（Purfence 已迁移到事件驱动）。
