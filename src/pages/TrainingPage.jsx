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

// Who it's for — 5 organisation archetypes
const AUDIENCES = [
  {
    title: 'Corporates & large enterprises',
    line:  'Banking, telco, FMCG, energy and professional services teams who need scalable training that matches the polish of an internal L&D function.',
    icon:  IconBuilding,
  },
  {
    title: 'SMEs & growth-stage businesses',
    line:  'Founder-led companies who have outgrown ad-hoc training and need their first proper leadership and management programme — without enterprise overhead.',
    icon:  IconShop,
  },
  {
    title: 'NGOs & foundations',
    line:  'Programme staff, country directors and operations teams who are doing serious work on tight budgets and need training that respects both.',
    icon:  IconHands,
  },
  {
    title: 'Churches & ministries',
    line:  'Leadership pipelines, staff teams and lay leaders who want development rooted in faith without losing rigour on the leadership and operations side.',
    icon:  IconChurch,
  },
  {
    title: 'Public sector & boards',
    line:  'Boards, senior public officials and executive teams who need facilitated sessions that combine financial literacy, governance and leadership in one room.',
    icon:  IconGovern,
  },
]

// Outcomes — observable results we design every engagement around
const OUTCOMES = [
  {
    metric: 'Sharper financial decisions',
    line:   'Managers stop deferring numbers up the chain. They read the P&L, defend their budget and make calls that compound.',
  },
  {
    metric: 'Stronger middle management',
    line:   'The layer that usually leaks talent and momentum starts running its own one-on-ones, hires and weekly rhythms with confidence.',
  },
  {
    metric: 'Aligned team rhythms',
    line:   'Meetings get shorter and sharper. Teams agree what good looks like — then ship against it without the founder in every thread.',
  },
  {
    metric: 'Measurable behaviour change',
    line:   'We define the post-engagement signals up front. Stakeholders see real shifts in how people lead, decide and follow through.',
  },
  {
    metric: 'Faith-aligned culture',
    line:   'For values-led organisations: integrity, ethics and service stop being posters on the wall and start showing up in everyday work.',
  },
  {
    metric: 'Lower churn, higher trust',
    line:   'When people feel invested in, they stay. Engaged managers and equipped teams keep customers — and each other — for longer.',
  },
]

// Sectors typically served (PLACEHOLDER — refine once formal case studies land)
const SECTORS = [
  'Banking & financial services',
  'Telecommunications',
  'FMCG & retail',
  'Energy & utilities',
  'Healthcare',
  'Education',
  'Hospitality',
  'Public sector',
  'NGO & development',
  'Faith-based organisations',
]

// Pull-quote lifted from the main /lady-adel testimonials so the page does
// not invent fresh quotes. Placeholder until a dedicated training case study
// quote is approved.
const PULL_QUOTE = {
  body:    'Lady Adel led a two-day leadership intensive for our senior management team. The shift in language, posture and ownership was immediate. She combines corporate rigour with spiritual clarity in a way I have not seen anywhere else.',
  name:    'Dr. Nana O.',
  role:    'Group HR Director',
  org:     'Corporate Training Client',
}

// How it works — 4-phase engagement (deliberately styled differently from the
// /programmes Cohort Timeline so the visual reads as separate territory).
const PHASES = [
  {
    n: '01',
    label: 'Discover',
    title: 'Scoping conversation',
    line:  'A 30–45 minute call with your L&D / leadership team to understand the audience, the current gap and the behaviour change you want to see.',
  },
  {
    n: '02',
    label: 'Design',
    title: 'Curriculum proposal',
    line:  'A written proposal with the recommended track(s), session structure, timeline, success measures and pricing — usually within a week of the discovery call.',
  },
  {
    n: '03',
    label: 'Deliver',
    title: 'Sessions & materials',
    line:  'Live delivery in-person, online or hybrid. Every session ships with worksheets, frameworks and follow-up assignments your team can use the next morning.',
  },
  {
    n: '04',
    label: 'Debrief',
    title: 'Impact review',
    line:  'A post-engagement debrief with stakeholders covering outcomes, observed behaviour change, materials handed over and recommended next steps.',
  },
]

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
        <WhoBand />
        <HowBand />
        <OutcomesBand />
        {/* Further bands added in Steps 13.5–13.6 */}
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

// ---- Who It's For -----------------------------------------------------------

function WhoBand() {
  return (
    <section className="tp-who site-section">
      <div className="site-container">
        <SectionHeader
          eyebrow="Who It Is For"
          title={<>Built for <em>five kinds</em> of organisation.</>}
          subtitle="Different sizes, different sectors — same need: training that translates to behaviour the team actually carries back to their desk."
        />

        <ul className="tp-who__grid">
          {AUDIENCES.map(a => {
            const Icon = a.icon
            return (
              <li key={a.title} className="tp-who__card">
                <span className="tp-who__icon" aria-hidden="true"><Icon /></span>
                <h3>{a.title}</h3>
                <p>{a.line}</p>
              </li>
            )
          })}
        </ul>
      </div>

      <style>{`
        .tp-who { background: var(--cream); color: var(--ink); }

        .tp-who__grid {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 16px;
        }
        @media (min-width: 720px)  { .tp-who__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1080px) { .tp-who__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        .tp-who__card {
          padding: 26px 24px 24px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 12px 28px rgba(13, 33, 55, 0.05);
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .tp-who__card:hover {
          transform: translateY(-3px);
          border-color: rgba(91, 45, 142, 0.32);
          box-shadow: 0 22px 48px rgba(13, 33, 55, 0.09);
        }

        .tp-who__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(91, 45, 142, 0.1);
          color: var(--purple);
        }
        .tp-who__icon svg { width: 22px; height: 22px; }

        .tp-who__card h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 17px;
          line-height: 1.25;
          letter-spacing: -0.2px;
          color: var(--navy);
        }
        .tp-who__card p {
          font-size: 13.5px;
          line-height: 1.65;
          color: rgba(13, 33, 55, 0.74);
        }
      `}</style>
    </section>
  )
}

// ---- How It Works -----------------------------------------------------------

function HowBand() {
  return (
    <section className="tp-how">
      <div className="tp-how__bg" aria-hidden="true">
        <span className="tp-how__orb tp-how__orb--gold" />
        <span className="tp-how__orb tp-how__orb--purple" />
      </div>
      <div className="site-container tp-how__inner">
        <SectionHeader
          tone="light"
          eyebrow="How It Works"
          title={<>From first call to <em>final debrief</em>.</>}
          subtitle="A four-phase engagement, each step crisply scoped. Most engagements move from Discover to Deliver in two to four weeks — faster if dates are tight."
        />

        <ol className="tp-how__grid">
          {PHASES.map((p, i) => (
            <li key={p.n} className="tp-phase">
              <div className="tp-phase__top">
                <span className="tp-phase__n">{p.n}</span>
                <span className="tp-phase__label">{p.label}</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.line}</p>
              {i < PHASES.length - 1 && (
                <span className="tp-phase__arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      <style>{`
        .tp-how {
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
        .tp-how__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .tp-how__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.45; }
        .tp-how__orb--gold   { width: 460px; height: 460px; top: -160px; right: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.4), transparent 70%); }
        .tp-how__orb--purple { width: 480px; height: 480px; bottom: -160px; left: -140px; background: radial-gradient(circle, rgba(122, 71, 184, 0.5), transparent 70%); }
        .tp-how__inner { position: relative; z-index: 1; }

        .tp-how__grid {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 18px;
          counter-reset: none;
        }
        @media (min-width: 720px)  { .tp-how__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1080px) { .tp-how__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 22px; } }

        .tp-phase {
          position: relative;
          padding: 24px 22px 26px;
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          min-width: 0;
          transition: transform 0.22s ease, border-color 0.22s ease;
        }
        .tp-phase:hover {
          transform: translateY(-4px);
          border-color: rgba(201, 168, 76, 0.45);
        }

        .tp-phase__top {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .tp-phase__n {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 36px;
          line-height: 1;
          letter-spacing: -1px;
          color: var(--gold);
        }
        .tp-phase__label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.62);
        }
        .tp-phase h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 18px;
          line-height: 1.25;
          letter-spacing: -0.2px;
          color: var(--white);
          margin-bottom: 8px;
        }
        .tp-phase p {
          font-size: 13.5px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.74);
        }

        /* Connector arrow between phases.
           Hidden by default; only shown horizontally on the 4-col layout. */
        .tp-phase__arrow {
          display: none;
        }
        @media (min-width: 1080px) {
          .tp-phase__arrow {
            display: inline-flex;
            position: absolute;
            top: 50%;
            right: -16px;
            transform: translateY(-50%);
            width: 28px;
            height: 28px;
            align-items: center;
            justify-content: center;
            color: var(--gold);
            background: var(--navy);
            border: 1px solid rgba(201, 168, 76, 0.5);
            border-radius: 50%;
            z-index: 2;
          }
          .tp-phase__arrow svg { width: 14px; height: 14px; }
        }
      `}</style>
    </section>
  )
}

// ---- Audience icons ---------------------------------------------------------

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <line x1="8"  y1="7"  x2="8"  y2="9" />
      <line x1="12" y1="7"  x2="12" y2="9" />
      <line x1="16" y1="7"  x2="16" y2="9" />
      <line x1="8"  y1="12" x2="8"  y2="14" />
      <line x1="12" y1="12" x2="12" y2="14" />
      <line x1="16" y1="12" x2="16" y2="14" />
      <rect x="10" y="17" width="4" height="4" />
    </svg>
  )
}
function IconShop() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l1.5-4h15L21 9" />
      <path d="M4 9v11h16V9" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <rect x="9" y="13" width="6" height="7" />
    </svg>
  )
}
function IconHands() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4l1.6 3.6L17.5 8l-2.7 2.6.7 3.7L12 12.6 8.5 14.3l.7-3.7L6.5 8l3.9-.4L12 4z" />
      <path d="M5 18c2-1 4-1 7-1s5 0 7 1" />
      <path d="M5 21c2-1 4-1 7-1s5 0 7 1" />
    </svg>
  )
}
function IconChurch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="2" x2="12" y2="8" />
      <line x1="9"  y1="5" x2="15" y2="5" />
      <path d="M5 21V12l7-4 7 4v9" />
      <rect x="10" y="14" width="4" height="7" />
      <line x1="5"  y1="16" x2="9"  y2="16" />
      <line x1="15" y1="16" x2="19" y2="16" />
    </svg>
  )
}
function IconGovern() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 3 21 8 3 8 12 3" />
      <line x1="5"  y1="11" x2="5"  y2="18" />
      <line x1="9"  y1="11" x2="9"  y2="18" />
      <line x1="15" y1="11" x2="15" y2="18" />
      <line x1="19" y1="11" x2="19" y2="18" />
      <line x1="3"  y1="20" x2="21" y2="20" />
    </svg>
  )
}

// ---- Outcomes + trust strip -------------------------------------------------

function OutcomesBand() {
  return (
    <section className="tp-out site-section">
      <div className="site-container">
        <SectionHeader
          eyebrow="What Changes Afterwards"
          title={<>Outcomes we <em>design</em> for.</>}
          subtitle="Every engagement is scoped against observable change. These are the six outcomes we aim at most often — the specific signals stakeholders look for in the debrief."
        />

        <ul className="tp-out__grid">
          {OUTCOMES.map((o, i) => (
            <li key={o.metric} className="tp-out__row">
              <span className="tp-out__tick" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 12 10 18 20 6" />
                </svg>
              </span>
              <div className="tp-out__body">
                <span className="tp-out__n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{o.metric}</h3>
                <p>{o.line}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Trust strip */}
        <div className="tp-trust">
          <div className="tp-trust__sectors">
            <span className="tp-trust__eyebrow">Sectors served</span>
            <ul className="tp-trust__chips">
              {SECTORS.map(s => <li key={s}>{s}</li>)}
            </ul>
          </div>

          <figure className="tp-trust__quote">
            <span className="tp-trust__mark" aria-hidden="true">&ldquo;</span>
            <blockquote>{PULL_QUOTE.body}</blockquote>
            <figcaption>
              <strong>{PULL_QUOTE.name}</strong>
              <span>{PULL_QUOTE.role} · {PULL_QUOTE.org}</span>
            </figcaption>
          </figure>
        </div>
      </div>

      <style>{`
        .tp-out { background: var(--white); color: var(--ink); }

        .tp-out__grid {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 14px;
          max-width: 980px;
          margin: 0 auto 60px;
        }
        @media (min-width: 720px)  { .tp-out__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; } }

        .tp-out__row {
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr);
          gap: 16px;
          padding: 20px 22px;
          background: var(--cream);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          align-items: start;
          transition: border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
        }
        .tp-out__row:hover {
          transform: translateY(-2px);
          border-color: rgba(91, 45, 142, 0.3);
          box-shadow: 0 18px 36px rgba(13, 33, 55, 0.08);
        }

        .tp-out__tick {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(91, 45, 142, 0.12);
          color: var(--purple);
        }
        .tp-out__tick svg { width: 18px; height: 18px; }

        .tp-out__body { min-width: 0; }
        .tp-out__n {
          display: block;
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 1.4px;
          color: var(--gold-dark);
          margin-bottom: 4px;
        }
        .tp-out__body h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 17px;
          line-height: 1.25;
          letter-spacing: -0.2px;
          color: var(--navy);
          margin-bottom: 6px;
        }
        .tp-out__body p {
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(13, 33, 55, 0.74);
        }

        /* Trust strip */
        .tp-trust {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 24px;
          padding: 32px 26px;
          background:
            radial-gradient(ellipse at 0% 0%, rgba(91, 45, 142, 0.07), transparent 60%),
            linear-gradient(160deg, var(--cream), var(--white));
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: 22px;
          box-shadow: 0 18px 42px rgba(13, 33, 55, 0.06);
        }
        @media (min-width: 880px) {
          .tp-trust {
            grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
            gap: 36px;
            padding: 40px 44px;
            align-items: center;
          }
        }
        .tp-trust > * { min-width: 0; }

        .tp-trust__eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          color: var(--purple);
          margin-bottom: 14px;
        }
        .tp-trust__chips {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tp-trust__chips li {
          padding: 7px 13px;
          font-size: 12px;
          font-weight: 700;
          color: var(--navy);
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.1);
          border-radius: 999px;
          line-height: 1.2;
        }

        .tp-trust__quote {
          position: relative;
          padding: 20px 22px 22px;
          background: var(--white);
          border: 1px solid rgba(201, 168, 76, 0.32);
          border-radius: 18px;
          margin: 0;
        }
        .tp-trust__mark {
          position: absolute;
          top: -14px;
          left: 18px;
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: flex-end;
          justify-content: center;
          background: var(--gold);
          color: var(--navy);
          border-radius: 50%;
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 30px;
          line-height: 1;
          padding-bottom: 6px;
          box-shadow: 0 8px 18px rgba(201, 168, 76, 0.4);
        }
        .tp-trust__quote blockquote {
          font-family: var(--font-display);
          font-weight: 600;
          font-style: italic;
          font-size: clamp(15px, 1.6vw, 17px);
          line-height: 1.5;
          color: var(--navy);
          margin: 0 0 14px;
        }
        .tp-trust__quote figcaption {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 12.5px;
        }
        .tp-trust__quote figcaption strong { color: var(--navy); }
        .tp-trust__quote figcaption span { color: rgba(13, 33, 55, 0.6); }
      `}</style>
    </section>
  )
}
