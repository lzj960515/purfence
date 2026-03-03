import { useState, useEffect, useCallback, useRef } from 'react'
import {
  check,
  type DownloadEvent,
  type Update,
} from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export interface UpdateInfo {
  version: string
  currentVersion: string
  releaseNotes?: string
  pubDate?: string
}

export interface DownloadProgress {
  downloaded: number
  total: number | null
  percentage: number
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'

interface UseUpdateReturn {
  status: UpdateStatus
  updateInfo: UpdateInfo | null
  downloadProgress: DownloadProgress | null
  error: string | null
  currentVersion: string
  checkForUpdates: () => Promise<boolean>
  startDownload: () => Promise<void>
  installAndRestart: () => Promise<void>
  dismissUpdate: () => void
  skipVersion: (version: string) => void
}

const CHECK_INTERVAL = 2 * 60 * 60 * 1000 // 2 hours

function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  const tauriWindow = window as Window & {
    __TAURI__?: unknown
    __TAURI_INTERNALS__?: unknown
  }
  return Boolean(tauriWindow.__TAURI__ || tauriWindow.__TAURI_INTERNALS__)
}

export function useUpdate(): UseUpdateReturn {
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [updateManifest, setUpdateManifest] = useState<Update | null>(null)

  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tauriAvailableRef = useRef<boolean>(isTauriRuntime())

  useEffect(() => {
    if (!tauriAvailableRef.current) return

    const initialCheckTimeout = setTimeout(() => {
      checkForUpdates()
    }, 5000)

    checkIntervalRef.current = setInterval(() => {
      checkForUpdates()
    }, CHECK_INTERVAL)

    return () => {
      clearTimeout(initialCheckTimeout)
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [])

  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if (!tauriAvailableRef.current) {
      setStatus('idle')
      setError(null)
      return false
    }

    if (status === 'checking' || status === 'downloading') {
      return false
    }

    setStatus('checking')
    setError(null)

    try {
      const manifest = await check()

      if (!manifest) {
        console.log('[useUpdate] No update available')
        setStatus('idle')
        return false
      }

      console.log('[useUpdate] Update available:', manifest.version)

      const skippedVersion = localStorage.getItem('purfence:skippedVersion')
      if (skippedVersion === manifest.version) {
        console.log('[useUpdate] Version skipped:', manifest.version)
        setStatus('idle')
        return false
      }

      setUpdateManifest(manifest)
      setCurrentVersion(manifest.currentVersion)

      setUpdateInfo({
        version: manifest.version,
        currentVersion: manifest.currentVersion,
        releaseNotes: manifest.body || undefined,
        pubDate: manifest.date || undefined,
      })
      setStatus('available')
      return true
    } catch (err) {
      console.error('[useUpdate] Failed to check for updates:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      setStatus('error')
      return false
    }
  }, [status])

  const startDownload = useCallback(async () => {
    if (!tauriAvailableRef.current || !updateManifest) {
      setError('没有可用的更新')
      return
    }

    console.log('[useUpdate] Starting download...')
    setStatus('downloading')
    setError(null)
    setDownloadProgress({ downloaded: 0, total: null, percentage: 0 })

    try {
      await updateManifest.downloadAndInstall((event: DownloadEvent) => {
        switch (event.event) {
          case 'Started':
            setDownloadProgress({
              downloaded: 0,
              total: event.data?.contentLength || null,
              percentage: 0,
            })
            break
          case 'Progress':
            setDownloadProgress((prev) => {
              if (!prev) return prev
              const downloaded = prev.downloaded + (event.data?.chunkLength || 0)
              const percentage = prev.total
                ? Math.round((downloaded / prev.total) * 100)
                : 0
              return { ...prev, downloaded, percentage }
            })
            break
          case 'Finished':
            setStatus('downloaded')
            setDownloadProgress((prev) =>
              prev ? { ...prev, percentage: 100 } : prev
            )
            break
        }
      })
    } catch (err) {
      console.error('[useUpdate] Failed to download update:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      setStatus('error')
      setDownloadProgress(null)
    }
  }, [updateManifest])

  const installAndRestart = useCallback(async () => {
    if (!tauriAvailableRef.current) return

    try {
      console.log('[useUpdate] Restarting app to install update...')
      await relaunch()
    } catch (err) {
      console.error('[useUpdate] Failed to restart app:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
    }
  }, [])

  const dismissUpdate = useCallback(() => {
    setStatus('idle')
    setUpdateInfo(null)
    setUpdateManifest(null)
    setDownloadProgress(null)
    setError(null)
  }, [])

  const skipVersion = useCallback((version: string) => {
    localStorage.setItem('purfence:skippedVersion', version)
    setStatus('idle')
    setUpdateInfo(null)
    setUpdateManifest(null)
    setDownloadProgress(null)
    setError(null)
  }, [])

  return {
    status,
    updateInfo,
    downloadProgress,
    error,
    currentVersion,
    checkForUpdates,
    startDownload,
    installAndRestart,
    dismissUpdate,
    skipVersion,
  }
}
