import { HashRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import QuoteCardStudio from './pages/QuoteCardStudio'
import EventFlyerStudio from './pages/EventFlyerStudio'
import VideoThumbnailStudio from './pages/VideoThumbnailStudio'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quote-studio" element={<QuoteCardStudio />} />
        <Route path="/flyer-studio" element={<EventFlyerStudio />} />
        <Route path="/thumb-studio" element={<VideoThumbnailStudio />} />
      </Routes>
    </HashRouter>
  )
}
