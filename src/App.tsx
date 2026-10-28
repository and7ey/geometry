import { useEffect } from 'react'
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider } from './app/store'
import { ToastProvider } from './components/ui'
import { Header, MobileNav } from './components/Header'
import { HomePage } from './pages/HomePage'
import { SetupPage } from './pages/SetupPage'
import { SessionPage } from './pages/SessionPage'
import { ResultsPage } from './pages/ResultsPage'
import { ReferencePage } from './pages/ReferencePage'
import { ItemPage } from './pages/ItemPage'
import { RoutePage } from './pages/RoutePage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'
import { CONTENT_STATS } from './content'
import { EmptyState, Button } from './components/ui'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <EmptyState
      icon="search"
      title="Страница не найдена"
      description="Такого раздела нет. Вернитесь на главную или откройте справочник."
      action={
        <Link to="/">
          <Button>На главную</Button>
        </Link>
      }
    />
  )
}

function Footer() {
  return (
    <footer className="mx-auto mt-10 hidden w-full max-w-6xl items-center justify-between gap-4 border-t border-line px-4 py-6 text-[0.6875rem] text-ink-3 sm:px-6 md:flex">
      <div>
        GeoMaster · геометрия 7–8 · {CONTENT_STATS.items} элементов · {CONTENT_STATS.topics} тем
      </div>
      <div className="flex items-center gap-4">
        <span>Данные хранятся только в этом браузере</span>
        <Link to="/settings" className="hover:text-ink-2">
          Настройки
        </Link>
      </div>
    </footer>
  )
}

function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/session" element={<SessionPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/reference" element={<ReferencePage />} />
          <Route path="/item/:id" element={<ItemPage />} />
          <Route path="/route/:topicId" element={<RoutePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <Layout />
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  )
}
