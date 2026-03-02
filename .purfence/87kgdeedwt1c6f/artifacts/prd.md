# PRD：将后端 Agent 的工具能力暴露给紫微

## 标题

让紫微支持文件操作能力（通过 Task 工具委托模式）

## 用户需求（原文）

Issue #87kgdeedwt1c6f 目标：将后端 Agent 的工具能力暴露给紫微。

用户期望紫微能够执行文件操作，如读取文件、搜索代码、执行命令等，这些能力在后端 Agent 中已经可用，但紫微当前无法直接使用。

## 目标与非目标

### 目标

- 使紫微能够执行文件读取、代码搜索、命令执行等操作
- 通过更新紫微的 prompt 文档，指导其正确使用 Task 工具进行文件操作
- 保持现有架构不变，最小化改动和风险

### 非目标

- 不为紫微创建新的独立文件操作工具（如 readFile、writeFile 等）
- 不改变紫微的执行服务架构（仍使用 MyAgentService）
- 不修改 Task 工具的实现代码

## 用户与场景

### 目标用户

- **开发者/产品经理**：使用紫微进行项目管理和需求协作时，需要快速查看代码文件、搜索代码内容、执行项目相关命令

### 使用场景

1. **代码审查场景**：用户想快速查看某个文件的代码内容，判断是否需要创建需求
2. **问题诊断场景**：用户想搜索代码中的某个函数/变量，定位问题所在
3. **项目状态查询**：用户想查看项目最近的 git 提交记录或运行测试命令
4. **文件整理场景**：用户想批量整理某个目录的文件结构

## 核心用户旅程

### 当前旅程（文件操作无法执行）

1. 用户向紫微发起请求："帮我看看 README.md 里写了什么"
2. 紫微意识到需要读取文件，但没有直接可用的文件操作工具
3. 紫微告知用户无法执行，或建议用户创建一个需求来处理
4. 用户感到不便，离开对话界面手动操作

### 目标旅程（通过 Task 工具执行）

**场景 A：读取当前目录文件**

1. 用户向紫微发起请求："帮我看看 README.md 里写了什么"
2. 紫微判断这是"结果类"请求，决定使用 Task 工具
3. 紫微调用 Task 工具，指定 cwd 和 prompt："读取当前目录的 README.md 文件"
4. Task 工具启动子 Agent，子 Agent 使用 Read 工具读取文件
5. 结果返回给紫微，紫微将内容展示给用户
6. 用户获得答案，对话继续

**场景 B：读取指定项目的文件**

1. 用户向紫微发起请求："帮我看看 purfence-backend 项目的 README.md"
2. 紫微判断需要定位项目目录
3. 紫微调用 `searchProjects` 工具，查询 "purfence-backend"
4. 从返回结果中获取 `localRootPath`，例如 `/Users/xxx/projects/purfence-backend`
5. 紫微构造 cwd=`localRootPath/repo`，调用 Task 工具
6. Task 工具启动子 Agent，在指定目录执行 Read 操作
7. 结果返回给紫微，紫微将内容展示给用户

## 功能清单

### P0（必须有）

- **F1：紫微理解文件操作请求**
  - 紫微能够识别用户的文件操作意图（读取、搜索、执行命令等）
  - 判断为"结果类"请求，决定使用 Task 工具

- **F2：紫微正确调用 Task 工具**
  - 正确设置 cwd 参数（工作目录）
  - 正确设置 subagent_type='default'
  - 正确构造 prompt，明确子 Agent 需要执行的操作

- **F3：紫微展示文件操作结果**
  - 将 Task 工具的返回结果清晰展示给用户
  - 对于大文件，能够总结关键信息或询问用户是否需要进一步处理

### P1（应该有）

- **F4：支持会话续写**
  - 对于同一目标的连续文件操作，复用同一个 Task 会话
  - 避免重复创建会话，保持上下文连续

- **F5：智能工作目录推断**
  - 当用户提到"某个项目"时，自动定位到项目的 repo 目录
  - 结合 searchProjects 和项目信息获取正确的 cwd

- **F6：结果优化展示**
  - 对于代码文件，使用 renderArtifacts 触发前端代码高亮展示
  - 对于搜索结果，以结构化方式展示匹配位置
  - **关键**：`renderArtifacts` 只能由紫微调用，子 Agent 没有此工具
    - 紫微需要从子 Agent 的返回结果中提取文件路径
    - 然后调用 `renderArtifacts(files=[文件路径列表])` 进行展示

### P2（可以有）

- **F7：文件操作快捷方式**
  - 提供更简洁的文件操作指令映射
  - 例如："读取文件" → Task(prompt="Read 文件路径")

- **F8：批量操作支持**
  - 支持一次性执行多个文件操作（如读取多个文件进行对比）

## 业务规则 / 边界条件

### 文件操作分类判断

紫微需要根据用户请求判断操作类型：

| 请求类型 | 示例 | Task Prompt 模板 |
|---------|------|----------------|
| 读取文件 | "看看 README.md" | "读取 [path] 文件的内容" |
| 搜索代码 | "搜索函数 foo()" | "在 [path] 目录中搜索 'foo'" |
| 执行命令 | "运行 npm test" | "在 [path] 目录执行 'npm test'" |
| 列出文件 | "看看 src 目录有什么" | "列出 [path] 目录的文件结构" |

### 工作目录（cwd）确定规则

1. **用户明确指定路径**：使用用户提供的绝对路径
2. **用户提到"某个项目名称"**：需要先调用 `searchProjects` 工具获取项目信息，从返回结果中提取 `localRootPath`，然后构造 `cwd=localRootPath/repo`
3. **用户提到"当前项目"**：通过 searchProjects 定位项目，使用 `project.localRootPath/repo`
4. **用户未指定且无项目上下文**：使用默认工作目录或询问用户

**重要**：当用户提到项目名称时，必须先使用 `searchProjects` 工具查询项目，获取 `localRootPath` 后才能执行文件操作。

**示例流程**：
```
用户："帮我看看 purfence-backend 项目的 README.md"

紫微的操作流程：
1. 调用 searchProjects(query="purfence-backend")
2. 从返回结果中获取 localRootPath="/Users/xxx/projects/purfence-backend"
3. 构造 cwd="/Users/xxx/projects/purfence-backend/repo"
4. 调用 Task(prompt="读取 README.md 文件内容", cwd="/Users/xxx/projects/purfence-backend/repo")
```

### 子 Agent 类型选择

- **文件操作任务**：使用 `subagent_type='default'`
- default agent 具备完整工具集：Read、Write、Edit、Glob、Grep、Bash 等

### 会话续写规则

遵循"连续推进同一目标"原则：

**判断逻辑**：
- 紫微需要分析用户意图，判断当前请求是否是上一次任务的延续
- 判断维度：
  1. **目标一致性**：是否在完成同一个任务目标？
  2. **上下文连续性**：是否依赖上一次操作的结果？
  3. **时间连续性**：是否紧接着上一次操作（没有切换话题）？

**session_id 的来源**：
- 首次调用 Task 工具时，返回值中包含 `session_id`
- 紫微需要保存这个 `session_id`，用于后续续写

**业务规则**：

| 判断条件 | 操作 |
|---------|------|
| 同一目标、同一目录、同一类型、连续对话 | 复用 session，传 `resume=session_id` 参数 |
| 新目标或不同目录或切换话题 | 创建新会话，不传 resume 参数 |
| 用户明确说"继续"、"接着来"等 | 复用最近的 session |

**示例场景**：

*续写场景*（使用 resume）：
```
用户："帮我看看 src 目录下有哪些文件"
紫微：调用 Task，获得 session_id="abc123"，返回文件列表
用户："看看 main.ts 的内容"
紫微：调用 Task(resume="abc123", prompt="读取 main.ts")  // 续写
```

*新建场景*（不使用 resume）：
```
用户："帮我看看 src 目录下有哪些文件"
紫微：调用 Task，获得 session_id="abc123"，返回文件列表
用户："帮我查一下另一个项目的 README"  // 切换目标
紫微：调用 Task(...，不传 resume)  // 新建会话
```

### 边界情况处理

| 情况 | 处理方式 |
|-----|---------|
| 文件不存在 | Task 工具会返回错误，紫微告知用户并建议解决方案 |
| 权限不足 | 紫微告知用户权限问题，建议调整或手动操作 |
| 大文件内容 | 紫微可选择摘要展示或询问用户关注点 |
| 危险操作（如删除） | 紫微应在 Task prompt 中要求子 Agent 确认，或提前告知用户风险 |
| 代码文件需要高亮展示 | 紫微从子 Agent 返回结果中提取文件路径，调用 `renderArtifacts(files=[路径列表])` |
| 文档/图片需要展示 | 紫微从子 Agent 返回结果中提取文件路径，调用 `renderArtifacts(files=[路径列表])` |

**renderArtifacts 调用规则**：
- **只能由紫微调用**：子 Agent 没有此工具
- **触发条件**：当子 Agent 返回结果包含文件路径，且需要前端可视化展示时
- **调用时机**：紫微收到 Task 工具返回结果后，立即提取文件路径并调用
- **典型场景**：
  - 子 Agent 读取了代码文件 → 紫微调用 `renderArtifacts(files=["/path/to/file.ts"])`
  - 子 Agent 生成或修改了文档 → 紫微调用 `renderArtifacts(files=["/path/to/doc.md"])`

## 非功能需求

### 性能

- Task 工具调用响应时间：应在 10 秒内开始返回流式输出
- 大文件读取（>1MB）：可接受较长响应时间，但应提供进度反馈

### 安全/隐私

- 文件操作在独立子进程中执行，不影响主服务稳定性
- 不向用户暴露系统路径信息（除非明确在用户项目目录内）
- 不允许访问用户项目目录之外的敏感路径

### 成本

- 无额外开发成本（仅更新 prompt）
- 利用现有 Claude Code SDK 资源，无额外基础设施成本

## 风险与取舍

### 风险

| 风险 | 应对方案 |
|-----|---------|
| 两步调用导致用户体验不如直接工具 | 观察 P0 实施后的用户反馈，必要时考虑方案 B |
| 紫微误判请求类型，使用了错误的方式 | 在 prompt 中提供清晰的判断标准和示例 |
| Task 工具返回结果格式不适合直接展示 | 在 prompt 中指导紫微如何优化结果展示 |

### 取舍

| 选择 | 理由 |
|-----|------|
| 选择方案 A（扩展 Task 工具）而非方案 B（独立文件工具） | 1. 零代码改动，快速交付<br>2. 符合主流三层架构模式<br>3. 安全隔离更好<br>4. 可根据反馈后续迭代 |
| 先实施 P0 功能，P1/P2 后续迭代 | 快速验证核心价值，避免过度工程 |
| 使用 'default' subagent 而非创建专门的 'file-explore' agent | default 已具备完整工具集，足够应对文件操作需求 |

## 决策与假设列表

### 决策

- **D1**：采用方案 A（扩展 Task 工具），不创建新的独立文件操作工具
  - 理由：开发成本极低，架构风险小，符合主流子代理委托模式

- **D2**：使用 `subagent_type='default'` 进行文件操作
  - 理由：default agent 已具备完整工具集（Read、Write、Grep、Glob、Bash 等），无需创建专门的 file-explore agent

- **D3**：在 ziwei.md 中添加"文件操作"专门章节，而非分散在各个工具说明中
  - 理由：集中说明便于理解，提供清晰的操作指南和示例

- **D4**：P0 阶段仅更新 prompt，不修改任何代码
  - 理由：最小化改动风险，快速验证方案可行性

### 假设

- **A1**：用户能够接受"两步调用"的体验（紫微 → Task → 子 Agent）
  - 依据：根据市场调研，子代理委托是主流架构模式，用户主要关心最终结果

- **A2**：default agent 的工具集足以覆盖大部分文件操作需求
  - 依据：default agent 具备 Claude Code SDK 的完整内置工具

- **A3**：紫微能够准确判断"结果类"请求，区分是否需要使用 Task 工具
  - 依据：紫微已具备"推进类"与"结果类"的判断逻辑，只需扩展到文件操作场景

## 实施计划

### 第一阶段：核心功能（P0）

**目标**：让紫微能够通过 Task 工具执行基本的文件操作

**交付物**：
- 更新 `backend/src/purfence/agents/ziwei.md`
- 添加"文件操作"章节，包含：
  - 文件操作场景识别
  - Task 工具调用指南
  - searchProjects 工具使用（获取项目 localRootPath）
  - renderArtifacts 工具调用规则（仅紫微可调用，从子 Agent 返回结果提取路径）
  - session_id 保存和续写逻辑
  - 5-8 个典型对话示例（包含 searchProjects 流程）

**验收**：
- 紫微能够正确响应"读取文件"请求
- 紫微能够正确响应"搜索代码"请求
- 紫微能够正确响应"执行命令"请求

### 第二阶段：体验优化（P1）

**目标**：优化文件操作的用户体验

**交付物**：
- 完善会话续写逻辑
- 添加智能工作目录推断
- 优化结果展示（使用 renderArtifacts）

**验收**：
- 连续文件操作能够复用会话
- 提到项目名称时能自动定位到项目目录
- 代码文件能够高亮展示

### 第三阶段：高级功能（P2）

**目标**：提供更便捷的文件操作体验

**交付物**：
- 文件操作快捷指令
- 批量操作支持

**验收**：
- 用户可以用更简洁的方式描述文件操作需求
- 支持一次性读取多个文件进行对比

## 附录：对话示例

### 示例 1：读取指定项目的文件（包含 searchProjects 流程）

```
用户：帮我看看 purfence-backend 项目的 README.md 里写了什么

紫微的内部流程：
1. 分析用户意图：读取指定项目的文件
2. 调用 searchProjects(query="purfence-backend")
3. 获取返回结果：{ localRootPath: "/Users/xxx/projects/purfence-backend", ... }
4. 构造 cwd："/Users/xxx/projects/purfence-backend/repo"
5. 调用 Task(
     cwd="/Users/xxx/projects/purfence-backend/repo",
     prompt="读取 README.md 文件的完整内容"
   )
6. 从返回结果中提取信息，展示给用户
```

### 示例 2：代码文件高亮展示（renderArtifacts 调用）

```
用户：看看 src/utils/helpers.ts 里有什么函数

紫微的内部流程：
1. 调用 Task(cwd="...", prompt="读取 src/utils/helpers.ts 并列出所有导出的函数")
2. 子 Agent 返回：文件内容包含多个函数，文件路径为 "/path/to/src/utils/helpers.ts"
3. 紫微提取文件路径
4. 调用 renderArtifacts(files=["/path/to/src/utils/helpers.ts"])
5. 前端以代码高亮方式展示文件内容
```

### 示例 3：会话续写（session_id 使用）

```
用户：列出 src 目录的所有文件
紫微：[调用 Task，获得 session_id="abc123"]，展示文件列表

用户：看看 index.ts 的内容
紫微：[判断是同一目标的延续]
紫微：[调用 Task(resume="abc123", prompt="读取 src/index.ts")]
紫微：[展示文件内容]

用户：再看看 config.ts
紫微：[判断仍是同一目标的延续]
紫微：[调用 Task(resume="abc123", prompt="读取 src/config.ts")]
紫微：[展示文件内容]
```

### 示例 4：新建会话（目标切换）

```
用户：帮我查一下另一个项目的 README
紫微：[判断目标已切换，不使用 resume]
紫微：[调用 Task(...) 创建新会话]
```

## 附录：参考资料

### 市场调研

- [AI Coding工具实战指南：Claude Code & Cursor深度实践](https://m.blog.csdn.net/u013857458/article/details/156134313)
- [Agent入门系列：基于文件系统的Agent上下文工程技术架构](https://blog.csdn.net/kanbide/article/details/156822938)
- [文件系统就是新的数据库：我是如何为 AI Agent 构建个人操作系统的](https://blog.csdn.net/weixin_48708052/article/details/158282946)

### 技术文档

- 调研报告：`.purfence/87kgdeedwt1c6f/artifacts/research-report.md`
- 紫微 Agent 定义：`backend/src/purfence/agents/ziwei.md`
- Task 工具实现：`backend/src/purfence/tools/task.tools.ts`
