# Slack 推送功能部署检查清单

## 部署前检查

### 1. 代码审查
- [ ] 所有变更已通过代码审查
- [ ] 无 console.log 或调试代码残留
- [ ] 敏感信息处理正确（不记录到日志）

### 2. 数据库迁移
- [ ] 迁移文件已创建: `add-slack-fields-to-project-1740100000000.ts`
- [ ] 迁移已通过语法检查
- [ ] 备份数据库（生产环境）
- [ ] 迁移回滚方案已准备

### 3. 后端构建
- [ ] `npm run build` 成功
- [ ] 无 TypeScript 编译错误
- [ ] 无 ESLint 警告

### 4. 前端构建
- [ ] `npm run build` 成功
- [ ] GraphQL hooks 已重新生成
- [ ] 无 TypeScript 编译错误

### 5. 依赖项
- [ ] 无新增外部依赖
- [ ] 现有依赖版本无变化

## 部署步骤

### 1. 数据库迁移
```bash
# 进入后端目录
cd backend

# 运行迁移（开发环境）
npm run migration:run

# 生产环境（根据实际部署流程）
# 通常由 CI/CD 或运维执行
```

### 2. 后端部署
```bash
# 构建后端
cd backend
npm run build

# 部署（根据实际部署流程）
```

### 3. 前端部署
```bash
# 生成 GraphQL 类型（需要后端服务运行）
cd backend
npm run codegen

# 构建前端
cd ../frontend
npm run build

# 部署（根据实际部署流程）
```

### 4. 验证部署
- [ ] 后端健康检查通过
- [ ] 前端页面可访问
- [ ] GraphQL API 可用

## 部署后验证

### 1. 数据库验证
```sql
-- 验证新字段已添加
DESCRIBE purfence_project;

-- 应看到 slackAppConfigId 和 slackChannelId 字段
```

### 2. API 验证
```graphql
# 测试查询项目 Slack 配置
query {
  purfenceProject(id: "test-project-id") {
    id
    name
    slackAppConfigId
    slackChannelId
  }
}
```

### 3. 前端验证
- [ ] 项目详情页显示 Slack 配置卡片
- [ ] 点击编辑按钮可进入编辑模式
- [ ] Slack App 下拉列表正常显示
- [ ] Channel ID 输入框正常
- [ ] 保存功能正常
- [ ] 取消功能正常
- [ ] 验证错误提示正常显示

### 4. 事件流验证
- [ ] 配置了 Slack 的项目完成 Issue 时发送通知
- [ ] 评估完成时发送通知（如适用）
- [ ] 定时任务完成时发送通知（如适用）

## 回滚方案

### 1. 代码回滚
```bash
# 回滚到上一个版本
git revert HEAD
# 或使用部署系统的回滚功能
```

### 2. 数据库回滚
```bash
# 手动执行 down migration
cd backend
npm run migration:revert
```

或手动执行 SQL：
```sql
ALTER TABLE purfence_project DROP COLUMN slackChannelId;
ALTER TABLE purfence_project DROP COLUMN slackAppConfigId;
```

## 监控事项

### 1. 日志监控
- 关注 Slack 发送失败的错误日志
- 关注事件发射失败的错误日志

### 2. 性能监控
- 关注 Slack API 调用延迟
- 关注事件处理队列长度

### 3. 业务监控
- Slack 通知发送成功率
- 用户配置 Slack 的项目数量

## 已知问题

### 1. GraphQL Codegen 依赖后端
**问题**: 前端构建需要后端服务运行并包含新的 schema
**解决方案**:
- 开发环境: 先启动后端，再运行 codegen
- CI/CD: 确保后端服务可用或使用 schema 文件

### 2. TypeScript 类型错误
**问题**: 如果未运行 codegen，前端会有类型错误
**解决方案**: 确保 codegen 在构建前执行

## 联系人

- 开发负责人: [填写]
- 运维负责人: [填写]
- 产品负责人: [填写]
