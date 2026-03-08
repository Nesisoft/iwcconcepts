import { HashRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import QuoteCardStudio from './pages/QuoteCardStudio'
import EventFlyerStudio from './pages/EventFlyerStudio'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quote-studio" element={<QuoteCardStudio />} />
        <Route path="/flyer-studio" element={<EventFlyerStudio />} />
      </Routes>
    </HashRouter>
  )
}
