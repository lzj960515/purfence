# Project-specific Conventions

这份文档用于承载「很重要但较长」的约定，避免 `AGENTS.md` 过大。

## Frontend

- 所有页面文案使用中文（导航、按钮、标题等）。
- 使用 React + Tailwind CSS + shadcn/ui 进行组件化开发。
- 优先使用 `@/components/ui/*` 中的 shadcn 组件（如 `button`, `input`, `card`, `label` 等），避免在业务组件里硬编码样式。
- shadcn/ui 组件必须用命令安装，不要手写复刻：使用 `npx shadcn@latest add <component>`（例如 `npx shadcn@latest add table select`），生成到 `frontend/src/components/ui/*` 后再在页面中使用。
- 页面/表单/列表优先“组件化组合”而不是直接写原生 HTML 标签：例如表格用 `Table` 组件，下拉选择用 `Select` 组件，弹窗用 `Dialog` 组件。
- 深色主题下使用 shadcn `Tabs` 时，务必给 `TabsList/TabsTrigger` 显式设置可读的 `bg/text` 与 `data-[state=active]` 样式，避免 tab 底色过深导致看不清。
- Radix `Select` 的 `Select.Item` 的 `value` 不能为 `''`（空字符串）；新建表单默认“未选择”要用 `undefined` 并显示 placeholder（例如“请选择”）。
- 遵循组件化目录结构（如 `components/` + `routes/`），避免将所有逻辑堆在 `App.tsx` 中。

## Backend

- 新增后端实体必须使用 `BaseEntity` / `BaseDto`，并补充必要的 `class-validator` 校验装饰器。
- 重要：新增后端实体（继承 `BaseEntity`）必须同步维护 `backend/src/entity-id-prefix.json` 的 ID 前缀映射，否则运行时会报 `entity prefix <EntityName> is not defined`。
- 实体创建细则见：`.claude/commands/create-entity.md`。

## GraphQL / 分页约定

- `nestjs-query` 的列表查询默认对 `paging.limit` 有上限校验（当前报错提示为最大 `50`）。前端写查询时，`limit` 不要超过 `50`；如需更多数据，使用分页（offset/limit）逐页拉取。

## Workflow

- 在仓库根目录下维护 `issues/` 目录，用于记录需求和开发任务（Markdown Issue 文档）。
- 大型或中型功能开发前，优先在 `issues/` 下创建对应 Issue 文件，明确背景、范围和验收标准。
- 智能代理在开发时，应参照这些 Issue，一次聚焦完成一个或少量 Issue，并在 Issue 文档中更新状态（例如在结尾打勾）。
- 如需调整工作方式或约定，请同步更新 `issues/README.md` 和 `AGENTS.md`。
- 如果在开发过程中发现本项目有「需要特别注意的事实或约定」，请随时写入到 `AGENTS.md` 中，确保后续协作都能看到这些信息。
- **本项目处于开发阶段，不做历史兼容**：数据库字段/API 接口/目录结构等可以随时调整，不要为了兼容旧版本引入"或者/回退逻辑"。旧数据如需迁移，提供一次性迁移脚本即可。
