import { ApolloProvider } from '@apollo/client/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { apolloClient } from './lib/apollo'
import { ensureBackendRunning } from './lib/tauri-backend'

function renderBootstrapError(message: string) {
  const rootEl = document.getElementById('root')
  if (!rootEl) return
  rootEl.innerHTML = `
    <div style="font-family: ui-sans-serif, system-ui; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at top, #f5f7ff 0%, #f2f5fb 35%, #eef2f7 100%); padding: 24px;">
      <div style="width: 100%; max-width: 560px; border-radius: 16px; border: 1px solid #dbe3ef; background: rgba(255,255,255,0.92); box-shadow: 0 20px 50px rgba(16, 24, 40, 0.08); padding: 24px;">
        <h1 style="font-size: 18px; margin: 0 0 10px; color: #111827; font-weight: 600;">Purfence</h1>
        <p style="margin: 0; color: #334155; white-space: pre-wrap; line-height: 1.5; font-size: 14px;">${message}</p>
      </div>
    </div>
  `.trim()
}

async function bootstrap() {
  const rootEl = document.getElementById('root')
  if (!rootEl) throw new Error('Missing #root')

  try {
    await ensureBackendRunning()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const logPath = window.__PURFENCE_BACKEND_LOG_PATH__
    const stderrTail = window.__PURFENCE_BACKEND_STDERR_TAIL__?.slice(-40).join('\n')
    const stdoutTail = window.__PURFENCE_BACKEND_STDOUT_TAIL__?.slice(-40).join('\n')

    const extra = [
      logPath ? `Log file:\n${logPath}` : undefined,
      stderrTail ? `\nLast stderr:\n${stderrTail}` : undefined,
      stdoutTail ? `\nLast stdout:\n${stdoutTail}` : undefined,
    ]
      .filter(Boolean)
      .join('\n\n')

    renderBootstrapError(
      `Failed to start local backend.\n\n${msg}\n\nTry restarting the app. If it keeps failing, check whether ports 1016-1020 are available.\n\n${extra}`,
    )
    throw e
  }

  createRoot(rootEl).render(
    <StrictMode>
      <ApolloProvider client={apolloClient}>
        <App />
      </ApolloProvider>
    </StrictMode>,
  )
}

void bootstrap()
