import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
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

const RESPONSE_WINDOW = 'Within 2 working days'
const OFFICE_HOURS    = 'Mon – Fri · 9am – 5pm GMT'

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
        {/* Further bands added in Steps 14.2–14.6 */}
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
