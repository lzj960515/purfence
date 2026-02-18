# Repo Structure & Dev Commands

## 目录结构（高层）

- `frontend/`：Vite + React + TypeScript + Tailwind（前端）
- `backend/`：NestJS + TypeScript（后端）
- `artifacts/`：业务/产品工件沉淀（保留目录，具体工件规范见 `docs/product-artifacts.md`）
- `docs/`：仓库文档索引与说明（避免 `AGENTS.md` 过大）
- `issues/`：开发过程的 Markdown Issue（需求/范围/验收/进度记录）

## Workspaces

根目录 `package.json` 使用 npm workspaces：
- workspace 路径：`frontend/`、`backend/`

> 注意：`frontend/package.json` 的 `name` 可能仍是 `front-template`，但在本仓库里我们以目录名 `frontend` / `backend` 作为主要称呼。

## 常用命令（从仓库根目录）

- 安装：`npm install`
- 同时启动前后端：`npm run dev`
- 构建：`npm run build`

分别运行：
- 前端：`npm -w frontend run dev` / `npm -w frontend run build` / `npm -w frontend run lint`
- 后端：`npm -w backend run start:dev` / `npm -w backend run build` / `npm -w backend run lint` / `npm -w backend run format` / `npm -w backend run test`

> 如果环境里服务已在运行，避免由智能代理直接启动服务；需要时先询问用户（见 `backend/CLAUDE.md`）。

## 前后端联调与产物路径

- 前端 dev server 端口固定为 `5173`，并通过 proxy 转发到后端（默认 `http://localhost:1016`）。
- 前端构建产物输出到后端静态目录：`backend/static/`（由 `frontend/vite.config.ts` 的 `build.outDir` 指定）。

代理路径（dev）：
- `/api` → 后端
- `/graphql` → 后端
- `/__health` → 后端
