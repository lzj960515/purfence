# Idea

## 需求描述（原文）

**标题**：将队列数据存储到主数据库中

## 问题

当前队列数据存储在系统临时目录：
```typescript
this.dbPath = path.join(os.tmpdir(), 'purfence-issue-queue.db');
```

**问题**：
- 临时目录可能被系统清理，导致数据丢失
- 重启后队列状态无法恢复
- 不符合桌面应用的持久化要求
- 数据分散，不便于管理

## 解决方案

将队列数据存储到应用的主数据库（`database.sqlite`）中，与其他数据表放在一起。

## 实现方案

### 方案 1：liteque 使用同一个数据库文件（推荐）

修改 `backend/src/purfence/issue-queue/issue-queue.service.ts`：

```typescript
import { app } from '@tauri-apps/api/path';

// 获取应用数据目录
const appDataDir = await app.getDataDir();
const dbPath = path.join(appDataDir, 'database.sqlite');

// 或者使用现有的数据库路径
const dbPath = path.join(
  process.env.TAURI_APP_DATA_DIR || path.join(os.homedir(), '.purfence'),
  'database.sqlite'
);

// 初始化 SqliteQueue
this.queue = new SqliteQueue('issue-queue', dbPath, {
  schema: IssueJobSchema,
});
```

**优势**：
- ✅ 数据统一管理
- ✅ 持久化到应用目录
- ✅ 便于备份和迁移
- ✅ 共享同一个 SQLite 连接池

### 方案 2：liteque 在主数据库中创建独立的表

liteque 会在 SQLite 中创建自己的表（如 `issue-queue_jobs`），与 TypeORM 的表共存。

**表结构示例**：
```
database.sqlite
├── tbl_issue (TypeORM)
├── tbl_project (TypeORM)
├── tbl_purfence_config (TypeORM)
└── issue-queue_jobs (liteque)
```

## 需要修改的文件

- `backend/src/purfence/issue-queue/issue-queue.service.ts` - 修改数据库路径

## 数据库路径获取方式

在 Tauri 应用中，推荐使用：

1. **应用数据目录**（推荐）：
```typescript
import { appDataDir } from '@tauri-apps/api/path';
const dbPath = await appDataDir();
```

2. **环境变量**：
```typescript
const dbPath = process.env.TAURI_APP_DATA_DIR;
```

3. **用户目录**：
```typescript
const dbPath = path.join(os.homedir(), 'Application Support', 'Purfence', 'database.sqlite');
```

## 验收标准

- [ ] 队列数据存储在主数据库文件中
- [ ] 不再使用临时目录
- [ ] 应用重启后队列数据仍然存在
- [ ] liteque 的表与 TypeORM 的表共存正常
- [ ] 队列功能正常工作

## 优先级

**P1（高优先级）** - 数据持久化问题
