declare global {
  interface Window {
    __PURFENCE_BACKEND_BASE_URL__?: string
  }
}

import { isTauri } from '@tauri-apps/api/core'

export function getBackendBaseUrl() {
  if (!isTauri()) return ''

  return window.__PURFENCE_BACKEND_BASE_URL__ ?? 'http://localhost:1016'
}
