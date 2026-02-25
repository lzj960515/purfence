# 清理 tbl_issue_queue 表 - 执行指南

## 快速开始

### 1. 执行迁移（删除废弃表）

```bash
cd backend
npm run typeorm:migration:run
```

### 2. 验证清理结果

**检查表已删除**:
```bash
# 连接到数据库（根据你的环境）
sqlite3 ~/.purfence/database.sqlite
# 或
sqlite3 ./data/database.sqlite

# 验证表不存在
.tables | grep issue_queue
# 应该没有输出

# 退出
.exit
```

**验证队列功能正常**:
```bash
# 启动应用
npm run start:dev

# 在另一个终端，检查队列状态
curl http://localhost:3000/api/queue/stats
```

## 决策说明

### 为什么直接删除而不是迁移数据？

| 因素 | 评估 |
|------|------|
| **代码引用** | ✅ 无任何代码引用旧表 |
| **数据价值** | ⚠️ 仅 2 条 pending + 7 条 failed，价值低 |
| **迁移复杂度** | ✅ 无需迁移，直接删除更简单 |
| **风险** | ✅ 低风险，迁移提供回滚能力 |

### 关键发现

1. **队列系统已完全迁移**: 现在使用 liteque 的 `tasks` 表
2. **无 entity 定义**: 没有TypeORM entity 引用 `tbl_issue_queue`
3. **数据量小**: 总共 9 条记录，且大部分是失败记录

## 迁移文件

**位置**: `backend/src/migrations/drop-legacy-issue-queue-table.ts`

**功能**:
- 检查表是否存在
- 记录删除的数据数量
- 安全删除表
- 支持回滚

## 故障排除

### 迁移失败

**问题**: 表不存在
**解决**: 正常，说明表已经被删除或从未创建

**问题**: 数据库锁定
**解决**: 确保没有其他进程正在使用数据库

### 回滚（如果需要）

```bash
npm run typeorm -- -d ./ormconfig.ts migration:revert
```

## 验收标准

完成以下检查即视为清理成功：

- [ ] 运行迁移无错误
- [ ] `tbl_issue_queue` 表不存在
- [ ] 应用启动正常
- [ ] 队列 API 响应正常 (`/api/queue/stats`)
- [ ] 创建新 Issue 功能正常

## 技术支持

如有问题，请检查：
1. 数据库连接配置
2. 迁移日志输出
3. 应用启动日志

详细报告请查看: `.purfence/874lpn0fpedcxm/outputs/cleanup-report.md`
