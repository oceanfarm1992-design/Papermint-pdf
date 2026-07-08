import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Local console only — there is no telemetry in this app.
    console.error('Unhandled error:', error, info.componentStack)
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <p className="text-5xl" aria-hidden>
            😵
          </p>
          <h1 className="mt-4 text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <button type="button" className="btn-primary mt-6" onClick={() => window.location.assign('/')}>
            Back to tools
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
