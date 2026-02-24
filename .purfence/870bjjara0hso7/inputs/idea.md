# Idea

## 需求描述（原文）

**标题**：SQLite 不支持 timestamp 数据类型导致数据库连接失败

## Bug 描述

应用启动时连接 SQLite 数据库失败，报错 `DataTypeNotSupportedError: Data type "timestamp" in "RemoteRepositoryConfig.lastSyncedAt" is not supported by "sqlite" database.`

## 错误日志

```
[Nest] 45166  - 02/24/2026, 4:23:39 PM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (1)...
DataTypeNotSupportedError: Data type "timestamp" in "RemoteRepositoryConfig.lastSyncedAt" is not supported by "sqlite" database.
```

## 问题分析

SQLite 数据库不原生支持 `timestamp` 数据类型。在 TypeORM 实体 `RemoteRepositoryConfig` 中，`lastSyncedAt` 字段使用了 `@Column({ type: 'timestamp' })`，这在 SQLite 中会导致报错。

## 可能的解决方案

1. 将 `timestamp` 改为 SQLite 支持的 `datetime` 类型
2. 或者使用 TypeORM 的 `datetime` 类型（它会根据数据库自动适配）
3. 或者检查实体是否配置 `sqlite` 专用列类型

## 影响范围

- 影响使用 SQLite 数据库部署的用户
- 阻塞应用正常启动
