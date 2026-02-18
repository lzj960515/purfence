# Developing Purfence

This file is for contributors who need to run, build, or package the project locally.

## Tech Stack

- `frontend/`: React + Vite + TypeScript + Tailwind
- `backend/`: NestJS + TypeScript + GraphQL
- `src-tauri/`: Tauri v2 desktop shell

## Install

```bash
npm install
```

## Local Development

Run frontend + backend together (recommended):

```bash
npm run dev
```

Default local endpoints:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:1016`
- GraphQL: `http://localhost:1016/graphql`

Run separately:

- Frontend: `npm -w frontend run dev`
- Backend: `npm -w backend run start:dev`

## Build

Build frontend and backend:

```bash
npm run build
```

## Tauri Desktop

Development:

```bash
npm run tauri:dev
```

Release build:

```bash
npm run tauri:build
```

macOS DMG only:

```bash
npm run tauri:build:dmg
```

Typical macOS artifact paths:

- App: `src-tauri/target/release/bundle/macos/Purfence.app`
- DMG: `src-tauri/target/release/bundle/dmg/`

## Notes

- Do not commit secrets (`.env`, tokens, certificates).
- Keep ignored local workspace content out of commits (`.claude`, `.project-purfence`, `docs`).
