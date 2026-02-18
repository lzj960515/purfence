import { expect, test as base, type Page } from '@playwright/test'

type SettingsFixtures = {
  settingsPage: SettingsPage
}

export class SettingsPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/settings')
  }

  async openAddDialog() {
    await this.page.click('button:has-text("添加配置")')
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible' })
  }

  async fillForm(data: {
    provider?: string
    name: string
    apiKey?: string
    baseUrl?: string
  }) {
    if (data.provider) {
      await this.page.selectOption('select[name="provider"]', data.provider)
    }

    await this.page.fill('input[name="name"]', data.name)

    if (data.apiKey && data.provider !== 'codex') {
      await this.page.fill('textarea[name="apiKey"]', data.apiKey)
    }

    if (data.baseUrl) {
      await this.page.fill('input[name="baseUrl"]', data.baseUrl)
    }
  }

  async submit() {
    await this.page.click('button:has-text("添加"), button:has-text("保存")')
  }

  async expectSuccessToast() {
    const toast = this.page.locator('[role="status"]').first()
    await toast.waitFor({ state: 'visible' })
  }

  async expectConfigVisible(name: string) {
    await expect(this.page.locator(`text=${name}`)).toBeVisible()
  }

  async clickEdit(name: string) {
    const card = this.page.locator(`text=${name}`).locator('../..')
    await card.locator('button:has-text("编辑")').click()
  }

  async clickDelete(name: string) {
    const card = this.page.locator(`text=${name}`).locator('../..')
    await card.locator('button:has-text("删除")').click()
  }

  async confirmDelete() {
    await this.page.click(
      'button:has-text("删除"):not([class*="outline"]):not([variant="outline"])'
    )
  }

  async cancelDelete() {
    await this.page.click('button:has-text("取消")')
  }
}

export const test = base.extend<SettingsFixtures>({
  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page)
    await use(settingsPage)
  },
})
