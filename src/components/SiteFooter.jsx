import { useNavigate } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'

const GOLD = '#C9A84C'

// Brand glyphs (lucide-react dropped brand logos, so we inline simple paths).
const FacebookIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
  </svg>
)
const InstagramIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)
const YoutubeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.77-1.77C19.34 5.13 12 5.13 12 5.13s-7.34 0-8.83.4A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.77 1.77c1.49.4 8.83.4 8.83.4s7.34 0 8.83-.4a2.5 2.5 0 0 0 1.77-1.77C23 15.2 23 12 23 12zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
  </svg>
)

// Edit these to your real handles / contact details.
const SOCIALS = [
  { icon: FacebookIcon,  href: 'https://facebook.com',  label: 'Facebook' },
  { icon: InstagramIcon, href: 'https://instagram.com', label: 'Instagram' },
  { icon: YoutubeIcon,   href: 'https://youtube.com',   label: 'YouTube' },
]

export default function SiteFooter() {
  const navigate = useNavigate()

  const quickLinks = [
    { label: 'Home',     onClick: () => navigate('/') },
    { label: 'About',    onClick: () => navigate('/about') },
    { label: 'Contact',  onClick: () => navigate('/contact') },
    { label: 'My Courses', onClick: () => navigate('/portal/login') },
  ]

  return (
    <footer style={{ background: '#0f0a1a', color: 'rgba(255,255,255,0.6)', padding: '48px 24px 32px' }}>
      <div style={{
        maxWidth: 1000, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <div style={{ maxWidth: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `linear-gradient(135deg, ${GOLD}, #e8c060)`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 14, color: '#1A1A2E',
              fontFamily: "'Playfair Display', serif",
            }}>IW</div>
            <div>
              <div style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>IWC Concepts</div>
              <div style={{ fontSize: 11, color: GOLD, letterSpacing: 2, textTransform: 'uppercase' }}>Faith · Business · Impact</div>
            </div>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            Empowering entrepreneurs and leaders to grow with purpose through faith-based
            courses and live events.
          </p>
        </div>

        {/* Quick links */}
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 13, marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase' }}>Explore</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickLinks.map(l => (
              <button key={l.label} onClick={l.onClick} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 13, marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase' }}>Get in touch</div>
          <a href="mailto:hello@iwcconcepts.com" style={contactRow}><Mail size={15} /> hello@iwcconcepts.com</a>
          <a href="tel:+233000000000" style={contactRow}><Phone size={15} /> +233 00 000 0000</a>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} style={socialBtn}>
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '36px auto 0', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12, textAlign: 'center' }}>
        © {new Date().getFullYear()} IWC Concepts. All rights reserved.
      </div>
    </footer>
  )
}

const contactRow = {
  display: 'flex', alignItems: 'center', gap: 8,
  color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none',
  marginBottom: 10,
}

const socialBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 34, height: 34, borderRadius: 8,
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.75)',
}
