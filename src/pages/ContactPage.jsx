import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SectionHeader from '../components/ui/SectionHeader'
import CTAButton from '../components/ui/CTAButton'

/**
 * /contact — full Contact page.
 *
 * Sits alongside the existing /lady-adel#contact section. This page
 * goes deeper: instant-contact tiles, a wider form, a "right place?"
 * routing band, dedicated paths for press / speaking / partnerships,
 * social + office info and a final CTA.
 *
 * Composition (built across Steps 14.1–14.6):
 *   14.1 · Hero + 3 instant-contact tiles      ← this step
 *   14.2 · Main form band (#message)
 *   14.3 · "Right place?" routing band
 *   14.4 · Press / Speaking / Partnerships
 *   14.5 · Socials + Office / Hours
 *   14.6 · Final CTA
 *
 * PLACEHOLDERS to replace post-launch:
 *   - WHATSAPP_NUMBER, CONTACT_EMAIL — confirm real values
 *   - OFFICE.* — confirm real address / hours
 *   - Specialist emails (press@ / speaking@ / partnerships@)
 *   - Form submit handler (stubbed in Step 14.2)
 */

// PLACEHOLDER values — confirm with the team before launch.
const WHATSAPP_NUMBER = '233000000000'
const CONTACT_EMAIL   = 'hello@iwcconcepts.com'

// PLACEHOLDER specialist inboxes — replace with real addresses
// (or alias them all to CONTACT_EMAIL on the mail server side).
const PRESS_EMAIL         = 'press@iwcconcepts.com'
const SPEAKING_EMAIL      = 'speaking@iwcconcepts.com'
const PARTNERSHIPS_EMAIL  = 'partnerships@iwcconcepts.com'

const RESPONSE_WINDOW = 'Within 2 working days'
const OFFICE_HOURS    = 'Mon – Fri · 9am – 5pm GMT'

// Office details — PLACEHOLDER values, refine pre-launch
const OFFICE = {
  city:    'Accra, Ghana',
  line1:   'IWC Concepts HQ',
  line2:   'Address details available on request',     // PLACEHOLDER
  hours:   OFFICE_HOURS,
  window:  RESPONSE_WINDOW,
  // Optional Google Maps URL — leave empty until confirmed
  mapsUrl: '',
}

// Social channels — kept in sync with MediaSection.jsx so handles/links
// stay consistent across the site.
const SOCIALS = [
  { name: 'Facebook',  handle: '@theladyadel',  brand: '#1877F2', confirmed: true,  href: 'https://facebook.com/theladyadel',                  icon: SocialFacebook  },
  { name: 'Instagram', handle: '@theladyadele', brand: '#E1306C', confirmed: true,  href: 'https://instagram.com/theladyadele',                icon: SocialInstagram },
  { name: 'LinkedIn',  handle: 'Adelaide Clottey', brand: '#0A66C2', confirmed: true,  href: 'https://linkedin.com/in/adelaide-clottey-07a0983b2', icon: SocialLinkedIn  },
  { name: 'YouTube',   handle: 'Coming soon',   brand: '#FF0000', confirmed: false, href: '#', icon: SocialYouTube  },
  { name: 'Spotify',   handle: 'Coming soon',   brand: '#1DB954', confirmed: false, href: '#', icon: SocialSpotify  },
  { name: 'TikTok',    handle: 'Coming soon',   brand: '#000000', confirmed: false, href: '#', icon: SocialTikTok   },
  { name: 'X',         handle: 'Coming soon',   brand: '#000000', confirmed: false, href: '#', icon: SocialX        },
]

// Specialist contact paths
const SPECIALIST_PATHS = [
  {
    accent:  'gold',
    label:   'Media & Press',
    line:    'Interviews, quotes, podcast appearances, press kit and bio. Tell us your outlet, deadline and angle.',
    email:   () => PRESS_EMAIL,
    subject: 'Media enquiry',
    icon:    IconCamera,
  },
  {
    accent:  'purple',
    label:   'Speaking Engagements',
    line:    'Keynotes, panels, conferences, corporate offsites. Share the date, audience and theme — we will respond with availability and fit.',
    email:   () => SPEAKING_EMAIL,
    subject: 'Speaking enquiry',
    icon:    IconStage,
  },
  {
    accent:  'orange',
    label:   'Partnerships & Sponsorship',
    line:    'Strategic collaborations, programme sponsorship, ecosystem partners and joint initiatives. Outline the proposition in a paragraph.',
    email:   () => PARTNERSHIPS_EMAIL,
    subject: 'Partnership enquiry',
    icon:    IconHandshake,
  },
]

// Enquiry routing — keep order matching the routing-band cards in 14.3
const ENQUIRY_TYPES = [
  'Corporate / Staff Training',
  'Speaking engagement',
  'One-on-one Coaching',
  'Entrepreneur Programme',
  'Catch Up registration',
  'Media / Press',
  'Partnership / Sponsorship',
  'General enquiry',
]
const PREFERRED_CONTACT = ['Email', 'WhatsApp', 'Either']

const INITIAL_MESSAGE = {
  name: '', email: '', whatsapp: '',
  organisation: '', country: '',
  enquiry: '', preferred: '',
  subject: '', message: '',
}

// "Right place?" routing — keep order matching the enquiry select order
const ROUTES = [
  {
    accent:   'orange',
    label:    'Apply to the programme',
    line:     'Founders ready to scope a cohort application — long-form or waitlist — start here. Your form lands directly with the programme team.',
    icon:     IconRoute,
    to:       '/programmes',
    hash:     'apply',
    cta:      'Open the application',
  },
  {
    accent:   'purple',
    label:    'Request a training proposal',
    line:     'HR, L&D, board sponsors. The proposal form lets you flag focus areas, audience size and dates — we come back with a written proposal.',
    icon:     IconBrief,
    to:       '/training',
    hash:     'proposal',
    cta:      'Open the proposal form',
  },
  {
    accent:   'gold',
    label:    'Register for Catch Up',
    line:     'The free monthly Zoom platform. Register once and you receive the link, calendar invite and reminders for every future episode.',
    icon:     IconBroadcast,
    to:       '/catch-up',
    hash:     'register',
    cta:      'Save your seat',
  },
  {
    accent:   'navy',
    label:    'Book a speaking engagement',
    line:     'Keynotes, panels, conferences and corporate events. Use the message form below and pick "Speaking engagement" for the fastest path.',
    icon:     IconMic,
    to:       null,            // stays on /contact
    hash:     'message',
    cta:      'Use the message form',
  },
]

// ---- Page -------------------------------------------------------------------

export default function ContactPage() {
  const location = useLocation()
  useEffect(() => {
    if (location.hash) return
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [location.hash, location.pathname])

  return (
    <>
      <Navbar />
      <main>
        <ContactHero />
        <RoutesBand />
        <MessageBand />
        <SpecialistBand />
        <SocialsOfficeBand />
        {/* Final CTA added in Step 14.6 */}
      </main>
      <Footer />
    </>
  )
}

// ---- Hero -------------------------------------------------------------------

function ContactHero() {
  return (
    <section className="cp-hero">
      <div className="cp-hero__bg" aria-hidden="true">
        <span className="cp-hero__orb cp-hero__orb--purple" />
        <span className="cp-hero__orb cp-hero__orb--gold" />
        <span className="cp-hero__grid" />
      </div>

      <div className="site-container cp-hero__inner">
        <span className="cp-hero__eyebrow">Get In Touch</span>

        <h1 className="cp-hero__title">
          Let&rsquo;s <em>talk</em> about what you&rsquo;re building
        </h1>

        <p className="cp-hero__lede">
          Whether you&rsquo;re scoping a training engagement, applying to the
          programme, planning a speaking slot or just saying hello — start
          here. Pick the channel that suits you and we&rsquo;ll come back
          quickly.
        </p>

        <ul className="cp-hero__tiles">
          <li className="cp-tile">
            <a className="cp-tile__link" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
              <span className="cp-tile__icon cp-tile__icon--green" aria-hidden="true"><IconWhatsApp /></span>
              <div>
                <span className="cp-tile__label">WhatsApp</span>
                <span className="cp-tile__value">Fastest route</span>
                <span className="cp-tile__sub">Tap to open a chat</span>
              </div>
            </a>
          </li>
          <li className="cp-tile">
            <a className="cp-tile__link" href={`mailto:${CONTACT_EMAIL}`}>
              <span className="cp-tile__icon cp-tile__icon--purple" aria-hidden="true"><IconMail /></span>
              <div>
                <span className="cp-tile__label">Email</span>
                <span className="cp-tile__value cp-tile__value--mono">{CONTACT_EMAIL}</span>
                <span className="cp-tile__sub">For longer briefs &amp; documents</span>
              </div>
            </a>
          </li>
          <li className="cp-tile cp-tile--info">
            <div className="cp-tile__link cp-tile__link--static">
              <span className="cp-tile__icon cp-tile__icon--gold" aria-hidden="true"><IconClock /></span>
              <div>
                <span className="cp-tile__label">Response window</span>
                <span className="cp-tile__value">{RESPONSE_WINDOW}</span>
                <span className="cp-tile__sub">{OFFICE_HOURS}</span>
              </div>
            </div>
          </li>
        </ul>

        <div className="cp-hero__ctas">
          <CTAButton href="#message" variant="primary" size="lg">
            Send a message
          </CTAButton>
          <CTAButton
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            variant="outline-light"
            size="lg"
            arrow={false}
            external
          >
            Message on WhatsApp
          </CTAButton>
        </div>
      </div>

      <style>{`
        .cp-hero {
          position: relative;
          padding: 120px 0 80px;
          background:
            radial-gradient(ellipse at 12% 0%, rgba(91, 45, 142, 0.5) 0%, transparent 55%),
            radial-gradient(ellipse at 88% 100%, rgba(201, 168, 76, 0.2) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
          isolation: isolate;
        }
        .cp-hero__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .cp-hero__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.55; }
        .cp-hero__orb--purple { width: 520px; height: 520px; top: -180px; left: -160px; background: radial-gradient(circle, rgba(122, 71, 184, 0.5), transparent 70%); }
        .cp-hero__orb--gold   { width: 460px; height: 460px; bottom: -180px; right: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.38), transparent 70%); }
        .cp-hero__grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse at center, black 25%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 25%, transparent 75%);
          opacity: 0.5;
        }

        .cp-hero__inner { position: relative; z-index: 1; text-align: center; max-width: 940px; }

        .cp-hero__eyebrow {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.6px;
          text-transform: uppercase;
          color: var(--gold);
          padding: 7px 16px;
          background: rgba(201, 168, 76, 0.12);
          border: 1px solid rgba(201, 168, 76, 0.32);
          border-radius: 999px;
          margin-bottom: 22px;
        }

        .cp-hero__title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(38px, 6.4vw, 70px);
          line-height: 1.05;
          letter-spacing: -1.4px;
          margin-bottom: 18px;
        }
        .cp-hero__title em { font-style: italic; color: var(--gold); }

        .cp-hero__lede {
          max-width: 700px;
          margin: 0 auto 42px;
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.82);
        }

        /* Tiles */
        .cp-hero__tiles {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 14px;
          margin: 0 auto 38px;
          max-width: 880px;
          text-align: left;
        }
        @media (min-width: 720px)  { .cp-hero__tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        .cp-tile { min-width: 0; }
        .cp-tile__link {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px 20px;
          height: 100%;
          background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          color: var(--white);
          text-decoration: none;
          transition: border-color 0.22s ease, transform 0.22s ease, background 0.22s ease;
        }
        .cp-tile__link:hover { border-color: rgba(201, 168, 76, 0.45); transform: translateY(-3px); }
        .cp-tile__link--static { cursor: default; }
        .cp-tile__link--static:hover { transform: none; border-color: rgba(255, 255, 255, 0.12); }

        .cp-tile__icon {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: var(--white);
        }
        .cp-tile__icon svg { width: 20px; height: 20px; }
        .cp-tile__icon--green  { background: linear-gradient(135deg, #25D366, #1da851); }
        .cp-tile__icon--purple { background: linear-gradient(135deg, var(--purple), #7a47b8); }
        .cp-tile__icon--gold   { background: linear-gradient(135deg, var(--gold), var(--gold-dark)); color: var(--navy); }

        .cp-tile__label {
          display: block;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
          margin-bottom: 4px;
        }
        .cp-tile__value {
          display: block;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 17px;
          color: var(--white);
          letter-spacing: -0.2px;
          margin-bottom: 4px;
          word-break: break-word;
        }
        .cp-tile__value--mono {
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 600;
        }
        .cp-tile__sub {
          display: block;
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.62);
          line-height: 1.45;
        }

        /* CTAs */
        .cp-hero__ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 460px;
          margin: 0 auto;
        }
        .cp-hero__ctas .cta { white-space: normal; text-align: center; line-height: 1.25; }
        @media (min-width: 520px) {
          .cp-hero__ctas {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            max-width: none;
          }
          .cp-hero__ctas .cta { white-space: nowrap; }
        }
      `}</style>
    </section>
  )
}

// ---- Hero icons -------------------------------------------------------------

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.2.3-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2.1-.2-.5-.4-.5-.6-.5-.1 0-.3 0-.5 0-.2 0-.5.1-.7.3-.3.3-1 .9-1 2.3 0 1.3 1 2.7 1.2 2.9.1.2 2 3.1 4.9 4.4.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.4c1.4.8 2.9 1.2 4.6 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  )
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  )
}

// ---- "Right place?" routing band --------------------------------------------

function RoutesBand() {
  return (
    <section className="cp-rt site-section">
      <div className="site-container">
        <SectionHeader
          eyebrow="Make sure you're in the right place"
          title={<>Save yourself a step &mdash; <em>route directly</em></>}
          subtitle="Most enquiries land in one of four places. If yours fits a route below, jumping straight there is faster than going through the general inbox. The form below is for everything else."
        />

        <ul className="cp-rt__grid">
          {ROUTES.map(r => {
            const Icon = r.icon
            const href = r.to
              ? `${r.to}${r.hash ? '#' + r.hash : ''}`
              : `#${r.hash || ''}`
            // Use Link for cross-page navigation (supports the hash anchor),
            // a plain <a> for in-page #message anchor.
            const Wrap = r.to ? Link : 'a'
            const wrapProps = r.to ? { to: href } : { href }
            return (
              <li key={r.label} className={`cp-rt__card cp-rt__card--${r.accent}`}>
                <Wrap className="cp-rt__link" {...wrapProps}>
                  <span className="cp-rt__icon" aria-hidden="true"><Icon /></span>
                  <h3>{r.label}</h3>
                  <p>{r.line}</p>
                  <span className="cp-rt__cta">
                    {r.cta}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </Wrap>
              </li>
            )
          })}
        </ul>
      </div>

      <style>{`
        .cp-rt { background: var(--white); color: var(--ink); }

        .cp-rt__grid {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 16px;
        }
        @media (min-width: 720px)  { .cp-rt__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1080px) { .cp-rt__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; } }

        .cp-rt__card { min-width: 0; }
        .cp-rt__link {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
          padding: 26px 24px 22px;
          background: var(--cream);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          color: var(--navy);
          text-decoration: none;
          overflow: hidden;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .cp-rt__link::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent-a), var(--accent-b));
        }
        .cp-rt__link:hover {
          transform: translateY(-4px);
          border-color: rgba(13, 33, 55, 0.18);
          box-shadow: 0 22px 48px rgba(13, 33, 55, 0.1);
        }

        .cp-rt__card--orange { --accent-a: var(--orange); --accent-b: var(--orange-dark); }
        .cp-rt__card--purple { --accent-a: var(--purple); --accent-b: #7a47b8; }
        .cp-rt__card--gold   { --accent-a: var(--gold);   --accent-b: var(--gold-dark); }
        .cp-rt__card--navy   { --accent-a: var(--navy);   --accent-b: #1a3a5f; }

        .cp-rt__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent-a), var(--accent-b));
          color: var(--white);
          box-shadow: 0 10px 22px rgba(13, 33, 55, 0.14);
        }
        .cp-rt__card--gold .cp-rt__icon { color: var(--navy); }
        .cp-rt__icon svg { width: 22px; height: 22px; }

        .cp-rt__link h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 17px;
          line-height: 1.25;
          letter-spacing: -0.2px;
          color: var(--navy);
        }
        .cp-rt__link p {
          flex-grow: 1;
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(13, 33, 55, 0.74);
        }

        .cp-rt__cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: var(--purple);
          transition: gap 0.18s ease;
        }
        .cp-rt__link:hover .cp-rt__cta { gap: 10px; }
      `}</style>
    </section>
  )
}

// ---- Route icons ------------------------------------------------------------

function IconRoute() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 19V9a3 3 0 0 1 3-3h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h9" />
      <polyline points="15 13 18 16 21 13" />
    </svg>
  )
}
function IconBrief() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <line x1="3" y1="13" x2="21" y2="13" />
    </svg>
  )
}
function IconBroadcast() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="2.2" />
      <path d="M16 8a5 5 0 0 1 0 8" />
      <path d="M8 8a5 5 0 0 0 0 8" />
      <path d="M19 5a9 9 0 0 1 0 14" />
      <path d="M5 5a9 9 0 0 0 0 14" />
    </svg>
  )
}
function IconMic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}

// ---- Specialist contact paths -----------------------------------------------

function SpecialistBand() {
  return (
    <section className="cp-spec">
      <div className="cp-spec__bg" aria-hidden="true">
        <span className="cp-spec__orb cp-spec__orb--gold" />
        <span className="cp-spec__orb cp-spec__orb--purple" />
      </div>
      <div className="site-container cp-spec__inner">
        <SectionHeader
          tone="light"
          eyebrow="Press · Speaking · Partnerships"
          title={<>Direct lines for <em>specialist enquiries</em></>}
          subtitle="If you are reaching out about media, a speaking slot or a strategic collaboration, jump to the inbox that handles it. The general team is copied automatically."
        />

        <ul className="cp-spec__grid">
          {SPECIALIST_PATHS.map(s => {
            const Icon = s.icon
            const email = s.email()
            return (
              <li key={s.label} className={`cp-spec__card cp-spec__card--${s.accent}`}>
                <span className="cp-spec__icon" aria-hidden="true"><Icon /></span>
                <h3>{s.label}</h3>
                <p>{s.line}</p>
                <a
                  className="cp-spec__email"
                  href={`mailto:${email}?subject=${encodeURIComponent(s.subject)}`}
                >
                  <span className="cp-spec__email-addr">{email}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              </li>
            )
          })}
        </ul>

        <p className="cp-spec__note">
          Specialist inboxes are placeholders for now &mdash; if your message
          bounces, send it to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
          and we&rsquo;ll route it internally.
        </p>
      </div>

      <style>{`
        .cp-spec {
          position: relative;
          padding: 100px 0 110px;
          background:
            radial-gradient(ellipse at 88% 0%, rgba(201, 168, 76, 0.22) 0%, transparent 55%),
            radial-gradient(ellipse at 12% 100%, rgba(91, 45, 142, 0.36) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
          isolation: isolate;
        }
        .cp-spec__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .cp-spec__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.42; }
        .cp-spec__orb--gold   { width: 460px; height: 460px; top: -160px; right: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.4), transparent 70%); }
        .cp-spec__orb--purple { width: 480px; height: 480px; bottom: -160px; left: -140px; background: radial-gradient(circle, rgba(122, 71, 184, 0.5), transparent 70%); }
        .cp-spec__inner { position: relative; z-index: 1; }

        .cp-spec__grid {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 18px;
          max-width: 1080px;
          margin: 0 auto 32px;
        }
        @media (min-width: 720px)  { .cp-spec__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        .cp-spec__card {
          position: relative;
          padding: 26px 24px 22px;
          background: linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
          transition: transform 0.22s ease, border-color 0.22s ease;
        }
        .cp-spec__card::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent-a), var(--accent-b));
        }
        .cp-spec__card:hover {
          transform: translateY(-4px);
          border-color: rgba(201, 168, 76, 0.45);
        }

        .cp-spec__card--gold   { --accent-a: var(--gold);   --accent-b: var(--gold-dark); }
        .cp-spec__card--purple { --accent-a: var(--purple); --accent-b: #7a47b8; }
        .cp-spec__card--orange { --accent-a: var(--orange); --accent-b: var(--orange-dark); }

        .cp-spec__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent-a), var(--accent-b));
          color: var(--white);
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.25);
        }
        .cp-spec__card--gold .cp-spec__icon { color: var(--navy); }
        .cp-spec__icon svg { width: 22px; height: 22px; }

        .cp-spec__card h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 18px;
          line-height: 1.25;
          letter-spacing: -0.2px;
          color: var(--white);
        }
        .cp-spec__card p {
          flex-grow: 1;
          font-size: 13.5px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.74);
        }

        .cp-spec__email {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          padding: 9px 14px;
          font-size: 12.5px;
          font-weight: 700;
          color: var(--gold);
          background: rgba(201, 168, 76, 0.1);
          border: 1px solid rgba(201, 168, 76, 0.32);
          border-radius: 999px;
          text-decoration: none;
          transition: background 0.18s ease, gap 0.18s ease, color 0.18s ease;
          align-self: flex-start;
          max-width: 100%;
        }
        .cp-spec__email:hover {
          background: rgba(201, 168, 76, 0.18);
          gap: 12px;
        }
        .cp-spec__email-addr {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .cp-spec__note {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
          font-size: 12.5px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.55);
        }
        .cp-spec__note a {
          color: var(--gold);
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      `}</style>
    </section>
  )
}

// ---- Specialist icons -------------------------------------------------------

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}
function IconStage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="6" width="18" height="11" rx="1.5" />
      <line x1="3" y1="17" x2="6" y2="21" />
      <line x1="21" y1="17" x2="18" y2="21" />
      <line x1="9" y1="6" x2="9" y2="2" />
      <line x1="15" y1="6" x2="15" y2="2" />
      <line x1="7" y1="2" x2="11" y2="2" />
      <line x1="13" y1="2" x2="17" y2="2" />
    </svg>
  )
}
function IconHandshake() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l4-4 3 2 4-3 4 3 3-1v8l-3 2-4-2-3 2-4-2-4 2z" />
      <path d="M10 13l2 2 2-2" />
    </svg>
  )
}

// ---- Socials + Office band --------------------------------------------------

function SocialsOfficeBand() {
  return (
    <section className="cp-soc site-section">
      <div className="site-container">
        <SectionHeader
          eyebrow="Follow · Visit · Connect"
          title={<>Where we&rsquo;re <em>online &amp; offline</em></>}
          subtitle="Active accounts where Lady Adel actually shows up — plus the working hours and response window so you know when to expect a reply."
        />

        <div className="cp-soc__grid">
          {/* Left: socials */}
          <div className="cp-soc__panel cp-soc__panel--socials">
            <div className="cp-soc__panel-head">
              <span className="cp-soc__eyebrow">Social Channels</span>
              <h3>Pick your preferred feed.</h3>
            </div>
            <ul className="cp-soc__list">
              {SOCIALS.map(s => {
                const Icon = s.icon
                const live = s.confirmed
                return (
                  <li key={s.name}>
                    <a
                      className={`cp-soc__row ${live ? '' : 'is-soon'}`}
                      href={live ? s.href : undefined}
                      target={live ? '_blank' : undefined}
                      rel={live ? 'noreferrer' : undefined}
                      aria-disabled={live ? undefined : 'true'}
                      onClick={live ? undefined : (e) => e.preventDefault()}
                    >
                      <span
                        className="cp-soc__chip"
                        style={{ background: s.brand }}
                        aria-hidden="true"
                      >
                        <Icon />
                      </span>
                      <div className="cp-soc__text">
                        <span className="cp-soc__name">{s.name}</span>
                        <span className="cp-soc__handle">{s.handle}</span>
                      </div>
                      {live ? (
                        <span className="cp-soc__cta">
                          Follow
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </span>
                      ) : (
                        <span className="cp-soc__soon">Soon</span>
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Right: office */}
          <div className="cp-soc__panel cp-soc__panel--office">
            <div className="cp-soc__panel-head">
              <span className="cp-soc__eyebrow">Office &amp; Hours</span>
              <h3>{OFFICE.city}</h3>
            </div>

            <ul className="cp-office__list">
              <li>
                <span className="cp-office__icon" aria-hidden="true"><IconPin /></span>
                <div>
                  <span className="cp-office__label">Location</span>
                  <span className="cp-office__value">{OFFICE.line1}</span>
                  <span className="cp-office__sub">{OFFICE.line2}</span>
                </div>
              </li>
              <li>
                <span className="cp-office__icon" aria-hidden="true"><IconClock /></span>
                <div>
                  <span className="cp-office__label">Working hours</span>
                  <span className="cp-office__value">{OFFICE.hours}</span>
                </div>
              </li>
              <li>
                <span className="cp-office__icon" aria-hidden="true"><IconMail /></span>
                <div>
                  <span className="cp-office__label">Response window</span>
                  <span className="cp-office__value">{OFFICE.window}</span>
                  <span className="cp-office__sub">For urgent matters, WhatsApp is fastest.</span>
                </div>
              </li>
            </ul>

            {OFFICE.mapsUrl ? (
              <a className="cp-office__maps" href={OFFICE.mapsUrl} target="_blank" rel="noreferrer">
                Open in Google Maps
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            ) : (
              <p className="cp-office__maps-soon">
                Map link coming soon &mdash; visits by appointment for now.
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .cp-soc { background: var(--white); color: var(--ink); }

        .cp-soc__grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 18px;
          align-items: stretch;
        }
        @media (min-width: 880px) {
          .cp-soc__grid {
            grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
            gap: 22px;
          }
        }

        .cp-soc__panel {
          padding: 26px 22px;
          background: var(--cream);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          min-width: 0;
        }
        @media (min-width: 768px) { .cp-soc__panel { padding: 32px 32px; } }

        .cp-soc__panel-head { margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid rgba(13, 33, 55, 0.08); }
        .cp-soc__eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          color: var(--purple);
          margin-bottom: 6px;
        }
        .cp-soc__panel-head h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 22px;
          line-height: 1.2;
          letter-spacing: -0.3px;
          color: var(--navy);
        }

        /* Socials list */
        .cp-soc__list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cp-soc__row {
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: 14px;
          color: var(--navy);
          text-decoration: none;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .cp-soc__row:hover:not(.is-soon) {
          transform: translateY(-2px);
          border-color: rgba(91, 45, 142, 0.32);
          box-shadow: 0 14px 28px rgba(13, 33, 55, 0.06);
        }
        .cp-soc__row.is-soon { cursor: default; opacity: 0.62; }

        .cp-soc__chip {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
        }
        .cp-soc__chip svg { width: 18px; height: 18px; }

        .cp-soc__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .cp-soc__name {
          font-size: 14px;
          font-weight: 800;
          color: var(--navy);
          line-height: 1.2;
        }
        .cp-soc__handle {
          font-size: 12px;
          color: rgba(13, 33, 55, 0.62);
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cp-soc__cta {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: var(--purple);
          background: rgba(91, 45, 142, 0.08);
          border-radius: 999px;
          transition: gap 0.18s ease, background 0.18s ease;
        }
        .cp-soc__row:hover:not(.is-soon) .cp-soc__cta {
          gap: 8px;
          background: rgba(91, 45, 142, 0.14);
        }
        .cp-soc__soon {
          padding: 5px 11px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: var(--gold-dark);
          background: rgba(201, 168, 76, 0.14);
          border-radius: 999px;
        }

        /* Office list */
        .cp-office__list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .cp-office__list li {
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr);
          gap: 14px;
          padding: 14px 14px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: 14px;
          align-items: start;
        }
        .cp-office__icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(91, 45, 142, 0.1);
          color: var(--purple);
        }
        .cp-office__icon svg { width: 18px; height: 18px; }
        .cp-office__list > li > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .cp-office__label {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: rgba(13, 33, 55, 0.55);
        }
        .cp-office__value {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--navy);
          line-height: 1.4;
        }
        .cp-office__sub {
          font-size: 12.5px;
          color: rgba(13, 33, 55, 0.6);
          line-height: 1.5;
        }

        .cp-office__maps {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--white);
          background: var(--purple);
          border-radius: 999px;
          text-decoration: none;
          transition: gap 0.18s ease, background 0.18s ease;
        }
        .cp-office__maps:hover { gap: 12px; background: var(--purple-dark); }
        .cp-office__maps-soon {
          margin-top: 18px;
          font-size: 12px;
          color: rgba(13, 33, 55, 0.55);
          font-style: italic;
        }
      `}</style>
    </section>
  )
}

// ---- Office icon ------------------------------------------------------------

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

// ---- Social icons (duplicated locally — keep in sync with MediaSection) -----

function SocialFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.4h2.5l.4-2.9h-2.9V8.9c0-.84.24-1.41 1.46-1.41H16.5V4.9c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9v2.17H8v2.9h2.42V21h3.08z" />
    </svg>
  )
}
function SocialInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}
function SocialLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9.5h4V21H3V9.5zm7 0h3.8v1.6h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.55 4.76 5.86V21h-4v-5.22c0-1.25-.03-2.86-1.8-2.86-1.8 0-2.08 1.35-2.08 2.76V21h-4V9.5z" />
    </svg>
  )
}
function SocialYouTube() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2c-.2-1.4-.9-2.1-2.3-2.3C17.4 4.6 12 4.6 12 4.6s-5.4 0-7.3.3c-1.4.2-2.1.9-2.3 2.3C2.1 9.1 2.1 12 2.1 12s0 2.9.3 4.8c.2 1.4.9 2.1 2.3 2.3 1.9.3 7.3.3 7.3.3s5.4 0 7.3-.3c1.4-.2 2.1-.9 2.3-2.3.3-1.9.3-4.8.3-4.8s0-2.9-.3-4.8zM10 15.4V8.6L15.8 12 10 15.4z" />
    </svg>
  )
}
function SocialSpotify() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.6 14.4c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4.1-.9 7.6-.5 10.5 1.2.3.2.4.6.1.9zm1.2-2.7c-.3.4-.7.5-1.1.3-2.9-1.8-7.3-2.3-10.7-1.3-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.9-1.2 8.8-.6 12.1 1.5.4.2.5.7.2 1zm.1-2.8c-3.4-2-9.1-2.2-12.4-1.2-.5.2-1.1-.1-1.2-.6-.2-.5.1-1.1.6-1.2 3.8-1.2 10.1-.9 14 1.4.5.3.6.9.3 1.3-.2.5-.8.6-1.3.3z" />
    </svg>
  )
}
function SocialTikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.6 8.3a6.1 6.1 0 0 1-3.6-1.2v7.3a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v2.9a2.9 2.9 0 1 0 2 2.8V2h2.9a3.9 3.9 0 0 0 3.6 3.5v2.8z" />
    </svg>
  )
}
function SocialX() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.5L4.5 21H1.3l7.5-8.5L1 3h6.5l4.5 6 5.5-6z" />
    </svg>
  )
}

// ---- Main contact form ------------------------------------------------------

function MessageBand() {
  const [values, setValues] = useState(INITIAL_MESSAGE)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')   // 'idle' | 'submitting' | 'success' | 'error'

  function handleChange(e) {
    const { name, value } = e.target
    setValues(v => ({ ...v, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }))
  }

  function validate() {
    const er = {}
    if (!values.name.trim())    er.name    = 'Please enter your name.'
    if (!values.email.trim())   er.email   = 'We need an email to reply on.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) er.email = 'That email does not look right.'
    if (!values.subject.trim()) er.subject = 'A short subject helps us route this.'
    if (!values.message.trim()) er.message = 'Please tell us what we can help with.'
    return er
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const er = validate()
    if (Object.keys(er).length > 0) { setErrors(er); return }
    setStatus('submitting')
    try {
      // TODO: wire to real backend (Formspree/Resend/internal endpoint).
      // eslint-disable-next-line no-console
      console.info('[ContactPage] message submitted', values)
      await new Promise(r => setTimeout(r, 600))
      setStatus('success')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ContactPage] submission failed', err)
      setStatus('error')
    }
  }

  function reset() {
    setStatus('idle')
    setErrors({})
    setValues(INITIAL_MESSAGE)
  }

  return (
    <section className="cp-msg" id="message">
      <div className="site-container">
        <SectionHeader
          eyebrow="Send a Message"
          title={<>Tell us what you&rsquo;re <em>thinking about</em></>}
          subtitle="A few short fields and one paragraph is plenty. Pick the enquiry type so we route it to the right person on the team — and we'll come back within 2 working days."
        />

        <div className="cp-msg__wrap">
          {status === 'success' ? (
            <MessageSuccess values={values} onReset={reset} />
          ) : (
            <form className="cp-msg__form" noValidate onSubmit={handleSubmit}>
              <FormGroup title="About you">
                <Field
                  label="Full name" name="name" required
                  value={values.name} error={errors.name}
                  onChange={handleChange} autoComplete="name"
                />
                <Field
                  label="Email address" name="email" type="email" required
                  value={values.email} error={errors.email}
                  onChange={handleChange} autoComplete="email"
                />
                <Field
                  label="WhatsApp number" name="whatsapp" type="tel"
                  hint="Optional — speeds things up if we end up chatting"
                  value={values.whatsapp} error={errors.whatsapp}
                  onChange={handleChange} autoComplete="tel"
                />
                <Field
                  label="Organisation" name="organisation"
                  hint="Optional — leave blank for personal enquiries"
                  value={values.organisation} error={errors.organisation}
                  onChange={handleChange} autoComplete="organization"
                />
                <Field
                  label="Country / City" name="country"
                  value={values.country} error={errors.country}
                  onChange={handleChange} autoComplete="country-name"
                />
              </FormGroup>

              <FormGroup title="Your enquiry">
                <SelectField
                  label="Enquiry type" name="enquiry"
                  placeholder="Pick the one that fits"
                  options={ENQUIRY_TYPES}
                  value={values.enquiry} error={errors.enquiry}
                  onChange={handleChange}
                />
                <RadioGroup
                  label="Preferred contact method" name="preferred"
                  options={PREFERRED_CONTACT}
                  value={values.preferred} error={errors.preferred}
                  onChange={handleChange}
                />
                <Field
                  label="Subject" name="subject" required
                  hint="A short headline — e.g. “Board training for 12 directors”"
                  value={values.subject} error={errors.subject}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup title="Message">
                <TextAreaField
                  label="What can we help with?" name="message" required
                  rows={5}
                  hint="A short paragraph is plenty — we&rsquo;ll come back with the right questions."
                  value={values.message} error={errors.message}
                  onChange={handleChange}
                />
              </FormGroup>

              <button
                type="submit"
                className="cp-msg__submit"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending your message…' : 'Send message'}
                {status !== 'submitting' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>

              <p className="cp-msg__privacy">
                We use your details only to reply to this enquiry. No
                marketing list, no third-party sharing. If we&rsquo;re not the
                right fit we&rsquo;ll say so directly.
              </p>

              {status === 'error' && (
                <p className="cp-msg__error" role="alert">
                  Something went wrong sending your message. Please try
                  again — or email us directly at{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      <style>{`
        .cp-msg { background: var(--cream); color: var(--ink); padding: 100px 0 110px; }

        .cp-msg__wrap {
          max-width: 760px;
          margin: 0 auto;
          padding: 28px 22px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 22px 60px rgba(13, 33, 55, 0.08);
          min-width: 0;
        }
        @media (min-width: 768px) { .cp-msg__wrap { padding: 40px 44px; } }

        .cp-msg__form { display: flex; flex-direction: column; gap: 28px; }

        .cp-msg__submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--orange);
          color: var(--white);
          border: 0;
          border-radius: 999px;
          padding: 15px 28px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(224, 90, 30, 0.28);
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          margin-top: 6px;
        }
        .cp-msg__submit:hover:not(:disabled) {
          background: var(--orange-dark);
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(224, 90, 30, 0.38);
        }
        .cp-msg__submit:disabled { opacity: 0.65; cursor: not-allowed; }

        .cp-msg__privacy { font-size: 11.5px; line-height: 1.6; color: rgba(13, 33, 55, 0.55); }
        .cp-msg__error {
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(224, 90, 30, 0.08);
          border: 1px solid rgba(224, 90, 30, 0.3);
          color: var(--orange-dark);
          font-size: 13px;
        }
        .cp-msg__error a { color: var(--purple); font-weight: 700; }
      `}</style>
    </section>
  )
}

// ---- Success state ----------------------------------------------------------

function MessageSuccess({ values, onReset }) {
  const waMsg = encodeURIComponent(
    `Hi Lady Adel — I just sent a message via the website${
      values.subject ? ` about "${values.subject}"` : ''
    }.`
  )
  return (
    <div className="cp-succ" role="status" aria-live="polite">
      <div className="cp-succ__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 12 10 18 20 6" />
        </svg>
      </div>
      <h3>Message sent.</h3>
      <p>
        We&rsquo;ll come back within 2 working days. If your timeline is
        tighter, the fastest route is a direct WhatsApp.
      </p>
      <div className="cp-succ__ctas">
        <CTAButton
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
          variant="primary"
          size="md"
          external
          arrow={false}
        >
          Message on WhatsApp
        </CTAButton>
        <CTAButton
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(values.subject || 'Follow-up')}`}
          variant="ghost"
          size="md"
          arrow={false}
        >
          Email the team
        </CTAButton>
      </div>
      <button type="button" className="cp-succ__reset" onClick={onReset}>
        Send another message
      </button>

      <style>{`
        .cp-succ { text-align: center; padding: 20px 4px; }
        .cp-succ__icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 64px; height: 64px;
          margin-bottom: 18px;
          border-radius: 50%;
          background: rgba(91, 45, 142, 0.12);
          color: var(--purple);
        }
        .cp-succ__icon svg { width: 28px; height: 28px; }
        .cp-succ h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 28px);
          color: var(--navy);
          margin-bottom: 10px;
        }
        .cp-succ p {
          max-width: 520px;
          margin: 0 auto 24px;
          font-size: 14px;
          line-height: 1.65;
          color: rgba(13, 33, 55, 0.72);
        }
        .cp-succ__ctas {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }
        @media (min-width: 520px) {
          .cp-succ__ctas {
            flex-direction: row;
            justify-content: center;
            flex-wrap: wrap;
          }
        }
        .cp-succ__reset {
          background: transparent;
          border: 0;
          cursor: pointer;
          color: var(--purple);
          font-weight: 800;
          font-size: 13px;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      `}</style>
    </div>
  )
}

// ---- Form primitives (cp- prefix) -------------------------------------------

function FormGroup({ title, children }) {
  return (
    <fieldset className="cp-grp">
      <legend>{title}</legend>
      <div className="cp-grp__rows">{children}</div>
      <style>{`
        .cp-grp { border: 0; padding: 0; margin: 0; }
        .cp-grp legend {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--purple);
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(91, 45, 142, 0.15);
          width: 100%;
        }
        .cp-grp__rows { display: flex; flex-direction: column; gap: 16px; }
      `}</style>
    </fieldset>
  )
}

function Field({ label, name, type = 'text', required, hint, value, error, onChange, ...rest }) {
  const id = `cp-${name}`
  return (
    <div className={`cp-fld ${error ? 'is-invalid' : ''}`}>
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <input
        id={id} name={name} type={type}
        required={required}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {error
        ? <span className="cp-fld__err" id={`${id}-err`}>{error}</span>
        : hint ? <span className="cp-fld__hint" id={`${id}-hint`}>{hint}</span> : null}
      <FieldStyles />
    </div>
  )
}

function SelectField({ label, name, value, error, onChange, options, placeholder, required }) {
  const id = `cp-${name}`
  return (
    <div className={`cp-fld cp-fld--sel ${error ? 'is-invalid' : ''}`}>
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <select
        id={id} name={name}
        value={value} onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {error && <span className="cp-fld__err" id={`${id}-err`}>{error}</span>}
      <FieldStyles />
    </div>
  )
}

function TextAreaField({ label, name, required, hint, rows = 4, value, error, onChange }) {
  const id = `cp-${name}`
  return (
    <div className={`cp-fld ${error ? 'is-invalid' : ''}`}>
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <textarea
        id={id} name={name} rows={rows}
        required={required}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      />
      {error
        ? <span className="cp-fld__err" id={`${id}-err`}>{error}</span>
        : hint ? <span className="cp-fld__hint" id={`${id}-hint`}>{hint}</span> : null}
      <FieldStyles />
    </div>
  )
}

function RadioGroup({ label, name, options, value, error, onChange, required }) {
  const errId = `cp-${name}-err`
  return (
    <div className={`cp-fld ${error ? 'is-invalid' : ''}`}>
      <span className="cp-fld__label-static">
        {label}{required && <span aria-hidden="true" className="cp-fld__req"> *</span>}
      </span>
      <div
        className="cp-radio__row"
        role="radiogroup"
        aria-label={label}
        aria-describedby={error ? errId : undefined}
      >
        {options.map(opt => {
          const id = `cp-${name}-${opt.replace(/\s+/g, '-').toLowerCase()}`
          const on = value === opt
          return (
            <label key={opt} htmlFor={id} className={`cp-radio ${on ? 'is-on' : ''}`}>
              <input
                id={id} type="radio"
                name={name} value={opt}
                checked={on}
                onChange={onChange}
              />
              <span className="cp-radio__dot" aria-hidden="true" />
              <span>{opt}</span>
            </label>
          )
        })}
      </div>
      {error && <span className="cp-fld__err" id={errId}>{error}</span>}
      <style>{`
        .cp-radio__row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        @media (min-width: 520px) {
          .cp-radio__row { flex-direction: row; flex-wrap: wrap; gap: 10px; }
        }
        .cp-radio {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          background: var(--white);
          border: 1.5px solid rgba(13, 33, 55, 0.15);
          border-radius: 12px;
          cursor: pointer;
          font-size: 13.5px;
          color: var(--navy);
          transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
          flex: 1 1 auto;
          min-width: 0;
        }
        .cp-radio:hover { border-color: rgba(91, 45, 142, 0.32); }
        .cp-radio.is-on {
          border-color: var(--purple);
          box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.14);
          background: rgba(91, 45, 142, 0.04);
        }
        .cp-radio input { position: absolute; opacity: 0; pointer-events: none; }
        .cp-radio__dot {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(13, 33, 55, 0.2);
          background: var(--white);
          position: relative;
          transition: border-color 0.18s ease;
        }
        .cp-radio.is-on .cp-radio__dot { border-color: var(--purple); }
        .cp-radio.is-on .cp-radio__dot::after {
          content: '';
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          background: var(--purple);
        }
      `}</style>
      <FieldStyles />
    </div>
  )
}

function FieldStyles() {
  return (
    <style>{`
      .cp-fld { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
      .cp-fld label, .cp-fld__label-static {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1.6px;
        text-transform: uppercase;
        color: var(--navy);
      }
      .cp-fld label span, .cp-fld__req { color: var(--orange); }
      .cp-fld input, .cp-fld select, .cp-fld textarea {
        width: 100%;
        font: inherit;
        font-size: 15px;
        color: var(--navy);
        padding: 12px 14px;
        border: 1.5px solid rgba(13, 33, 55, 0.15);
        border-radius: 12px;
        background: var(--white);
        transition: border-color 0.18s ease, box-shadow 0.18s ease;
      }
      .cp-fld textarea { resize: vertical; min-height: 120px; line-height: 1.55; }
      .cp-fld input:focus, .cp-fld select:focus, .cp-fld textarea:focus {
        outline: none;
        border-color: var(--purple);
        box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.18);
      }
      .cp-fld__hint { font-size: 11.5px; color: rgba(13, 33, 55, 0.55); }
      .cp-fld__err  { font-size: 12px; color: var(--orange); font-weight: 700; }
      .cp-fld.is-invalid input,
      .cp-fld.is-invalid select,
      .cp-fld.is-invalid textarea {
        border-color: var(--orange);
        box-shadow: 0 0 0 3px rgba(224, 90, 30, 0.12);
      }
      .cp-fld--sel select {
        appearance: none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1l5 5 5-5' stroke='%230D2137' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>");
        background-repeat: no-repeat;
        background-position: right 14px center;
        padding-right: 38px;
      }
    `}</style>
  )
}
