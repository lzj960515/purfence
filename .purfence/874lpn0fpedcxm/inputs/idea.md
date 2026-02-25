# Idea

## 需求描述（原文）

**标题**：清理废弃的 tbl_issue_queue 表

## 背景

在完成队列数据迁移到 liteque 后（Issue #874j6ovxhon4f4），发现主数据库中仍存在旧的 TypeORM 队列表 `tbl_issue_queue`。

## 现状

**表信息**：
- 表名：`tbl_issue_queue`
- 数据：9 条记录（2 pending, 7 failed）
- 代码引用：无（已完全迁移到 liteque）

**问题**：
- 该表是旧的 TypeORM 实现，已被 liteque 替代
- 无代码引用，属于废弃表
- 可能导致混淆，增加数据库维护成本

## 任务

1. **评估数据**：
   - 检查 2 条 pending 记录是否需要迁移到 liteque
   - 7 条 failed 记录可能不需要处理

2. **清理方案**：
   - 如果 pending 数据有价值，编写迁移脚本
   - 删除 `tbl_issue_queue` 表
   - 清理相关的 TypeORM entity 定义（如果存在）

3. **验证**：
   - 确认应用功能正常
   - 确认队列表只有 liteque 的 `tasks` 表

## 优先级

**P2（中优先级）** - 技术债务清理

## 验收标准

- [ ] 评估 pending 数据是否需要迁移
- [ ] 删除 `tbl_issue_queue` 表
- [ ] 清理相关的 TypeORM 代码（如果有）
- [ ] 应用功能正常
- [ ] 数据库整洁，无废弃表
