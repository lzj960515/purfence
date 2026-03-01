import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
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
  downloadUrl?: string
  pubDate?: string
  // Backend may return snake_case fields
  current_version?: string
  pub_date?: string
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
  // State
  status: UpdateStatus
  updateInfo: UpdateInfo | null
  downloadProgress: DownloadProgress | null
  error: string | null
  currentVersion: string

  // Actions
  checkForUpdates: () => Promise<boolean>
  startDownload: () => Promise<void>
  cancelDownload: () => void
  installAndRestart: () => Promise<void>
  dismissUpdate: () => void
  skipVersion: (version: string) => void
}

const CHECK_INTERVAL = 2 * 60 * 60 * 1000 // 2 hours in milliseconds

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

  const abortControllerRef = useRef<AbortController | null>(null)
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tauriAvailableRef = useRef<boolean>(isTauriRuntime())

  // Get current version on mount
  useEffect(() => {
    if (!tauriAvailableRef.current) {
      setCurrentVersion('')
      return
    }

    invoke<string>('get_current_version')
      .then((version) => {
        console.log('[useUpdate] Current version:', version)
        setCurrentVersion(version)
      })
      .catch((err) => console.error('[useUpdate] Failed to get current version:', err))
  }, [])

  // Set up periodic check
  useEffect(() => {
    if (!tauriAvailableRef.current) {
      return
    }

    // Check on mount (with a small delay to let app initialize)
    const initialCheckTimeout = setTimeout(() => {
      checkForUpdates()
    }, 5000)

    // Set up periodic checks
    checkIntervalRef.current = setInterval(() => {
      checkForUpdates()
    }, CHECK_INTERVAL)

    return () => {
      clearTimeout(initialCheckTimeout)
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
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
      console.log('[useUpdate] Checking for updates via GitHub API...')

      // First check using our GitHub API
      const rawInfo = await invoke<UpdateInfo | null>('check_for_updates')

      if (rawInfo) {
        // Normalize field names (backend returns snake_case, frontend uses camelCase)
        const info: UpdateInfo = {
          ...rawInfo,
          currentVersion: rawInfo.currentVersion || rawInfo.current_version || '',
          pubDate: rawInfo.pubDate || rawInfo.pub_date,
        }

        console.log('[useUpdate] Update info received:', info)
        console.log('[useUpdate] Current version:', info.currentVersion)
        console.log('[useUpdate] Latest version:', info.version)

        // Check if this version has been skipped
        const skippedVersion = localStorage.getItem('purfence:skippedVersion')
        if (skippedVersion === info.version) {
          // This version was skipped, don't show update
          console.log('[useUpdate] Version skipped:', info.version)
          setStatus('idle')
          return false
        }

        setUpdateInfo(info)

        // Also check using Tauri updater plugin (for actual download)
        console.log('[useUpdate] Checking Tauri updater plugin...')
        try {
          const manifest = await check()
          if (manifest) {
            console.log('[useUpdate] Tauri updater manifest received:', manifest)
            setUpdateManifest(manifest)
          } else {
            console.log('[useUpdate] No Tauri updater manifest available')
          }
        } catch (manifestError) {
          // Tauri updater plugin might not be configured, log but don't fail
          console.warn('[useUpdate] Tauri updater plugin check failed:', manifestError)
        }

        setStatus('available')
        return true
      } else {
        console.log('[useUpdate] No update available')
        setStatus('idle')
        return false
      }
    } catch (err) {
      console.error('[useUpdate] Failed to check for updates:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      setStatus('error')
      // Don't return false here, let the error state be handled by the UI
      return false
    }
  }, [status])

  const startDownload = useCallback(async () => {
    if (!tauriAvailableRef.current) {
      return
    }

    if (!updateManifest) {
      console.error('[useUpdate] No update manifest available')
      setError('没有可用的更新')
      return
    }

    console.log('[useUpdate] Starting download...')

    setStatus('downloading')
    setError(null)
    setDownloadProgress({ downloaded: 0, total: null, percentage: 0 })

    abortControllerRef.current = new AbortController()

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
      // Check if it was aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('[useUpdate] Download aborted')
        setStatus('available')
        setDownloadProgress(null)
        return
      }

      console.error('[useUpdate] Failed to download update:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      setStatus('error')
      setDownloadProgress(null)
    }
  }, [updateManifest])

  const cancelDownload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setStatus('available')
    setDownloadProgress(null)
  }, [])

  const installAndRestart = useCallback(async () => {
    if (!tauriAvailableRef.current) {
      return
    }

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
    setDownloadProgress(null)
    setError(null)
  }, [])

  const skipVersion = useCallback((version: string) => {
    localStorage.setItem('purfence:skippedVersion', version)
    setStatus('idle')
    setUpdateInfo(null)
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
    cancelDownload,
    installAndRestart,
    dismissUpdate,
    skipVersion,
  }
}
