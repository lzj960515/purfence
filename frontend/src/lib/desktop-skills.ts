import { invoke, isTauri } from '@tauri-apps/api/core'

export interface DesktopSkillItem {
  name: string
  description: string
  source: 'installed' | 'builtin' | 'online'
  package?: string
}

export interface DesktopSkillsCatalog {
  installed: DesktopSkillItem[]
  recommended: DesktopSkillItem[]
}

export interface DesktopSkillInstallResult {
  success: boolean
  message: string
  updatedCount?: number
}

const EMPTY_CATALOG: DesktopSkillsCatalog = {
  installed: [],
  recommended: [],
}

export async function getDesktopSkillsCatalog(): Promise<DesktopSkillsCatalog> {
  if (!isTauri()) {
    return EMPTY_CATALOG
  }

  const result = await invoke<{
    installed: DesktopSkillItem[]
    recommended: DesktopSkillItem[]
  }>('desktop_skills_catalog')

  return {
    installed: result.installed || [],
    recommended: result.recommended || [],
  }
}

export async function installDesktopSkill(input: {
  name: string
  source: 'builtin' | 'online'
  package?: string
}): Promise<DesktopSkillInstallResult> {
  if (!isTauri()) {
    return {
      success: false,
      message: '仅桌面端可用',
    }
  }

  const result = await invoke<{
    success: boolean
    message: string
    updated_count?: number
  }>('install_desktop_skill', {
    name: input.name,
    source: input.source,
    package: input.package || null,
  })

  return {
    success: result.success,
    message: result.message,
    updatedCount: result.updated_count,
  }
}
