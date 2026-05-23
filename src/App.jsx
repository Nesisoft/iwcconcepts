
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import QuoteCardStudio from './pages/QuoteCardStudio'
import EventFlyerStudio from './pages/EventFlyerStudio'
import FormBuilder from './pages/FormBuilder'
import EventRegistration from './pages/EventRegistration'
import EventFeedback from './pages/EventFeedback'
import EventDashboard from './pages/EventDashboard'
import DatabaseSetup from './pages/DatabaseSetup'
import LandingPage from './pages/LandingPage'
import ProgramsManager from './pages/ProgramsManager'
import TestimonialsManager from './pages/TestimonialsManager'
import ProgramOnboarding from './pages/ProgramOnboarding'

// Pages that are publicly accessible (no login required)
const PUBLIC_ROUTES = (
  <>
    <Route path="/register"  element={<EventRegistration />} />
    <Route path="/feedback"  element={<EventFeedback />} />
    <Route path="/onboard"   element={<ProgramOnboarding />} />
  </>
)

// All admin pages wrapped in ProtectedRoute
function PrivateRoute({ element }) {
  return <ProtectedRoute>{element}</ProtectedRoute>
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"       element={<LandingPage />} />
          <Route path="/login"  element={<Login />} />
          {PUBLIC_ROUTES}

          {/* Protected admin pages */}
          <Route path="/admin"               element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/quote-studio"        element={<PrivateRoute element={<QuoteCardStudio />} />} />
          <Route path="/flyer-studio"        element={<PrivateRoute element={<EventFlyerStudio />} />} />
          <Route path="/form-builder"        element={<PrivateRoute element={<FormBuilder />} />} />
          <Route path="/event-dashboard"     element={<PrivateRoute element={<EventDashboard />} />} />
          <Route path="/db-setup"            element={<PrivateRoute element={<DatabaseSetup />} />} />
          <Route path="/programs-admin"      element={<PrivateRoute element={<ProgramsManager />} />} />
          <Route path="/testimonials-admin"  element={<PrivateRoute element={<TestimonialsManager />} />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
