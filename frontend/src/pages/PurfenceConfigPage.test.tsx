import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PurfenceConfigPage } from '@/pages/PurfenceConfigPage'

const mockUsePurfenceConfig = vi.fn()

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => false,
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('@/hooks/useUpdate', () => ({
  useUpdate: () => ({
    status: 'idle',
    updateInfo: null,
    downloadProgress: 0,
    error: null,
    currentVersion: '1.0.0',
    checkForUpdates: vi.fn(),
    startDownload: vi.fn(),
    dismissUpdate: vi.fn(),
    installAndRestart: vi.fn(),
    skipVersion: vi.fn(),
  }),
}))

vi.mock('@/components/update', () => ({
  UpdateDialog: () => null,
}))

vi.mock('@/hooks/usePurfenceConfig', () => ({
  usePurfenceConfig: () => mockUsePurfenceConfig(),
}))

describe('PurfenceConfigPage', () => {
  beforeEach(() => {
    const getModelConfig = vi.fn(() => ({
      default: { id: 'provider-1', model: 'gpt-5.4' },
      fallbacks: [],
    }))

    mockUsePurfenceConfig.mockReset()
    mockUsePurfenceConfig.mockImplementation(() => ({
      config: {
        projectsRootPath: '/tmp/projects',
        proxyUrl: '',
      },
      loading: false,
      error: null,
      saving: false,
      saveConfig: vi.fn(),
      providers: [{ id: 'provider-1', name: 'OpenAI', provider: 'openai' }],
      saveModelConfig: vi.fn(),
      getModelConfig,
    }))
  })

  it('adds a fallback row when clicking add', async () => {
    const user = userEvent.setup()

    render(<PurfenceConfigPage />)

    expect(screen.getAllByPlaceholderText('gpt-5.4')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: '添加' }))

    expect(screen.getAllByPlaceholderText('gpt-5.4')).toHaveLength(2)
  })

  it('keeps focus on the fallback model input while typing', async () => {
    const user = userEvent.setup()

    render(<PurfenceConfigPage />)

    await user.click(screen.getByRole('button', { name: '添加' }))

    const fallbackInput = screen.getAllByPlaceholderText('gpt-5.4')[1]
    await user.click(fallbackInput)
    await user.type(fallbackInput, 'claude-sonnet-4')

    expect(fallbackInput).toHaveValue('claude-sonnet-4')
    expect(fallbackInput).toHaveFocus()
  })
})
