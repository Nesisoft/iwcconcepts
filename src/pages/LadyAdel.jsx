import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HeroSection from '../components/sections/HeroSection'
import AboutSection from '../components/sections/AboutSection'
import ServicesSection from '../components/sections/ServicesSection'
import CatchUpSpotlight from '../components/sections/CatchUpSpotlight'
import TestimonialsSection from '../components/sections/TestimonialsSection'
import MediaSection from '../components/sections/MediaSection'
import ProgrammeSection from '../components/sections/ProgrammeSection'
import ContactSection from '../components/sections/ContactSection'

/**
 * /lady-adel — main profile page.
 *
 * Composes the full set of sections from the plan (Hero → About →
 * Services → Catch Up → Testimonials → Media → Programme → Contact →
 * Footer). All navbar anchors are live.
 */

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
      <TestimonialsSection />
      <MediaSection />
      <ProgrammeSection />
      <ContactSection />

      <Footer />
    </>
  )
}
