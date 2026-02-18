# purfence

一个本地开发友好的 Monorepo：

- `frontend/`：Vite + React + TypeScript + Tailwind
- `backend/`：NestJS + TypeScript

前端开发时通过 Vite proxy 请求后端；生产构建时前端产物写入 `backend/static/` 由后端托管。

## 快速开始

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

分别运行：

- 前端：`npm -w frontend run dev`
- 后端：`npm -w backend run start:dev`

> 如果环境里服务已在运行，避免由智能代理直接启动服务；需要时先询问用户（见 `backend/CLAUDE.md`）。

## 文档

- `docs/README.md`：文档索引
- `docs/source-plan.md`：Purfence 产品概念与术语
- `docs/product-artifacts.md`：产品工件规范
- `docs/release-desktop.md`：Desktop 发布（GitHub Releases / 签名 / 公证）

## 桌面端（Tauri）

桌面端通过 Tauri v2 打包前端，并在本地启动后端 sidecar（二进制）。面向用户分发时，建议直接从 GitHub Releases 下载产物。

本地开发/调试（推荐）：

```bash
npm run tauri:dev
```

本地打包（Release）：

```bash
npm run tauri:build
```

只打包 DMG（Release, macOS）：

```bash
npm run tauri:build:dmg
```

打包 Debug 版本（便于调试）：

```bash
# 生成 Debug .app（可打开 WebView DevTools）
npm run tauri:build:debug
```

产物位置（macOS）：

- `.app`：`src-tauri/target/release/bundle/macos/Purfence.app`
- `.dmg`：`src-tauri/target/release/bundle/dmg/`
