# Bug 修复报告：SQLite Timestamp 类型不兼容

## Issue 信息
- **Issue ID**: 870bjjara0hso7
- **标题**: SQLite 不支持 timestamp 数据类型导致数据库连接失败
- **类型**: Bug 修复
- **优先级**: High（阻塞应用启动）

## 问题描述

应用启动时连接 SQLite 数据库失败，报错：
```
DataTypeNotSupportedError: Data type "timestamp" in "RemoteRepositoryConfig.lastSyncedAt" is not supported by "sqlite" database.
```

## 根因分析

SQLite 数据库不原生支持 `timestamp` 数据类型。在 TypeORM 实体 `RemoteRepositoryConfig` 中，`lastSyncedAt` 字段使用了 `@Column({ type: 'timestamp' })`，这在 SQLite 中会导致类型不支持错误。

## 修复方案

**修改文件**: `backend/src/remote-git/entities/remote-repository.entity.ts`

**变更内容**:
```typescript
// 修改前（第 47 行）
@Column({ type: 'timestamp', nullable: true })
lastSyncedAt?: Date;

// 修改后
@Column({ type: 'datetime', nullable: true })
lastSyncedAt?: Date;
```

## 技术说明

将 `timestamp` 改为 `datetime` 类型的优势：

1. **跨数据库兼容性**: TypeORM 会根据不同数据库驱动自动映射
   - SQLite → TEXT（SQLite 的日期时间存储方式）
   - PostgreSQL → TIMESTAMP
   - MySQL → DATETIME

2. **符合 TypeORM 最佳实践**: `datetime` 是 TypeORM 推荐的时间日期类型

3. **不影响现有功能**: 类型映射由 TypeORM 自动处理，应用层代码无需修改

## 验证结果

| 验证项 | 结果 | 说明 |
|--------|------|------|
| TypeScript 构建 | ✅ 通过 | 编译成功，无错误 |
| 数据库连接 | ✅ 通过 | SQLite 连接成功，无类型错误 |
| 实体初始化 | ✅ 通过 | RemoteRepositoryConfig 实体正常加载 |
| 类型兼容性 | ✅ 通过 | datetime 类型在 SQLite 中正常工作 |
| 代码扫描 | ✅ 通过 | 项目中无其他 timestamp 类型字段 |

## 影响范围

- ✅ 修复了使用 SQLite 数据库部署的用户无法启动应用的问题
- ✅ 保持了与其他数据库（PostgreSQL、MySQL）的兼容性
- ✅ 无破坏性变更，不影响现有功能

## 执行时间

- **分析时间**: 5 分钟
- **修复时间**: 10 分钟
- **验证时间**: 15 分钟
- **总计**: 30 分钟

## 执行团队

- **修复**: backend-architect
- **验证**: tester

## 状态

✅ **已完成并验证通过**
