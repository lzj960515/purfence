# Docs Index

这份目录用于把"长期有效的约定 / 业务与架构信息"从 `AGENTS.md` 中拆出来，避免单个文件过大。

## 文档索引

### 核心架构

- `docs/智能任务处理流程.md`
  - **重要**：Purfence 模块的事件驱动架构、队列任务、天府 Agent 工具。

- `docs/source-plan.md`
- Purfence 产品概念与术语（Project / Issue / Execution / Workspace / Artifacts）。

- `docs/agent-skill-架构.md`
  - Agent 与 Skill 架构设计（团队结构、工作流程、文件结构、软链接设置）。

### 开发规范

- `docs/repo-structure.md`
  - Monorepo 目录结构、关键脚本、开发/构建产物路径。

- `docs/conventions.md`
  - 项目关键约定（前端中文+组件化、分页上限、工作流约定等）。

- `docs/bullmq-processors.md`
  - BullMQ 队列处理器基类使用说明。

- `backend/CLAUDE.md`
  - 后端编码约束与常见坑（务必遵循现有 import/结构模式）。

- `.claude/commands/create-entity.md`
  - 后端新增实体规范（BaseEntity/BaseDto、校验、ID 前缀映射等）。

### Agent 框架

- `backend/libs/my-agent/docs/config-driven-workflows.md`
  - `my-agent` 的配置驱动 Workflow DSL（偏框架/引擎设计）。

- `backend/libs/my-agent/docs/competitive-intel-workflow.md`
  - Competitive Intel workflow 的示例设计（偏业务 workflow 示例）。

### 其他

- `issues/README.md`
  - 本仓库的 Markdown Issue 写法与协作流程（用于开发过程记录）。
