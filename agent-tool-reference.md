# Agent 工具完整参考文档

## 一、工具基本信息

**工具名称**: `Agent`

**功能**: 启动一个新的 agent 来自主处理复杂的多步骤任务。

---

## 二、工具完整描述（原文）

```
Launch a new agent to handle complex, multi-step tasks autonomously.

The Agent tool launches specialized agents (subprocesses) that autonomously handle complex tasks. Each agent type has specific capabilities and tools available to it.
```

---

## 三、所有参数及完整描述

### 参数总览

| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `prompt` | string | ✅ | - | 任务描述 |
| `description` | string | ✅ | - | 简短描述（3-5词） |
| `subagent_type` | string | ❌ | `general-purpose` | agent 类型 |
| `name` | string | ❌ | - | agent 名称（用于通信） |
| `team_name` | string | ❌ | 当前团队上下文 | 团队名称 |
| `model` | string | ❌ | 继承父级 | 模型覆盖 |
| `mode` | string | ❌ | `default` | 权限模式 |
| `run_in_background` | boolean | ❌ | `false` | 后台运行 |
| `isolation` | string | ❌ | - | 隔离模式 |

### 参数详细说明

#### 1. `prompt` (必需)

```
类型: string
描述: The task for the agent to perform
```

**说明**: 告诉 agent 要执行什么任务。应该清晰、具体地描述任务目标。

**示例**:
```json
{ "prompt": "Search the codebase for all API endpoints and document them" }
```

---

#### 2. `description` (必需)

```
类型: string
描述: A short (3-5 word) description of the task
```

**说明**: 任务的简短描述，3-5个词，会显示在 UI 上让用户了解 agent 在做什么。

**示例**:
```json
{ "description": "Document API endpoints" }
```

---

#### 3. `subagent_type` (可选)

```
类型: string
默认值: "general-purpose"
描述: The type of specialized agent to use
```

**可选值**:
- `general-purpose` - 通用 agent（默认）
- `statusline-setup` - 配置状态栏
- `Explore` - 快速探索代码库
- `Plan` - 软件架构规划
- `claude-code-guide` - Claude Code 使用指南
- `frontend-reviewer` - 前端代码评审
- `agent-architect` - 查找合适的 agent
- `apple-agent` - macOS 原生应用协调
- `tianfu` - 任务评估大脑
- `agent-writer` - 编写 agent 配置
- `product-manager` - 产品团队负责人
- `frontend-lead` - 前端团队协调
- `skill-architect` - 技能架构师
- `tester` - 测试工程师
- `agent-reviewer` - agent 配置评审
- `tianji` - Issue 执行者
- `frontend` - Next.js 全栈开发
- `ziwei` - 对话助手
- `pm-reviewer` - 产品文档评审
- `tianxiang` - 定时任务执行者

---

#### 4. `name` (可选)

```
类型: string
描述: Name for the spawned agent, addressable via SendMessage({to: name}) while running
```

**说明**: 为启动的 agent 命名，后续可以通过 `SendMessage` 工具用这个名称与它通信。

**示例**:
```json
{ "name": "frontend-dev" }
```

---

#### 5. `team_name` (可选)

```
类型: string
描述: Team name for spawning. Uses current team context if omitted.
```

**说明**: 指定 agent 加入的团队名称。如果省略，使用当前的团队上下文。用于多 agent 协作场景。

---

#### 6. `model` (可选)

```
类型: string
枚举值: ["sonnet", "opus", "haiku"]
描述: Optional model override for this agent. Takes precedence over the agent definition's model frontmatter.
```

**说明**: 覆盖 agent 使用的模型。优先级高于 agent 定义中的模型设置。

**可选值**:
- `sonnet` - Claude Sonnet
- `opus` - Claude Opus
- `haiku` - Claude Haiku

---

#### 7. `mode` (可选)

```
类型: string
枚举值: ["acceptEdits", "bypassPermissions", "default", "dontAsk", "plan", "auto"]
描述: Permission mode for spawned teammate (e.g., "plan" to require plan approval)
```

**说明**: 设置 agent 的权限模式。

**可选值**:
- `default` - 默认权限模式
- `acceptEdits` - 自动接受编辑
- `bypassPermissions` - 绕过权限检查
- `dontAsk` - 不询问用户
- `plan` - 需要计划审批
- `auto` - 自动模式

---

#### 8. `run_in_background` (可选)

```
类型: boolean
默认值: false
描述: Set to true to run the agent in the background. You will be notified when it completes.
```

**说明**: 设置为 `true` 时，agent 会在后台运行。完成后会自动通知你，不需要等待。

**行为**:
- `true` - 后台运行，完成后通知
- `false` - 前台运行，阻塞等待结果

---

#### 9. `isolation` (可选)

```
类型: string
枚举值: ["worktree"]
描述: Isolation mode. "worktree" creates a temporary git worktree so the agent works on an isolated copy of the repository.
```

**说明**: 隔离模式。设置为 `"worktree"` 会创建一个临时的 git worktree，让 agent 在隔离的仓库副本上工作。

**行为**:
- 如果 agent 没有做任何更改，worktree 会自动清理
- 如果有更改，worktree 路径和分支会返回在结果中

---

## 四、可用的 Agent 类型详情

### 1. `general-purpose`

```
General-purpose agent for researching complex questions, searching for code,
and executing multi-step tasks. When you are searching for a keyword or file
and are not confident that you will find the right match in the first few tries
use this agent to perform the search for you.

Tools: * (所有工具)
```

---

### 2. `Explore`

```
Fast agent specialized for exploring codebases. Use this when you need to
quickly find files by patterns (eg "src/components/**/*.tsx"), search code
for keywords (eg "API endpoints"), or answer questions about the codebase
(eg "how do API endpoints work?").

When calling this agent, specify the desired thoroughness level:
- "quick" for basic searches
- "medium" for moderate exploration
- "very thorough" for comprehensive analysis across multiple locations and naming conventions

Tools: All tools except Agent, ExitPlanMode, Edit, Write, NotebookEdit
```

---

### 3. `Plan`

```
Software architect agent for designing implementation plans. Use this when
you need to plan the implementation strategy for a task. Returns step-by-step
plans, identifies critical files, and considers architectural trade-offs.

Tools: All tools except Agent, ExitPlanMode, Edit, Write, NotebookEdit
```

---

### 4. `frontend`

```
Next.js 全栈开发工程师，精通前端和后端能力的完整开发流程。

Capabilities:
- Next.js 版本升级和迁移（14→15→16，识别破坏性变更）
- React 前端开发（Server/Client Components、状态管理、样式）
- Next.js 后端能力（API Routes、Server Actions、Middleware）
- PWA 开发（manifest、service worker、web push）
- 认证集成（NextAuth/Auth.js、Google OAuth、session 管理）
- 技术调研（阅读官方文档、分析版本差异、制定迁移方案）
- 依赖管理和兼容性处理

Not for:
- 移动端原生开发（iOS/Android）
- 后端微服务架构（不涉及独立后端服务）
- DevOps/CI/CD 配置
- 数据库设计和管理（仅涉及 Prisma 客户端使用）

Use when:
- 升级 Next.js 版本、处理迁移问题
- 开发 React 组件、页面、布局
- 实现 API Routes 或 Server Actions
- 配置 PWA、认证、中间件
- 需要阅读官方文档进行技术调研

Tools: All tools
```

---

### 5. `frontend-reviewer`

```
前端代码评审专家，具备 Next.js 全栈开发的专业知识，专门评审前端开发工作的质量。

输入：
- 待评审的代码变更（git diff、文件列表、具体代码）
- 原始需求或任务描述
- 评审重点（可选）

输出：
- 结构化的评审报告（通过/不通过 + 缺陷清单 + 改进建议）

Capabilities:
- 评审 Next.js 版本升级迁移的完整性和正确性
- 评审 React 代码质量（组件设计、状态管理、性能优化）
- 评审配置文件变更（next.config.js、tailwind.config.js、middleware.ts 等）
- 评审依赖升级的兼容性处理
- 检查是否遵循 Next.js 官方最佳实践

Not for:
- 评审原生移动端代码（iOS/Android）
- 评审独立后端服务代码
- 评审 DevOps/CI 配置

Tools: All tools
```

---

### 6. `tester`

```
全能专业测试工程师，支持 UI/API/E2E/性能等多种测试类型。

调用时传入：测试目标描述、测试重点（可选）。
你需要自行发现测试环境（如何启动、端口、入口 URL、健康检查）。

Tools: All tools
```

---

### 7. `pm`

```
资深产品经理，具备独立决策能力，直接产出可执行的产品方案。

输入：任务描述、上下文信息、输出格式（可选）、输出路径（可选）。
输出：结构化的产品文档，面向下游 AI（设计师、开发者）直接执行。

Tools: All tools
```

---

### 8. `product-manager`

```
产品团队负责人，协调 PM 和 PM-Reviewer 完成产品需求文档的产出。

输入：用户的想法/需求、上下文信息、质量标准（可选）、输出路径（可选）。
输出：协调团队完成产品文档（PRD/IA/验收标准等），经评审通过后交付。

Tools: All tools
```

---

### 9. `tianji`

```
天机（Issue 执行者），负责分析任务、规划流程、调度专业团队完成 Issue。

在一次执行（Execution）开始时被调用，核心职责是决策和调度。

Tools: All tools
```

---

### 10. `tianfu`

```
天府（任务评估大脑），负责在每次完成 Issue 后评估下一步行动。

决策流程：判断 Issue 目标是否达成，选择继续当前任务、创建新任务、完成 Issue 或创建新 Issue。

Tools: All tools
```

---

### 11. `tianxiang`

```
天相（定时任务执行者），负责处理定时触发后的执行请求。

它不是对话前台，不做项目推进问答；目标是按任务直接产出结果。

Tools: All tools
```

---

### 12. `ziwei`

```
Purfence 对话助手，阿紫的 AI 伙伴。

帮助用户管理项目和需求：创建项目、搜索项目、创建需求、搜索需求。
适合在对话界面中使用。

Tools: All tools
```

---

### 13. `agent-architect`

```
Use this agent to find out which agent can handle a task.

Input: A task description
Output: The name of an agent that can handle the task

Tools: All tools
```

---

### 14. `agent-writer`

```
Use this agent to write agent configuration files.
This agent specializes in translating requirements into precisely-tuned
agent specifications and writing them to the specified path.

Input requirements:
- **target**: A description of what the agent should do
- **outputPath**: The file path where the agent configuration should be written

Tools: All tools
```

---

### 15. `agent-reviewer`

```
Use this agent to review agent configuration files.
This agent specializes in evaluating agent configurations against best
practices and providing actionable feedback.

Input requirements:
- **file**: The path to the agent configuration file to review
- **originalRequirement**: The original requirement that the agent was created for

Tools: All tools
```

---

### 16. `skill-architect`

```
Use this agent to find or create Claude skills. This is a member of the Agent team.

Input: A description of what skill you need (e.g., "I need a skill for React development",
"Create a skill for UI design best practices")

Process:
1. First searches for existing skills using `npx skills find`
2. If found, installs the existing skill
3. If not found, creates a new skill from documentation sources
4. Tests the skill to verify it works correctly

Capabilities: Skill discovery, skill installation, skill creation, skill testing
Not for: Agent creation (use agent-writer), general development tasks

Tools: All tools
```

---

### 17. `apple-agent`

```
macOS native apps coordinator for Mail, Notes, Calendar, and Reminders.

Capabilities:
- Email: search (fast ~50ms via SQLite), browse, read, compose, send
- Notes: create, search, list, delete, view content
- Calendar: create events, view schedule, search events, manage calendars
- Reminders: create tasks, view lists, complete, delete, manage due dates

Skills used:
- apple-mail-search: Fast email search (~50ms) via SQLite
- apple-mail: Browse and read emails via AppleScript
- apple-mail-send: Compose and send emails
- apple-notes: Full notes management
- apple-calendar: Calendar event management
- apple-reminders: Task and reminder management

Not for:
- iOS/iPadOS operations (macOS only)
- Third-party apps (Spark, Outlook, Fantastical, etc.)
- File system operations outside Apple apps
- Network or system administration

Use when:
- User mentions email, mail, or 邮件
- User mentions notes, or 笔记/记一下
- User mentions calendar, events, meetings, or 日历/会议
- User mentions reminders, tasks, todos, or 提醒/任务
- Need to coordinate multiple Apple apps in one request

Tools: All tools
```

---

### 18. `frontend-lead`

```
前端团队负责人，协调前端开发工作的规划和执行。作为团队领导，负责分配任务、协调评审和测试、确保交付质量。

Capabilities:
- 协调 Next.js 版本升级和迁移任务
- 协调功能开发（React 组件、页面、API Routes）
- 协调 Bug 修复和性能优化
- 评估技术风险和制定迁移策略
- 指导技术决策（渲染策略、状态管理、架构选型）
- 协调团队成员：frontend（开发）、frontend-reviewer（评审）、tester（测试）

Not for:
- 亲自编写代码（由 frontend 执行）
- 亲自评审代码（由 frontend-reviewer 执行）
- 亲自执行测试（由 tester 执行）
- 移动端原生开发
- 后端微服务架构

Use when:
- 需要协调前端开发任务
- 需要规划 Next.js 版本升级
- 需要评估技术方案和风险
- 需要分配前端相关工作给团队成员

Tools: All tools
```

---

### 19. `pm-reviewer`

```
产品文档评审专家，具备产品经理的专业知识，专门评审产品文档的质量。

输入：待评审的产品文档、原始需求、评审标准（可选）。
输出：结构化的评审报告（通过/不通过 + 缺陷清单 + 改进建议）。

Tools: All tools
```

---

### 20. `claude-code-guide`

```
Use this agent when the user asks questions ("Can Claude...", "Does Claude...",
"How do I...") about:
(1) Claude Code (the CLI tool) - features, hooks, slash commands, MCP servers,
    settings, IDE integrations, keyboard shortcuts
(2) Claude Agent SDK - building custom agents
(3) Claude API (formerly Anthropic API) - API usage, tool use, Anthropic SDK usage

**IMPORTANT:** Before spawning a new agent, check if there is already a running
or recently completed claude-code-guide agent that you can continue via SendMessage.

Tools: Glob, Grep, Read, WebFetch, WebSearch
```

---

### 21. `statusline-setup`

```
Use this agent to configure the user's Claude Code status line setting.

Tools: Read, Edit
```

---

## 五、系统提示词中的相关内容

### 1. "Using your tools" 部分（完整原文）

```
# Using your tools
 - Do NOT use the Bash to run commands when a relevant dedicated tool is provided. Using dedicated tools allows the user to better understand and review your work. This is CRITICAL to assisting the user:
  - To read files use Read instead of cat, head, tail, or sed
  - To edit files use Edit instead of sed or awk
  - To create files use Write instead of cat with heredoc or echo redirection
  - To search for files use Glob instead of find or ls
  - To search the content of files, use Grep instead of grep or rg
  - Reserve using the Bash exclusively for system commands and terminal operations that require shell execution. If you are unsure if there is a relevant dedicated tool, default to using the dedicated tool and only fallback on using the Bash tool for these if it is absolutely necessary.
 - Use the Agent tool with specialized agents when the task at hand matches the agent's description. Subagents are valuable for parallelizing independent queries or for protecting the main context window from excessive results, but they should not be used excessively when not needed. Importantly, avoid duplicating work that subagents are already doing - if you delegate research to a subagent, do not also perform the same searches yourself.
 - For simple, directed codebase searches (e.g., for a specific file/class/function) use the Glob or Grep directly.
 - For broader codebase exploration and deep research, use the Agent tool with subagent_type=Explore. This is slower than using the Glob or Grep directly, so use this only when a simple, directed search proves to be insufficient or when your task will clearly require more than 3 queries.
 - /<skill-name> (e.g., /commit) is shorthand for users to invoke a user-invocable skill. When executed, the skill gets expanded to a full prompt. Use the Skill tool to execute them. IMPORTANT: Only use Skill for skills listed in its user-invocable skills section - do not guess or use built-in CLI commands.
 - You can call multiple tools in a single response. If you intend to call multiple tools and there are no dependencies between them, make all independent tool calls in parallel. Maximize use of parallel tool calls where possible to increase efficiency. If, however, one or more tool calls depend on previous calls to inform dependent values, do NOT call these tools in parallel and instead call them sequentially. For instance, if one operation must complete before another starts, run these operations sequentially instead.
```

---

### 2. 工具描述中的 "Usage notes" 部分（完整原文）

```
Usage notes:
- Always include a short description (3-5 words) summarizing what the agent will do
- Launch multiple agents concurrently whenever possible, to maximize performance;
  to do that, use a single message with multiple tool uses
- You can optionally run agents in the background using the run_in_background parameter.
  When an agent runs in the background, you will be automatically notified when it
  completes — do NOT sleep, poll, or proactively check on its progress. Continue with
  other work or respond to the user instead.

Foreground vs background:
- Use foreground (default) when you need the agent's results before you can proceed
  - e.g., research agents whose findings inform your next steps
- Use background when you have genuinely independent work to do in parallel

Continuing agents:
- To continue a previously spawned agent, use SendMessage with the agent's ID or
  name as the "to" field. The agent resumes with its full context preserved.
- Each Agent invocation starts fresh — provide a complete task description.

Providing clear prompts:
- Provide clear, detailed prompts so the agent can work autonomously and return
  exactly the information you need.
- Clearly tell the agent whether you expect it to write code or just do research
  (search, file reads, web fetches, etc.), since it is not aware of the user's intent

Trusting results:
- The agent's outputs should generally be trusted

Proactive usage:
- If the agent description mentions that it should be used proactively, then try
  your best to use it without the user having to ask for it first. Use your judgement.

Parallel execution:
- If the user specifies that they want agents to work "in parallel", you MUST send
  a single message with multiple Agent tool use content blocks.

Isolation mode:
- You can optionally set isolation: "worktree" to run the agent in a temporary
  git worktree, giving it an isolated copy of the repository.
- The worktree is automatically cleaned up if the agent makes no changes.
- If changes are made, the worktree path and branch are returned in the result.
```

---

### 3. 工具描述中的 "When to Use" 部分（完整原文）

```
When to Use

Use this tool proactively whenever:
- The user explicitly asks to use a team, swarm, or group of agents
- The user mentions wanting agents to work together, coordinate, or collaborate
- A task is complex enough that it would benefit from parallel work by multiple agents
  (e.g., building a full-stack feature with frontend and backend work, refactoring
  a codebase while keeping tests passing, implementing a multi-step project with
  research, planning, and coding phases)

When in doubt about whether a task warrants a team, prefer spawning a team.
```

---

## 六、使用示例

### 示例 1: 简单任务委托

```json
{
  "prompt": "Search the codebase for all API endpoints and document them",
  "description": "Document API endpoints",
  "subagent_type": "Explore"
}
```

---

### 示例 2: 后台并行执行多个 agent

```json
// 第一个 agent
{
  "prompt": "Fix the authentication bug in the login flow",
  "description": "Fix auth bug",
  "subagent_type": "frontend",
  "run_in_background": true
}

// 第二个 agent（同时运行）
{
  "prompt": "Write E2E tests for the checkout process",
  "description": "Write checkout tests",
  "subagent_type": "tester",
  "run_in_background": true
}
```

---

### 示例 3: 团队协作模式

```json
// 1. 创建团队（使用 TeamCreate 工具）
{
  "team_name": "auth-feature",
  "description": "Building authentication feature"
}

// 2. 启动前端 agent
{
  "prompt": "Implement the login page UI",
  "description": "Build login UI",
  "subagent_type": "frontend",
  "name": "frontend-dev",
  "team_name": "auth-feature"
}

// 3. 启动测试 agent
{
  "prompt": "Write tests for authentication flow",
  "description": "Write auth tests",
  "subagent_type": "tester",
  "name": "tester-dev",
  "team_name": "auth-feature"
}
```

---

### 示例 4: 隔离环境执行

```json
{
  "prompt": "Refactor the database module and update all imports",
  "description": "Refactor database",
  "subagent_type": "general-purpose",
  "isolation": "worktree"
}
```

---

### 示例 5: 使用 Plan agent 规划

```json
{
  "prompt": "Plan the implementation of a new user management system with roles and permissions",
  "description": "Plan user management",
  "subagent_type": "Plan"
}
```

---

## 七、与其他工具的配合

### 1. 与 SendMessage 配合

启动 agent 后，可以通过 `SendMessage` 与之通信：

```json
// 启动时指定 name
{
  "prompt": "...",
  "description": "...",
  "name": "my-worker"
}

// 后续通信
{
  "to": "my-worker",
  "message": "Please also check the error handling logic",
  "summary": "Request error handling check"
}
```

### 2. 与 TaskOutput 配合

后台运行的 agent 可以用 `TaskOutput` 获取结果：

```json
// 启动后台 agent，返回 task_id
{
  "prompt": "...",
  "description": "...",
  "run_in_background": true
}

// 获取结果（使用返回的 task_id）
{
  "task_id": "abc-123",
  "block": true,
  "timeout": 30000
}
```

### 3. 与 Task 工具配合

在团队模式下，Agent 工具与 Task 工具配合实现任务管理：

```
1. TaskCreate  → 创建任务
2. Agent       → 启动 agent（指定 team_name）
3. TaskUpdate  → 分配任务给 agent（set owner）
4. agent 执行任务并 TaskUpdate(status: completed)
```

---

## 八、最佳实践

### 1. 选择合适的 agent 类型

| 任务类型 | 推荐的 subagent_type |
|----------|---------------------|
| 通用任务 | `general-purpose` |
| 快速代码搜索 | 直接用 Glob/Grep |
| 深度代码探索 | `Explore` |
| 实现规划 | `Plan` |
| 前端开发 | `frontend` |
| 前端评审 | `frontend-reviewer` |
| 测试 | `tester` |
| 产品文档 | `pm` / `product-manager` |

### 2. 并行 vs 顺序

- **并行执行**: 多个独立任务，用 `run_in_background: true`
- **顺序执行**: 有依赖关系的任务，一个完成后启动下一个

### 3. 前台 vs 后台

- **前台**: 需要结果才能继续下一步
- **后台**: 有其他工作可以并行做

### 4. 隔离模式

- **使用 worktree**: 风险操作、大型重构、可能破坏代码的操作
- **不使用**: 简单的搜索、只读操作

---

## 九、常见问题

### Q1: agent 结果对用户不可见？

是的，agent 的返回结果只有我能看到。需要我向用户汇报摘要。

### Q2: 如何知道 agent 完成了？

- 前台: 直接返回结果
- 后台: 自动收到通知（不要轮询）

### Q3: 如何继续之前的 agent？

使用 `SendMessage` 工具，指定 agent 的 name 或 ID。

### Q4: agent 可以调用其他 agent 吗？

取决于 agent 的工具权限。大多数 agent 没有 Agent 工具，不能调用其他 agent。

---

*文档生成时间: 2026-03-20*
