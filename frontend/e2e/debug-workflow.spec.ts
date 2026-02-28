import { test, expect } from '@playwright/test'

test.describe('Debug Workflow Settings Page', () => {
  const testProjectId = 'test-project-123'

  test('capture console logs and errors for workflow settings page', async ({ page }) => {
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

    // Navigate to workflow settings page
    await page.goto(`/projects/${testProjectId}/settings/workflow`)

    // Wait for network to be idle
    await page.waitForLoadState('networkidle')

    // Take a screenshot
    await page.screenshot({ path: 'test-results/workflow-debug.png', fullPage: true })

    // Wait a bit more for any async content
    await page.waitForTimeout(3000)

    // Check what's on the page
    const pageContent = await page.content()

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
    const hasWorkflowConfig = await page.locator('text=工作流配置').count() > 0
    const hasModeSelection = await page.locator('text=工作流模式').count() > 0
    const hasAutomationSettings = await page.locator('text=自动化设置').count() > 0

    console.log('\n=== Element Checks ===')
    console.log(`Has loading spinner: ${hasLoadingSpinner}`)
    console.log(`Has workflow config title: ${hasWorkflowConfig}`)
    console.log(`Has mode selection: ${hasModeSelection}`)
    console.log(`Has automation settings: ${hasAutomationSettings}`)

    // Take another screenshot after waiting
    await page.screenshot({ path: 'test-results/workflow-debug-after-wait.png', fullPage: true })

    // Check if GraphQL returned data
    const hasSwitches = await page.locator('[role="switch"]').count()
    const hasCards = await page.locator('[role="region"], .card, [data-slot="card"]').count()

    console.log(`\nNumber of switches: ${hasSwitches}`)
    console.log(`Number of cards/regions: ${hasCards}`)
  })
})
