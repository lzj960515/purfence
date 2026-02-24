# Idea

## 需求描述（原文）

**标题**：回滚 AI SDK 迁移，重新使用 voltagent 2.6.1

## 背景

voltagent 官方已修复 ReadableStream 锁定错误（issue #1105），在 2.6.1 版本中修复。因此回滚之前的 AI SDK 迁移，重新使用 voltagent。

## 任务内容

### 1. 回滚 AI SDK 迁移
- 回滚提交：将 AI SDK 改回 voltagent 的相关提交
- 恢复原有的 voltagent 代码结构
- 移除 AI SDK 相关代码

### 2. 升级 voltagent 到 2.6.1
```bash
npm install @voltagent/core@2.6.1 @voltagent/server-hono@2.6.1
```

### 3. 验证修复
- 测试 AI 消息发送是否正常
- 验证不再有 ReadableStream 错误
- 确保所有功能正常工作

## 涉及文件

- `backend/package.json` - 依赖切换
- `backend/libs/my-agent/` - 恢复 voltagent 代码
- 移除 AI SDK 相关实现

## 验收标准

- [ ] 成功回滚到 voltagent 代码
- [ ] voltagent 升级到 2.6.1
- [ ] AI 功能正常工作
- [ ] 无 ReadableStream 错误
- [ ] 其他功能不受影响

## 优先级

**P0（紧急）** - 回滚并升级到稳定版本
