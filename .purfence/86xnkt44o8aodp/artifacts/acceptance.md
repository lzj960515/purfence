# Voltagent → AI SDK 迁移验收标准文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-02-23
- **关联文档**: [技术设计文档](./tech-design.md)
- **验收状态**: ⏳ 待执行

---

## 1. 功能验收标准

### 1.1 Agent 创建和调用

#### 1.1.1 Agent 创建

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| 基本创建 | `MyAgentService.createAgent()` 成功返回 `MyAgent` 实例 | 单元测试 | P0 |
| 配置传递 | `name`, `prompt`, `modelOptions`, `tools` 正确传递到 AI SDK | 单元测试 + 日志验证 | P0 |
| 工具绑定 | Agent 创建时正确绑定指定工具列表 | 集成测试 | P0 |
| 内存配置 | `memory: false` 和 `memory: 'in-memory'` 配置生效 | 单元测试 | P1 |
| 子 Agent | `subAgentsOptions` 参数被正确处理（即使为空） | 单元测试 | P2 |

**验收检查清单**:
- [ ] `createAgent()` 返回类型为 `MyAgent`
- [ ] `MyAgent.getAgentName()` 返回正确的 Agent 名称
- [ ] `MyAgent.getMyModel()` 返回正确的模型配置
- [ ] `MyAgent.getModel()` 返回 AI SDK 的 `LanguageModel` 实例
- [ ] `MyAgent.getTools()` 返回 AI SDK 格式的工具集合

#### 1.1.2 流式调用

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| 基本流式 | `MyAgent.stream()` 返回 Observable 流 | 单元测试 | P0 |
| 流事件类型 | 流中包含 `thinking`, `text`, `tool_text`, `tool_result` 事件 | E2E 测试 | P0 |
| 会话管理 | `conversationId` 正确关联到会话存储 | 集成测试 | P0 |
| 用户上下文 | `userId` 和 `context` 正确传递 | 单元测试 | P0 |
| 中断处理 | `abortSignal` 正确中断流 | 单元测试 | P1 |
| 重试机制 | 流错误时自动重试（最多5次） | 集成测试 | P1 |
| 压缩逻辑 | 会话满时触发消息压缩 | 集成测试 | P2 |

**验收检查清单**:
- [ ] 流式响应包含 `role: 'ai'` 的事件
- [ ] 文本事件 `type: 'text'` 正确返回
- [ ] 推理事件 `type: 'thinking'` 正确返回（支持推理的模型）
- [ ] 工具调用事件 `type: 'tool_text'` 正确触发
- [ ] 工具结果事件 `type: 'tool_result'` 包含 artifact
- [ ] 流结束正确触发 `finalize`

#### 1.1.3 非流式调用

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| 基本调用 | `MyAgent.invoke()` 返回字符串结果 | 单元测试 | P0 |
| 结构化输出 | 传入 `generateTextOutputOptions` 返回结构化对象 | 单元测试 | P0 |
| 上下文传递 | `chatOptions.context` 正确传递 | 单元测试 | P1 |

**验收检查清单**:
- [ ] 无 schema 时返回 `string`
- [ ] 有 schema 时返回符合 schema 的对象
- [ ] 结果与流式调用结果一致

### 1.2 Tool 定义和执行

#### 1.2.1 Tool 装饰器

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| 装饰器注册 | `@Tool()` 装饰的方法被正确注册 | 单元测试 | P0 |
| 参数定义 | `parameters` (Zod schema) 正确传递 | 单元测试 | P0 |
| 描述传递 | `description` 正确传递到 AI SDK | 单元测试 | P0 |
| 名称定义 | `name` 正确设置（默认使用方法名） | 单元测试 | P0 |

**验收检查清单**:
- [ ] 装饰器不改变原有方法行为
- [ ] `ToolOpt` 元数据正确存储
- [ ] `ToolWatermark` 正确标记类

#### 1.2.2 Tool 执行

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| 同步执行 | Tool 同步返回结果 | 单元测试 | P0 |
| 异步执行 | Tool 异步返回结果 | 单元测试 | P0 |
| 参数传递 | Tool 参数正确传递给 execute 函数 | 集成测试 | P0 |
| 上下文传递 | `toolCallId` 和 `messages` 正确传递 | 集成测试 | P0 |
| 错误处理 | Tool 执行错误正确捕获和返回 | 单元测试 | P0 |
| Artifact 生成 | Tool 生成的 artifact 正确存储 | 集成测试 | P0 |

**验收检查清单**:
- [ ] Tool 执行结果正确返回给 AI
- [ ] Tool 执行错误不中断整个流
- [ ] Tool 执行时间被记录
- [ ] Tool 生成的 artifact 可通过 `toolCallId` 查询

#### 1.2.3 MCP 工具

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| MCP 连接 | 成功连接到配置的 MCP 服务器 | 集成测试 | P0 |
| 工具发现 | 自动发现并注册 MCP 工具 | 集成测试 | P0 |
| 工具调用 | MCP 工具正确执行 | 集成测试 | P0 |
| 错误处理 | MCP 服务器故障不影响其他工具 | 集成测试 | P1 |

**验收检查清单**:
- [ ] MCP 工具与本地工具无冲突
- [ ] MCP 工具描述正确传递
- [ ] MCP 工具参数正确转换

#### 1.2.4 工具包 (Toolkit)

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| 工具包注册 | `createToolKits()` 正确注册工具包 | 单元测试 | P0 |
| 工具包获取 | `getToolKit()` 返回正确的工具包 | 单元测试 | P0 |
| 工具包执行 | 工具包中的工具正确执行 | 集成测试 | P0 |

### 1.3 流式响应处理

#### 1.3.1 流事件映射

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| text-delta | AI SDK `text-delta` 映射为 `type: 'text'` | 单元测试 | P0 |
| reasoning-delta | AI SDK `reasoning-delta` 映射为 `type: 'thinking'` | 单元测试 | P0 |
| tool-call | AI SDK `tool-call` 映射为 `type: 'tool_text'` | 单元测试 | P0 |
| tool-result | AI SDK `tool-result` 映射为 `type: 'tool_result'` | 单元测试 | P0 |
| finish | AI SDK `finish` 触发 onEnd 逻辑 | 单元测试 | P0 |
| error | AI SDK `error` 正确抛出异常 | 单元测试 | P0 |

**验收检查清单**:
- [ ] 所有事件类型都有对应的处理逻辑
- [ ] 事件 ID 生成唯一且稳定
- [ ] 事件内容正确提取

#### 1.3.2 流管道处理

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| Artifact 加载 | `tool_result` 事件正确加载 artifact | 集成测试 | P0 |
| 空内容过滤 | 空内容事件被正确过滤 | 单元测试 | P1 |
| 类型过滤 | 非目标类型事件被正确过滤 | 单元测试 | P1 |
| 日志输出 | 流事件正确输出到日志 | 单元测试 | P2 |

### 1.4 数据存储和检索

#### 1.4.1 消息存储

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| 消息添加 | `addMessage()` 正确存储消息 | 单元测试 | P0 |
| 批量添加 | `addMessages()` 正确存储多条消息 | 单元测试 | P0 |
| 消息查询 | `getMessages()` 返回正确格式的消息 | 单元测试 | P0 |
| 分页查询 | `limit`, `before`, `after` 参数生效 | 单元测试 | P1 |
| 角色过滤 | `roles` 参数正确过滤 | 单元测试 | P1 |
| 去重处理 | 相同 ID 的消息更新而非重复插入 | 单元测试 | P0 |

**验收检查清单**:
- [ ] 消息存储后可通过 `conversationId` 查询
- [ ] 消息格式符合 `UIMessage` 标准
- [ ] 消息元数据正确存储

#### 1.4.2 会话管理

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| 会话创建 | `createConversation()` 创建新会话 | 单元测试 | P0 |
| 重复检测 | 相同 ID 创建抛出 `ConversationAlreadyExistsError` | 单元测试 | P0 |
| 会话查询 | `getConversation()` 返回正确会话 | 单元测试 | P0 |
| 会话更新 | `updateConversation()` 更新会话信息 | 单元测试 | P0 |
| 会话删除 | `deleteConversation()` 删除会话及消息 | 单元测试 | P0 |
| 标题更新 | 会话标题正确更新 | 集成测试 | P0 |

#### 1.4.3 Working Memory

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| 用户级别 | `scope: 'user'` 正确存储和读取 | 单元测试 | P1 |
| 会话级别 | `scope: 'conversation'` 正确存储和读取 | 单元测试 | P1 |
| 全局级别 | `scope: 'global'` 正确存储和读取 | 单元测试 | P1 |

#### 1.4.4 Workflow State

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| 状态存储 | `setWorkflowState()` 正确存储 | 单元测试 | P2 |
| 状态读取 | `getWorkflowState()` 正确读取 | 单元测试 | P2 |
| 状态更新 | `updateWorkflowState()` 正确更新 | 单元测试 | P2 |

### 1.5 Hooks 生命周期

#### 1.5.1 生命周期事件

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| onStart | Agent 调用开始时触发 | 单元测试 | P0 |
| onEnd | Agent 调用结束时触发 | 单元测试 | P0 |
| 事件参数 | 事件包含 `agentName`, `conversationId`, `userId`, `output` | 单元测试 | P0 |

#### 1.5.2 Token 使用量统计

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| inputTokens | 正确记录输入 token 数 | 集成测试 | P0 |
| outputTokens | 正确记录输出 token 数 | 集成测试 | P0 |
| totalTokens | 正确记录总 token 数 | 集成测试 | P0 |
| reasoningTokens | 正确记录推理 token 数（如支持） | 集成测试 | P1 |
| 数据库更新 | `AgentConversationSession` 正确更新 | 集成测试 | P0 |

#### 1.5.3 自定义事件

| 验收项 | 验收标准 | 测试方法 | 优先级 |
|-------|---------|---------|--------|
| 事件触发 | `context.event` 触发对应事件 | 集成测试 | P0 |
| 参数传递 | 事件参数包含 `conversationId` 和上下文 | 集成测试 | P0 |

---

## 2. 数据结构验收标准

### 2.1 数据库实体保持不变

#### 2.1.1 AgentMemoryConversation

| 字段 | 类型 | 是否变更 | 验证方法 |
|-----|------|---------|---------|
| id | string | ❌ 不变 | 数据库 schema 对比 |
| resourceId | string | ❌ 不变 | 数据库 schema 对比 |
| userId | string | ❌ 不变 | 数据库 schema 对比 |
| title | string | ❌ 不变 | 数据库 schema 对比 |
| metadata | json | ❌ 不变 | 数据库 schema 对比 |
| createdAt | datetime | ❌ 不变 | 数据库 schema 对比 |
| updatedAt | datetime | ❌ 不变 | 数据库 schema 对比 |

#### 2.1.2 AgentMemoryMessage

| 字段 | 类型 | 是否变更 | 验证方法 |
|-----|------|---------|---------|
| id | string | ❌ 不变 | 数据库 schema 对比 |
| userId | string | ❌ 不变 | 数据库 schema 对比 |
| conversationId | string | ❌ 不变 | 数据库 schema 对比 |
| role | string | ❌ 不变 | 数据库 schema 对比 |
| parts | json | ❌ 不变 | 数据库 schema 对比 |
| metadata | json | ❌ 不变 | 数据库 schema 对比 |
| createdAt | datetime | ❌ 不变 | 数据库 schema 对比 |
| updatedAt | datetime | ❌ 不变 | 数据库 schema 对比 |

#### 2.1.3 AgentWorkingMemory

| 字段 | 类型 | 是否变更 | 验证方法 |
|-----|------|---------|---------|
| id | string | ❌ 不变 | 数据库 schema 对比 |
| scope | enum | ❌ 不变 | 数据库 schema 对比 |
| userId | string | ❌ 不变 | 数据库 schema 对比 |
| conversationId | string | ❌ 不变 | 数据库 schema 对比 |
| content | text | ❌ 不变 | 数据库 schema 对比 |
| createdAt | datetime | ❌ 不变 | 数据库 schema 对比 |
| updatedAt | datetime | ❌ 不变 | 数据库 schema 对比 |

#### 2.1.4 AgentWorkflowState

| 字段 | 类型 | 是否变更 | 验证方法 |
|-----|------|---------|---------|
| id | string | ❌ 不变 | 数据库 schema 对比 |
| workflowId | string | ❌ 不变 | 数据库 schema 对比 |
| workflowName | string | ❌ 不变 | 数据库 schema 对比 |
| status | enum | ❌ 不变 | 数据库 schema 对比 |
| userId | string | ❌ 不变 | 数据库 schema 对比 |
| conversationId | string | ❌ 不变 | 数据库 schema 对比 |
| input | json | ❌ 不变 | 数据库 schema 对比 |
| context | json | ❌ 不变 | 数据库 schema 对比 |
| workflowState | json | ❌ 不变 | 数据库 schema 对比 |
| createdAt | datetime | ❌ 不变 | 数据库 schema 对比 |
| updatedAt | datetime | ❌ 不变 | 数据库 schema 对比 |

#### 2.1.5 AgentConversationSession

| 字段 | 类型 | 是否变更 | 验证方法 |
|-----|------|---------|---------|
| id | string | ❌ 不变 | 数据库 schema 对比 |
| userId | string | ❌ 不变 | 数据库 schema 对比 |
| conversationId | string | ❌ 不变 | 数据库 schema 对比 |
| isCurrent | boolean | ❌ 不变 | 数据库 schema 对比 |
| inputTokens | int | ❌ 不变 | 数据库 schema 对比 |
| outputTokens | int | ❌ 不变 | 数据库 schema 对比 |
| totalTokens | int | ❌ 不变 | 数据库 schema 对比 |
| reasoningTokens | int | ❌ 不变 | 数据库 schema 对比 |
| cachedInputTokens | int | ❌ 不变 | 数据库 schema 对比 |
| createdAt | datetime | ❌ 不变 | 数据库 schema 对比 |
| updatedAt | datetime | ❌ 不变 | 数据库 schema 对比 |

**验收检查清单**:
- [ ] 所有数据库表结构与原结构完全一致
- [ ] 所有字段类型未变更
- [ ] 所有索引未变更
- [ ] 所有外键约束未变更

### 2.2 API 响应格式保持不变

#### 2.2.1 StreamEvent 格式

```typescript
// 必须保持的格式
interface StreamEvent {
  role: 'ai';
  id: string;
  type: 'thinking' | 'text' | 'tool_text' | 'tool_result' | 'interrupt';
  content?: string;
  toolName?: string;
  artifact?: any;
}
```

| 字段 | 类型 | 是否变更 | 验证方法 |
|-----|------|---------|---------|
| role | 'ai' | ❌ 不变 | 响应数据对比 |
| id | string | ❌ 不变 | 响应数据对比 |
| type | StreamEventType | ❌ 不变 | 响应数据对比 |
| content | string? | ❌ 不变 | 响应数据对比 |
| toolName | string? | ❌ 不变 | 响应数据对比 |
| artifact | any? | ❌ 不变 | 响应数据对比 |

#### 2.2.2 ChatOptions 格式

| 字段 | 类型 | 是否变更 | 验证方法 |
|-----|------|---------|---------|
| message | string \| UIMessage[] | ❌ 不变 | TypeScript 编译检查 |
| userId | string? | ❌ 不变 | TypeScript 编译检查 |
| conversationId | string? | ❌ 不变 | TypeScript 编译检查 |
| context | Record<string, any>? | ❌ 不变 | TypeScript 编译检查 |
| modelOptions | ModelOptions? | ❌ 不变 | TypeScript 编译检查 |

#### 2.2.3 AgentOptions 格式

| 字段 | 类型 | 是否变更 | 验证方法 |
|-----|------|---------|---------|
| name | string | ❌ 不变 | TypeScript 编译检查 |
| model | SupportedModel? | ❌ 不变 | TypeScript 编译检查 |
| modelOptions | ModelOptions? | ❌ 不变 | TypeScript 编译检查 |
| prompt | string? | ❌ 不变 | TypeScript 编译检查 |
| tools | (string \| object)[]? | ❌ 不变 | TypeScript 编译检查 |
| subAgentsOptions | AgentOptions[]? | ❌ 不变 | TypeScript 编译检查 |
| memory | false \| 'in-memory'? | ❌ 不变 | TypeScript 编译检查 |

### 2.3 流事件格式保持一致

#### 2.3.1 事件类型映射验证

| AI SDK 事件 | 内部事件类型 | 字段映射 | 验证状态 |
|------------|-------------|---------|---------|
| text-delta | text | textDelta → content | ⏳ 待验证 |
| reasoning-delta | thinking | textDelta → content | ⏳ 待验证 |
| tool-call | tool_text | toolName → toolName/content | ⏳ 待验证 |
| tool-result | tool_result | result → content/artifact | ⏳ 待验证 |
| finish | (无事件) | 触发 onEnd | ⏳ 待验证 |
| error | (抛出异常) | error → Error | ⏳ 待验证 |

#### 2.3.2 事件顺序验证

```
预期事件序列:
1. text-delta / reasoning-delta (可选，可多个)
2. tool-call (可选)
3. tool-result (可选，对应 tool-call)
4. text-delta (可选，工具结果后的文本)
5. finish
```

**验收检查清单**:
- [ ] 事件顺序与原实现一致
- [ ] 事件时间戳合理（无乱序）
- [ ] 事件 ID 唯一性

---

## 3. 性能验收标准

### 3.1 响应时间对比

#### 3.1.1 首 Token 响应时间 (TTFT)

| 指标 | Voltagent 基线 | AI SDK 目标 | 容忍偏差 | 测试方法 |
|-----|---------------|-------------|---------|---------|
| 简单查询 | < 500ms | < 500ms | +20% | 压力测试 |
| 复杂查询 | < 1000ms | < 1000ms | +20% | 压力测试 |
| 带工具调用 | < 1500ms | < 1500ms | +20% | 压力测试 |

**验收检查清单**:
- [ ] TTFT 不超过基线的 120%
- [ ] 95 分位数 TTFT 不超过基线的 150%

#### 3.1.2 流式传输延迟

| 指标 | Voltagent 基线 | AI SDK 目标 | 容忍偏差 | 测试方法 |
|-----|---------------|-------------|---------|---------|
| 事件间隔 | < 50ms | < 50ms | +20% | 流式测试 |
| 端到端时间 | < 5s (短回复) | < 5s | +10% | E2E 测试 |

### 3.2 内存使用对比

| 指标 | Voltagent 基线 | AI SDK 目标 | 容忍偏差 | 测试方法 |
|-----|---------------|-------------|---------|---------|
| 空闲内存 | X MB | < X MB | +10% | 内存分析 |
| 流式处理内存 | Y MB | < Y MB | +10% | 内存分析 |
| 并发请求内存 | Z MB | < Z MB | +10% | 内存分析 |
| 内存泄漏 | 无 | 无 | - | 长时间运行测试 |

**验收检查清单**:
- [ ] 无内存泄漏（24 小时运行）
- [ ] 内存使用峰值不超过基线的 110%

### 3.3 吞吐量对比

| 指标 | Voltagent 基线 | AI SDK 目标 | 容忍偏差 | 测试方法 |
|-----|---------------|-------------|---------|---------|
| RPS (简单) | X req/s | >= X | -10% | 负载测试 |
| RPS (复杂) | Y req/s | >= Y | -10% | 负载测试 |
| 并发连接 | Z | >= Z | -10% | 并发测试 |

**验收检查清单**:
- [ ] 吞吐量不低于基线的 90%
- [ ] 错误率 < 0.1%

### 3.4 性能测试场景

#### 3.4.1 测试场景定义

| 场景 | 描述 | 负载 | 持续时间 |
|-----|------|------|---------|
| 简单对话 | 单次文本生成 | 100 RPS | 5 分钟 |
| 工具调用 | 单次工具调用 | 50 RPS | 5 分钟 |
| 多轮对话 | 10 轮对话 | 20 RPS | 10 分钟 |
| 混合负载 | 70% 简单 + 30% 工具 | 80 RPS | 10 分钟 |
| 长时间运行 | 持续对话 | 10 RPS | 24 小时 |

#### 3.4.2 性能基准数据收集

```bash
# 执行性能测试前，先收集 Voltagent 基线数据
npm run test:performance:baseline

# 执行 AI SDK 性能测试
npm run test:performance

# 对比报告
npm run test:performance:compare
```

---

## 4. 兼容性验收标准

### 4.1 现有代码无需修改即可使用

#### 4.1.1 服务层兼容性

| 使用方 | 代码示例 | 预期行为 | 验证状态 |
|-------|---------|---------|---------|
| PurfenceAgentService | `this.myAgentService.createAgent(...)` | 正常工作 | ⏳ 待验证 |
| PurfenceAgentService | `agent.stream(...)` | 正常工作 | ⏳ 待验证 |
| PurfenceAgentService | `agent.invoke(...)` | 正常工作 | ⏳ 待验证 |
| 其他服务 | `this.toolsService.getTools(...)` | 正常工作 | ⏳ 待验证 |

#### 4.1.2 Controller 层兼容性

| Controller | 功能 | 预期行为 | 验证状态 |
|-----------|------|---------|---------|
| ChatController | 流式聊天 | SSE 正常 | ⏳ 待验证 |
| AgentController | Agent 管理 | API 正常 | ⏳ 待验证 |

#### 4.1.3 工具兼容性

| 工具类型 | 示例 | 预期行为 | 验证状态 |
|---------|------|---------|---------|
| 本地工具 | createProject | 正常执行 | ⏳ 待验证 |
| MCP 工具 | webSearch | 正常执行 | ⏳ 待验证 |
| 工具包 | reasoning_tools | 正常执行或移除 | ⏳ 待验证 |

**验收检查清单**:
- [ ] 所有现有服务无需修改即可编译通过
- [ ] 所有现有服务单元测试通过
- [ ] 所有现有集成测试通过

### 4.2 现有数据完整保留

#### 4.2.1 数据迁移验证

| 数据类型 | 验证项 | 方法 | 验收标准 |
|---------|-------|------|---------|
| 历史消息 | 可正常查询 | 查询测试 | 100% 数据可访问 |
| 历史会话 | 可正常加载 | 加载测试 | 100% 会话可加载 |
| Token 统计 | 统计正确 | 对比测试 | 统计数据准确 |
| Working Memory | 可正常读取 | 读取测试 | 数据完整 |

#### 4.2.2 数据一致性验证

```sql
-- 迁移前数据量统计
SELECT
  'AgentMemoryConversation' as table_name, COUNT(*) as count FROM agent_memory_conversation
UNION ALL
SELECT 'AgentMemoryMessage', COUNT(*) FROM agent_memory_message
UNION ALL
SELECT 'AgentConversationSession', COUNT(*) FROM agent_conversation_session;

-- 迁移后数据量应该完全一致
```

**验收检查清单**:
- [ ] 所有历史数据可正常访问
- [ ] 新写入数据格式与旧数据兼容
- [ ] 数据量统计一致

---

## 5. 测试验收标准

### 5.1 单元测试覆盖率

#### 5.1.1 覆盖率要求

| 模块 | 行覆盖率 | 分支覆盖率 | 函数覆盖率 |
|-----|---------|-----------|-----------|
| MyAgentService | >= 80% | >= 70% | >= 80% |
| MyAgent | >= 80% | >= 70% | >= 80% |
| ToolsService | >= 75% | >= 65% | >= 75% |
| MemoryStorageService | >= 80% | >= 70% | >= 80% |
| AgentLifecycleService | >= 80% | >= 70% | >= 80% |
| StreamEventMapper | >= 90% | >= 80% | >= 90% |

#### 5.1.2 关键路径覆盖

| 路径 | 描述 | 必须覆盖 |
|-----|------|---------|
| 流式调用成功 | 正常流式响应 | ✅ |
| 流式调用失败 | 网络错误、API 错误 | ✅ |
| 流式调用重试 | 重试机制 | ✅ |
| 工具调用成功 | 工具正常执行 | ✅ |
| 工具调用失败 | 工具执行错误 | ✅ |
| 会话创建 | 新会话创建 | ✅ |
| 会话复用 | 已有会话加载 | ✅ |
| Token 统计 | 使用量统计 | ✅ |

### 5.2 集成测试场景

#### 5.2.1 场景列表

| 场景 ID | 场景描述 | 前置条件 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| INT-001 | 创建 Agent 并流式调用 | 服务正常启动 | 返回正确流事件 | P0 |
| INT-002 | 创建 Agent 并非流式调用 | 服务正常启动 | 返回正确结果 | P0 |
| INT-003 | 调用带工具的 Agent | 工具已注册 | 工具正确执行 | P0 |
| INT-004 | 多轮对话 | 已有会话 | 上下文正确传递 | P0 |
| INT-005 | 会话标题生成 | CODEX provider | 标题正确生成 | P1 |
| INT-006 | Token 使用量统计 | 任意调用 | 统计正确 | P0 |
| INT-007 | 消息压缩 | 会话满 | 正确压缩 | P1 |
| INT-008 | MCP 工具调用 | MCP 服务可用 | 工具正确执行 | P1 |
| INT-009 | 流中断 | 调用中 | 正确中断 | P1 |
| INT-010 | 错误重试 | 临时错误 | 正确重试 | P1 |

#### 5.2.2 集成测试执行

```bash
# 执行所有集成测试
npm run test:integration

# 执行特定场景
npm run test:integration -- --grep "INT-001"
```

### 5.3 E2E 测试流程

#### 5.3.1 完整对话流程

```gherkin
Feature: 完整对话流程

  Scenario: 用户发起对话并收到回复
    Given 用户已登录
    And 服务正常运行
    When 用户发送消息 "你好"
    Then 收到流式响应
    And 响应包含文本内容
    And 会话被创建
    And Token 使用量被记录

  Scenario: 多轮对话保持上下文
    Given 已有活跃会话
    When 用户发送消息 "刚才我说了什么"
    Then 收到流式响应
    And 响应包含对前文内容的引用

  Scenario: 工具调用
    Given 用户已登录
    When 用户发送消息 "创建项目测试项目"
    Then 收到流式响应
    And 响应包含 tool_text 事件
    And 响应包含 tool_result 事件
    And 项目被成功创建
```

#### 5.3.2 性能基准测试

```gherkin
Feature: 性能基准

  Scenario: 并发流式请求
    Given 服务正常运行
    When 同时发起 100 个流式请求
    Then 所有请求成功完成
    And 平均响应时间 < 基线 120%
    And 错误率 < 0.1%
```

#### 5.3.3 E2E 测试执行

```bash
# 启动测试环境
docker-compose -f docker-compose.test.yml up -d

# 执行 E2E 测试
npm run test:e2e

# 生成报告
npm run test:e2e:report
```

### 5.4 测试环境要求

#### 5.4.1 单元测试

- 无需外部依赖
- 使用 Jest + 模拟数据
- 运行时间 < 2 分钟

#### 5.4.2 集成测试

- 需要数据库（SQLite 内存或测试 MySQL）
- 需要 Redis（可选，可用内存替代）
- 需要 AI 服务模拟（msw 或真实 API key）
- 运行时间 < 10 分钟

#### 5.4.3 E2E 测试

- 需要完整服务栈
- 需要真实 AI API key
- 运行时间 < 30 分钟

---

## 6. 验收流程

### 6.1 验收阶段

```
Phase 2 验收 (存储层适配完成后)
├── 单元测试通过 (MemoryStorageService)
├── 集成测试通过 (存储操作)
└── 数据兼容性验证通过

Phase 3 验收 (核心功能迁移完成后)
├── 单元测试通过 (所有核心模块)
├── 集成测试通过 (所有场景)
├── E2E 测试通过 (核心流程)
└── 性能测试通过 (不劣化)

Phase 4 验收 (集成测试完成后)
├── 全量集成测试通过
├── 全量 E2E 测试通过
├── 性能基准对比通过
└── 代码审查通过

Phase 5 验收 (清理验证完成后)
├── 依赖清理完成
├── 回归测试通过
└── 文档更新完成
```

### 6.2 验收检查表

#### Phase 2 验收检查表

- [ ] `MemoryStorageService` 单元测试覆盖率 >= 80%
- [ ] 所有存储操作集成测试通过
- [ ] 数据库 schema 未变更验证通过
- [ ] 历史数据读取测试通过

#### Phase 3 验收检查表

- [ ] `MyAgentService` 单元测试覆盖率 >= 80%
- [ ] `MyAgent` 单元测试覆盖率 >= 80%
- [ ] `ToolsService` 单元测试覆盖率 >= 75%
- [ ] `AgentLifecycleService` 单元测试覆盖率 >= 80%
- [ ] `StreamEventMapper` 单元测试覆盖率 >= 90%
- [ ] 所有集成测试场景通过
- [ ] E2E 核心流程测试通过
- [ ] 性能测试不劣化

#### Phase 4 验收检查表

- [ ] 全量集成测试通过
- [ ] 全量 E2E 测试通过
- [ ] 性能基准对比通过
- [ ] 代码审查无阻塞问题
- [ ] 安全扫描通过

#### Phase 5 验收检查表

- [ ] voltagent 依赖已移除
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 回滚方案已验证

### 6.3 验收通过标准

| 验收项 | 通过标准 |
|-------|---------|
| 功能验收 | 所有 P0 功能测试通过 |
| 数据结构 | 所有数据库实体未变更 |
| 性能验收 | 性能不劣于基线 90% |
| 兼容性 | 现有代码无需修改即可使用 |
| 测试覆盖 | 核心模块覆盖率 >= 75% |
| 代码质量 | 审查无阻塞问题 |

---

## 7. 附录

### 7.1 验收工具

| 工具 | 用途 | 命令 |
|-----|------|------|
| Jest | 单元测试 | `npm run test:unit` |
| Supertest | 集成测试 | `npm run test:integration` |
| Playwright | E2E 测试 | `npm run test:e2e` |
| Artillery | 性能测试 | `npm run test:performance` |
| Istanbul | 覆盖率 | `npm run test:coverage` |

### 7.2 验收报告模板

```markdown
## 验收报告 - Phase X

### 执行日期
YYYY-MM-DD

### 执行人
[姓名]

### 验收结果
- [ ] 通过
- [ ] 不通过（见问题列表）

### 测试统计
| 测试类型 | 总数 | 通过 | 失败 | 跳过 |
|---------|------|------|------|------|
| 单元测试 | X | X | X | X |
| 集成测试 | X | X | X | X |
| E2E 测试 | X | X | X | X |

### 覆盖率报告
| 模块 | 行覆盖 | 分支覆盖 | 函数覆盖 |
|-----|-------|---------|---------|
| ... | ... | ... | ... |

### 性能对比
| 指标 | 基线 | 当前 | 偏差 |
|-----|------|------|------|
| ... | ... | ... | ... |

### 发现问题
1. [问题描述]
   - 严重程度: [高/中/低]
   - 解决方案: [描述]

### 签名
- 测试: ___________
- 开发: ___________
- 架构: ___________
```

### 7.3 问题升级流程

```
发现问题
    ↓
记录问题（验收文档）
    ↓
评估严重程度
    ↓
├── 阻塞问题 → 停止验收，修复后重新验收
├── 高优先级 → 记录，修复后验证
├── 中优先级 → 记录，可在后续迭代修复
└── 低优先级 → 记录，不影响验收
```

---

**文档结束**
