import { HashRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import QuoteCardStudio from './pages/QuoteCardStudio'
import EventFlyerStudio from './pages/EventFlyerStudio'
import VideoThumbnailStudio from './pages/VideoThumbnailStudio'
import FormBuilder from './pages/FormBuilder'
import EventRegistration from './pages/EventRegistration'
import EventFeedback from './pages/EventFeedback'
import EventDashboard from './pages/EventDashboard'
import SpeakerDatabase from './pages/SpeakerDatabase'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quote-studio" element={<QuoteCardStudio />} />
        <Route path="/flyer-studio" element={<EventFlyerStudio />} />
        <Route path="/thumb-studio" element={<VideoThumbnailStudio />} />
        <Route path="/form-builder" element={<FormBuilder />} />
        <Route path="/register" element={<EventRegistration />} />
        <Route path="/feedback" element={<EventFeedback />} />
        <Route path="/event-dashboard" element={<EventDashboard />} />
        <Route path="/speakers" element={<SpeakerDatabase />} />
      </Routes>
    </HashRouter>
  )
}
