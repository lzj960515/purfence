# Desktop Release (macOS + Windows)

This repo builds a Tauri v2 desktop app that bundles a backend sidecar.
We distribute binaries via GitHub Releases.

## Local builds

- Dev (best for debugging):

```bash
npm run tauri:dev
```

- Release build (local .app):

```bash
npm run tauri:build
```

- Release build (local .dmg):

```bash
npm run tauri:build:dmg
```

## CI release

Workflow: `.github/workflows/release-desktop.yml`

Trigger: push a git tag like `v0.1.0`.

Before Tauri build runs, CI now syncs desktop app version from tag:

- `v0.1.5` -> `src-tauri/tauri.conf.json` version `0.1.5`
- `v0.1.5` -> `src-tauri/Cargo.toml` package version `0.1.5`

Local helper command:

```bash
npm run release:sync-version -- v0.1.5
```

The workflow creates a GitHub Release (draft) and uploads artifacts.

## Required secrets (macOS signing + notarization)

Add these secrets in GitHub:

- `APPLE_CERTIFICATE`:
  - Developer ID Application certificate in `.p12` format, base64-encoded.
- `APPLE_CERTIFICATE_PASSWORD`:
  - Password for the `.p12`.
- `APPLE_SIGNING_IDENTITY`:
  - The signing identity name, e.g. `Developer ID Application: <Name> (<TeamID>)`.
- `KEYCHAIN_PASSWORD`:
  - Password for the temporary CI keychain.

Notarization (recommended: App Store Connect API key):

- `APPLE_API_ISSUER`:
  - Issuer ID.
- `APPLE_API_KEY`:
  - Key ID.
- `APPLE_API_KEY_P8`:
  - The `.p8` file content, base64-encoded (workflow writes it to disk and sets `APPLE_API_KEY_PATH`).

Notes:
- Do NOT paste secrets in issues or chat.
- If you only build unsigned binaries, macOS Gatekeeper will warn.

## Windows signing (optional)

If you have an Authenticode cert, we can sign Windows builds too.
Otherwise, Windows builds will work but can trigger SmartScreen warnings.
