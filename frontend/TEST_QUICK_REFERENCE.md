# 测试快速参考

## 快速命令

```bash
# 安装测试依赖
npm install

# 运行所有测试（交互式）
npm run test

# 运行所有测试（单次）
npm run test:run

# 生成覆盖率报告
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e

# E2E UI 模式
npm run test:e2e:ui
```

## 文件位置

| 类型 | 位置 |
|------|------|
| 组件测试 | `src/components/**/__tests__/*.test.tsx` |
| Hook 测试 | `src/hooks/**/__tests__/*.test.ts` |
| 页面测试 | `src/pages/**/__tests__/*.test.tsx` |
| E2E 测试 | `e2e/*.spec.ts` |
| 测试工具 | `src/test/*.ts` |

## 测试模板

### 组件测试

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { YourComponent } from '../YourComponent'

describe('YourComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该渲染', () => {
    render(<YourComponent />)
    expect(screen.getByText('文本')).toBeInTheDocument()
  })

  it('应该处理交互', async () => {
    const user = userEvent.setup()
    const mockFn = vi.fn()
    render(<YourComponent onClick={mockFn} />)

    await user.click(screen.getByRole('button'))
    expect(mockFn).toHaveBeenCalled()
  })
})
```

### Hook 测试

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useYourHook } from '../useYourHook'

describe('useYourHook', () => {
  it('应该返回初始状态', () => {
    const { result } = renderHook(() => useYourHook())
    expect(result.current.value).toBe(initialValue)
  })

  it('应该处理异步操作', async () => {
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

### E2E 测试

```typescript
import { test, expect } from '@playwright/test'

test.describe('功能组', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-path')
  })

  test('测试名称', async ({ page }) => {
    // 操作
    await page.click('selector')
    await page.fill('input', 'value')

    // 断言
    await expect(page.locator('.result')).toBeVisible()
  })
})
```

## 常用断言

### React Testing Library

```typescript
// 元素存在
expect(screen.getByText('文本')).toBeInTheDocument()
expect(screen.queryByText('文本')).not.toBeInTheDocument()

// 元素状态
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toHaveValue('value')
expect(element).toHaveClass('class-name')

// 元素数量
expect(screen.getAllByRole('button')).toHaveLength(3)
```

### Playwright

```typescript
// 页面导航
await expect(page).toHaveURL('/path')
await expect(page).toHaveTitle('标题')

// 元素状态
await expect(element).toBeVisible()
await expect(element).toBeDisabled()
await expect(element).toHaveText('文本')

// 数量
await expect(page.locator('.item')).toHaveCount(3)
```

## Mock 技巧

### Mock 模块

```typescript
vi.mock('@/hooks/useProviderConfigs', () => ({
  useProviderConfigs: vi.fn(() => ({
    configs: [],
    loading: false,
    addConfig: vi.fn(),
  })),
}))
```

### Mock 函数

```typescript
const mockFn = vi.fn()
mockFn.mockReturnValue('value')
mockFn.mockResolvedValue('async-value')
mockFn.mockRejectedValue(new Error('error'))
expect(mockFn).toHaveBeenCalledWith('arg')
expect(mockFn).toHaveBeenCalledTimes(1)
```

### Mock 定时器

```typescript
vi.useFakeTimers()
vi.advanceTimersByTime(1000)
vi.useRealTimers()
```

## 测试数据

使用 `@/test/factory` 创建测试数据：

```typescript
import { createMockProviderConfig, mockKimiConfig } from '@/test/factory'

const config = createMockProviderConfig({
  name: '自定义名称',
  provider: 'openai',
})

const kimi = mockKimiConfig
```

## 选择器策略

### React Testing Library

| 优先级 | 方法 | 示例 |
|--------|------|------|
| 1 | getByRole | `getByRole('button', { name: '提交' })` |
| 2 | getByLabelText | `getByLabelText('用户名')` |
| 3 | getByPlaceholderText | `getByPlaceholderText('输入...')` |
| 4 | getByText | `getByText('提交')` |
| 5 | getByTestId | `getByTestId('submit-btn')` |

### Playwright

| 优先级 | 选择器 | 示例 |
|--------|--------|------|
| 1 | 角色 | `page.getByRole('button')` |
| 2 | 文本 | `page.getByText('提交')` |
| 3 | Label | `page.getByLabel('用户名')` |
| 4 | Placeholder | `page.getByPlaceholder('输入...')` |
| 5 | CSS | `page.locator('.btn')` |
| 6 | Test ID | `page.getByTestId('submit')` |

## 调试技巧

### Vitest

```typescript
// 只运行一个测试
test.only('测试名称', () => {})

// 跳过测试
test.skip('测试名称', () => {})

// 打印调试
screen.debug()
screen.debug(element)
```

### Playwright

```typescript
// 只运行一个测试
test.only('测试名称', async ({ page }) => {})

// 跳过测试
test.skip('测试名称', async ({ page }) => {})

// 调试模式
npm run test:e2e:debug

// 截图
await page.screenshot({ path: 'screenshot.png' })
```

## 常见问题

**Q: 测试超时？**
```typescript
test('测试', async () => {}, { timeout: 10000 })
```

**Q: 异步测试失败？**
```typescript
await waitFor(() => {
  expect(element).toBeVisible()
})
```

**Q: Mock 不生效？**
```typescript
// 在测试文件顶部 mock
vi.mock('@/module', () => ({ ... }))
```

## 更多信息

- 详细指南: [TESTING.md](./TESTING.md)
- 测试总结: [TEST_SUMMARY.md](./TEST_SUMMARY.md)
