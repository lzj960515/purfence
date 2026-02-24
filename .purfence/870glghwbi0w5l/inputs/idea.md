# Idea

## 需求描述（原文）

**标题**：增加 Issue 继续运行功能和运行详情对话页面

## 功能需求

### 1. 问题背景
- Issue 运行时可能因服务重启等原因卡住/停止
- 目前无法继续运行
- 不知道卡在哪一步（天机还是天府）

### 2. 数据库改造
**给 Execution（运行）表添加字段**：
- 添加 `stage` 字段，标识当前运行阶段
- 值：`tianji`（默认）或 `tianfu`
- 创建时默认是 `tianji`
- 以前的没有值就默认是 `tianji`
- 天机完成发事件时，天府开始前，更新这个标识为 `tianfu`

### 3. 新增工具

**① 查询运行列表工具**：
- 工具名：`listExecutions`
- 传入：`issueId`
- 返回：该 issue 的所有运行列表（包含 stage 标识）

**② 继续运行工具**：
- 工具名：`continueExecution`
- 传入：`executionId`（运行 ID）
- 逻辑：根据 `stage` 标识，选择天机或天府的提示词和工具
- 发送"继续"让 AI 继续执行

### 4. 后端改造 - 新增事件

**新增 `chat_execution` 事件**：
- 区别于原来的 `chat` 事件
- 参数：
  - 原有参数（message、conversationId 等）
  - 新增：`agent`（`tianji` 或 `tianfu`）
- 使用对应的提示词和工具（天机或天府的）

### 5. 前端改造

**需求详情页 - 运行列表**：
- 点击某个运行，打开 AI 对话页面
- 复用现有 AI 对话页面
- 但使用 `chat_execution` 事件，不是 `chat`
- 传入 `executionId` 和 `agent`（根据 stage 自动选择）

**AI 对话页面改造**：
- 右下角可以选模型（原有功能）
- **新增**：选 agent（天机/天府）
- 样式做成一样（复用选模型的样式）
- 选了 agent 后，使用 `chat_execution` 事件

### 6. 涉及文件

**后端**：
- `backend/src/purfence/entities/execution.entity.ts` - 添加 stage 字段
- `backend/src/purfence/tools/list-executions.tool.ts` - 新增查询运行列表工具
- `backend/src/purfence/tools/continue-execution.tool.ts` - 新增继续运行工具
- `backend/src/purfence/events/chat-execution.event.ts` - 新增 chat_execution 事件
- 数据库迁移文件

**前端**：
- `frontend/src/pages/IssueDetailPage.tsx` - 运行列表点击打开对话
- `frontend/src/pages/AIChatPage.tsx` - 增加选 agent 功能
- 相关组件和样式

### 7. 验收标准

- [ ] Execution 表有 stage 字段（默认 tianji）
- [ ] 天机完成后更新 stage 为 tianfu
- [ ] 有 `listExecutions` 工具可查询运行列表
- [ ] 有 `continueExecution` 工具可继续运行
- [ ] 有 `chat_execution` 事件支持指定 agent
- [ ] 需求详情页点击运行可打开 AI 对话
- [ ] AI 对话页面可选 agent（天机/天府）
- [ ] 选 agent 后使用对应提示词和工具
- [ ] 可以从卡住的 issue 继续运行

### 8. 优先级

**P1（高优先级）** - 核心功能，解决 issue 运行中断问题
