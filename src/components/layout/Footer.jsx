import { NavLink } from 'react-router-dom'

/**
 * Section 09 — Footer
 *
 * Contains: IWC Concepts + Lady Adel branding, quick navigation links,
 * social icons, contact details, tagline, legal links and copyright.
 */

const SOCIALS = [
  { name: 'Facebook',  href: 'https://facebook.com/theladyadel',                        label: 'Follow Lady Adel on Facebook',  icon: IconFacebook },
  { name: 'Instagram', href: 'https://instagram.com/theladyadele',                      label: 'Follow Lady Adel on Instagram', icon: IconInstagram },
  { name: 'LinkedIn',  href: 'https://linkedin.com/in/adelaide-clottey-07a0983b2',      label: 'Connect on LinkedIn',           icon: IconLinkedIn },
  // TODO: add handle
  { name: 'YouTube',   href: '#',                                                       label: 'YouTube',                       icon: IconYouTube },
  // TODO: add handle
  { name: 'Spotify',   href: '#',                                                       label: 'Listen on Spotify',             icon: IconSpotify },
  // TODO: add handle
  { name: 'TikTok',    href: '#',                                                       label: 'TikTok',                        icon: IconTikTok },
  // TODO: add handle
  { name: 'X',         href: '#',                                                       label: 'X (Twitter)',                   icon: IconX },
]

// PLACEHOLDER: Replace with confirmed WhatsApp number
const WHATSAPP_NUMBER = '233000000000'
// PLACEHOLDER: Replace with Lady Adel's dedicated contact email
const CONTACT_EMAIL = 'hello@iwcconcepts.com'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer__top site-container">
        {/* Brand column */}
        <div className="site-footer__brand">
          <div className="site-footer__mark-row">
            <span className="site-footer__mark" aria-hidden="true">IW</span>
            <div>
              <div className="site-footer__name">Lady Adel</div>
              <div className="site-footer__sub">IWC Concepts</div>
            </div>
          </div>
          <p className="site-footer__blurb">
            Apostle Adelaide Clottey — banker, pastor, business coach. Raising Kingdom-minded leaders across Africa and beyond.
          </p>
          <div className="site-footer__tagline">Faith. Business. Impact.</div>
        </div>

        {/* Explore column */}
        <div className="site-footer__col">
          <h4>Explore</h4>
          <ul>
            <li><NavLink to="/lady-adel">Home</NavLink></li>
            <li><a href="/#/lady-adel#about">About</a></li>
            <li><a href="/#/lady-adel#services">Services</a></li>
            <li><a href="/#/lady-adel#media">Media</a></li>
            <li><a href="/#/lady-adel#testimonials">Testimonials</a></li>
          </ul>
        </div>

        {/* Offerings column */}
        <div className="site-footer__col">
          <h4>Offerings</h4>
          <ul>
            <li><NavLink to="/catch-up">Catch Up With Lady Adel</NavLink></li>
            <li><NavLink to="/programmes">Entrepreneur Programme</NavLink></li>
            <li><NavLink to="/training">Corporate Training</NavLink></li>
            <li><NavLink to="/contact">Speaking Enquiries</NavLink></li>
            <li><NavLink to="/contact">1:1 Coaching</NavLink></li>
          </ul>
        </div>

        {/* Contact column */}
        <div className="site-footer__col">
          <h4>Get in Touch</h4>
          <ul className="site-footer__contact">
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </li>
            <li>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Lady Adel, I found your website and I am interested in learning more.')}`} target="_blank" rel="noreferrer">
                WhatsApp Lady Adel
              </a>
            </li>
            <li><NavLink to="/contact">Send an enquiry →</NavLink></li>
          </ul>

          <div className="site-footer__socials" role="list">
            {SOCIALS.map(({ name, href, label, icon: Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                role="listitem"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="site-footer__bottom site-container">
        <div>&copy; {year} IWC Concepts. All rights reserved.</div>
        <div className="site-footer__legal">
          <a href="#privacy">Privacy Policy</a>
          <span aria-hidden="true">·</span>
          <a href="#terms">Terms &amp; Conditions</a>
        </div>
      </div>

      <style>{`
        .site-footer {
          background: var(--navy);
          color: rgba(255, 255, 255, 0.82);
          padding: 64px 0 28px;
          margin-top: 80px;
          position: relative;
          overflow: hidden;
        }
        .site-footer::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: linear-gradient(90deg, var(--gold), var(--orange), var(--purple));
        }
        .site-footer__top {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }
        @media (min-width: 720px)  { .site-footer__top { grid-template-columns: 1.4fr 1fr 1fr; } }
        @media (min-width: 1024px) { .site-footer__top { grid-template-columns: 1.4fr 1fr 1fr 1.2fr; gap: 48px; } }

        .site-footer__brand { max-width: 340px; }
        .site-footer__mark-row { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .site-footer__mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 11px;
          background: var(--grad-gold);
          color: var(--navy);
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 17px;
        }
        .site-footer__name {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 20px;
          color: var(--white);
          line-height: 1;
        }
        .site-footer__sub {
          margin-top: 4px;
          font-size: 10px;
          letter-spacing: 3px;
          color: var(--gold);
          text-transform: uppercase;
          font-weight: 700;
        }
        .site-footer__blurb {
          font-size: 13px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.62);
          margin-bottom: 18px;
        }
        .site-footer__tagline {
          display: inline-block;
          font-family: var(--font-display);
          font-weight: 700;
          font-style: italic;
          color: var(--gold);
          letter-spacing: 0.4px;
        }

        .site-footer__col h4 {
          font-size: 11px;
          letter-spacing: 3px;
          color: var(--gold);
          text-transform: uppercase;
          font-weight: 800;
          margin-bottom: 16px;
        }
        .site-footer__col ul { list-style: none; }
        .site-footer__col li { margin-bottom: 10px; }
        .site-footer__col a {
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          transition: color 0.18s ease;
        }
        .site-footer__col a:hover { color: var(--white); }

        .site-footer__contact li a { font-weight: 600; }

        .site-footer__socials {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 22px;
        }
        .site-footer__socials a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.82);
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
        }
        .site-footer__socials a:hover {
          background: var(--gold);
          color: var(--navy);
          border-color: var(--gold);
          transform: translateY(-2px);
        }
        .site-footer__socials svg { width: 17px; height: 17px; }

        .site-footer__bottom {
          margin-top: 48px;
          padding-top: 22px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;
          font-size: 11px;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.45);
        }
        .site-footer__legal { display: flex; gap: 10px; align-items: center; }
        .site-footer__legal a { color: rgba(255, 255, 255, 0.55); }
        .site-footer__legal a:hover { color: var(--gold); }

        @media (min-width: 720px) {
          .site-footer__bottom {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>
    </footer>
  )
}

/* ---- Inline SVG icons (no extra deps) ---- */

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.4h2.5l.4-2.9h-2.9V8.9c0-.84.24-1.41 1.46-1.41H16.5V4.9c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9v2.17H8v2.9h2.42V21h3.08z" />
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9.5h4V21H3V9.5zm7 0h3.8v1.6h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.55 4.76 5.86V21h-4v-5.22c0-1.25-.03-2.86-1.8-2.86-1.8 0-2.08 1.35-2.08 2.76V21h-4V9.5z" />
    </svg>
  )
}

function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2c-.2-1.4-.9-2.1-2.3-2.3C17.4 4.6 12 4.6 12 4.6s-5.4 0-7.3.3c-1.4.2-2.1.9-2.3 2.3C2.1 9.1 2.1 12 2.1 12s0 2.9.3 4.8c.2 1.4.9 2.1 2.3 2.3 1.9.3 7.3.3 7.3.3s5.4 0 7.3-.3c1.4-.2 2.1-.9 2.3-2.3.3-1.9.3-4.8.3-4.8s0-2.9-.3-4.8zM10 15.4V8.6L15.8 12 10 15.4z" />
    </svg>
  )
}

function IconSpotify() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.6 14.4c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4.1-.9 7.6-.5 10.5 1.2.3.2.4.6.1.9zm1.2-2.7c-.3.4-.7.5-1.1.3-2.9-1.8-7.3-2.3-10.7-1.3-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.9-1.2 8.8-.6 12.1 1.5.4.2.5.7.2 1zm.1-2.8c-3.4-2-9.1-2.2-12.4-1.2-.5.2-1.1-.1-1.2-.6-.2-.5.1-1.1.6-1.2 3.8-1.2 10.1-.9 14 1.4.5.3.6.9.3 1.3-.2.5-.8.6-1.3.3z" />
    </svg>
  )
}

function IconTikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.6 8.3a6.1 6.1 0 0 1-3.6-1.2v7.3a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v2.9a2.9 2.9 0 1 0 2 2.8V2h2.9a3.9 3.9 0 0 0 3.6 3.5v2.8z" />
    </svg>
  )
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.5L4.5 21H1.3l7.5-8.5L1 3h6.5l4.5 6 5.5-6z" />
    </svg>
  )
}
