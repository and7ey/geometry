import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, Card, Icon } from '../components/ui'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('GeoMaster: необработанная ошибка интерфейса', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-xl items-center px-4 py-10">
        <Card className="w-full text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
            <Icon name="alert" size={22} />
          </span>
          <h1 className="mt-4 text-xl">Что-то пошло не так</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Интерфейс столкнулся с ошибкой. Прогресс в LocalStorage не пострадал — перезагрузите страницу.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={() => window.location.reload()}>Перезагрузить</Button>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.hash = '#/'
                window.location.reload()
              }}
            >
              На главную
            </Button>
          </div>
          <details className="mt-6 text-left text-xs text-ink-3">
            <summary className="cursor-pointer">Техническая информация</summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-surface-2 p-3 text-[0.6875rem]">
              {this.state.error.message}
            </pre>
          </details>
        </Card>
      </div>
    )
  }
}
