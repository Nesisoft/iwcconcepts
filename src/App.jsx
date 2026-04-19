import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { migrateFromLocalStorage } from './utils/db'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Studio (admin) pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import QuoteCardStudio from './pages/QuoteCardStudio'
import EventFlyerStudio from './pages/EventFlyerStudio'
import FormBuilder from './pages/FormBuilder'
import EventRegistration from './pages/EventRegistration'
import EventFeedback from './pages/EventFeedback'
import EventDashboard from './pages/EventDashboard'
import DatabaseSetup from './pages/DatabaseSetup'

// Public Lady Adel site
import LadyAdel from './pages/LadyAdel'
import LadyAdelPlaceholder from './pages/LadyAdelPlaceholder'
import CatchUpPage from './pages/CatchUpPage'
import ProgrammesPage from './pages/ProgrammesPage'
import WhatsAppButton from './components/layout/WhatsAppButton'

function PrivateRoute({ element }) {
  return <ProtectedRoute>{element}</ProtectedRoute>
}

/**
 * Toggles a body class so public (Lady Adel) pages get the light
 * cream theme and studio/admin pages keep the dark theme defined
 * in global.css. Also renders the floating WhatsApp button on
 * every public page.
 */
const PUBLIC_PATHS = ['/lady-adel', '/catch-up', '/programmes', '/training', '/contact']
function useIsPublicRoute() {
  const location = useLocation()
  return PUBLIC_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))
}

function ThemeSwitch() {
  const isPublic = useIsPublicRoute()
  useEffect(() => {
    document.body.classList.toggle('site-public', isPublic)
  }, [isPublic])
  return null
}

function PublicChrome() {
  const isPublic = useIsPublicRoute()
  if (!isPublic) return null
  return <WhatsAppButton />
}

export default function App() {
  useEffect(() => { migrateFromLocalStorage() }, [])
  return (
    <HashRouter>
      <AuthProvider>
        <ThemeSwitch />
        <PublicChrome />
        <Routes>
          {/* Root → Lady Adel public profile */}
          <Route path="/" element={<Navigate to="/lady-adel" replace />} />

          {/* Public — Lady Adel site */}
          <Route path="/lady-adel"  element={<LadyAdel />} />
          <Route path="/catch-up"   element={<CatchUpPage />} />
          <Route path="/programmes" element={<ProgrammesPage />} />
          <Route path="/training"   element={<LadyAdelPlaceholder page="training" />} />
          <Route path="/contact"    element={<LadyAdelPlaceholder page="contact" />} />

          {/* Public — shared event links (keep at root to preserve existing URLs) */}
          <Route path="/register" element={<EventRegistration />} />
          <Route path="/feedback" element={<EventFeedback />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Studio (admin) — everything nested under /studio */}
          <Route path="/studio"                  element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/studio/quote-studio"     element={<PrivateRoute element={<QuoteCardStudio />} />} />
          <Route path="/studio/flyer-studio"     element={<PrivateRoute element={<EventFlyerStudio />} />} />
          <Route path="/studio/form-builder"     element={<PrivateRoute element={<FormBuilder />} />} />
          <Route path="/studio/event-dashboard"  element={<PrivateRoute element={<EventDashboard />} />} />
          <Route path="/studio/db-setup"         element={<PrivateRoute element={<DatabaseSetup />} />} />

          {/* Legacy admin paths → redirect to /studio/* so old bookmarks still work */}
          <Route path="/quote-studio"    element={<Navigate to="/studio/quote-studio" replace />} />
          <Route path="/flyer-studio"    element={<Navigate to="/studio/flyer-studio" replace />} />
          <Route path="/form-builder"    element={<Navigate to="/studio/form-builder" replace />} />
          <Route path="/event-dashboard" element={<Navigate to="/studio/event-dashboard" replace />} />
          <Route path="/db-setup"        element={<Navigate to="/studio/db-setup" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/lady-adel" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
