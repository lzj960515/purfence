# Purfence — 产品概念与术语

> 目标：把"用户的一句想法"变成可持续迭代的工程交付流程。
> 用户可能是开发者也可能不是，但系统**不假设**用户能提供技术细节。

## 核心思路

- 用户只需要：创建 `Project` → 系统自动创建 `Issue` → 自动执行 `Execution`
- 系统内部：事件驱动架构，自动调度 Agent 执行任务
- 用户交互不是聊天：主要围绕"工件预览 + 确认放行 +（可选）补充信息"

## 术语

- **Launcher / Control Plane（启动器/控制面）**
  - 负责：创建项目、管理 issue、调度 agent、展示工件、记录审计。
  - 本仓库的 `frontend/` + `backend/` 会承载这部分能力。

- **Workspace（工作空间）**
  - 一次交付的文件空间（目录）。
  - 在我们的设想里：workspace 默认初始化为 git worktree，便于版本化与回滚。

- **Project（项目）**
  - 长期存在的容器，不应被设计成"做完就结束"的生命周期对象。
  - 用户可以持续提出新需求。
  - 创建后自动触发文件系统初始化和第一个 Issue 创建。

- **Issue（需求/变更单）**
  - 用户一次提出的需求单位，粒度可大可小。
  - 每个 Issue 有独立的 git 分支（`issue/{issueId}`）和 worktree。
  - Issue 完成时自动合并分支到 main。

- **Execution（一次执行）**
  - 针对某个 Issue 的一次流程执行实例（可能会多次重跑/修订）。
  - Execution 需要状态（running/needs_user/needs_approval/done/budget_exhausted…），但 Project 不需要终态。
  - Execution 仅记录执行历史（状态、时间等），工作目录从 `issue.workdir` 获取。

- **Artifacts（工件）**
  - 产出物文件（PRD、验收标准、页面结构、开放问题、审计日志等）。

## 事件驱动架构

详见 `docs/智能任务处理流程.md`。

```
Project 创建 → ProjectSubscriber → init-project
  ↓
Issue 创建 → IssueSubscriber → init-issue
  ↓
Execution 创建 → ExecutionSubscriber → execute-ai
  ↓
任务完成 → evaluate-execution-next-step
  ↓
  天府 Agent 自主决策
```

## 技术约定

### Issue 工作目录

- 创建 Issue 时自动创建 git worktree，路径存储在 `issue.workdir`
- worktree 路径：`{projectRoot}/worktrees/issue-{issueId}-{slug}/`
- git 分支名：`issue/{issueId}`
- 同步 attachments：从 `{projectRoot}/attachments/` 镜像到 `{worktree}/.purfence/attachments/`

### Issue 目录结构

```
{worktree}/.purfence/
  inputs/       # 输入文件（idea.md, user_answers.md）
  artifacts/    # 生成的工件（prd.md, ia.md, acceptance.md, open_questions.md）
  logs/         # 日志（audit.jsonl）
  meta/         # 元数据（issue.json, execution.json）
  attachments/  # 附件镜像（从项目根目录同步）
```

### Agent 工具开发

- 工具从 `context.get('issueId')` 获取 issue ID
- 查询 `PurfenceIssue` 获取 `workdir`
- 工作目录始终使用 `issue.workdir`，不要硬编码路径

```typescript
const issueId = context.get('issueId') as string;
const issue = await PurfenceIssue.findOne({ where: { id: issueId } });
const workdir = issue?.workdir ?? throw new Error('Issue workdir not initialized');
```
