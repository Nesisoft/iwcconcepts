import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HeroSection from '../components/sections/HeroSection'
import AboutSection from '../components/sections/AboutSection'
import ServicesSection from '../components/sections/ServicesSection'
import CatchUpSpotlight from '../components/sections/CatchUpSpotlight'

/**
 * /lady-adel — main profile page.
 *
 * Composes the nine sections from the plan. Sections are being added
 * incrementally; unbuilt sections render as anchor placeholders so the
 * navbar's smooth-scroll + scroll-spy keep working from day one.
 */

const PLACEHOLDER_SECTIONS = [
  { id: 'testimonials',  label: 'Testimonials & Impact',           step: 'Step 7' },
  { id: 'media',         label: 'Media — Podcast & Content',       step: 'Step 8' },
  { id: 'programme',     label: 'The Entrepreneur Programme',      step: 'Step 9' },
  { id: 'contact',       label: 'Contact & Enquiry',               step: 'Step 10' },
]

export default function LadyAdel() {
  const location = useLocation()

  // Handle anchor navigation from other pages (e.g. /lady-adel#services)
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
      return
    }
    const id = location.hash.replace('#', '')
    // Wait a tick so sections are mounted before scrolling
    const t = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(t)
  }, [location.hash, location.pathname])

  return (
    <>
      <Navbar />

      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <CatchUpSpotlight />

      {/* Placeholder anchors for sections not yet built — keeps the
          navbar's smooth-scroll and scroll-spy functional. */}
      {PLACEHOLDER_SECTIONS.map(({ id, label, step }) => (
        <section key={id} id={id} className="la-placeholder">
          <div className="site-container">
            <span className="eyebrow">{step}</span>
            <h2>{label}</h2>
            <p>This section will be built next. Navigation anchors already work.</p>
          </div>
        </section>
      ))}

      <Footer />

      <style>{`
        .la-placeholder {
          padding: 72px 0;
          text-align: center;
          border-top: 1px solid rgba(13, 33, 55, 0.06);
        }
        .la-placeholder:nth-child(even) { background: var(--white); }
        .la-placeholder h2 {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(28px, 4vw, 40px);
          color: var(--navy);
          margin: 10px 0 8px;
        }
        .la-placeholder p {
          font-size: 14px;
          color: rgba(13, 33, 55, 0.55);
        }
        .la-placeholder .eyebrow { color: var(--gold-dark); }
      `}</style>
    </>
  )
}
