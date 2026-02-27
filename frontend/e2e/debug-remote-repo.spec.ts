import { test, expect } from '@playwright/test'

test.describe('Debug Remote Repository Settings Page', () => {
  const testProjectId = 'test-project-123'

  test('capture console logs and errors for remote repo settings page', async ({ page }) => {
    const consoleLogs: string[] = []
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      const text = msg.text()
      consoleLogs.push(`[${msg.type()}] ${text}`)
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      }
    })

    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`)
    })

    // Navigate to remote repo settings page
    await page.goto(`/projects/${testProjectId}/settings/remote`)

    // Wait for network to be idle
    await page.waitForLoadState('networkidle')

    // Take a screenshot
    await page.screenshot({ path: 'test-results/remote-repo-debug.png', fullPage: true })

    // Wait a bit more for any async content
    await page.waitForTimeout(3000)

    // Log the console output
    console.log('\n=== Console Logs ===')
    consoleLogs.forEach(log => console.log(log))

    console.log('\n=== Console Errors ===')
    if (consoleErrors.length === 0) {
      console.log('No console errors')
    } else {
      consoleErrors.forEach(err => console.log(err))
    }

    // Check for various elements
    const hasLoadingSpinner = await page.locator('.animate-spin').count() > 0
    const hasRemoteRepoTitle = await page.locator('text=远程仓库配置').count() > 0
    const hasForm = await page.locator('#repositoryUrl').count() > 0
    const hasTestButton = await page.locator('button:has-text("测试连接")').count() > 0
    const hasSaveButton = await page.locator('button:has-text("保存配置")').count() > 0

    console.log('\n=== Element Checks ===')
    console.log(`Has loading spinner: ${hasLoadingSpinner}`)
    console.log(`Has remote repo title: ${hasRemoteRepoTitle}`)
    console.log(`Has form (URL input): ${hasForm}`)
    console.log(`Has test button: ${hasTestButton}`)
    console.log(`Has save button: ${hasSaveButton}`)
  })

  test('capture console logs for remote issues page', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Navigate to remote issues page
    await page.goto(`/projects/${testProjectId}/remote-issues`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    console.log('\n=== Remote Issues Page Console Errors ===')
    if (consoleErrors.length === 0) {
      console.log('No console errors')
    } else {
      consoleErrors.forEach(err => console.log(err))
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/remote-issues-debug.png', fullPage: true })

    // Check what rendered
    const hasWarning = await page.locator('text=请先配置远程仓库').count() > 0
    const hasGoToConfigButton = await page.locator('button:has-text("前往配置")').count() > 0

    console.log('\n=== Element Checks ===')
    console.log(`Has warning message: ${hasWarning}`)
    console.log(`Has go to config button: ${hasGoToConfigButton}`)
  })
})
