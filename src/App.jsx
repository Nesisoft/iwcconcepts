
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CustomerAuthProvider } from './contexts/CustomerAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import CustomerRoute from './components/CustomerRoute'
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
import ContentManager from './pages/ContentManager'
import PortalLogin from './pages/PortalLogin'
import Portal from './pages/Portal'
import ProgramPortal from './pages/ProgramPortal'

// Pages that are publicly accessible (no login required)
const PUBLIC_ROUTES = (
  <>
    <Route path="/register"  element={<EventRegistration />} />
    <Route path="/feedback"  element={<EventFeedback />} />
    <Route path="/onboard"   element={<ProgramOnboarding />} />
  </>
)

// Admin page wrapper
function AdminRoute({ element }) {
  return <ProtectedRoute>{element}</ProtectedRoute>
}

// Customer portal page wrapper
function PortalRoute({ element }) {
  return <CustomerRoute>{element}</CustomerRoute>
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <CustomerAuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/"       element={<LandingPage />} />
            <Route path="/login"  element={<Login />} />
            {PUBLIC_ROUTES}

            {/* Customer portal */}
            <Route path="/portal/login"           element={<PortalLogin />} />
            <Route path="/portal"                 element={<PortalRoute element={<Portal />} />} />
            <Route path="/portal/program/:programId" element={<PortalRoute element={<ProgramPortal />} />} />

            {/* Protected admin pages */}
            <Route path="/admin"               element={<AdminRoute element={<Dashboard />} />} />
            <Route path="/quote-studio"        element={<AdminRoute element={<QuoteCardStudio />} />} />
            <Route path="/flyer-studio"        element={<AdminRoute element={<EventFlyerStudio />} />} />
            <Route path="/form-builder"        element={<AdminRoute element={<FormBuilder />} />} />
            <Route path="/event-dashboard"     element={<AdminRoute element={<EventDashboard />} />} />
            <Route path="/db-setup"            element={<AdminRoute element={<DatabaseSetup />} />} />
            <Route path="/programs-admin"      element={<AdminRoute element={<ProgramsManager />} />} />
            <Route path="/testimonials-admin"  element={<AdminRoute element={<TestimonialsManager />} />} />
            <Route path="/content-admin"       element={<AdminRoute element={<ContentManager />} />} />
          </Routes>
        </CustomerAuthProvider>
      </AuthProvider>
    </HashRouter>
  )
}
