# Idea

## 需求描述（原文）

**标题**：重构队列系统 - 使用 liteque 替换现有实现

## 背景

当前的 issue-queue 实现存在严重问题：
- 代码逻辑复杂且容易出 bug
- 多次修复仍然有问题
- 自相矛盾的逻辑（先 add 再检查）
- 不必要的并发查询

## 目标

使用成熟的数据库队列库 **liteque** 替换现有实现，简化代码并提供队列管理功能。

## liteque 优势

- ✅ 原生 TypeScript，类型安全
- ✅ 轻量级（仅3个依赖）
- ✅ Zod Schema 验证
- ✅ Drizzle ORM 底层（与 TypeORM 共存）
- ✅ 活跃维护（2026年1月最新发布）
- ✅ 支持重试、并发、超时、失败处理

## 任务

### 1. 集成 liteque

**安装**：
```bash
npm install liteque
```

**配置**：
```typescript
import { Queue } from 'liteque';

const issueQueue = new Queue('issue-queue', {
  // 配置项
});
```

### 2. 移除现有实现

**删除文件**：
- `backend/src/purfence/issue-queue/entities/issue-queue.entity.ts`
- `backend/src/purfence/issue-queue/issue-queue.service.ts`
- `backend/src/purfence/issue-queue/issue-scheduler.service.ts`
- 相关迁移文件

**保留**：
- `IssueQueueModule` 结构（但内部改为 liteque）

### 3. 重写队列服务

**新的 IssueQueueService**：
```typescript
import { Queue, Job } from 'liteque';

@Injectable()
export class IssueQueueService {
  private queue: Queue;
  
  constructor(private readonly issueService: IssueService) {
    this.queue = new Queue('issue-queue', async (job: Job) => {
      const { issueId } = job.data;
      await this.issueService.startIssue(issueId);
    });
  }
  
  // 入队
  async enqueue(issueId: string): Promise<void> {
    await this.queue.addJob({ issueId });
  }
  
  // 获取队列状态
  async getStatus() {
    const stats = await this.queue.getStats();
    return stats;
  }
  
  // 获取任务列表
  async getJobs(status?: string) {
    return await this.queue.getJobs(status);
  }
  
  // 暂停/恢复队列
  async pause() {
    await this.queue.pause();
  }
  
  async resume() {
    await this.queue.resume();
  }
}
```

### 4. 创建队列管理页面（前端）

**页面功能**：
- 查看队列统计（等待中、处理中、已完成、失败）
- 查看任务列表（带分页）
- 重试失败的任务
- 删除任务
- 暂停/恢复队列
- 清空队列

**路由**：`/settings/queue`

**组件结构**：
```
QueueManagementPage
├── QueueStats（队列统计卡片）
├── QueueControls（暂停/恢复/清空按钮）
└── JobList（任务列表表格）
    ├── Filter（状态过滤）
    ├── Table（任务详情）
    └── Actions（重试/删除）
```

### 5. 集成到现有流程

**修改 IssueSubscriber**：
```typescript
@AfterInsert()
async afterInsert() {
  // 延迟1秒后入队
  setTimeout(() => {
    this.eventEmitter.emit('purfence.issue.created', { issueId: this.id });
  }, 1000);
}
```

**修改事件监听器**：
```typescript
@OnEvent('purfence.issue.created')
async handleIssueCreated(payload: { issueId: string }) {
  await this.issueQueueService.enqueue(payload.issueId);
}
```

## 涉及文件

**后端**：
- `backend/package.json` - 添加 liteque 依赖
- `backend/src/purfence/issue-queue/` - 重写队列服务
- `backend/src/purfence/purfence.module.ts` - 更新模块
- 删除旧的 entity、service、scheduler 文件

**前端**：
- `frontend/src/pages/QueueManagementPage.tsx` - 新增页面
- `frontend/src/components/queue/` - 队列相关组件
- `frontend/src/App.tsx` - 添加路由

## 验收标准

- [ ] liteque 已安装并配置
- [ ] 旧的 issue-queue 实现已删除
- [ ] 新的队列服务正常工作
- [ ] 创建 issue 后能正确入队
- [ ] 队列能正确执行任务（调用 startIssue）
- [ ] 支持并发控制（从配置读取 maxConcurrency）
- [ ] 前端有队列管理页面
- [ ] 能查看队列状态和任务列表
- [ ] 能重试失败的任务
- [ ] 能暂停/恢复队列

## 优先级

**P0（最高优先级）** - 核心功能重构
