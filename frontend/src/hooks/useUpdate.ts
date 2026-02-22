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

  // Get current version on mount
  useEffect(() => {
    invoke<string>('get_current_version')
      .then(setCurrentVersion)
      .catch((err) => console.error('Failed to get current version:', err))
  }, [])

  // Set up periodic check
  useEffect(() => {
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
    if (status === 'checking' || status === 'downloading') {
      return false
    }

    setStatus('checking')
    setError(null)

    try {
      // First check using our GitHub API
      const info = await invoke<UpdateInfo | null>('check_for_updates')

      if (info) {
        // Check if this version has been skipped
        const skippedVersion = localStorage.getItem('purfence:skippedVersion')
        if (skippedVersion === info.version) {
          // This version was skipped, don't show update
          setStatus('idle')
          return false
        }

        setUpdateInfo(info)

        // Also check using Tauri updater plugin (for actual download)
        const manifest = await check()
        if (manifest) {
          setUpdateManifest(manifest)
        }

        setStatus('available')
        return true
      } else {
        setStatus('idle')
        return false
      }
    } catch (err) {
      console.error('Failed to check for updates:', err)
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
      return false
    }
  }, [status])

  const startDownload = useCallback(async () => {
    if (!updateManifest) {
      setError('没有可用的更新')
      return
    }

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
        setStatus('available')
        setDownloadProgress(null)
        return
      }

      console.error('Failed to download update:', err)
      setError(err instanceof Error ? err.message : String(err))
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
    try {
      await relaunch()
    } catch (err) {
      console.error('Failed to restart app:', err)
      setError(err instanceof Error ? err.message : String(err))
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
