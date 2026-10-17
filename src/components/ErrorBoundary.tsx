import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/** Prevents a rendering failure from leaving visitors with a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render failed', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="error-boundary" role="alert">
        <div className="error-boundary__card">
          <span className="error-boundary__symbol" aria-hidden="true">
            ☸
          </span>
          <p className="eyebrow">Một phút tĩnh tâm</p>
          <h1>Trang vừa gặp một sự cố nhỏ</h1>
          <p>Dữ liệu của bạn vẫn an toàn. Hãy tải lại trang để tiếp tục hành trình.</p>
          <div className="error-boundary__actions">
            <button className="button primary" type="button" onClick={() => window.location.reload()}>
              Tải lại trang
            </button>
            <a className="button ghost" href="/">
              Về trang chủ
            </a>
          </div>
        </div>
      </main>
    )
  }
}
