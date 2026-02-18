# 设置页面测试总结

## 测试概览

本项目为设置页面（Settings Page）创建了完整的测试套件，包括：

- **7 个组件测试文件**
- **1 个 Hook 测试文件**
- **1 个 E2E 测试文件**
- **50+ 个测试用例**

## 测试覆盖率

| 类型 | 覆盖率目标 | 测试数量 |
|------|-----------|---------|
| 组件测试 | > 80% | 30+ |
| Hook 测试 | > 80% | 15+ |
| E2E 测试 | 主要流程 | 18 |

## 已创建的文件

### 配置文件

1. **vitest.config.ts** - Vitest 测试配置
2. **playwright.config.ts** - Playwright E2E 测试配置
3. **frontend/src/test/setup.ts** - 测试环境初始化
4. **frontend/src/test/test-utils.tsx** - 测试工具函数
5. **frontend/src/test/factory.ts** - 测试数据工厂

### 组件测试

1. **SettingsPage.test.tsx** (5 个测试)
   - 渲染测试
   - URL 路由解析测试
   - 导航测试

2. **SettingsSidebar.test.tsx** (6 个测试)
   - 菜单项渲染
   - 激活状态
   - 交互处理
   - 禁用项和 Tooltip

3. **ProviderConfigPage.test.tsx** (7 个测试)
   - 加载/空/错误状态
   - 配置列表渲染
   - 对话框交互
   - 页面标题和描述

4. **ProviderCard.test.tsx** (12 个测试)
   - 提供商信息显示
   - 图标和状态徽章
   - 编辑/删除/切换操作
   - 不同提供商的 URL 显示

5. **ProviderConfigDialog.test.tsx** (15 个测试)
   - 添加/编辑模式
   - 提供商选择
   - 表单验证
   - URL 验证
   - 按钮交互和加载状态

6. **DeleteConfirmDialog.test.tsx** (9 个测试)
   - 对话框显示
   - 确认/取消操作
   - 加载状态
   - 按钮禁用状态

### Hook 测试

1. **useProviderConfigs.test.ts** (15+ 个测试)
   - 初始状态测试
   - 加载配置测试
   - 添加配置测试
   - 更新配置测试
   - 删除配置测试
   - 错误处理测试
   - 不同提供商类型测试

### E2E 测试

1. **settings.spec.ts** (18 个测试)
   - 页面访问测试
   - 导航测试
   - 添加配置测试（Kimi/Zhipu/OpenAI）
   - 编辑配置测试
   - 删除配置测试
   - 启用/禁用切换测试
   - 表单验证测试
   - 空状态测试
   - 对话框交互测试

## 运行测试

### 前置条件

```bash
# 安装依赖
npm install

# 安装 Playwright 浏览器（仅首次需要）
npx playwright install
```

### 运行命令

```bash
# 组件和单元测试（交互式）
npm run test

# 组件和单元测试（单次运行）
npm run test:run

# 测试覆盖率报告
npm run test:coverage

# 测试 UI 界面
npm run test:ui

# E2E 测试
npm run test:e2e

# E2E 测试 UI
npm run test:e2e:ui

# E2E 调试模式
npm run test:e2e:debug
```

## 测试结构示例

### 组件测试示例

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { ProviderCard } from '../ProviderCard'

describe('ProviderCard', () => {
  it('应该显示提供商名称', () => {
    render(<ProviderCard config={mockConfig} {...mockHandlers} />)
    expect(screen.getByText('Kimi 配置')).toBeInTheDocument()
  })
})
```

### Hook 测试示例

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProviderConfigs } from '../useProviderConfigs'

test('应该添加新配置', async () => {
  const { result } = renderHook(() => useProviderConfigs())
  await act(async () => {
    await result.current.addConfig(newConfig)
  })
  expect(result.current.configs).toHaveLength(1)
})
```

### E2E 测试示例

```typescript
import { test, expect } from '@playwright/test'

test('可以添加配置', async ({ page }) => {
  await page.goto('/settings')
  await page.click('button:has-text("添加配置")')
  await page.fill('input[name="name"]', '测试配置')
  await page.click('button:has-text("添加")')
  await expect(page.locator('text=测试配置')).toBeVisible()
})
```

## 测试工具

### test-utils.tsx

提供 `renderWithProviders` 函数，自动包装必要的 Provider：

```typescript
export const renderWithProviders = (
  ui: ReactElement,
  { route, ...options }: CustomRenderOptions = {}
) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>,
    options
  )
}
```

### factory.ts

提供测试数据工厂函数：

```typescript
import { createMockProviderConfig, mockKimiConfig } from '@/test/factory'

const config = createMockProviderConfig({ name: '自定义名称' })
const kimi = mockKimiConfig
```

### e2e/helpers.ts

提供 E2E 测试辅助函数：

```typescript
import { fillProviderForm, waitForToast } from '../helpers'

await fillProviderForm(page, { provider: 'kimi', name: '测试' })
await waitForToast(page)
```

## 最佳实践

1. **使用语义化选择器**: `getByRole`、`getByLabelText`
2. **Mock 外部依赖**: 使用 `vi.mock` mock API
3. **测试用户行为**: 关注用户看到的和操作的
4. **保持测试简单**: 每个测试验证一个行为
5. **使用描述性名称**: 清晰描述测试内容

## 已知限制

1. **GraphQL Mock**: 当前使用 mock 实现，需要替换为真实的 GraphQL API
2. **OAuth 功能**: Codex OAuth 功能尚未实现，相关测试仅验证 UI
3. **持久化测试**: 当前测试使用内存状态，不测试本地存储

## 下一步

1. 集成真实的 GraphQL API 并更新 mock
2. 添加更多边界情况测试
3. 添加性能测试
4. 添加可访问性测试
5. 增加测试覆盖率到 90%+

## 相关文档

- [TESTING.md](./TESTING.md) - 详细的测试指南
- [Vitest 文档](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright 文档](https://playwright.dev/)
