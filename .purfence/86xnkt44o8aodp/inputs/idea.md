# Idea

## 需求描述（原文）

**标题**：移除 voltagent 依赖，直接使用 AI SDK

## 背景

当前项目使用 voltagent 框架（封装了 ai sdk），但遇到了版本兼容性问题。计划移除 voltagent，直接使用 ai sdk。

## 目标

在不改变现有数据结构和使用方式的前提下，将 voltagent 替换为直接使用 ai sdk。

## 关键要求

### 1. 保留现有数据结构
- Tool 定义方式不变
- Agent 配置方式不变  
- 流式响应处理方式不变
- 数据存储格式不变

### 2. 使用 AI SDK 的 Step 事件
- voltagent 使用 step 事件存储数据
- ai sdk 也有 step 事件，需要对应迁移
- 保持数据存储逻辑一致

### 3. 使用 AI SDK 的 Hooks
- 使用 ai sdk 提供的 hooks 替代 voltagent 的 hooks
- 保持相同的调用方式

## 调研任务

### 1. 查看当前 voltagent 使用方式
```bash
# 查看 voltagent 相关代码
grep -r "voltagent\|from.*voltagent" backend/src --include="*.ts" | head -20

# 查看 agent 定义方式
grep -r "createAgent\|new Agent\|defineTool" backend/src --include="*.ts" | head -20
```

### 2. 研究 AI SDK 文档
- 查看 ai sdk 的 streamText API
- 查看 ai sdk 的 step 事件
- 查看 ai sdk 的 tool 定义方式
- 查看 ai sdk 的 hooks

### 3. 对比 voltagent 和 ai sdk 的差异
| 功能 | voltagent 方式 | ai sdk 方式 |
|------|---------------|------------|
| Agent 创建 | ? | ? |
| Tool 定义 | ? | ? |
| 流式调用 | ? | ? |
| Step 事件 | ? | ? |
| 数据存储 | ? | ? |

## 实现方案

### Phase 1: 调研
- 完整梳理当前 voltagent 的使用方式
- 研究 ai sdk 对应功能的实现方式
- 制定详细的迁移计划

### Phase 2: 实现
- 替换 voltagent 依赖为 ai sdk
- 重写 agent 创建逻辑
- 重写 tool 定义逻辑
- 重写流式处理逻辑
- 重写 step 事件处理

### Phase 3: 测试
- 验证所有功能正常工作
- 验证数据结构保持一致
- 验证性能没有下降

## 涉及文件

- `backend/libs/my-agent/` - 核心 agent 逻辑
- `backend/package.json` - 依赖管理
- 其他使用 voltagent 的文件

## 验收标准

- [ ] 完全移除 voltagent 依赖
- [ ] 直接使用 ai sdk 实现相同功能
- [ ] 数据结构保持不变
- [ ] 使用方式保持不变
- [ ] 所有功能正常工作
- [ ] 性能不下降

## 优先级

**P1（高优先级）** - 解决版本兼容性问题，提升稳定性
