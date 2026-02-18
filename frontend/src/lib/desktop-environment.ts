import { invoke, isTauri } from '@tauri-apps/api/core'

export interface DesktopItemStatus {
  installed: boolean
  detail: string
}

export interface DesktopEnvironmentStatus {
  platform: string
  node: DesktopItemStatus
  claudeCode: DesktopItemStatus
  git: DesktopItemStatus
  agents: DesktopItemStatus
}

export interface DesktopActionResult {
  success: boolean
  message: string
  updatedCount?: number
}

const EMPTY_STATUS: DesktopEnvironmentStatus = {
  platform: 'unknown',
  node: { installed: false, detail: '仅桌面端可用' },
  claudeCode: { installed: false, detail: '仅桌面端可用' },
  git: { installed: false, detail: '仅桌面端可用' },
  agents: { installed: false, detail: '仅桌面端可用' },
}

export async function getDesktopEnvironmentStatus(): Promise<DesktopEnvironmentStatus> {
  if (!isTauri()) {
    return EMPTY_STATUS
  }

  const result = await invoke<{
    platform: string
    node: DesktopItemStatus
    claude_code: DesktopItemStatus
    git: DesktopItemStatus
    agents: DesktopItemStatus
  }>('desktop_environment_status')

  return {
    platform: result.platform,
    node: result.node,
    claudeCode: result.claude_code,
    git: result.git,
    agents: result.agents,
  }
}

export async function installClaudeCodeDesktop(): Promise<DesktopActionResult> {
  if (!isTauri()) {
    return { success: false, message: '仅桌面端可用' }
  }

  const result = await invoke<{ success: boolean; message: string; updated_count?: number }>(
    'install_claude_code_desktop',
  )
  return {
    success: result.success,
    message: result.message,
    updatedCount: result.updated_count,
  }
}

export async function installBuiltinAgentsDesktop(): Promise<DesktopActionResult> {
  if (!isTauri()) {
    return { success: false, message: '仅桌面端可用' }
  }

  const result = await invoke<{ success: boolean; message: string; updated_count?: number }>(
    'install_builtin_agents_desktop',
  )
  return {
    success: result.success,
    message: result.message,
    updatedCount: result.updated_count,
  }
}

export async function getGitInstallPromptDesktop(): Promise<string> {
  if (!isTauri()) {
    return ''
  }

  return invoke<string>('git_install_prompt_desktop')
}
