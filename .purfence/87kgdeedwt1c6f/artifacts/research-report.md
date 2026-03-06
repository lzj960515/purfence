# 调研报告：将后端 Agent 的工具能力暴露给紫微

## 概述

本报告分析了 Purfence 系统中后端 Agent 的工具集以及紫微（Ziwei）的架构，评估将后端 Agent 的工具能力直接暴露给紫微的可行性。

---

## 1. 后端 Agent 工具清单

### 1.1 Purfence 后端自定义工具

后端自定义工具通过 `@Tool` 装饰器定义，存放在 `backend/src/purfence/tools/` 目录下。

| 工具名称 | 功能描述 | 参数 | 返回值 |
|---------|---------|-----|-------|
| **createProject** | 创建项目或导入现有本地项目 | `mode`: 'create' \| 'import'<br>`name`: 项目名称（create 模式必填）<br>`slug`: 项目英文标识<br>`description`: 项目描述（可选）<br>`externalPath`: 本地项目绝对路径（import 模式必填）<br>`defaultBranch`: 默认主分支名（可选） | `{ id, name, slug, description, localRootPath }` |
| **searchProjects** | 搜索/列出项目 | `query`: 按名称/描述模糊搜索（可选）<br>`limit`: 返回数量 1-50（可选） | `{ items: [{ id, name, description, localRootPath }] }` |
| **updateProject** | 更新项目信息（名称、描述、Slack 配置） | `projectId`: 项目 ID<br>`name`: 项目名称（可选）<br>`description`: 项目描述（可选）<br>`slackAppConfigId`: Slack App 配置 ID（可选）<br>`slackChannelId`: Slack 频道 ID（可选） | `{ id, name, description, slackAppConfigId, slackChannelId }` |
| **createIssue** | 在指定项目下创建需求 | `projectId`: 项目 ID<br>`title`: 需求标题<br>`slug`: 需求英文标识<br>`description`: 需求描述 | `{ id, projectId, title, slug, status, latestExecutionId }` |
| **startIssue** | 启动指定需求，创建并开始新的执行流程 | `issueId`: 需求 ID | `{ issueId, executionId }` |
| **searchIssues** | 搜索/列出需求 | `projectId`: 按项目过滤（可选）<br>`query`: 按标题/描述模糊搜索（可选）<br>`limit`: 返回数量 1-50（可选） | `{ items: [{ id, projectId, title, status, latestExecutionId }] }` |
| **renderArtifacts** | 向用户展示文件（图片/PDF/DOCX/XLSX） | `files`: `[{ path, type: 'image' \| 'pdf' \| 'docx' \| 'xlsx' }]` | `string`: 操作结果消息 |
| **createScheduledTask** | 创建定时任务（支持一次性/周期性） | `name`: 任务名称<br>`prompt`: 到点后发送给 AI 的提示词<br>`kind`: 'one_time' \| 'recurring'<br>`runAt`: 一次性任务的绝对执行时间（可选）<br>`cronExpr`: Cron 表达式（可选）<br>`slackAppConfigId`: Slack App 配置 ID（可选）<br>`slackChannelId`: Slack 频道 ID（可选） | `{ id, name, nextRunAt, kind }` |
| **getCurrentTime** | 获取当前本机时间与时区 | 无 | `{ nowIso, nowLocal, timeZone, unixMs }` |
| **Task** | 启动通用任务 Agent（支持指定 cwd） | `description`: 简短任务描述<br>`prompt`: 任务内容<br>`subagent_type`: Agent 类型<br>`cwd`: 工作目录（可选）<br>`resume`: 会话 ID（可选） | `TaskToolResult`: SDK 执行结果 |
| **delegateTask** | 启动专用任务 Agent（用于 Issue 执行） | `description`: 简短任务描述<br>`prompt`: 任务内容<br>`subagent_type`: Agent 类型 | `TaskToolResult`: SDK 执行结果 |
| **listExecutions** | 查询指定 Issue 的所有 Execution 运行列表 | `issueId`: Issue ID | `{ items: [{ executionId, stage, status, goal, createdAt, updatedAt }], total }` |
| **resumeExecution** | 继续运行指定的 Execution | `executionId`: Execution ID<br>`message`: 附加消息（可选） | `{ executionId, stage, status, message }` |
| **continueExecution** | 继续当前执行，更新目标后重新执行 | `goal`: 更新后的执行目标 | `{ executionId, goal, message }` |
| **createNextExecution** | 创建新执行，用于开始新阶段 | `goal`: 新执行的目标 | `{ executionId, goal, message }` |
| **completeIssue** | 完成 Issue 并合并分支到 main | 无（从上下文获取 issueId） | `{ issueId, status, success, message }` |
| **createNextIssue** | 创建新 Issue 继续推进项目 | `title`: Issue 标题<br>`description`: Issue 描述 | `{ issueId, title, message }` |

### 1.2 工具分类

**紫微（Ziwei）当前可用的工具：**
```typescript
const ZIWEI_TOOLS = [
  'createProject',
  'createIssue',
  'startIssue',
  'searchProjects',
  'searchIssues',
  'getCurrentTime',
  'Task',
  'updateProject',
  'renderArtifacts',
  'createScheduledTask',
] as const;
```

**天机（Tianji）可用的工具：**
```typescript
const TIANJI_TOOLS = [
  'delegateTask',
  'getCurrentTime',
] as const;
```

**天府（Tianfu）可用的工具：**
```typescript
const TIANFU_TOOLS = [
  'continueExecution',
  'createNextExecution',
  'completeIssue',
  'createNextIssue',
  'delegateTask',
  'getCurrentTime',
] as const;
```

### 1.3 MCP（Model Context Protocol）工具

系统还支持通过 MCP 配置外部工具，配置存放在 `my-agent.config.ts` 中：

```typescript
mcpServers: {
  ...getMcpServersFromEnv(),
  // 可配置如 shopify-dev, playwright, chrome-devtools 等
}
```

---

## 2. 紫微架构分析

### 2.1 技术栈

- **后端框架**: NestJS (TypeScript)
- **AI 框架**: @voltagent/core (VoltAgent)
- **LLM 服务**: 自建 LlmService，支持 OpenAI、Anthropic、Gemini 等
- **数据库**: TypeORM (MySQL/PostgreSQL)
- **实时通信**: WebSocket (SocketService)

### 2.2 代码位置

| 组件 | 路径 |
|-----|-----|
| 紫微 Agent 定义 | `backend/src/purfence/agents/ziwei.md` |
| Agent 服务 | `backend/src/purfence/agent.service.ts` |
| 工具定义 | `backend/src/purfence/tools/` |
| 工具模块 | `backend/src/purfence/tools/tools.module.ts` |
| Agent 加载器 | `backend/libs/my-agent/src/utils/agent-loader.util.ts` |
| 工具服务 | `backend/libs/my-agent/src/tools.service.ts` |

### 2.3 紫微现有工具

紫微目前可以使用以下工具（定义在 `agent.service.ts` 的 `ZIWEI_TOOLS`）：

1. **项目管理**: `createProject`, `searchProjects`, `updateProject`
2. **需求管理**: `createIssue`, `startIssue`, `searchIssues`
3. **任务执行**: `Task`
4. **文件展示**: `renderArtifacts`
5. **定时任务**: `createScheduledTask`, `getCurrentTime`

### 2.4 工具集成点

工具通过以下流程集成到紫微：

```
1. 工具定义（@Tool 装饰器）
   ↓
2. ToolsService.scanAndRegisterTools() 自动扫描注册
   ↓
3. MyAgentService.createAgent({ tools: [...] })
   ↓
4. Agent.stream() 执行时使用工具
```

**关键代码（agent.service.ts）：**
```typescript
async streamZiwei(params: {...}) {
  const ziweiPrompt = getAgentPrompt('ziwei');

  await this.streamAgent({
    agentName: 'ziwei',
    prompt: ziweiPrompt,
    tools: [...ZIWEI_TOOLS],  // 工具列表
    ...
  });
}
```

---

## 3. 问题分析

### 3.1 当前问题

**需求中描述的问题**：紫微无法直接使用"后端 Agent 的工具能力（如读取文件、搜索代码等）"。

**实际分析**：

这里存在概念混淆：

1. **紫微的工具**：是 Purfence 后端自定义的业务工具（项目管理、需求管理等）
2. **"后端 Agent 的工具"**：实际上指的是 **Claude Code SDK 提供的底层工具**（Read、Write、Grep、Glob、Bash 等）

**真正的差异**：

| 能力 | 紫微 (Ziwei) | 后端 Agent (通过 Task/delegateTask) |
|-----|-------------|-----------------------------------|
| 文件读取 | ❌ 无 | ✅ Read 工具 |
| 文件写入 | ❌ 无 | ✅ Write/Edit 工具 |
| 代码搜索 | ❌ 无 | ✅ Grep/Glob 工具 |
| 命令执行 | ❌ 无 | ✅ Bash 工具 |
| 项目管理 | ✅ 有 | ❌ 无（需调用紫微工具） |
| 需求管理 | ✅ 有 | ❌ 无（需调用紫微工具） |

### 3.2 为什么紫微没有这些工具？

**原因分析**：

1. **架构设计**：紫微被设计为"对话前台"，专注于项目/需求管理
2. **工具来源**：紫微的工具来自 Purfence 后端自定义工具，而非 Claude Code SDK 的内置工具
3. **执行环境**：后端 Agent 通过 `ClaudeAgentSdkService` 执行，拥有完整的 Claude Code 工具集；紫微通过 `MyAgentService` 执行，只有自定义工具

**关键发现**：

```typescript
// task.tools.ts - 后端 Agent 的执行方式
const enhancedResult = await this.claudeAgentSdkService.executeClaudeAgent({
  prompt: fullTask,
  resume,
  sessionId,
  cwd,
  systemPrompt: getAgentPrompt(agent),
  env: claudeCodeEnv,
});
```

后端 Agent 使用 `ClaudeAgentSdkService`，这会启动一个 Claude Code 子进程，拥有完整的内置工具集（Read、Write、Grep、Glob、Bash 等）。

---

## 4. 集成方案建议

### 方案 A：扩展紫微的 Task 工具（推荐）

**思路**：紫微已经可以使用 `Task` 工具，该工具可以启动一个通用 Agent 来执行文件操作等任务。

**优点**：
- 无需修改现有架构
- 紫微已经具备这个能力（`Task` 工具）
- 安全隔离，文件操作在独立进程中执行

**缺点**：
- 需要理解 Task 工具的使用方式
- 执行效率略低（需要启动子进程）

**实现方式**：
1. 更新紫微的 prompt，明确说明可以使用 `Task` 工具进行文件操作
2. 在 ziwei.md 中添加文件操作示例

**示例用法**：
```
用户：帮我读取 ~/test.txt 文件
紫微：我会使用 Task 工具来读取文件。
[调用 Task 工具，subagent_type='default', prompt='读取 ~/test.txt 文件的内容']
```

### 方案 B：为紫微创建独立的文件操作工具

**思路**：在 Purfence 后端创建 `readFile`、`writeFile`、`searchCode` 等工具，添加到紫微的工具列表。

**实现步骤**：

1. **创建新工具文件** `backend/src/purfence/tools/file.tools.ts`：

```typescript
@Injectable()
export class FileTools {
  @Tool({
    name: 'readFile',
    description: '读取指定路径的文件内容',
    parameters: z.object({
      path: z.string().describe('文件的绝对路径'),
    }),
  })
  async readFile(args: { path: string }) {
    const content = await fs.readFile(args.path, 'utf-8');
    return { content };
  }

  @Tool({
    name: 'writeFile',
    description: '写入内容到指定文件',
    parameters: z.object({
      path: z.string().describe('文件的绝对路径'),
      content: z.string().describe('要写入的内容'),
    }),
  })
  async writeFile(args: { path: string; content: string }) {
    await fs.writeFile(args.path, args.content, 'utf-8');
    return { success: true };
  }

  @Tool({
    name: 'searchCode',
    description: '在指定目录中搜索代码',
    parameters: z.object({
      pattern: z.string().describe('搜索的正则表达式模式'),
      path: z.string().describe('搜索的目录路径'),
    }),
  })
  async searchCode(args: { pattern: string; path: string }) {
    // 实现代码搜索逻辑
  }
}
```

2. **注册工具模块**：更新 `tools.module.ts`

3. **更新紫微工具列表**：

```typescript
const ZIWEI_TOOLS = [
  // 现有工具...
  'readFile',
  'writeFile',
  'searchCode',
] as const;
```

**优点**：
- 直接调用，效率高
- 完全控制工具行为

**缺点**：
- 需要维护额外的工具代码
- 需要处理安全性问题（路径访问控制等）

### 方案 C：让紫微使用 ClaudeAgentSdkService

**思路**：让紫微也通过 `ClaudeAgentSdkService` 执行，获得完整的 Claude Code 工具集。

**实现方式**：
1. 修改 `streamZiwei` 方法，使用 `ClaudeAgentSdkService` 而非 `MyAgentService`
2. 保留紫微的自定义工具通过 MCP 或其他方式注入

**优点**：
- 获得完整的 Claude Code 工具集
- 与后端 Agent 能力一致

**缺点**：
- 架构改动较大
- 可能影响现有功能

---

## 5. 推荐方案

### 推荐：方案 A（扩展 Task 工具）

**理由**：
1. **零代码改动**：紫微已经具备 `Task` 工具
2. **安全隔离**：文件操作在独立进程中执行，不影响主服务
3. **易于实现**：只需更新紫微的 prompt 文档

**实现步骤**：

1. **更新 ziwei.md**，在工具使用提示中明确说明：

```markdown
## 文件操作

当用户需要读取文件、搜索代码、执行命令时，使用 Task 工具：

- **读取文件**：Task(subagent_type='default', prompt='读取 xxx 文件')
- **搜索代码**：Task(subagent_type='default', prompt='在 xxx 目录搜索 yyy')
- **执行命令**：Task(subagent_type='default', prompt='执行 xxx 命令')

示例：
用户：帮我读取 ~/test.txt 文件
紫微：我会使用 Task 工具来读取文件。
[调用 Task 工具]
```

2. **可选：创建专门的 file-explore agent**，用于文件操作任务

---

## 6. 下一步行动建议

### 短期（1-2 天）

1. **验证 Task 工具能力**
   - 测试紫微使用 Task 工具读取文件的能力
   - 测试紫微使用 Task 工具搜索代码的能力
   - 记录问题和限制

2. **更新紫微 Prompt**
   - 在 ziwei.md 中添加文件操作指南
   - 添加使用 Task 工具的示例对话

### 中期（3-5 天）

3. **优化 Task 工具体验**
   - 考虑为文件操作创建专门的 subagent_type（如 'file-explore'）
   - 优化 Task 工具的返回格式，更适合文件内容展示

4. **考虑方案 B 的实现**
   - 如果 Task 工具体验不佳，考虑创建独立的文件操作工具
   - 评估安全性需求（路径访问控制等）

### 长期（1-2 周）

5. **统一 Agent 工具架构**
   - 评估是否需要让所有 Agent 都使用 ClaudeAgentSdkService
   - 考虑工具共享的标准化方案

---

## 7. 附录

### 7.1 关键文件路径

| 文件 | 路径 | 用途 |
|-----|-----|-----|
| 紫微定义 | `backend/src/purfence/agents/ziwei.md` | Agent prompt 定义 |
| Agent 服务 | `backend/src/purfence/agent.service.ts` | Agent 执行逻辑 |
| Purfence 工具 | `backend/src/purfence/tools/purfence.tools.ts` | 项目/需求管理工具 |
| Task 工具 | `backend/src/purfence/tools/task.tools.ts` | 任务委托工具 |
| 工具装饰器 | `backend/libs/my-agent/src/tool.decorator.ts` | @Tool 装饰器定义 |
| 工具服务 | `backend/libs/my-agent/src/tools.service.ts` | 工具注册和获取 |
| Agent 加载器 | `backend/libs/my-agent/src/utils/agent-loader.util.ts` | Agent prompt 加载 |

### 7.2 工具注册流程

```
1. 定义工具类（@Tool 装饰器）
   ↓
2. ToolsModule 注册 Provider
   ↓
3. ToolsService.scanAndRegisterTools() 扫描
   ↓
4. 工具存入 Map<string, Tool>
   ↓
5. MyAgentService.createAgent({ tools: [...] })
   ↓
6. ToolsService.getTools(tools) 获取工具实例
```

### 7.3 Claude Code SDK 内置工具

Claude Code SDK 启动时自动提供以下内置工具：

| 工具 | 功能 |
|-----|-----|
| Read | 读取文件 |
| Write | 写入文件 |
| Edit | 编辑文件 |
| Glob | 文件模式匹配 |
| Grep | 内容搜索 |
| Bash | 执行命令 |
| LSP | 语言服务器协议（代码智能） |
| Task | 启动子 Agent |
| WebSearch | 网页搜索 |
| NotebookEdit | 编辑 Jupyter Notebook |
| KillShell | 终止后台 Shell |

这些工具只有在通过 `ClaudeAgentSdkService` 执行时才可用。
