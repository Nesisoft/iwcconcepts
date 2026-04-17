import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

/**
 * Shared top navigation for the public Lady Adel site.
 *
 * - Logo + wordmark on the left
 * - Section anchors (About, Services, Media) smooth-scroll when on /lady-adel,
 *   otherwise navigate to /lady-adel with the hash and let the page scroll.
 * - Page links (Catch Up, Programmes, Training, Contact) route to their own pages.
 * - Primary "Register" CTA links to /catch-up#register.
 */

const ANCHOR_LINKS = [
  { label: 'About',    hash: '#about'    },
  { label: 'Services', hash: '#services' },
  { label: 'Media',    hash: '#media'    },
]

const PAGE_LINKS = [
  { label: 'Catch Up',   to: '/catch-up'   },
  { label: 'Programmes', to: '/programmes' },
  { label: 'Training',   to: '/training'   },
  { label: 'Contact',    to: '/contact'    },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeHash, setActiveHash] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const onLadyAdel = location.pathname === '/lady-adel'

  // Shrink + shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Active-section highlight (scroll-spy) only on /lady-adel
  useEffect(() => {
    if (!onLadyAdel) { setActiveHash(''); return }
    const ids = ['about', 'services', 'catch-up', 'testimonials', 'media', 'programme', 'contact']
    const onScroll = () => {
      let current = ''
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top <= 120) current = '#' + id
      }
      setActiveHash(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onLadyAdel, location.pathname])

  // Close mobile menu on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  function handleAnchor(e, hash) {
    e.preventDefault()
    setOpen(false)
    if (onLadyAdel) {
      const id = hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/lady-adel' + hash)
    }
  }

  return (
    <>
      <header className={`site-nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
        <div className="site-nav__inner">
          {/* Logo */}
          <NavLink to="/lady-adel" className="site-nav__logo" aria-label="Lady Adel — IWC Concepts home">
            <span className="site-nav__mark" aria-hidden="true">IW</span>
            <span className="site-nav__wordmark">
              <span className="site-nav__brand">Lady Adel</span>
              <span className="site-nav__tag">Faith · Business · Impact</span>
            </span>
          </NavLink>

          {/* Desktop links */}
          <nav className="site-nav__links" aria-label="Primary">
            {ANCHOR_LINKS.map(l => (
              <a
                key={l.hash}
                href={'/lady-adel' + l.hash}
                onClick={e => handleAnchor(e, l.hash)}
                className={activeHash === l.hash ? 'is-active' : ''}
              >
                {l.label}
              </a>
            ))}
            {PAGE_LINKS.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => isActive ? 'is-active' : ''}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* CTA */}
          <NavLink to="/catch-up" className="site-nav__cta">
            Register
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </NavLink>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="site-nav__burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile drawer */}
        <div className={`site-nav__drawer ${open ? 'is-open' : ''}`}>
          {ANCHOR_LINKS.map(l => (
            <a
              key={l.hash}
              href={'/lady-adel' + l.hash}
              onClick={e => handleAnchor(e, l.hash)}
            >{l.label}</a>
          ))}
          {PAGE_LINKS.map(l => (
            <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
          ))}
          <NavLink to="/catch-up" className="site-nav__drawer-cta">Register for Catch Up</NavLink>
        </div>
      </header>

      {/* Spacer so page content is not hidden beneath the fixed nav */}
      <div className="site-nav__spacer" aria-hidden="true" />

      <style>{`
        .site-nav {
          position: fixed;
          inset: 0 0 auto 0;
          z-index: 80;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: saturate(160%) blur(14px);
          -webkit-backdrop-filter: saturate(160%) blur(14px);
          border-bottom: 1px solid rgba(13, 33, 55, 0.06);
          transition: background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .site-nav.is-scrolled {
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 8px 28px rgba(13, 33, 55, 0.07);
          border-bottom-color: rgba(13, 33, 55, 0.08);
        }
        .site-nav__inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .site-nav__spacer { height: 72px; }

        /* Logo */
        .site-nav__logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: var(--navy);
          text-decoration: none;
          margin-right: auto;
        }
        .site-nav__mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--grad-gold);
          color: var(--navy);
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 16px;
          letter-spacing: 0.5px;
          box-shadow: 0 6px 18px rgba(201, 168, 76, 0.35);
        }
        .site-nav__wordmark {
          display: flex;
          flex-direction: column;
          line-height: 1.05;
        }
        .site-nav__brand {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 18px;
          letter-spacing: 0.5px;
          color: var(--navy);
        }
        .site-nav__tag {
          margin-top: 2px;
          font-size: 9px;
          letter-spacing: 2.2px;
          text-transform: uppercase;
          color: var(--gold-dark);
          font-weight: 700;
        }

        /* Desktop links */
        .site-nav__links {
          display: none;
          align-items: center;
          gap: 6px;
        }
        .site-nav__links a {
          position: relative;
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          color: var(--navy);
          border-radius: 8px;
          transition: color 0.18s ease, background 0.18s ease;
        }
        .site-nav__links a:hover { color: var(--purple); background: rgba(91, 45, 142, 0.06); }
        .site-nav__links a.is-active {
          color: var(--purple);
        }
        .site-nav__links a.is-active::after {
          content: '';
          position: absolute;
          left: 14px; right: 14px; bottom: 2px;
          height: 2px;
          background: var(--gold);
          border-radius: 2px;
        }

        /* CTA button */
        .site-nav__cta {
          display: none;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          background: var(--orange);
          color: var(--white);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          box-shadow: 0 10px 26px rgba(224, 90, 30, 0.3);
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }
        .site-nav__cta:hover {
          background: var(--orange-dark);
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(224, 90, 30, 0.38);
        }

        /* Hamburger */
        .site-nav__burger {
          display: inline-flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
        }
        .site-nav__burger span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--navy);
          border-radius: 2px;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .site-nav.is-open .site-nav__burger span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .site-nav.is-open .site-nav__burger span:nth-child(2) { opacity: 0; }
        .site-nav.is-open .site-nav__burger span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* Mobile drawer */
        .site-nav__drawer {
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-height: 0;
          overflow: hidden;
          padding: 0 20px;
          background: var(--white);
          border-top: 1px solid transparent;
          transition: max-height 0.3s ease, padding 0.3s ease, border-color 0.3s ease;
        }
        .site-nav__drawer.is-open {
          max-height: 520px;
          padding: 14px 20px 22px;
          border-top-color: rgba(13, 33, 55, 0.06);
        }
        .site-nav__drawer a {
          padding: 14px 4px;
          font-size: 15px;
          font-weight: 600;
          color: var(--navy);
          border-bottom: 1px solid rgba(13, 33, 55, 0.06);
        }
        .site-nav__drawer a:last-child { border-bottom: none; }
        .site-nav__drawer a.active, .site-nav__drawer a[aria-current="page"] { color: var(--purple); }
        .site-nav__drawer-cta {
          margin-top: 12px;
          text-align: center;
          padding: 14px 18px !important;
          border-radius: 999px !important;
          background: var(--orange);
          color: var(--white) !important;
          font-weight: 800 !important;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-size: 13px !important;
          border-bottom: none !important;
        }

        @media (min-width: 960px) {
          .site-nav__inner { padding: 16px 40px; gap: 24px; }
          .site-nav__spacer { height: 80px; }
          .site-nav__links { display: flex; }
          .site-nav__cta { display: inline-flex; }
          .site-nav__burger { display: none; }
          .site-nav__drawer { display: none; }
        }
      `}</style>
    </>
  )
}
