import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <h1 className="text-lg font-semibold">应用出现错误</h1>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground mb-2">
                错误信息：
              </p>
              <p className="text-sm font-mono text-destructive break-all">
                {this.state.error?.message || '未知错误'}
              </p>

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    查看详细错误信息
                  </summary>
                  <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-48 p-2 bg-muted rounded">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={this.handleReset} className="flex-1">
                尝试恢复
              </Button>
              <Button onClick={this.handleReload} className="flex-1">
                重新加载
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              如果问题持续存在，请尝试重启应用或联系技术支持
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
import { useState, useCallback } from 'react'

interface UseErrorBoundaryReturn {
  error: Error | null
  resetError: () => void
  ErrorBoundaryWrapper: ({ children }: { children: ReactNode }) => ReactNode
}

export function useErrorBoundary(): UseErrorBoundaryReturn {
  const [error, setError] = useState<Error | null>(null)

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  const ErrorBoundaryWrapper = useCallback(
    ({ children }: { children: ReactNode }) => (
      <ErrorBoundary>{children}</ErrorBoundary>
    ),
    []
  )

  return { error, resetError, ErrorBoundaryWrapper }
}
