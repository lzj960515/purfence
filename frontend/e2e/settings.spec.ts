import { test, expect } from '@playwright/test'

test.describe('设置页面 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test('可以访问设置页面', async ({ page }) => {
    await expect(page).toHaveURL(/\/settings\/providers/)
    await expect(page.locator('h1')).toContainText('模型提供商配置')
  })

  test('侧边栏导航正常工作', async ({ page }) => {
    // 点击"即将推出"的菜单项
    await page.click('text=Claude Code 配置')
    await expect(page).toHaveURL(/\/settings\/claude-code/)
    await expect(page.locator('h2')).toContainText('即将推出')

    // 返回模型提供商配置
    await page.click('text=模型提供商配置')
    await expect(page).toHaveURL(/\/settings\/providers/)
  })

  test('可以添加 Kimi 配置', async ({ page }) => {
    // 点击添加按钮
    await page.click('button:has-text("添加配置")')

    // 等待对话框打开
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // 选择提供商（默认应该是 Kimi）
    await expect(page.locator('select[name="provider"]')).toHaveValue('kimi')

    // 填写表单
    await page.fill('input[name="name"]', '我的 Kimi 配置')
    await page.fill('textarea[name="apiKey"]', 'sk-test123456789')

    // 验证 Base URL 是固定值且只读
    await expect(page.locator('input[name="baseUrl"]')).toHaveValue(
      'https://api.moonshot.ai/v1'
    )
    await expect(page.locator('input[name="baseUrl"]')).toBeDisabled()

    // 保存
    await page.click('button:has-text("添加")')

    // 等待对话框关闭和成功提示
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    await expect(page.locator('text=配置已添加')).toBeVisible()

    // 验证配置出现在列表中
    await expect(page.locator('text=我的 Kimi 配置')).toBeVisible()
  })

  test('可以添加 Zhipu 配置', async ({ page }) => {
    await page.click('button:has-text("添加配置")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // 选择 Zhipu
    await page.selectOption('select[name="provider"]', 'zhipu')

    // 填写表单
    await page.fill('input[name="name"]', '智谱 AI 配置')
    await page.fill('textarea[name="apiKey"]', 'sk-zhipu123456')

    // 验证 Base URL 是固定值
    await expect(page.locator('input[name="baseUrl"]')).toHaveValue(
      'https://open.bigmodel.cn/api/anthropic/v1'
    )
    await expect(page.locator('input[name="baseUrl"]')).toBeDisabled()

    // 保存
    await page.click('button:has-text("添加")')

    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    await expect(page.locator('text=智谱 AI 配置')).toBeVisible()
  })

  test('可以添加 OpenAI 配置（API Key）', async ({ page }) => {
    await page.click('button:has-text("添加配置")')

    // 选择 OpenAI
    await page.selectOption('select[name="provider"]', 'openai')

    // 填写表单
    await page.fill('input[name="name"]', '我的 OpenAI 配置')
    await page.fill('textarea[name="apiKey"]', 'sk-openai123456')
    await page.fill('input[name="baseUrl"]', 'https://api.openai.com/v1')

    // 保存
    await page.click('button:has-text("添加")')

    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    await expect(page.locator('text=我的 OpenAI 配置')).toBeVisible()
  })

  test('可以添加 Codex 配置（OAuth - UI 检查）', async ({ page }) => {
    await page.click('button:has-text("添加配置")')

    // 选择 Codex
    await page.selectOption('select[name="provider"]', 'codex')

    // 验证 OAuth 按钮显示
    await expect(page.locator('text=点击授权（即将推出）')).toBeVisible()

    // 验证 API Key 字段不显示
    await expect(page.locator('label:has-text("API Key")')).not.toBeVisible()

    // 填写基本信息（无法保存，因为需要授权）
    await page.fill('input[name="name"]', 'OpenAI OAuth 配置')

    // 尝试保存应该显示错误（因为 OAuth 未实现）
    await page.click('button:has-text("添加")')
    // 实际行为取决于实现，这里只验证 UI 状态
  })

  test('可以编辑配置', async ({ page }) => {
    // 先添加一个配置
    await page.click('button:has-text("添加配置")')
    await page.fill('input[name="name"]', '原始名称')
    await page.fill('textarea[name="apiKey"]', 'sk-test')
    await page.click('button:has-text("添加")')

    // 等待配置添加完成
    await expect(page.locator('text=原始名称')).toBeVisible()

    // 点击编辑
    await page.click('button:has-text("编辑")')

    // 等待对话框打开
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // 修改名称
    await page.fill('input[name="name"]', '修改后的名称')

    // 保存
    await page.click('button:has-text("保存")')

    // 验证
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    await expect(page.locator('text=配置已更新')).toBeVisible()
    await expect(page.locator('text=修改后的名称')).toBeVisible()
  })

  test('可以删除配置', async ({ page }) => {
    // 先添加一个配置
    await page.click('button:has-text("添加配置")')
    await page.fill('input[name="name"]', '要删除的配置')
    await page.fill('textarea[name="apiKey"]', 'sk-test')
    await page.click('button:has-text("添加")')

    await expect(page.locator('text=要删除的配置')).toBeVisible()

    // 点击删除
    await page.click('button:has-text("删除")')

    // 等待确认对话框
    await expect(page.locator('text=确定要删除配置')).toBeVisible()
    await expect(page.locator('text=要删除的配置')).toBeVisible()

    // 确认删除
    await page.click(
      'button:has-text("删除"):not([class*="outline"]):not([variant="outline"])'
    )

    // 验证
    await expect(page.locator('text=配置已删除')).toBeVisible()
    await expect(page.locator('text=要删除的配置')).not.toBeVisible()
  })

  test('可以取消删除操作', async ({ page }) => {
    // 先添加一个配置
    await page.click('button:has-text("添加配置")')
    await page.fill('input[name="name"]', '测试配置')
    await page.fill('textarea[name="apiKey"]', 'sk-test')
    await page.click('button:has-text("添加")')

    await expect(page.locator('text=测试配置')).toBeVisible()

    // 点击删除
    await page.click('button:has-text("删除")')

    // 点击取消
    await page.click('button:has-text("取消"):has-text("取消")')

    // 验证配置仍然存在
    await expect(page.locator('text=测试配置')).toBeVisible()
  })

  test('可以切换配置的启用状态', async ({ page }) => {
    // 添加一个启用的配置
    await page.click('button:has-text("添加配置")')
    await page.fill('input[name="name"]', '测试配置')
    await page.fill('textarea[name="apiKey"]', 'sk-test')
    await page.click('button:has-text("添加")')

    // 等待配置添加
    await expect(page.locator('text=测试配置')).toBeVisible()

    // 初始状态应该是启用
    await expect(page.locator('text=已启用')).toBeVisible()

    // 切换为禁用
    await page.click('[role="switch"]')

    // 验证
    await expect(page.locator('text=配置已禁用')).toBeVisible()
    await expect(page.locator('text=已禁用')).toBeVisible()

    // 再次切换为启用
    await page.click('[role="switch"]')

    // 验证
    await expect(page.locator('text=配置已启用')).toBeVisible()
    await expect(page.locator('text=已启用')).toBeVisible()
  })

  test('表单验证正常工作', async ({ page }) => {
    await page.click('button:has-text("添加配置")')

    // 不填写任何字段，直接点击保存
    await page.click('button:has-text("添加")')

    // 验证错误提示
    await expect(page.locator('text=请输入配置名称')).toBeVisible()
    await expect(page.locator('text=请输入 API Key')).toBeVisible()

    // 填写无效的 Base URL
    await page.fill('input[name="name"]', '测试')
    await page.selectOption('select[name="provider"]', 'openai')
    await page.fill('textarea[name="apiKey"]', 'sk-test')
    await page.fill('input[name="baseUrl"]', 'not-a-valid-url')
    await page.click('button:has-text("添加")')

    // 验证 URL 验证错误
    await expect(page.locator('text=请输入有效的 URL')).toBeVisible()
  })

  test('配置名称不能超过 50 个字符', async ({ page }) => {
    await page.click('button:has-text("添加配置")')

    // 输入超过 50 个字符的名称
    await page.fill('input[name="name"]', 'a'.repeat(51))

    // 验证错误提示
    await expect(
      page.locator('text=配置名称不能超过 50 个字符')
    ).toBeVisible()
  })

  test('空状态正常显示', async ({ page }) => {
    // 刷新页面以确保没有配置
    await page.reload()

    // 验证空状态显示
    await expect(page.locator('text=还没有配置任何模型提供商')).toBeVisible()
    await expect(
      page.locator('text=点击右上角「添加配置」按钮开始添加您的第一个模型提供商配置')
    ).toBeVisible()

    // 验证支持的提供商列表
    await expect(page.locator('text=Kimi (月之暗面)')).toBeVisible()
    await expect(page.locator('text=Zhipu (智谱 AI)')).toBeVisible()
    await expect(page.locator('text=OpenAI')).toBeVisible()
  })

  test('可以关闭添加对话框', async ({ page }) => {
    await page.click('button:has-text("添加配置")')

    // 验证对话框打开
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // 点击取消按钮
    await page.click('button:has-text("取消")')

    // 验证对话框关闭
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('可以通过 ESC 键关闭对话框', async ({ page }) => {
    await page.click('button:has-text("添加配置")')

    // 验证对话框打开
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // 按 ESC 键
    await page.keyboard.press('Escape')

    // 验证对话框关闭
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('ProviderCard 显示正确的信息', async ({ page }) => {
    // 添加 Kimi 配置
    await page.click('button:has-text("添加配置")')
    await page.fill('input[name="name"]', 'Kimi 测试')
    await page.fill('textarea[name="apiKey"]', 'sk-test')
    await page.click('button:has-text("添加")')

    // 验证卡片显示
    await expect(page.locator('text=Kimi 测试')).toBeVisible()
    await expect(page.locator('text=Kimi (月之暗面) · API Key')).toBeVisible()
    await expect(page.locator('text=Base URL: https://api.moonshot.ai/v1')).toBeVisible()
    await expect(page.locator('text=已启用')).toBeVisible()

    // 验证按钮存在
    await expect(page.locator('button:has-text("编辑")')).toBeVisible()
    await expect(page.locator('button:has-text("删除")')).toBeVisible()
  })

  test('可以添加多个配置', async ({ page }) => {
    // 添加第一个配置
    await page.click('button:has-text("添加配置")')
    await page.fill('input[name="name"]', '配置1')
    await page.fill('textarea[name="apiKey"]', 'sk-test1')
    await page.click('button:has-text("添加")')

    await expect(page.locator('text=配置1')).toBeVisible()

    // 添加第二个配置
    await page.click('button:has-text("添加配置")')
    await page.selectOption('select[name="provider"]', 'openai')
    await page.fill('input[name="name"]', '配置2')
    await page.fill('textarea[name="apiKey"]', 'sk-test2')
    await page.click('button:has-text("添加")')

    await expect(page.locator('text=配置2')).toBeVisible()

    // 验证两个配置都存在
    await expect(page.locator('text=配置1')).toBeVisible()
    await expect(page.locator('text=配置2')).toBeVisible()
  })
})
