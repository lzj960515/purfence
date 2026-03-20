import type { Child } from '@tauri-apps/plugin-shell'
import { isTauri } from '@tauri-apps/api/core'

declare global {
  interface Window {
    __PURFENCE_BACKEND_CHILD__?: Child
    __PURFENCE_BACKEND_STARTING__?: Promise<void>
    __PURFENCE_BACKEND_BASE_URL__?: string
    __PURFENCE_BACKEND_LOG_PATH__?: string
    __PURFENCE_BACKEND_STDOUT_TAIL__?: string[]
    __PURFENCE_BACKEND_STDERR_TAIL__?: string[]
  }
}

function parsePortsFromEnv() {
  const raw = import.meta.env.VITE_PURFENCE_BACKEND_PORTS as string | undefined
  if (!raw) {
    return [1016, 1017, 1018, 1019, 1020]
  }

  const ports = raw
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((port) => Number.isInteger(port) && port > 0 && port <= 65535)

  return ports.length > 0 ? ports : [1016, 1017, 1018, 1019, 1020]
}

const PORTS_TO_TRY = parsePortsFromEnv()
const BACKEND_HOST = '127.0.0.1'
const DISABLE_BACKEND_REUSE =
  (import.meta.env.VITE_PURFENCE_BACKEND_DISABLE_REUSE as string | undefined) === '1'
const BACKEND_COMMANDS = {
  macos: ['purfence-backend-macos-arm64', 'purfence-backend-macos-x64'],
  windows: ['purfence-backend-windows-arm64', 'purfence-backend-windows-x64'],
} as const

function resolveBackendCommandCandidates() {
  return navigator.userAgent.includes('Windows')
    ? BACKEND_COMMANDS.windows
    : BACKEND_COMMANDS.macos
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function withTimeout<T>(p: Promise<T>, timeoutMs: number, label: string) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

async function fetchTextNoStore(url: string, timeoutMs: number) {
  // Avoid relying solely on AbortController (some WebViews can be flaky).
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined
  const abortTimer = controller
    ? setTimeout(() => {
        try {
          controller.abort()
        } catch {
          // ignore
        }
      }, timeoutMs)
    : undefined

  try {
    const res = await withTimeout(
      fetch(url, {
        cache: 'no-store',
        signal: controller?.signal,
      }),
      timeoutMs,
      `fetch ${url}`,
    )

    const text = await withTimeout(res.text(), timeoutMs, `read body ${url}`)
    return { ok: res.ok, text }
  } finally {
    if (abortTimer) clearTimeout(abortTimer)
  }
}

async function waitForHealth(timeoutMs: number) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const baseUrl = window.__PURFENCE_BACKEND_BASE_URL__ ?? 'http://localhost:1016'
      const { ok, text } = await fetchTextNoStore(`${baseUrl}/__health`, 1000)
      if (!ok) {
        // Not our backend (or not ready yet). Retry / let caller switch ports.
        await sleep(250)
        continue
      }
      if (text.trim() === 'OK') return
    } catch {
      // ignore and retry
    }
    await sleep(250)
  }

  throw new Error('Backend health check timed out')
}

export async function ensureBackendRunning() {
  if (!isTauri()) return

  if (window.__PURFENCE_BACKEND_STARTING__) {
    await window.__PURFENCE_BACKEND_STARTING__
    return
  }

  window.__PURFENCE_BACKEND_STARTING__ = (async () => {
    if (window.__PURFENCE_BACKEND_CHILD__) return

    const [{ Command }, { appDataDir, join }] = await Promise.all([
      import('@tauri-apps/plugin-shell'),
      import('@tauri-apps/api/path'),
    ])

    const dataDir = await appDataDir()
    const dbPath = await join(dataDir, 'database.sqlite')
    const logPath = await join(dataDir, 'backend.log')
    window.__PURFENCE_BACKEND_LOG_PATH__ = logPath

    if (!DISABLE_BACKEND_REUSE) {
      // If a backend is already up (e.g. app restarted), reuse it.
      for (const port of PORTS_TO_TRY) {
        try {
          const { ok, text } = await fetchTextNoStore(
            `http://${BACKEND_HOST}:${port}/__health`,
            300,
          )
          if (ok && text.trim() === 'OK') {
            window.__PURFENCE_BACKEND_BASE_URL__ = `http://${BACKEND_HOST}:${port}`
            return
          }
        } catch {
          // ignore
        }
      }
    }

    let lastError: unknown

    const backendCommandCandidates = resolveBackendCommandCandidates()

    for (const port of PORTS_TO_TRY) {
      window.__PURFENCE_BACKEND_BASE_URL__ = `http://${BACKEND_HOST}:${port}`
      window.__PURFENCE_BACKEND_STDOUT_TAIL__ = []
      window.__PURFENCE_BACKEND_STDERR_TAIL__ = []

      for (const backendCommand of backendCommandCandidates) {
        const command = Command.create(backendCommand, [], {
          env: {
            APP_ENV: 'desktop',
            SERVER_PORT: String(port),
            TYPEORM_DATABASE: dbPath,
            PURFENCE_LOG_PATH: logPath,
          },
        })

        const pushTail = (arr: string[] | undefined, line: string) => {
          if (!arr) return
          arr.push(line)
          // Keep the last ~80 lines to avoid huge error screens.
          if (arr.length > 80) arr.splice(0, arr.length - 80)
        }

        let outBuf = ''
        let errBuf = ''
        const onChunk = (stream: 'stdout' | 'stderr', chunk: string) => {
          const normalized = chunk.replace(/\r\n/g, '\n')
          if (stream === 'stdout') outBuf += normalized
          else errBuf += normalized

          const buf = stream === 'stdout' ? outBuf : errBuf
          const parts = buf.split('\n')
          const complete = parts.slice(0, -1)
          const rest = parts[parts.length - 1] ?? ''

          for (const line of complete) {
            if (stream === 'stdout') pushTail(window.__PURFENCE_BACKEND_STDOUT_TAIL__, line)
            else pushTail(window.__PURFENCE_BACKEND_STDERR_TAIL__, line)
          }

          if (stream === 'stdout') outBuf = rest
          else errBuf = rest
        }

        command.stdout.on('data', (chunk) => onChunk('stdout', String(chunk)))
        command.stderr.on('data', (chunk) => onChunk('stderr', String(chunk)))
        command.on('error', (e) => {
          pushTail(window.__PURFENCE_BACKEND_STDERR_TAIL__, `[plugin-shell error] ${String(e)}`)
        })
        command.on('close', ({ code, signal }) => {
          pushTail(
            window.__PURFENCE_BACKEND_STDERR_TAIL__,
            `[backend exited] code=${String(code)} signal=${String(signal)}`,
          )
        })

        try {
          const child = await withTimeout(command.spawn(), 3000, `spawn backend command ${backendCommand}`)
          window.__PURFENCE_BACKEND_CHILD__ = child

          await waitForHealth(12_000)
          break
        } catch (e) {
          lastError = e
          try {
            await window.__PURFENCE_BACKEND_CHILD__?.kill()
          } catch {
            // ignore
          } finally {
            window.__PURFENCE_BACKEND_CHILD__ = undefined
          }
        }

        if (window.__PURFENCE_BACKEND_CHILD__) {
          break
        }
      }

      if (window.__PURFENCE_BACKEND_CHILD__) {
        break
      }
    }

    if (!window.__PURFENCE_BACKEND_CHILD__) {
      throw lastError ?? new Error('Failed to start backend sidecar')
    }

    const kill = async () => {
      const c = window.__PURFENCE_BACKEND_CHILD__
      if (!c) return
      try {
        await c.kill()
      } catch {
        // ignore
      } finally {
        window.__PURFENCE_BACKEND_CHILD__ = undefined
      }
    }

    window.addEventListener('beforeunload', () => {
      void kill()
    })
  })()

  await window.__PURFENCE_BACKEND_STARTING__
}
