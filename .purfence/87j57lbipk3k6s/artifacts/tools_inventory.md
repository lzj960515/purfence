# Delegate Task 工具能力清单

## 概述
- **调研日期**：2025-03-01
- **工具总数**：2 个核心工具（delegateTask 和 Task）
- **Agent 总数**：28 个专业化 agent
- **Skills 总数**：39 个技能包
- **来源位置**：
  - 核心实现：`backend/src/purfence/tools/task.tools.ts`
  - Agent 配置目录：`~/.claude/agents/purfence/`
  - Skills 目录：`~/.claude/skills/`
  - SDK 封装：`backend/libs/my-agent/src/claude-agent-sdk.service.ts`
  - Agent 加载器：`backend/libs/my-agent/src/utils/agent-loader.util.ts`

---

## 核心工具

### 1. delegateTask

**描述**：用于 Issue 执行流程的专用任务委托工具。自动关联 issueId 和 executionId，支持会话复用，自动读取需求文档。

**参数**：

| 参数名 | 类型 | 必需 | 描述 | 默认值 |
|--------|------|------|------|--------|
| description | string | 是 | 简短任务描述（3-5 个词） | - |
| prompt | string | 是 | 详细的任务说明，会自动追加需求原文路径 | - |
| subagent_type | string | 是 | 要调用的 agent 类型（如 backend-architect, web-dev 等） | - |

**返回值**：
```typescript
interface TaskToolResult {
  /** SDK 原始结果 */
  result: SDKResultMessage;
  /** 错误信息（如果发生了 conversation not found 并进行了重试） */
  error?: ExecutionErrorInfo;
}

interface ExecutionErrorInfo {
  message: string;
  type: 'conversation_not_found' | 'unknown';
  retried: boolean;
  retrySuccess: boolean;
  originalSessionId: string;
  newSessionId?: string;
}
```

**实现逻辑**：
1. 从 context 中获取 issueId 和 executionId
2. 调用 `determineParams()` 决定是否复用会话：
   - 检查 issue 的 workdir 是否存在
   - 检查 execution 是否已有 sessionId
   - 返回 resume、sessionId、cwd 参数
3. 拼接完整任务提示（task + 需求原文路径）
4. 调用 `ClaudeAgentSdkService.executeClaudeAgent()`
5. 提供 `onSessionIdUpdate` 回调，自动更新 execution 的 sessionId
6. 格式化返回结果，包含错误和重试信息

**依赖关系**：
- `ClaudeAgentSdkService` - 执行 Claude Agent SDK
- `ClaudeCodeConfigService` - 构建环境变量
- `PurfenceIssue` 实体 - 获取 issue 信息
- `PurfenceExecution` 实体 - 获取/更新 execution 信息
- `PurfenceProject` 实体 - 获取项目路径
- `getAgentPrompt()` - 动态加载 agent 配置

**特殊机制**：
- **自动错误恢复**：当遇到 "conversation not found" 错误时，自动创建新会话并重试
- **会话持久化**：自动保存和恢复 sessionId，支持长时间任务
- **需求文档注入**：自动在 prompt 后追加 `.purfence/${issueId}/inputs/idea.md`

---

### 2. Task

**描述**：通用任务执行工具，支持指定工作目录和手动会话管理。适用于非 Issue 场景的通用任务。

**参数**：

| 参数名 | 类型 | 必需 | 描述 | 默认值 |
|--------|------|------|------|--------|
| description | string | 是 | 简短任务描述（3-5 个词） | - |
| prompt | string | 是 | 详细的任务说明 | - |
| subagent_type | string | 是 | 要调用的 agent 类型，支持 "default" 使用默认 agent | - |
| cwd | string | 否 | 工作目录路径 | 当前项目 repo 目录 |
| resume | string | 否 | 要恢复的 sessionId，不提供则创建新会话 | - |

**返回值**：同 `delegateTask`

**实现逻辑**：
1. 检查 context 中是否有 projectId
2. 如果有 projectId，从 PurfenceProject 获取 localRootPath/repo 作为 cwd
3. 调用 `ClaudeAgentSdkService.executeClaudeAgent()`
4. 如果 subagent_type 为 "default"，不设置 systemPrompt
5. 格式化返回结果

**依赖关系**：
- `ClaudeAgentSdkService`
- `ClaudeCodeConfigService`
- `PurfenceProject` 实体（可选）
- `getAgentPrompt()`

**与 delegateTask 的区别**：
- **无自动需求注入**：不会自动追加需求文档路径
- **无 execution 关联**：不更新 execution 的 sessionId
- **支持 default agent**：subagent_type 可以是 "default"
- **手动会话管理**：resume 参数由调用者显式提供

---

## Agent 加载机制

### Agent 配置文件格式

每个 agent 使用 Markdown 格式配置，包含 YAML frontmatter：

```yaml
---
name: agent-name          # 唯一标识符
description: |            # Agent 描述（用于工具说明）
  Agent 描述内容
model: sonnet             # 模型选择：sonnet | opus | haiku
mode: primary             # 可选：标识为团队 leader
tools: string             # 可选：自定义工具列表
---

# Agent 详细系统提示内容
## 核心职责
## 工作流程
## 可用工具
## 输出格式
```

### Agent 加载流程

**核心函数**：`getAgentPrompt(name: string): string`

**实现逻辑**：
1. 从 `~/.claude/agents/` 目录递归收集所有 `.md` 文件
2. 使用 `gray-matter` 库解析 YAML frontmatter
3. 根据 `name` 字段匹配 agent
4. 返回 Markdown body 部分作为系统提示

**相关函数**：
- `collectAgentFiles(dir)` - 递归收集 agent 文件
- `parseAgentFile(content)` - 解析 frontmatter 和 content
- `loadPrimaryAgents()` - 加载所有 mode=primary 的 agent（用于工具描述）
- `getAgentFrontmatter(name)` - 获取 agent 的元数据
- `formatAgentsList(agents)` - 格式化 agent 列表

---

## Agent 分类清单

### 一、核心管理层（4 个）

#### 1. ziwei
- **名称**：紫微
- **功能**：Purfence 对话助手，负责用户交互、项目/需求管理
- **模型**：sonnet
- **主要工具**：
  - createProject / searchProjects
  - createIssue / searchIssues / startIssue
  - createScheduledTask / getCurrentTime
  - Task / renderArtifacts

#### 2. tianji
- **名称**：天机
- **功能**：Issue 执行者，负责任务分析、流程规划、团队调度
- **模型**：sonnet
- **主要工具**：delegateTask, getCurrentTime
- **核心职责**：
  - 任务分类（Small/Medium/Large）
  - 执行流程规划
  - 调用专业团队
  - 与 agent-architect 协作

#### 3. tianfu
- **名称**：天府
- **功能**：任务评估大脑，负责完成后评估和下一步规划
- **模型**：sonnet
- **决策流程**：
  - 判断 Issue 目标是否达成
  - 选择：继续任务 / 创建新任务 / 完成 Issue / 创建新 Issue

#### 4. tianxiang
- **名称**：天相
- **功能**：定时任务执行者，处理系统定时触发的任务
- **模型**：sonnet
- **特点**：非对话前台，直接产出结果

---

### 二、产品管理团队（3 个）

#### 5. product-manager (mode: primary)
- **功能**：产品团队负责人，协调 PM 和 PM-Reviewer
- **模型**：sonnet
- **输出**：PRD / IA / 验收标准等

#### 6. pm
- **功能**：资深产品经理，独立产出可执行产品方案
- **模型**：sonnet
- **输出**：结构化产品文档

#### 7. pm-reviewer
- **功能**：产品文档评审专家
- **模型**：sonnet
- **输出**：评审报告（通过/不通过 + 缺陷清单 + 改进建议）

---

### 三、前端开发团队（3 个）

#### 8. web-architect (mode: primary)
- **功能**：Web 架构师，协调设计和开发
- **模型**：sonnet
- **技术栈**：React, Next.js, Vue, Astro, TypeScript, Tailwind CSS, Vite
- **核心职责**：架构设计 → 开发协调 → 测试（tester）→ 部署

#### 9. web-dev
- **功能**：前端开发者
- **模型**：sonnet
- **技术栈**：React/Vue/Astro/Next.js/Solid/Svelte, Tailwind CSS, Vite/webpack
- **专长**：响应式设计、性能优化、SEO、无障碍访问、测试

#### 10. web-dev-reviewer
- **功能**：前端代码评审专家
- **模型**：sonnet
- **评审范围**：代码质量、性能、无障碍、SEO、测试覆盖

---

### 四、后端开发团队（3 个）

#### 11. backend-architect (mode: primary)
- **功能**：后端架构师，协调开发和评审
- **模型**：sonnet
- **技术栈**：Node.js 18+, TypeScript, Express.js, Prisma ORM, MySQL/PostgreSQL, Redis, JWT
- **核心职责**：需求分析 → 架构设计 → 开发协调 → 测试 → 部署

#### 12. backend-dev
- **功能**：后端开发者
- **模型**：sonnet
- **技术栈**：Express.js, Prisma ORM, MySQL, Redis, JWT, bcrypt
- **专长**：RESTful API、数据库设计、安全、性能优化

#### 13. backend-dev-reviewer
- **功能**：后端代码评审专家
- **模型**：sonnet
- **评审范围**：代码质量、安全（OWASP Top 10）、性能、数据库优化

---

### 五、桌面应用团队（1 个）

#### 14. desktop-dev
- **功能**：桌面应用开发者
- **模型**：sonnet
- **技术栈**：Tauri 2.x (Rust-based)，**不支持 Electron**
- **专长**：跨平台开发、系统级编程、Shell 集成

---

### 六、设计团队（3 个）

#### 15. design-lead (mode: primary)
- **功能**：设计团队负责人
- **模型**：sonnet
- **专长**：UI/UX 设计、设计系统、组件库、设计交付

#### 16. designer
- **功能**：UI/UX 设计师
- **模型**：sonnet
- **专长**：视觉设计、交互设计、原型设计、响应式布局

#### 17. design-reviewer
- **功能**：设计评审专家
- **模型**：sonnet
- **评审范围**：视觉设计质量、用户体验、无障碍、设计一致性

---

### 七、内容营销团队（3 个）

#### 18. content-marketing-lead (mode: primary)
- **功能**：内容营销团队负责人
- **模型**：sonnet
- **专长**：内容策略、社交媒体研究、多平台内容适配

#### 19. content-writer
- **功能**：内容创作者
- **模型**：sonnet
- **专长**：营销文案、公众号文章、双语写作（中/英）

#### 20. content-reviewer
- **功能**：内容评审专家
- **模型**：sonnet
- **评审范围**：文案质量、内容结构、平台合规、品牌一致性

---

### 八、AI 工作流团队（2 个）

#### 21. ai-workflow-dev
- **功能**：AI/ML 工作流开发者
- **模型**：sonnet
- **专长**：ComfyUI 工作流、模型发现、提示工程、视频生成

#### 22. ai-workflow-reviewer
- **功能**：AI 工作流评审专家
- **模型**：sonnet
- **评审范围**：工作流结构、模型兼容性、提示质量、文档质量

---

### 九、Agent 管理团队（3 个）

#### 23. agent-architect (mode: primary)
- **功能**：Agent 架构师，负责 agent 创建和管理
- **模型**：sonnet
- **核心职责**：
  - 查找匹配任务的 agent
  - 迭代现有 agent
  - 创建新的 agent 团队
  - 确保团队准备就绪

#### 24. agent-writer
- **功能**：Agent 配置写作者
- **模型**：sonnet
- **输出**：agent 配置文件（~/.claude/agents/purfence/{name}.md）

#### 25. agent-reviewer
- **功能**：Agent 配置评审专家
- **模型**：sonnet
- **评审范围**：配置质量、最佳实践、完整性

---

### 十、其他专业 Agent（3 个）

#### 26. skill-architect
- **功能**：技能架构师，创建和管理 Claude Skills
- **模型**：sonnet
- **流程**：搜索现有技能 → 安装或创建 → 测试验证

#### 27. tester (mode: primary, model: opus)
- **功能**：全能测试工程师
- **模型**：opus（高能力模型）
- **支持**：UI/API/E2E/性能测试
- **特点**：自行发现测试环境

#### 28. apple-agent
- **功能**：macOS 原生应用协调器
- **模型**：sonnet
- **支持应用**：Mail, Notes, Calendar, Reminders
- **使用的技能**：
  - apple-mail-search（快速邮件搜索）
  - apple-mail（浏览和阅读）
  - apple-mail-send（发送邮件）
  - apple-notes（笔记管理）
  - apple-calendar（日历管理）
  - apple-reminders（提醒管理）

---

## Skills 技能包清单

### 已安装的 Skills（39 个）

#### 开发框架类
1. **astro** - Astro 项目技能
2. **electron** - Electron 框架技能
3. **express-typescript** - Express.js + TypeScript 最佳实践
4. **nextjs-app-router-patterns** - Next.js 14+ App Router 模式
5. **nodejs-backend-patterns** - Node.js 后端架构模式
6. **vite** - Vite 构建工具配置
7. **tauri-v2** - Tauri v2 跨平台开发

#### React 生态
8. **vercel-react-best-practices** - React 和 Next.js 性能优化
9. **tailwind-design-system** - Tailwind CSS 设计系统

#### TypeScript
10. **typescript-expert** - TypeScript 高级类型和模式

#### 数据库
11. **prisma-cli** - Prisma CLI 命令参考
12. **prisma-expert** - Prisma ORM 专家
13. **redis-best-practices** - Redis 最佳实践

#### API 和安全
14. **api-security-best-practices** - API 安全最佳实践

#### Web 技术
15. **frontend-design** - 前端设计生成
16. **web-design-guidelines** - Web 设计指南
17. **web-typography** - Web 排版框架

#### 内容创作
18. **content-strategy** - 内容策略规划
19. **copywriting** - 营销文案写作
20. **social-content** - 社交媒体内容创作

#### AI 工作流
21. **comfyui** - ComfyUI 综合技能
22. **comfyui-api** - ComfyUI API 连接
23. **comfyui-inventory** - ComfyUI 模型清单
24. **comfyui-nodes-dev** - ComfyUI 自定义节点开发
25. **comfyui-prompt-engineer** - ComfyUI 提示工程
26. **comfyui-troubleshooter** - ComfyUI 故障排除
27. **comfyui-workflow-builder** - ComfyUI 工作流构建器

#### 苹果生态
28. **apple-calendar** - Apple 日历集成
29. **apple-hig-designer** - Apple Human Interface Guidelines 设计
30. **apple-mail** - Apple Mail 集成
31. **apple-mail-search** - Apple Mail 快速搜索
32. **apple-mail-send** - Apple Mail 发送邮件
33. **apple-notes** - Apple Notes 管理
34. **apple-reminders** - Apple Reminders 管理

#### 工具类
35. **docx** - Word 文档操作
36. **xlsx** - Excel 电子表格操作
37. **nanobanana** - Gemini 3 Pro Image 图片生成
38. **playwright-cli** - 浏览器自动化
39. **gh-cli** - GitHub CLI 综合参考

#### 云服务
40. **cloudflare** - Cloudflare 平台技能
41. **cloudflare-dns** - Cloudflare DNS 管理

#### 其他
42. **accessibility-compliance** - 无障碍合规（WCAG 2.2）
43. **find-skills** - 技能发现和安装
44. **skill-creator** - 创建新技能
45. **baoyu-cover-image** - 文章封面图生成
46. **wechat-publish** - 微信公众号发布

---

## 调用机制详解

### 1. SDK 调用流程

```typescript
// 核心调用
const result = await ClaudeAgentSdkService.executeClaudeAgent({
  prompt: string,              // 用户任务
  resume: boolean,             // 是否恢复会话
  threadId: string,            // 会话线程 ID
  sessionId: string,           // Agent 会话 ID
  callId: string,              // 工具调用 ID
  cwd?: string,                // 工作目录
  env?: Record<string, string>,// 环境变量
  systemPrompt?: string,       // 系统提示（agent 配置）
  onSessionIdUpdate?: (id: string) => Promise<void>  // sessionId 更新回调
});
```

### 2. 错误处理和重试

**自动错误恢复机制**：
- 检测 "No conversation found with session ID" 错误
- 自动创建新会话（resume=false, new sessionId）
- 重新执行任务
- 返回错误信息和重试状态

### 3. 会话管理

**Session 复用策略**：
- **delegateTask**：自动管理 sessionId，通过 execution.sessionId 持久化
- **Task**：手动管理 resume 参数，调用者负责 sessionId 跟踪

**Session 生命周期**：
1. 首次调用：生成新的 sessionId
2. 后续调用：读取已有 sessionId，设置 resume=true
3. 错误恢复：生成新 sessionId，重置 resume=false

### 4. 环境变量构建

```typescript
const env = await ClaudeCodeConfigService.buildClaudeCodeEnv();
// 包含：
// - Claude Code 配置
// - API keys
// - 自定义环境变量
```

---

## 团队协作模式

### 1. Leader-Worker-Reviewer 模式

**团队结构**：
- **Leader** (mode: primary)：协调团队、分配任务、确保质量
- **Worker**：执行具体工作
- **Reviewer**：评审工作质量

**工作流程**：
```
Requirements → Leader 接收
  → Leader 分配给 Worker
  → Worker 执行
  → Reviewer 评审
  → (迭代直到通过)
  → Leader 交付
```

### 2. 开发团队特殊流程

**开发团队（web-dev, backend-dev 等）必须包含测试**：
```
Requirements → Architecture → Development
  → Code Review → Testing (tester agent) → Deployment
```

**非开发团队**：不需要调用 tester

### 3. Agent-Architect 协作

**使用场景**：
- Tianji 规划执行流程时
- 发现 agent 能力不足时
- 需要创建新 agent 时

**协作流程**：
1. Tianji 提交完整计划给 agent-architect
2. agent-architect 评估 agent 能力
3. 迭代现有 agent 或创建新团队
4. 返回准备就绪的 agent 列表

---

## 分类统计

### 按功能分类

| 类别 | 数量 | Agent 列表 |
|------|------|-----------|
| **核心管理** | 4 | ziwei, tianji, tianfu, tianxiang |
| **产品管理** | 3 | product-manager, pm, pm-reviewer |
| **前端开发** | 3 | web-architect, web-dev, web-dev-reviewer |
| **后端开发** | 3 | backend-architect, backend-dev, backend-dev-reviewer |
| **桌面开发** | 1 | desktop-dev |
| **设计** | 3 | design-lead, designer, design-reviewer |
| **内容营销** | 3 | content-marketing-lead, content-writer, content-reviewer |
| **AI 工作流** | 2 | ai-workflow-dev, ai-workflow-reviewer |
| **Agent 管理** | 3 | agent-architect, agent-writer, agent-reviewer |
| **其他专业** | 3 | skill-architect, tester, apple-agent |
| **总计** | **28** | |

### 按 Model 分类

| 模型 | 数量 | Agent 列表 |
|------|------|-----------|
| **sonnet** | 27 | 大部分 agent |
| **opus** | 1 | tester（需要高能力进行测试） |

### 按 Mode 分类

| 模式 | 数量 | Agent 列表 |
|------|------|-----------|
| **primary** (Leader) | 9 | ziwei, tianji, product-manager, web-architect, backend-architect, design-lead, content-marketing-lead, agent-architect, tester |
| **worker/reviewer** | 19 | 其他所有 agent |

---

## 复刻复杂度评估

### 容易复刻（直接映射）

**1. Agent 配置系统**
- **复杂度**：⭐
- **原因**：纯文本配置，格式简单
- **实现要点**：
  - YAML frontmatter 解析（使用 gray-matter 或类似库）
  - Markdown body 作为系统提示
  - 文件系统扫描和缓存

**2. Task 工具基础框架**
- **复杂度**：⭐⭐
- **原因**：参数化调用，逻辑清晰
- **实现要点**：
  - 参数验证（使用 Zod 或类似库）
  - Agent 名称映射
  - 工作目录管理

**3. Session 管理**
- **复杂度**：⭐⭐
- **原因**：字符串 ID 管理，逻辑简单
- **实现要点**：
  - UUID 生成
  - Session 持久化（数据库）
  - Resume 逻辑

### 中等复杂度（需要适配）

**4. delegateTask 工具**
- **复杂度**：⭐⭐⭐
- **原因**：涉及多个实体关联，自动错误恢复
- **实现要点**：
  - Issue/Execution/Project 实体关系
  - 自动需求文档注入
  - Session 更新回调
  - 错误检测和重试

**5. Agent 加载和缓存**
- **复杂度**：⭐⭐⭐
- **原因**：需要文件监听和热更新
- **实现要点**：
  - 递归文件扫描
  - 配置解析和验证
  - 缓存机制
  - 热更新支持

**6. Skills 集成**
- **复杂度**：⭐⭐⭐
- **原因**：外部依赖，版本管理
- **实现要点**：
  - Skills 发现和安装
  - 符号链接管理
  - Skills 加载和解析

### 复杂（需要重新实现）

**7. Claude Agent SDK 集成**
- **复杂度**：⭐⭐⭐⭐
- **原因**：核心依赖，需要深度集成
- **实现要点**：
  - SDK 动态加载（ESM）
  - 流式响应处理
  - 错误处理和重试
  - 环境变量管理

**8. 错误恢复机制**
- **复杂度**：⭐⭐⭐⭐
- **原因**：需要识别和处理多种错误类型
- **实现要点**：
  - 错误类型识别（正则匹配）
  - 自动重试逻辑
  - Session 状态管理
  - 错误日志和监控

**9. 团队协作流程**
- **复杂度**：⭐⭐⭐⭐⭐
- **原因**：涉及多个 agent 协调，流程复杂
- **实现要点**：
  - Leader-Worker-Reviewer 模式
  - 测试流程集成
  - 迭代和反馈循环
  - Agent-architect 协作

---

## 关键技术要点

### 1. Agent 配置标准

```yaml
---
name: string              # 必需：唯一标识符
description: string       # 必需：用于工具说明
model: sonnet | opus      # 可选：默认 sonnet
mode: primary             # 可选：标识为 leader
tools: string             # 可选：自定义工具列表
---

# Markdown 内容作为系统提示
```

### 2. 工具描述动态生成

```typescript
// 工具描述模板
const TOOL_DESCRIPTION = `
Launch a new agent to handle complex, multi-step tasks autonomously.

Available agent types and the tools they have access to:
{{AGENTS}}  // 动态插入所有 primary agent
`;

// 动态加载 primary agents
const agents = loadPrimaryAgents();
const agentsList = formatAgentsList(agents);
const finalDescription = TOOL_DESCRIPTION.replace('{{AGENTS}}', agentsList);
```

### 3. 错误处理模式

```typescript
interface ExecutionErrorInfo {
  message: string;
  type: 'conversation_not_found' | 'unknown';
  retried: boolean;
  retrySuccess: boolean;
  originalSessionId: string;
  newSessionId?: string;
}

// 错误检测
const CONVERSATION_NOT_FOUND_PATTERN =
  /No conversation found with session ID:/i;

// 自动重试
if (CONVERSATION_NOT_FOUND_PATTERN.test(error.message)) {
  // 创建新 session，重新执行
}
```

### 4. Session 持久化

```typescript
// delegateTask: 自动持久化
onSessionIdUpdate: async (newSessionId: string) => {
  execution.sessionId = newSessionId;
  await execution.save();
}

// Task: 手动管理
// 调用者负责保存和恢复 sessionId
```

---

## 安全性和权限控制

### 1. Agent 隔离

- **文件系统隔离**：通过 cwd 参数限制工作目录
- **权限继承**：Agent 继承调用者的权限
- **无特权提升**：Agent 无法访问超出调用者权限的资源

### 2. 输入验证

- **参数类型检查**：使用 Zod schema 验证
- **路径安全**：防止路径遍历攻击
- **Agent 名称白名单**：只允许已配置的 agent

### 3. 敏感信息保护

- **环境变量加密**：敏感配置通过安全渠道传递
- **日志脱敏**：不记录敏感信息
- **Session 隔离**：不同 execution 的 session 相互隔离

---

## 性能优化建议

### 1. Agent 配置缓存

```typescript
// 使用内存缓存
const agentCache = new Map<string, AgentConfig>();

function getAgentPrompt(name: string): string {
  if (agentCache.has(name)) {
    return agentCache.get(name);
  }
  const config = loadAgentFromFile(name);
  agentCache.set(name, config);
  return config;
}
```

### 2. 文件监听和热更新

```typescript
// 监听 agent 配置目录变化
fs.watch(agentsDir, (eventType, filename) => {
  if (filename.endsWith('.md')) {
    agentCache.delete(extractAgentName(filename));
  }
});
```

### 3. 并发控制

- **限制并发 Agent 数量**：防止资源耗尽
- **任务队列**：使用 BullMQ 管理长时间运行的任务
- **超时控制**：设置任务执行超时

---

## 部署注意事项

### 1. 环境变量配置

```bash
# Claude Agent SDK 路径
PURFENCE_CLAUDE_AGENT_SDK_DIR=/path/to/sdk
PURFENCE_CLAUDE_AGENT_SDK_ENTRY=/path/to/sdk/entry.mjs

# Claude API 配置
ANTHROPIC_API_KEY=sk-ant-...

# 其他环境变量
NODE_ENV=production
```

### 2. 目录结构

```
~/.claude/
├── agents/
│   └── purfence/
│       ├── backend-architect.md
│       ├── web-dev.md
│       └── ... (28 个 agent 配置)
└── skills/
    ├── comfyui -> ../../.agents/skills/comfyui
    ├── docx -> ../../.agents/skills/docx
    └── ... (39 个技能包)
```

### 3. 数据库依赖

- **PurfenceIssue**：存储 issue 信息（workdir 等）
- **PurfenceExecution**：存储 execution 信息（sessionId 等）
- **PurfenceProject**：存储项目信息（localRootPath 等）

---

## 总结和建议

### 关键发现

1. **模块化设计**：Agent 系统高度模块化，配置和代码分离
2. **团队协作**：Leader-Worker-Reviewer 模式确保质量
3. **自动化**：错误恢复、会话管理、需求注入等自动化机制
4. **可扩展**：通过 agent-architect 动态扩展能力

### 复刻优先级

**第一阶段（核心功能）**：
1. Agent 配置加载器（agent-loader.util.ts）
2. Task 工具基础框架
3. Session 管理机制
4. 3-5 个核心 agent（ziwei, tianji, backend-architect, web-architect）

**第二阶段（完善功能）**：
5. delegateTask 工具（含错误恢复）
6. Skills 集成
7. 更多专业 agent

**第三阶段（优化和监控）**：
8. 性能优化（缓存、并发控制）
9. 监控和日志
10. 测试和文档

### 技术栈建议

- **配置解析**：gray-matter（YAML frontmatter）
- **参数验证**：Zod（TypeScript schema）
- **ORM**：Prisma（已有）
- **任务队列**：BullMQ（长时间任务）
- **文件监听**：chokidar（热更新）
- **日志**：Pino 或 Winston

---

**文档版本**：1.0
**最后更新**：2025-03-01
