# AGENTS.md (repo guidance for coding agents)

## Docs index (read when relevant)

- `docs/README.md`: doc entrypoint
- `docs/智能任务处理流程.md`: **Purfence 事件驱动架构（重要）**
- `docs/repo-structure.md`: monorepo structure + commands
- `docs/source-plan.md`: Purfence 产品概念与术语
- `docs/product-artifacts.md`: 产品工件规范
- `docs/conventions.md`: 项目关键约定（前端中文+组件化、分页上限、工作流约定等）
- `issues/README.md`: 本仓库 Markdown Issue 规范
- `backend/CLAUDE.md`: 后端编码约束（强约束）
- `backend/libs/my-agent/docs/config-driven-workflows.md`: my-agent 配置驱动 workflow DSL

## Commands (npm workspaces)

- Install: `npm install`
- Dev (both): `npm run dev` ← **推荐：同时启动前后端**
- Build (FE -> BE static, then BE): `npm run build`

Per workspace:
- Frontend: `npm -w frontend run dev` / `npm -w frontend run build` / `npm -w frontend run lint`
- Backend: `npm -w backend run start:dev` / `npm -w backend run build` / `npm -w backend run lint` / `npm -w backend run format` / `npm -w backend run test` / `npm -w backend run test:e2e`

### ⚠️ 服务启动/停止规则（重要！）

1. **端口配置**：
   - 前端：`http://localhost:5173`
- 后端：`http://localhost:1016`
- GraphQL：`http://localhost:1016/graphql`

2. **启动前检查**：
   ```bash
   # 检查前端是否运行
   curl -s http://localhost:5173 > /dev/null && echo "Frontend: running" || echo "Frontend: NOT running"

   # 检查后端是否运行
curl -s http://localhost:1016/__health > /dev/null && echo "Backend: running" || echo "Backend: NOT running"
   ```

3. **启动原则**：
   - **✓ 推荐**：使用 `npm run dev`（在根目录，同时启动前后端）
   - **✗ 禁止**：单独启动前端或后端（除非用户明确要求）
   - **✗ 禁止**：重复启动已有服务（后端有热加载，不需要重启）

4. **停止原则**：
   - 要么一起停止前后端
   - 要么都不停止（让用户手动管理）
   - 不要单独停止某一个服务

5. **如果服务已运行**：
   - 直接使用，不要重复启动
   - 后端支持热加载，代码修改会自动生效

## Code style / conventions

- Follow existing patterns: read similar files first; don’t invent new architecture.
- Imports:
  - Backend prefers path aliases like `@app/shared`.
  - Frontend uses `@/` (Vite/TS alias).
- Formatting:
  - Backend Prettier: `backend/.prettierrc` (`singleQuote: true`, `trailingComma: all`).
- Types: avoid `any`; prefer precise DTOs/types and `unknown` at boundaries; validate inputs with `class-validator` when applicable.
- Error handling: only catch errors you can handle; otherwise let Nest exception filters/handlers deal with them.

### Backend notes

- Strictly follow `backend/CLAUDE.md` (it contains project-specific “DO NOT” rules).
- Database access: prefer `BaseEntity` active-record style.
  - Avoid injecting `Repository` / using `@InjectRepository` in application services.
  - Use `Entity.findOne(...)`, `Entity.update(...)`, `entity.save()`, etc.
- Keep module files flat.
  - Avoid Java-style subfolders like `purfence-issue/`, `purfence-project/`, `purfence-run/`; keep files under `backend/src/<module>/`.
- MySQL needs to support Chinese content.
  - For user-facing text fields like `name`/`title`, use `@Column({ type: 'varchar', length: N })` (not ASCII-only options like `IDColumnOpts`).
  - Rely on DB/table default `utf8mb4` settings (no per-column charset overrides unless necessary).
- `BaseEntity` expects an entity prefix mapping file at `backend/src/entity-id-prefix.json` (see `backend/libs/shared/src/domain/base-entity.ts`). Ensure it exists before relying on BaseEntity at runtime.

### Frontend notes

- Current stack is React + Vite + Tailwind.
- UI/UX & 组件化约定见 `docs/conventions.md`（中文文案、shadcn/ui 安装方式、Select/Tabs 注意事项等）。

## Node / nvm

- 推荐使用 `nvm` 管理 Node。
- Node 版本文件在 `backend/.nvmrc`（当前为 `22`）。

## API / GraphQL 测试规则

### ⚠️ 测试方式选择

1. **API/GraphQL 测试**：使用 `curl` 直接 HTTP 请求
   ```bash
   # GraphQL 测试示例
curl -X POST http://localhost:1016/graphql \
     -H 'Content-Type: application/json' \
     -d '{"query":"mutation { createOnePurfenceProject(input: { purfenceProject: { name: \"测试\" } }) { id name } }"}'
   ```

2. **前端 UI 测试**：使用 `web-test` agent（Playwright）
   - 仅用于测试页面交互、视觉效果、表单提交等
   - 不要用于 API 测试

3. **启动 web-test agent 前**：
   - 先检查服务是否运行
   - 如果没运行，使用 `npm run dev` 启动
   - 不要单独启动前端或后端

## Purfence 架构

### 核心架构（事件驱动）

详见 `docs/智能任务处理流程.md`，核心流程：

```
Project 创建 → ProjectSubscriber → init-project 队列
  ↓
Issue 创建 → IssueSubscriber → init-issue 队列
  ↓
Execution 创建 → ExecutionSubscriber → execute-ai 队列
  ↓
任务完成 → evaluate-execution-next-step 队列
  ↓
天府 Agent（tianfu）自主决策（4 个工具）
```

### 天府 Agent 工具

| 工具 | 作用 |
|-----|-----|
| `continueExecution` | 继续当前执行 |
| `createNextExecution` | 创建下一执行 |
| `completeIssue` | 完成 Issue + 合并分支 |
| `createNextIssue` | 创建后续 Issue |
| `delegateTask` | 启动子 Agent 分析代码 |

### 关键代码文件

- `backend/src/purfence/` - Purfence 模块
  - `purfence-run.processor.ts` - 队列任务处理
  - `purfence-*.subscriber.ts` - 事件订阅器
  - `tools/tianfu.tools.ts` - 天府工具
  - `prompts/` - Agent prompts

### 本地目录结构

- 兼容性策略：见 `docs/conventions.md`（开发阶段不做历史兼容）
- Projects root path (local): `~/purfence/projects/`.
- Per-project layout (local): `~/purfence/projects/<projectId>/repo/` + `~/purfence/projects/<projectId>/worktrees/`.
- Default branch name: `main`.
- Attachments: Strategy **B**
  - Canonical attachments live outside git: `~/purfence/projects/<projectId>/attachments/`.
  - Before running any agent/task in a worktree, sync/copy attachments into the worktree at `.purfence/attachments/`.
- API: GraphQL-first
  - Add operations as `gql` documents under `frontend/src/api/`.
  - Run `npm run codegen -w backend` to generate `frontend/src/graphql/__generated__/types.ts` and `frontend/src/graphql/__generated__/hooks.ts`.
- DB: MySQL is already connected; rely on TypeORM `synchronize` in non-prod (no migrations for now).
- CRUD: prefer `nestjs-query` auto CRUD; avoid hand-writing basic CRUD resolvers.
- Scaffolding: when creating new Nest modules/resources, prefer Nest CLI generators (e.g. `npx nest g module <name>`).

## Workflow

- 在仓库根目录下维护 `issues/` 目录，用于记录需求和开发任务（Markdown Issue 文档）。
- 中型/大型功能开发前，优先在 `issues/` 下创建对应 Issue 文件，明确背景、范围和验收标准。
- 智能代理在开发时，应参照这些 Issue，一次聚焦完成一个或少量 Issue，并在 Issue 文档中更新状态（例如在结尾打勾）。
- 如需调整工作方式或约定，请同步更新 `issues/README.md` 和本文件。
