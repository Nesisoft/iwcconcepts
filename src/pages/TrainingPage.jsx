import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SectionHeader from '../components/ui/SectionHeader'
import CTAButton from '../components/ui/CTAButton'

/**
 * /training — dedicated landing page for Corporate & Staff Training.
 *
 * Audience is B2B (HR / L&D / boards / SME founders / NGO leaders),
 * not the founder-personal voice of /programmes. The conversion
 * point is the Request-a-Proposal form at #proposal.
 *
 * Composition (built across Steps 13.1–13.6):
 *   13.1 · Hero band                              ← this step
 *   13.2 · Training Tracks
 *   13.3 · Who It's For + How It Works
 *   13.4 · Outcomes + Trust strip
 *   13.5 · Request-a-Proposal form (#proposal)
 *   13.6 · FAQ + Final CTA
 *
 * PLACEHOLDERS to replace post-launch:
 *   - DISCOVERY_CALL_URL — real booking URL (currently routes to
 *     /lady-adel#contact)
 *   - Sectors-served list (sample list used for now)
 *   - Form submit handler (stubbed in Step 13.5)
 */

// PLACEHOLDER: replace with the real Calendly / booking URL when ready.
// Falls back to the contact section on the main profile page.
const DISCOVERY_CALL_URL = '/lady-adel#contact'

const SNAPSHOT = {
  audience:  'Teams of 10–500',
  format:    'In-person · Online · Hybrid',
  duration:  '½-day to multi-week',
  model:     'Bespoke or off-the-shelf',
}

// Training tracks — six core categories. Lengths are indicative.
const TRACKS = [
  {
    accent: 'purple',
    title:  'Leadership & Management Development',
    line:   'Equip new and senior managers with the frameworks to lead themselves, lead their teams and lead through change — without losing the people on the way.',
    length: '1–3 days · or 6-week series',
    icon:   IconLeader,
  },
  {
    accent: 'gold',
    title:  'Financial Acumen for Non-Finance Leaders',
    line:   'Read a P&L, defend a budget, ask the right questions in a finance meeting. Built for managers and directors whose decisions move money but whose training never covered it.',
    length: '½-day · 1-day · 2-day',
    icon:   IconChart,
  },
  {
    accent: 'navy',
    title:  'Faith & Work Integration',
    line:   'For organisations and ministries that want their values, ethics and culture to actually show up Monday morning — not just in the strategy deck or the Sunday service.',
    length: '½-day workshop · multi-week',
    icon:   IconAnchor,
  },
  {
    accent: 'orange',
    title:  'Team Effectiveness & Communication',
    line:   'Sharper meetings, clearer feedback, fewer breakdowns. A toolkit for cross-functional teams that have outgrown the founder-and-friends way of working.',
    length: '1–2 days · quarterly cadence',
    icon:   IconTeam,
  },
  {
    accent: 'purple',
    title:  'Customer Service Excellence',
    line:   'Service standards your front-line will actually use under pressure. For teams in retail, hospitality, banking, healthcare and any setting where the customer experience is the brand.',
    length: '½-day · 1-day',
    icon:   IconHeart,
  },
  {
    accent: 'gold',
    title:  'Bespoke Curriculum',
    line:   'A custom programme co-designed with your L&D or executive team — combining tracks above, your own KPIs and the specific behaviour change you need to see in 90 days.',
    length: 'Scoped per engagement',
    icon:   IconCustom,
  },
]

// ---- Page -------------------------------------------------------------------

export default function TrainingPage() {
  const location = useLocation()
  useEffect(() => {
    if (location.hash) return
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [location.hash, location.pathname])

  return (
    <>
      <Navbar />
      <main>
        <TrainingHero />
        <TracksBand />
        {/* Further bands added in Steps 13.3–13.6 */}
      </main>
      <Footer />
    </>
  )
}

// ---- Hero -------------------------------------------------------------------

function TrainingHero() {
  return (
    <section className="tp-hero">
      <div className="tp-hero__bg" aria-hidden="true">
        <span className="tp-hero__orb tp-hero__orb--purple" />
        <span className="tp-hero__orb tp-hero__orb--gold" />
        <span className="tp-hero__grid" />
      </div>

      <div className="site-container tp-hero__inner">
        <span className="tp-hero__eyebrow">For Teams · Leaders · Boards</span>

        <h1 className="tp-hero__title">
          Corporate &amp; Staff <em>Training</em>
        </h1>

        <p className="tp-hero__lede">
          Practical, mentor-led training that sharpens leaders, aligns teams
          and translates strategy into observable behaviour — designed for
          organisations that want measurable change, not feel-good workshops.
        </p>

        <dl className="tp-hero__snap">
          <div><dt>Audience</dt><dd>{SNAPSHOT.audience}</dd></div>
          <div><dt>Format</dt><dd>{SNAPSHOT.format}</dd></div>
          <div><dt>Duration</dt><dd>{SNAPSHOT.duration}</dd></div>
          <div><dt>Model</dt><dd>{SNAPSHOT.model}</dd></div>
        </dl>

        <div className="tp-hero__ctas">
          <CTAButton href="#proposal" variant="primary" size="lg">
            Request a Proposal
          </CTAButton>
          <CTAButton to={DISCOVERY_CALL_URL} variant="outline-light" size="lg" arrow={false}>
            Book a Discovery Call
          </CTAButton>
        </div>

        <p className="tp-hero__note">
          Bespoke curricula · Single sessions to multi-week programmes · Faith-aligned options
        </p>
      </div>

      <style>{`
        .tp-hero {
          position: relative;
          padding: 120px 0 90px;
          background:
            radial-gradient(ellipse at 12% 0%, rgba(91, 45, 142, 0.5) 0%, transparent 55%),
            radial-gradient(ellipse at 88% 100%, rgba(201, 168, 76, 0.2) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
          isolation: isolate;
        }
        .tp-hero__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .tp-hero__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.55; }
        .tp-hero__orb--purple { width: 520px; height: 520px; top: -180px; left: -160px; background: radial-gradient(circle, rgba(122, 71, 184, 0.5), transparent 70%); }
        .tp-hero__orb--gold   { width: 460px; height: 460px; bottom: -180px; right: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.38), transparent 70%); }
        .tp-hero__grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse at center, black 25%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 25%, transparent 75%);
          opacity: 0.5;
        }

        .tp-hero__inner { position: relative; z-index: 1; text-align: center; max-width: 880px; }

        .tp-hero__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
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

        .tp-hero__title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(38px, 6.4vw, 70px);
          line-height: 1.05;
          letter-spacing: -1.4px;
          margin-bottom: 18px;
        }
        .tp-hero__title em { font-style: italic; color: var(--gold); }

        .tp-hero__lede {
          max-width: 700px;
          margin: 0 auto 38px;
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.82);
        }

        .tp-hero__snap {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin: 0 auto 36px;
          max-width: 760px;
          padding: 20px 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          text-align: left;
        }
        @media (min-width: 768px) {
          .tp-hero__snap {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 24px;
            padding: 22px 30px;
            text-align: center;
          }
        }
        .tp-hero__snap > div { min-width: 0; }
        .tp-hero__snap dt {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 4px;
        }
        .tp-hero__snap dd {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.92);
          line-height: 1.4;
        }

        .tp-hero__ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 460px;
          margin: 0 auto 22px;
        }
        .tp-hero__ctas .cta { white-space: normal; text-align: center; line-height: 1.25; }
        @media (min-width: 520px) {
          .tp-hero__ctas {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            max-width: none;
          }
          .tp-hero__ctas .cta { white-space: nowrap; }
        }

        .tp-hero__note {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.2px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </section>
  )
}

// ---- Training tracks --------------------------------------------------------

function TracksBand() {
  return (
    <section className="tp-tracks site-section">
      <div className="site-container">
        <SectionHeader
          eyebrow="Training Tracks"
          title={<>Six tracks. <em>One toolkit</em>.</>}
          subtitle="Most engagements draw from one or two tracks; bespoke programmes blend several. Every track is led by Lady Adel and the IWC faculty, designed around the behaviour change your team actually needs."
        />

        <ul className="tp-tracks__grid">
          {TRACKS.map(t => {
            const Icon = t.icon
            return (
              <li key={t.title} className={`tp-track tp-track--${t.accent}`}>
                <span className="tp-track__icon" aria-hidden="true"><Icon /></span>
                <h3>{t.title}</h3>
                <p>{t.line}</p>
                <span className="tp-track__len">
                  <span className="tp-track__len-dot" aria-hidden="true" />
                  {t.length}
                </span>
              </li>
            )
          })}
        </ul>

        <p className="tp-tracks__note">
          Don&rsquo;t see exactly what you need? Every track can be tailored — or
          combined into a multi-track programme. The proposal form lets you
          flag the focus areas that matter.
        </p>
      </div>

      <style>{`
        .tp-tracks { background: var(--white); color: var(--ink); }

        .tp-tracks__grid {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 18px;
        }
        @media (min-width: 720px)  { .tp-tracks__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1080px) { .tp-tracks__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        .tp-track {
          position: relative;
          padding: 26px 24px 22px;
          background: var(--cream);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
          overflow: hidden;
        }
        .tp-track::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent-a), var(--accent-b));
        }
        .tp-track:hover {
          transform: translateY(-4px);
          border-color: rgba(13, 33, 55, 0.18);
          box-shadow: 0 22px 48px rgba(13, 33, 55, 0.1);
        }

        /* Per-track accent colour pair (drives top stripe + icon chip) */
        .tp-track--purple { --accent-a: var(--purple);     --accent-b: #7a47b8; }
        .tp-track--gold   { --accent-a: var(--gold);       --accent-b: var(--gold-dark); }
        .tp-track--orange { --accent-a: var(--orange);     --accent-b: var(--orange-dark); }
        .tp-track--navy   { --accent-a: var(--navy);       --accent-b: #1a3a5f; }

        .tp-track__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--accent-a), var(--accent-b));
          color: var(--white);
          box-shadow: 0 10px 22px rgba(13, 33, 55, 0.14);
        }
        .tp-track--gold .tp-track__icon { color: var(--navy); }
        .tp-track__icon svg { width: 22px; height: 22px; }

        .tp-track h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 17.5px;
          line-height: 1.25;
          letter-spacing: -0.2px;
          color: var(--navy);
        }
        .tp-track p {
          flex-grow: 1;
          font-size: 13.5px;
          line-height: 1.65;
          color: rgba(13, 33, 55, 0.75);
        }
        .tp-track__len {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: var(--navy);
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.1);
          border-radius: 999px;
        }
        .tp-track__len-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent-a);
        }

        .tp-tracks__note {
          max-width: 680px;
          margin: 36px auto 0;
          text-align: center;
          font-size: 13.5px;
          line-height: 1.7;
          color: rgba(13, 33, 55, 0.66);
        }
      `}</style>
    </section>
  )
}

// ---- Track icons ------------------------------------------------------------

function IconLeader() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
      <path d="M9 4l3-2 3 2" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="20" x2="21" y2="20" />
      <rect x="6" y="11" width="3" height="7" rx="0.6" />
      <rect x="11" y="7" width="3" height="11" rx="0.6" />
      <rect x="16" y="14" width="3" height="4" rx="0.6" />
      <polyline points="4 8 9 5 14 9 20 4" />
    </svg>
  )
}
function IconAnchor() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="20" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <path d="M5 14a7 7 0 0 0 14 0" />
      <line x1="3" y1="14" x2="5" y2="14" />
      <line x1="19" y1="14" x2="21" y2="14" />
    </svg>
  )
}
function IconTeam() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M3 19v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
      <path d="M15 19v-0.5a3.5 3.5 0 0 1 3.5-3.5H19a3 3 0 0 1 3 3v1" />
    </svg>
  )
}
function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" />
    </svg>
  )
}
function IconCustom() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  )
}
