# 设置页面测试指南

本文档介绍如何为设置页面编写和运行测试。

## 测试框架

- **单元测试和组件测试**: Vitest + React Testing Library
- **E2E 测试**: Playwright
- **测试覆盖率**: Vitest Coverage (v8)

## 测试文件结构

```
frontend/
├── src/
│   ├── components/
│   │   └── settings/
│   │       ├── __tests__/
│   │       │   ├── SettingsSidebar.test.tsx
│   │       │   ├── ProviderCard.test.tsx
│   │       │   ├── ProviderConfigDialog.test.tsx
│   │       │   └── DeleteConfirmDialog.test.tsx
│   ├── hooks/
│   │   └── __tests__/
│   │       └── useProviderConfigs.test.ts
│   ├── pages/
│   │   └── __tests__/
│   │       ├── SettingsPage.test.tsx
│   │       └── ProviderConfigPage.test.tsx
│   └── test/
│       ├── setup.ts              # 测试环境配置
│       └── test-utils.tsx        # 测试工具函数
└── e2e/
    ├── settings.spec.ts          # E2E 测试用例
    ├── helpers.ts                # E2E 辅助函数
    └── fixtures.ts               # E2E fixtures
```

## 安装依赖

```bash
cd frontend
npm install
```

## 运行测试

### 单元测试和组件测试

```bash
# 交互式测试模式（推荐）
npm run test

# 单次运行所有测试
npm run test:run

# 运行测试并生成覆盖率报告
npm run test:coverage

# 使用 UI 界面查看测试结果
npm run test:ui
```

### E2E 测试

```bash
# 运行所有 E2E 测试（无头模式）
npm run test:e2e

# 使用 UI 界面运行 E2E 测试
npm run test:e2e:ui

# 调试模式（打开浏览器）
npm run test:e2e:debug
```

## 测试用例覆盖

### 组件测试

#### SettingsPage 组件
- ✅ 渲染侧边栏和内容区域
- ✅ 当前 tab 从 URL 正确获取
- ✅ 点击侧边栏项触发路由导航

#### SettingsSidebar 组件
- ✅ 渲染三个菜单项
- ✅ "模型提供商配置"显示为激活状态
- ✅ 点击菜单项调用 onTabChange
- ✅ 禁用的菜单项显示 tooltip

#### ProviderConfigPage 组件
- ✅ 加载状态显示
- ✅ 空状态显示（当 configs 为空）
- ✅ 配置列表显示
- ✅ 点击"添加配置"按钮打开对话框
- ✅ ProviderCard 正确渲染

#### ProviderCard 组件
- ✅ 显示提供商名称和状态徽章
- ✅ 显示正确的提供商图标
- ✅ 点击"编辑"按钮调用 onEdit
- ✅ 点击"删除"按钮调用 onDelete
- ✅ 切换开关调用 onToggleEnabled
- ✅ Kimi/Zhipu 显示固定 Base URL
- ✅ OpenAI 显示自定义或默认 Base URL

#### ProviderConfigDialog 组件
- ✅ 添加模式：显示提供商选择
- ✅ 编辑模式：隐藏提供商选择，使用现有数据
- ✅ 选择 Kimi：显示固定 Base URL
- ✅ 选择 Zhipu：显示固定 Base URL
- ✅ 选择 OpenAI + API Key：显示可选 Base URL
- ✅ 选择 OpenAI + Codex OAuth：显示授权按钮
- ✅ 表单验证：配置名称为必填
- ✅ 表单验证：API Key 为必填（当使用 API Key 时）
- ✅ 表单验证：Base URL 必须是有效 URL（如果填写）
- ✅ 点击保存调用 onSave
- ✅ 点击取消调用 onCancel

#### DeleteConfirmDialog 组件
- ✅ 显示配置名称
- ✅ 点击"取消"调用 onCancel
- ✅ 点击"删除"调用 onConfirm

### Hook 测试

#### useProviderConfigs Hook
- ✅ 初始状态：configs 为空，loading 为 true
- ✅ 加载完成后：loading 为 false
- ✅ addConfig 添加新配置到列表
- ✅ updateConfig 更新现有配置
- ✅ deleteConfig 从列表中删除配置
- ✅ 错误处理：API 调用失败时设置 error

### E2E 测试

- ✅ 可以访问设置页面
- ✅ 侧边栏导航正常工作
- ✅ 可以添加 Kimi 配置
- ✅ 可以添加 Zhipu 配置
- ✅ 可以添加 OpenAI 配置（API Key）
- ✅ 可以添加 OpenAI 配置（Codex OAuth - UI 检查）
- ✅ 可以编辑配置
- ✅ 可以删除配置
- ✅ 可以取消删除操作
- ✅ 可以切换配置的启用状态
- ✅ 表单验证正常工作
- ✅ 配置名称不能超过 50 个字符
- ✅ 空状态正常显示
- ✅ 可以关闭添加对话框
- ✅ 可以通过 ESC 键关闭对话框
- ✅ ProviderCard 显示正确的信息
- ✅ 可以添加多个配置

## 测试覆盖率目标

- 组件测试: > 80%
- Hook 测试: > 80%
- E2E 测试: 覆盖所有主要用户流程

## 编写新测试的指南

### 组件测试模板

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { YourComponent } from '../YourComponent'

describe('YourComponent 组件测试', () => {
  const mockHandler = vi.fn()

  beforeEach(() => {
    mockHandler.mockClear()
  })

  it('应该渲染基本结构', () => {
    render(<YourComponent />)
    expect(screen.getByText('期望的文本')).toBeInTheDocument()
  })

  it('应该处理用户交互', async () => {
    render(<YourComponent onClick={mockHandler} />)
    const button = screen.getByRole('button')
    button.click()
    expect(mockHandler).toHaveBeenCalled()
  })
})
```

### Hook 测试模板

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useYourHook } from '../useYourHook'

describe('useYourHook 测试', () => {
  it('应该返回正确的初始状态', () => {
    const { result } = renderHook(() => useYourHook())
    expect(result.current.value).toBe(initialValue)
  })

  it('应该正确处理异步操作', async () => {
    const { result } = renderHook(() => useYourHook())
    await act(async () => {
      await result.current.asyncAction()
    })
    await waitFor(() => {
      expect(result.current.value).toBe(expectedValue)
    })
  })
})
```

### E2E 测试模板

```typescript
import { test, expect } from '@playwright/test'

test.describe('功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page')
  })

  test('应该完成某个用户流程', async ({ page }) => {
    // 执行操作
    await page.click('button')
    await page.fill('input', 'value')

    // 验证结果
    await expect(page.locator('.result')).toBeVisible()
  })
})
```

## 最佳实践

1. **使用语义化的选择器**: 优先使用 `getByRole`、`getByLabelText` 等语义化方法
2. **Mock 外部依赖**: 使用 `vi.mock` 来 mock API 调用和外部模块
3. **测试用户行为**: 关注用户看到的和操作的，而不是实现细节
4. **保持测试简单**: 每个测试应该只验证一个行为或状态
5. **使用描述性的测试名称**: 测试名称应该清楚描述测试的内容

## 常见问题

### Q: 测试运行失败，提示 "Cannot find module '@/xxx'"

A: 确保在测试配置中正确设置了路径别名。检查 `vitest.config.ts` 中的 `resolve.alias` 配置。

### Q: E2E 测试超时

A: 检查应用是否正在运行，或者在 `playwright.config.ts` 中配置 `webServer` 自动启动应用。

### Q: 测试覆盖率报告在哪里？

A: 运行 `npm run test:coverage` 后，报告会生成在 `coverage/index.html`。

## 相关资源

- [Vitest 文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/react)
- [Playwright 文档](https://playwright.dev/)
- [测试最佳实践](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
