import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Toast } from './components/Toast'
import { Home } from './pages/Home'
import { Temple } from './pages/Temple'
import { FortunePage } from './pages/FortunePage'
import { WishesPage } from './pages/WishesPage'
import { MeritPage } from './pages/MeritPage'
import { MeditationPage } from './pages/MeditationPage'
import { AccountPage } from './pages/AccountPage'
import { AboutPage } from './pages/AboutPage'
import { AdminPage } from './pages/AdminPage'

const CalendarPage = lazy(() => import('./pages/CalendarPage').then(module => ({ default: module.CalendarPage })))

export function App() {
  const location = useLocation()
  return (
    <Layout>
      <div className="route-stage" key={location.pathname}>
        <Suspense fallback={<div className="page-container page-loader">Đang mở lịch an lành…</div>}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/chua/:slug" element={<Temple />} />
            <Route path="/xin-xam" element={<FortunePage />} />
            <Route path="/to-nguyen" element={<WishesPage />} />
            <Route path="/cong-duc" element={<MeritPage />} />
            <Route path="/lich" element={<CalendarPage />} />
            <Route path="/thien" element={<MeditationPage />} />
            <Route path="/tai-khoan" element={<AccountPage />} />
            <Route path="/gioi-thieu" element={<AboutPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <Toast />
    </Layout>
  )
}
