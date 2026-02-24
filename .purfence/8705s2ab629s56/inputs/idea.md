# Idea

## 需求描述（原文）

**标题**：增加最大 Issue 并行数配置和 TypeORM 队列机制

## 功能需求

### 1. 基础设置增加配置项
- 增加"最大 Issue 并行数"配置（默认2）
- 在 Purfence 基础设置页面可配置

### 2. 队列机制
重构当前的 issue 处理流程：

**当前流程**（需要修改）：
```
createIssue → commonService.emit → 立即执行
```

**新流程**（目标）：
```
createIssue → emit → 入队 → 队列控制并发 → 依次执行
```

### 3. 并发控制
- 同时处理的 issue 数量不超过配置的最大值
- 使用 Node.js 定时器调度执行

### 4. 数据持久化
- 队列状态持久化到数据库（TypeORM）
- 防止软件重启后丢失队列数据

## 技术方案

使用 **TypeORM + Node.js 定时器** 实现：

### 数据库表设计
```typescript
// IssueQueue 实体
@Entity()
class IssueQueue {
  @PrimaryColumn()
  id: string;           // issue ID
  
  @Column()
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  @Column({ type: 'int' })
  priority: number;     // 优先级（可选）
  
  @Column({ type: 'datetime' })
  createdAt: Date;
  
  @Column({ type: 'datetime', nullable: true })
  startedAt: Date;
  
  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;
  
  @Column({ type: 'json', nullable: true })
  payload: any;        // issue 相关数据
}
```

### 队列服务设计
```typescript
@Injectable()
class IssueQueueService {
  // 入队
  async enqueue(issueId: string, payload: any): Promise<void>;
  
  // 出队（获取下一个待处理的 issue）
  async dequeue(): Promise<IssueQueue | null>;
  
  // 标记为处理中
  async markAsProcessing(issueId: string): Promise<void>;
  
  // 标记为完成
  async markAsCompleted(issueId: string): Promise<void>;
  
  // 获取当前正在处理的 issue 数量
  async getProcessingCount(): Promise<number>;
  
  // 获取队列长度
  async getQueueLength(): Promise<number>;
}
```

### 调度器设计
```typescript
@Injectable()
class IssueSchedulerService {
  private maxConcurrency: number = 2; // 从配置读取
  
  // 定时检查队列（每5秒）
  @Interval(5000)
  async processQueue() {
    const processingCount = await this.queueService.getProcessingCount();
    const availableSlots = this.maxConcurrency - processingCount;
    
    if (availableSlots <= 0) return;
    
    // 取出 availableSlots 个待处理的 issue
    for (let i = 0; i < availableSlots; i++) {
      const item = await this.queueService.dequeue();
      if (!item) break;
      
      await this.queueService.markAsProcessing(item.id);
      this.executeIssue(item); // 异步执行，不 await
    }
  }
  
  private async executeIssue(item: IssueQueue) {
    try {
      // 执行 issue
      await this.issueService.execute(item.id, item.payload);
      await this.queueService.markAsCompleted(item.id);
    } catch (error) {
      await this.queueService.markAsFailed(item.id, error);
    }
  }
}
```

## 涉及文件

- `backend/src/purfence/entities/issue-queue.entity.ts` - 队列实体
- `backend/src/purfence/issue-queue.service.ts` - 队列服务
- `backend/src/purfence/issue-scheduler.service.ts` - 调度器服务
- `backend/src/purfence/issue.service.ts` - 修改 createIssue 入队逻辑
- `backend/src/purfence/settings/` - 基础设置增加配置项
- 前端设置页面增加"最大 Issue 并行数"配置

## 数据库迁移

需要创建 migration 添加 `issue_queue` 表。

## 验收标准

- [ ] 基础设置可配置"最大 Issue 并行数"（默认2）
- [ ] createIssue 后进入队列，不是立即执行
- [ ] 队列服务正确管理 issue 状态（pending/processing/completed/failed）
- [ ] 同时处理的 issue 不超过配置的最大值
- [ ] 软件重启后队列数据不丢失
- [ ] issue 执行完成后自动从队列取出下一个执行
- [ ] 队列状态可查询（当前处理中、待处理数量）

## 优先级

**P1（高优先级）** - 架构优化，支持并发控制
