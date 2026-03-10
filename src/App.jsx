import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { migrateFromLocalStorage } from './utils/db'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import QuoteCardStudio from './pages/QuoteCardStudio'
import EventFlyerStudio from './pages/EventFlyerStudio'
import VideoThumbnailStudio from './pages/VideoThumbnailStudio'
import FormBuilder from './pages/FormBuilder'
import EventRegistration from './pages/EventRegistration'
import EventFeedback from './pages/EventFeedback'
import EventDashboard from './pages/EventDashboard'
import SpeakerDatabase from './pages/SpeakerDatabase'
import BannerStudio from './pages/BannerStudio'
import DatabaseSetup from './pages/DatabaseSetup'

// Pages that are publicly accessible (shared form links — no login required)
const PUBLIC_ROUTES = (
  <>
    <Route path="/register" element={<EventRegistration />} />
    <Route path="/feedback"  element={<EventFeedback />} />
  </>
)

// All admin pages wrapped in ProtectedRoute
function PrivateRoute({ element }) {
  return <ProtectedRoute>{element}</ProtectedRoute>
}

export default function App() {
  useEffect(() => { migrateFromLocalStorage() }, [])
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          {PUBLIC_ROUTES}

          {/* Protected admin pages */}
          <Route path="/"              element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/quote-studio"  element={<PrivateRoute element={<QuoteCardStudio />} />} />
          <Route path="/flyer-studio"  element={<PrivateRoute element={<EventFlyerStudio />} />} />
          <Route path="/thumb-studio"  element={<PrivateRoute element={<VideoThumbnailStudio />} />} />
          <Route path="/banner-studio" element={<PrivateRoute element={<BannerStudio />} />} />
          <Route path="/form-builder"  element={<PrivateRoute element={<FormBuilder />} />} />
          <Route path="/event-dashboard" element={<PrivateRoute element={<EventDashboard />} />} />
          <Route path="/speakers"      element={<PrivateRoute element={<SpeakerDatabase />} />} />
          <Route path="/db-setup"      element={<PrivateRoute element={<DatabaseSetup />} />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
