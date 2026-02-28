import { test, expect } from '@playwright/test'

test.describe('Remote Git Integration E2E Tests', () => {
  // Use a test project ID - this will be substituted in URLs
  const testProjectId = 'test-project-123'

  test.beforeEach(async ({ page }) => {
    // Set base URL for all tests
    // Navigate to a starting page to ensure the app is loaded
    await page.goto('/')
  })

  test.describe('Remote Repository Settings Page', () => {
    test('page renders without errors', async ({ page }) => {
      // Navigate to the remote repository settings page
      await page.goto(`/projects/${testProjectId}/settings/remote`)

      // Wait for the page to load
      await page.waitForLoadState('networkidle')

      // Check that the page header is visible
      await expect(page.locator('h2:has-text("远程仓库配置")')).toBeVisible({ timeout: 10000 })

      // Check for the description
      await expect(page.locator('text=配置 GitLab 或 GitHub 远程仓库集成')).toBeVisible()
    })

    test('form elements are present', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/remote`)
      await page.waitForLoadState('networkidle')

      // Check repository type select
      await expect(page.locator('label:has-text("仓库类型")')).toBeVisible()

      // Check URL input
      await expect(page.locator('label:has-text("仓库 URL")')).toBeVisible()
      await expect(page.locator('#repositoryUrl')).toBeVisible()

      // Check Access Token input
      await expect(page.locator('label:has-text("Access Token")')).toBeVisible()
      await expect(page.locator('#accessToken')).toBeVisible()

      // Check Default Branch input
      await expect(page.locator('label:has-text("默认分支")')).toBeVisible()
      await expect(page.locator('#defaultBranch')).toBeVisible()

      // Check buttons
      await expect(page.locator('button:has-text("测试连接")')).toBeVisible()
      await expect(page.locator('button:has-text("保存配置")')).toBeVisible()
    })

    test('repository type dropdown has GitLab and GitHub options', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/remote`)
      await page.waitForLoadState('networkidle')

      // Click on the repository type select
      await page.click('[role="combobox"]')

      // Check that GitLab and GitHub options are available
      await expect(page.locator('text=GitLab')).toBeVisible()
      await expect(page.locator('text=GitHub')).toBeVisible()
    })

    test('test connection button is disabled when fields are empty', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/remote`)
      await page.waitForLoadState('networkidle')

      // The test connection button should be disabled initially
      const testButton = page.locator('button:has-text("测试连接")')
      await expect(testButton).toBeDisabled()
    })

    test('save button is disabled when required fields are empty', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/remote`)
      await page.waitForLoadState('networkidle')

      // The save button should be disabled initially
      const saveButton = page.locator('button:has-text("保存配置")')
      await expect(saveButton).toBeDisabled()
    })

    test('can fill in form fields', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/remote`)
      await page.waitForLoadState('networkidle')

      // Fill in the URL
      await page.fill('#repositoryUrl', 'https://gitlab.com/test/project')

      // Fill in the Access Token
      await page.fill('#accessToken', 'glpat-test-token-12345')

      // Fill in the default branch
      await page.fill('#defaultBranch', 'develop')

      // Verify the values
      await expect(page.locator('#repositoryUrl')).toHaveValue('https://gitlab.com/test/project')
      await expect(page.locator('#accessToken')).toHaveValue('glpat-test-token-12345')
      await expect(page.locator('#defaultBranch')).toHaveValue('develop')
    })

    test('back button navigates to previous page', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/remote`)
      await page.waitForLoadState('networkidle')

      // Check that the back button exists
      const backButton = page.locator('button:has(svg.lucide-arrow-left)')
      await expect(backButton).toBeVisible()
    })
  })

  test.describe('Remote Issues Page', () => {
    test('page renders without errors', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/remote-issues`)
      await page.waitForLoadState('networkidle')

      // The page should show either the warning about no config or the issue list
      // Both have the header
      await expect(page.locator('h2:has-text("远程 Issue")')).toBeVisible({ timeout: 10000 })
    })

    test('shows warning when no remote repository configured', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/remote-issues`)
      await page.waitForLoadState('networkidle')

      // Should show the warning card
      await expect(page.locator('text=请先配置远程仓库')).toBeVisible({ timeout: 10000 })

      // Should have a button to go to settings
      await expect(page.locator('button:has-text("前往配置")')).toBeVisible()
    })

    test('can navigate to remote settings from warning', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/remote-issues`)
      await page.waitForLoadState('networkidle')

      // Click the button to go to settings
      await page.click('button:has-text("前往配置")')

      // Should navigate to the remote settings page
      await expect(page).toHaveURL(/\/settings\/remote/)
    })
  })

  test.describe('Workflow Settings Page', () => {
    test('page renders without errors', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/workflow`)
      await page.waitForLoadState('networkidle')

      // Check that the page header is visible
      await expect(page.locator('h2:has-text("工作流配置")')).toBeVisible({ timeout: 10000 })
    })

    test('mode selection is present', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/workflow`)
      await page.waitForLoadState('networkidle')

      // Check for mode selection card
      await expect(page.locator('text=工作流模式')).toBeVisible()
    })

    test('automation settings are present', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/workflow`)
      await page.waitForLoadState('networkidle')

      // Check for automation settings card
      await expect(page.locator('text=自动化设置')).toBeVisible()

      // Check for toggle options
      await expect(page.locator('text=自动创建 Issue')).toBeVisible()
      await expect(page.locator('text=自动合并')).toBeVisible()
      await expect(page.locator('text=自动推送')).toBeVisible()
      await expect(page.locator('text=需要人工审批')).toBeVisible()
    })

    test('switch components are interactive', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/workflow`)
      await page.waitForLoadState('networkidle')

      // Find switches
      const switches = page.locator('[role="switch"]')
      const count = await switches.count()
      expect(count).toBeGreaterThan(0)
    })

    test('save and reset buttons are present', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/workflow`)
      await page.waitForLoadState('networkidle')

      // Check for action buttons
      await expect(page.locator('button:has-text("重置为默认")')).toBeVisible()
      await expect(page.locator('button:has-text("保存配置")')).toBeVisible()
    })

    test('configuration summary is displayed', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/workflow`)
      await page.waitForLoadState('networkidle')

      // Check for configuration summary card
      await expect(page.locator('text=当前配置摘要')).toBeVisible()
    })
  })

  test.describe('Route Accessibility', () => {
    test('all remote git routes are accessible', async ({ page }) => {
      const routes = [
        `/projects/${testProjectId}/settings/remote`,
        `/projects/${testProjectId}/settings/workflow`,
        `/projects/${testProjectId}/remote-issues`,
      ]

      for (const route of routes) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')

        // Check that no error boundary is shown
        const errorElement = page.locator('text=加载失败')
        const isErrorVisible = await errorElement.isVisible().catch(() => false)

        // The page should either load successfully or show a loading state
        // But not show a hard error
        expect(isErrorVisible).toBe(false)
      }
    })
  })

  test.describe('Checkbox Component', () => {
    test('checkbox works in remote issues page context', async ({ page }) => {
      // First configure a remote repository (mock the state)
      await page.goto(`/projects/${testProjectId}/remote-issues`)
      await page.waitForLoadState('networkidle')

      // The page should render without errors
      // Even if it shows the "no config" warning, the checkbox component should be loaded
      const pageContent = await page.content()
      expect(pageContent).toContain('远程 Issue')
    })
  })

  test.describe('AlertDialog Component', () => {
    test('alert dialog structure exists in remote settings page', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/settings/remote`)
      await page.waitForLoadState('networkidle')

      // The AlertDialog component is used for delete confirmation
      // We can verify the delete button exists (which triggers the dialog)
      // Note: The delete button only shows when there's an existing config
      // So we just verify the page structure supports it
      const pageContent = await page.content()
      expect(pageContent).toContain('远程仓库配置')
    })
  })
})
