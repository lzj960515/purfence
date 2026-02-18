import { type Page, type Locator } from '@playwright/test'

/**
 * 等待 Toast 提示出现并返回其文本内容
 */
export async function waitForToast(page: Page): Promise<string> {
  const toast = page.locator('[role="status"]').first()
  await toast.waitFor({ state: 'visible' })
  return await toast.textContent() || ''
}

/**
 * 填写并提交配置表单
 */
export async function fillProviderForm(
  page: Page,
  options: {
    provider?: 'kimi' | 'zhipu' | 'openai' | 'codex'
    name: string
    apiKey?: string
    baseUrl?: string
    isEnabled?: boolean
  }
) {
  // 选择提供商（如果指定）
  if (options.provider) {
    await page.selectOption('select[name="provider"]', options.provider)
  }

  // 填写配置名称
  await page.fill('input[name="name"]', options.name)

  // 填写 API Key（Codex 不需要）
  if (options.apiKey && options.provider !== 'codex') {
    await page.fill('textarea[name="apiKey"]', options.apiKey)
  }

  // 填写 Base URL（OpenAI）
  if (options.provider === 'openai' && options.baseUrl) {
    await page.fill('input[name="baseUrl"]', options.baseUrl)
  }

  // 设置启用状态
  if (options.isEnabled !== undefined) {
    const switchElement = page.locator('input[name="isEnabled"]')
    const isChecked = await switchElement.isChecked()
    if (isChecked !== options.isEnabled) {
      await switchElement.click()
    }
  }

  // 提交表单
  await page.click('button:has-text("添加"), button:has-text("保存")')
}

/**
 * 等待配置列表加载完成
 */
export async function waitForConfigList(page: Page) {
  await page.waitForSelector('[data-testid="provider-card-"]', {
    state: 'attached',
    timeout: 5000,
  })
}

/**
 * 获取所有配置卡片
 */
export function getConfigCards(page: Page): Locator {
  return page.locator('[data-testid="provider-card-"]')
}

/**
 * 打开添加配置对话框
 */
export async function openAddDialog(page: Page) {
  await page.click('button:has-text("添加配置")')
  await page.waitForSelector('[role="dialog"]', { state: 'visible' })
}

/**
 * 关闭对话框
 */
export async function closeDialog(page: Page) {
  await page.click('button:has-text("取消")')
  await page.waitForSelector('[role="dialog"]', { state: 'hidden' })
}
