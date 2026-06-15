import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Info, Mail, Menu, X } from 'lucide-react'

const GOLD = '#C9A84C'

/**
 * Shared top navigation for the public (customer) site.
 *
 * Props:
 *   solid – when true the bar is always dark (use on pages without a hero).
 *           When false it starts transparent and turns solid on scroll
 *           (used on the landing page over the hero carousel).
 */
export default function SiteNav({ solid = false }) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (solid) return
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [solid])

  const opaque = solid || scrolled

  const links = [
    { label: 'Courses',  onClick: () => goToCourses() },
    { label: 'About',    onClick: () => navigate('/about') },
    { label: 'Contact',  onClick: () => navigate('/contact') },
  ]

  function goToCourses() {
    navigate('/courses')
    setMenuOpen(false)
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: opaque ? 'rgba(15,10,26,0.95)' : 'transparent',
      backdropFilter: opaque ? 'blur(12px)' : 'none',
      borderBottom: opaque ? '1px solid rgba(255,255,255,0.08)' : 'none',
      transition: 'all 0.3s',
      padding: '0 24px',
      display: 'flex', alignItems: 'center', height: 64,
    }}>
      {/* Brand */}
      <button
        onClick={() => navigate('/')}
        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: `linear-gradient(135deg, ${GOLD}, #e8c060)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 14, color: '#1A1A2E',
          fontFamily: "'Playfair Display', serif",
        }}>IW</div>
        <span style={{ color: 'white', fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>IWC CONCEPTS</span>
      </button>

      {/* Desktop links */}
      <div className="site-nav-links" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {links.map(l => (
          <button key={l.label} onClick={l.onClick} style={textLink}>{l.label}</button>
        ))}
        <button onClick={() => navigate('/portal/login')} style={primaryBtn}>
          <GraduationCap size={15} strokeWidth={2.4} /> My Account
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="site-nav-burger"
        onClick={() => setMenuOpen(o => !o)}
        style={{ display: 'none', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'white', width: 38, height: 38, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        aria-label="Menu"
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="site-nav-mobile" style={{
          position: 'absolute', top: 64, left: 0, right: 0,
          background: 'rgba(15,10,26,0.98)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 16px', display: 'none', flexDirection: 'column', gap: 4,
        }}>
          <button onClick={goToCourses} style={mobileLink}><GraduationCap size={16} /> Courses</button>
          <button onClick={() => { navigate('/about'); setMenuOpen(false) }} style={mobileLink}><Info size={16} /> About</button>
          <button onClick={() => { navigate('/contact'); setMenuOpen(false) }} style={mobileLink}><Mail size={16} /> Contact</button>
          <button onClick={() => { navigate('/portal/login'); setMenuOpen(false) }} style={{ ...mobileLink, color: GOLD }}><GraduationCap size={16} /> My Account</button>
        </div>
      )}

      <style>{`
        @media (max-width: 720px) {
          .site-nav-links { display: none !important; }
          .site-nav-burger { display: flex !important; }
          .site-nav-mobile { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}

const textLink = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: 14,
  padding: '8px 12px', borderRadius: 8,
}

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  background: 'rgba(255,255,255,0.1)', color: 'white',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  marginLeft: 4,
}

const mobileLink = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
  color: 'white', fontWeight: 600, fontSize: 15, padding: '12px 10px',
  borderRadius: 8, width: '100%',
}
