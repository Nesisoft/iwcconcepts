import { useEffect, useState } from 'react'
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

// PLACEHOLDER: replace with the real business numbers / inbox when confirmed.
const WHATSAPP_NUMBER = '233000000000'
const CONTACT_EMAIL   = 'training@iwcconcepts.com'

// FAQ — 5 items, B2B procurement-focused
const FAQ = [
  {
    q: 'How long is a typical engagement?',
    a: 'It ranges from a single half-day workshop to a multi-week leadership programme spread across a quarter. Most one-track engagements land at 1–3 days; multi-track or bespoke programmes typically run 4–12 weeks with weekly sessions. We size the engagement to the outcome you need, not to a fixed catalogue.',
  },
  {
    q: 'Do you travel for in-person sessions?',
    a: 'Yes — we deliver in-person across Ghana and West Africa, and travel further afield for engagements that warrant it (typically multi-day intensives or board offsites). Travel and accommodation, where they apply, are scoped transparently in the proposal.',
  },
  {
    q: 'Do you work with churches, ministries and NGOs?',
    a: 'Yes. A meaningful part of our work is with faith-based organisations, NGOs and foundations. We bring the same operational rigour to a ministry leadership team or country office that we would to a corporate. Pricing is calibrated to the sector.',
  },
  {
    q: 'How is a session priced?',
    a: 'Engagements are priced per scope rather than per head. The proposal sets out a clear total, what is included (sessions, materials, debrief, post-engagement support) and what is optional. Indicative budgets in the request form help us land the right tier on the first pass.',
  },
  {
    q: 'How quickly can you start?',
    a: 'For a standard one- or two-day engagement, two to four weeks from first contact to first session is typical. Multi-week programmes need a little more lead time for design. If your timeline is tighter than that, flag it in the brief — we have moved fast before.',
  },
]

// Focus-area chips (must align with TRACKS titles below)
const FOCUS_AREAS = [
  'Leadership & Management',
  'Financial Acumen',
  'Faith & Work',
  'Team Effectiveness',
  'Customer Service',
  'Bespoke / Multi-track',
]
const AUDIENCE_SIZES = ['Under 10', '10–25', '25–60', '60+']
const FORMATS = ['In-person', 'Online', 'Hybrid']

const INITIAL_PROPOSAL = {
  // About you
  name: '', email: '', role: '', organisation: '',
  phone: '', country: '',
  // Engagement
  focus: [],            // string[] — multi-select chips
  audienceSize: '',
  dates: '',
  format: '',
  location: '',
  // Brief
  objective: '', challenges: '', context: '',
}

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
        <ProposalBand />
        <FAQBand />
        <FinalCTABand />
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

// ---- Request a Proposal -----------------------------------------------------

function ProposalBand() {
  const [values, setValues] = useState(INITIAL_PROPOSAL)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')   // 'idle' | 'submitting' | 'success' | 'error'

  function handleChange(e) {
    const { name, value } = e.target
    setValues(v => ({ ...v, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }))
  }

  function toggleFocus(area) {
    setValues(v => {
      const next = v.focus.includes(area)
        ? v.focus.filter(f => f !== area)
        : [...v.focus, area]
      return { ...v, focus: next }
    })
    if (errors.focus) setErrors(er => ({ ...er, focus: null }))
  }

  function validate() {
    const er = {}
    if (!values.name.trim())         er.name         = 'Please enter your name.'
    if (!values.email.trim())        er.email        = 'We need a work email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) er.email = 'That email does not look right.'
    if (!values.role.trim())         er.role         = 'Your role helps us pitch the proposal correctly.'
    if (!values.organisation.trim()) er.organisation = 'Tell us where you work.'
    if (values.focus.length === 0)   er.focus        = 'Pick at least one focus area.'
    if (!values.objective.trim())    er.objective    = 'A line on the business objective is essential.'
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
      console.info('[TrainingPage] proposal submitted', values)
      await new Promise(r => setTimeout(r, 600))
      setStatus('success')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[TrainingPage] submission failed', err)
      setStatus('error')
    }
  }

  function reset() {
    setStatus('idle')
    setErrors({})
    setValues(INITIAL_PROPOSAL)
  }

  return (
    <section className="tp-prop" id="proposal">
      <div className="site-container">
        <SectionHeader
          eyebrow="Request a Proposal"
          title={<>Tell us about your team &mdash; <em>we&rsquo;ll write the brief</em>.</>}
          subtitle="A 10–12 minute form. Once it lands we'll review and come back within 2 working days with a proposal — or a request for a quick call if we need more context first."
        />

        <div className="tp-prop__wrap">
          {status === 'success' ? (
            <ProposalSuccess onReset={reset} values={values} />
          ) : (
            <form className="tp-prop__form" noValidate onSubmit={handleSubmit}>
              <FormGroup title="About you">
                <Field
                  label="Full name" name="name" required
                  value={values.name} error={errors.name}
                  onChange={handleChange} autoComplete="name"
                />
                <Field
                  label="Work email" name="email" type="email" required
                  value={values.email} error={errors.email}
                  onChange={handleChange} autoComplete="email"
                />
                <Field
                  label="Role / job title" name="role" required
                  hint="e.g. Group HR Director, L&D Lead, MD"
                  value={values.role} error={errors.role}
                  onChange={handleChange} autoComplete="organization-title"
                />
                <Field
                  label="Organisation" name="organisation" required
                  value={values.organisation} error={errors.organisation}
                  onChange={handleChange} autoComplete="organization"
                />
                <Field
                  label="Phone / WhatsApp" name="phone" type="tel"
                  hint="Optional — speeds up scheduling the discovery call"
                  value={values.phone} error={errors.phone}
                  onChange={handleChange} autoComplete="tel"
                />
                <Field
                  label="Country / City" name="country"
                  value={values.country} error={errors.country}
                  onChange={handleChange} autoComplete="country-name"
                />
              </FormGroup>

              <FormGroup title="Engagement">
                <ChipSelect
                  label="Training focus area" required
                  hint="Pick all that apply"
                  options={FOCUS_AREAS}
                  selected={values.focus}
                  error={errors.focus}
                  onToggle={toggleFocus}
                />
                <SelectField
                  label="Audience size" name="audienceSize"
                  placeholder="Pick a size band"
                  options={AUDIENCE_SIZES}
                  value={values.audienceSize} error={errors.audienceSize}
                  onChange={handleChange}
                />
                <Field
                  label="Preferred dates window" name="dates"
                  hint="e.g. mid-March to early-April"
                  value={values.dates} error={errors.dates}
                  onChange={handleChange}
                />
                <RadioGroup
                  label="Preferred format" name="format"
                  options={FORMATS}
                  value={values.format} error={errors.format}
                  onChange={handleChange}
                />
                <Field
                  label="Location / city" name="location"
                  hint="If in-person or hybrid — where are we delivering?"
                  value={values.location} error={errors.location}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup title="The brief">
                <TextAreaField
                  label="What is the business objective behind this training?"
                  name="objective" required rows={3}
                  value={values.objective} error={errors.objective}
                  onChange={handleChange}
                />
                <TextAreaField
                  label="Specific challenges or behaviours you want addressed"
                  name="challenges" rows={3}
                  hint="Optional — what is happening (or not happening) right now?"
                  value={values.challenges} error={errors.challenges}
                  onChange={handleChange}
                />
                <TextAreaField
                  label="Anything else we should know"
                  name="context" rows={3}
                  hint="Indicative budget, internal deadlines, prior providers — useful context"
                  value={values.context} error={errors.context}
                  onChange={handleChange}
                />
              </FormGroup>

              <button
                type="submit"
                className="tp-prop__submit"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending your request…' : 'Send proposal request'}
                {status !== 'submitting' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>

              <p className="tp-prop__privacy">
                We use your details only to scope this training engagement. No
                third-party sharing, no marketing list. If we are not the right
                fit we will say so directly.
              </p>

              {status === 'error' && (
                <p className="tp-prop__error" role="alert">
                  Something went wrong sending your request. Please try again
                  — or email us directly at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      <style>{`
        .tp-prop { background: var(--cream); color: var(--ink); padding: 100px 0 110px; }

        .tp-prop__wrap {
          max-width: 760px;
          margin: 0 auto;
          padding: 28px 22px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 22px 60px rgba(13, 33, 55, 0.08);
          min-width: 0;
        }
        @media (min-width: 768px) { .tp-prop__wrap { padding: 40px 44px; } }

        .tp-prop__form { display: flex; flex-direction: column; gap: 28px; }

        .tp-prop__submit {
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
        .tp-prop__submit:hover:not(:disabled) {
          background: var(--orange-dark);
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(224, 90, 30, 0.38);
        }
        .tp-prop__submit:disabled { opacity: 0.65; cursor: not-allowed; }

        .tp-prop__privacy { font-size: 11.5px; line-height: 1.6; color: rgba(13, 33, 55, 0.55); }
        .tp-prop__error {
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(224, 90, 30, 0.08);
          border: 1px solid rgba(224, 90, 30, 0.3);
          color: var(--orange-dark);
          font-size: 13px;
        }
        .tp-prop__error a { color: var(--purple); font-weight: 700; }
      `}</style>
    </section>
  )
}

// ---- Success state ----------------------------------------------------------

function ProposalSuccess({ onReset, values }) {
  const waMsg = encodeURIComponent(
    `Hi Lady Adel — I just submitted a proposal request for ${values.organisation || 'our team'}.`
  )
  return (
    <div className="tp-succ" role="status" aria-live="polite">
      <div className="tp-succ__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 12 10 18 20 6" />
        </svg>
      </div>
      <h3>Your request is in.</h3>
      <p>
        We&rsquo;ll review the brief and come back within 2 working days
        — either with a proposal or a request for a short discovery call.
        If your timeline is tight, the fastest path is a direct WhatsApp.
      </p>
      <div className="tp-succ__ctas">
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
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Proposal request — ' + (values.organisation || ''))}`}
          variant="ghost"
          size="md"
          arrow={false}
        >
          Email the team
        </CTAButton>
      </div>
      <button type="button" className="tp-succ__reset" onClick={onReset}>
        Submit another request
      </button>

      <style>{`
        .tp-succ { text-align: center; padding: 20px 4px; }
        .tp-succ__icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 64px; height: 64px;
          margin-bottom: 18px;
          border-radius: 50%;
          background: rgba(91, 45, 142, 0.12);
          color: var(--purple);
        }
        .tp-succ__icon svg { width: 28px; height: 28px; }
        .tp-succ h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 28px);
          color: var(--navy);
          margin-bottom: 10px;
        }
        .tp-succ p {
          max-width: 520px;
          margin: 0 auto 24px;
          font-size: 14px;
          line-height: 1.65;
          color: rgba(13, 33, 55, 0.72);
        }
        .tp-succ__ctas {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }
        @media (min-width: 520px) {
          .tp-succ__ctas {
            flex-direction: row;
            justify-content: center;
            flex-wrap: wrap;
          }
        }
        .tp-succ__reset {
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

// ---- Form primitives (scoped tp- prefix) ------------------------------------

function FormGroup({ title, children }) {
  return (
    <fieldset className="tp-grp">
      <legend>{title}</legend>
      <div className="tp-grp__rows">{children}</div>
      <style>{`
        .tp-grp { border: 0; padding: 0; margin: 0; }
        .tp-grp legend {
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
        .tp-grp__rows { display: flex; flex-direction: column; gap: 16px; }
      `}</style>
    </fieldset>
  )
}

function Field({ label, name, type = 'text', required, hint, value, error, onChange, ...rest }) {
  const id = `tp-${name}`
  return (
    <div className={`tp-fld ${error ? 'is-invalid' : ''}`}>
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
        ? <span className="tp-fld__err" id={`${id}-err`}>{error}</span>
        : hint ? <span className="tp-fld__hint" id={`${id}-hint`}>{hint}</span> : null}
      <FieldStyles />
    </div>
  )
}

function SelectField({ label, name, value, error, onChange, options, placeholder, required }) {
  const id = `tp-${name}`
  return (
    <div className={`tp-fld tp-fld--sel ${error ? 'is-invalid' : ''}`}>
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
      {error && <span className="tp-fld__err" id={`${id}-err`}>{error}</span>}
      <FieldStyles />
    </div>
  )
}

function TextAreaField({ label, name, required, hint, rows = 4, value, error, onChange }) {
  const id = `tp-${name}`
  return (
    <div className={`tp-fld ${error ? 'is-invalid' : ''}`}>
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
        ? <span className="tp-fld__err" id={`${id}-err`}>{error}</span>
        : hint ? <span className="tp-fld__hint" id={`${id}-hint`}>{hint}</span> : null}
      <FieldStyles />
    </div>
  )
}

function ChipSelect({ label, hint, required, options, selected, error, onToggle }) {
  const errId = 'tp-focus-err'
  return (
    <div className={`tp-fld tp-chips ${error ? 'is-invalid' : ''}`}>
      <span className="tp-fld__label-static">
        {label}{required && <span aria-hidden="true" className="tp-fld__req"> *</span>}
      </span>
      <div
        className="tp-chips__row"
        role="group"
        aria-label={label}
        aria-describedby={error ? errId : undefined}
      >
        {options.map(opt => {
          const on = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              className={`tp-chips__btn ${on ? 'is-on' : ''}`}
              aria-pressed={on}
              onClick={() => onToggle(opt)}
            >
              <span className="tp-chips__check" aria-hidden="true">
                {on
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6" /></svg>
                  : null}
              </span>
              {opt}
            </button>
          )
        })}
      </div>
      {error
        ? <span className="tp-fld__err" id={errId}>{error}</span>
        : hint ? <span className="tp-fld__hint">{hint}</span> : null}
      <style>{`
        .tp-chips__row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tp-chips__btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          font-size: 12.5px;
          font-weight: 700;
          color: var(--navy);
          background: var(--white);
          border: 1.5px solid rgba(13, 33, 55, 0.15);
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
          line-height: 1.2;
        }
        .tp-chips__btn:hover { border-color: rgba(91, 45, 142, 0.4); }
        .tp-chips__btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.2);
        }
        .tp-chips__btn.is-on {
          background: linear-gradient(135deg, var(--purple), var(--navy));
          color: var(--white);
          border-color: transparent;
          box-shadow: 0 8px 18px rgba(91, 45, 142, 0.28);
        }
        .tp-chips__check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
          color: var(--white);
        }
        .tp-chips__btn:not(.is-on) .tp-chips__check {
          background: rgba(13, 33, 55, 0.06);
          color: transparent;
        }
        .tp-chips__check svg { width: 10px; height: 10px; }
      `}</style>
      <FieldStyles />
    </div>
  )
}

function RadioGroup({ label, name, options, value, error, onChange, required }) {
  const errId = `tp-${name}-err`
  return (
    <div className={`tp-fld ${error ? 'is-invalid' : ''}`}>
      <span className="tp-fld__label-static">
        {label}{required && <span aria-hidden="true" className="tp-fld__req"> *</span>}
      </span>
      <div
        className="tp-radio__row"
        role="radiogroup"
        aria-label={label}
        aria-describedby={error ? errId : undefined}
      >
        {options.map(opt => {
          const id = `tp-${name}-${opt.replace(/\s+/g, '-').toLowerCase()}`
          const on = value === opt
          return (
            <label key={opt} htmlFor={id} className={`tp-radio ${on ? 'is-on' : ''}`}>
              <input
                id={id} type="radio"
                name={name} value={opt}
                checked={on}
                onChange={onChange}
              />
              <span className="tp-radio__dot" aria-hidden="true" />
              <span>{opt}</span>
            </label>
          )
        })}
      </div>
      {error && <span className="tp-fld__err" id={errId}>{error}</span>}
      <style>{`
        .tp-radio__row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        @media (min-width: 520px) {
          .tp-radio__row { flex-direction: row; flex-wrap: wrap; gap: 10px; }
        }
        .tp-radio {
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
        .tp-radio:hover { border-color: rgba(91, 45, 142, 0.32); }
        .tp-radio.is-on {
          border-color: var(--purple);
          box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.14);
          background: rgba(91, 45, 142, 0.04);
        }
        .tp-radio input { position: absolute; opacity: 0; pointer-events: none; }
        .tp-radio__dot {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(13, 33, 55, 0.2);
          background: var(--white);
          position: relative;
          transition: border-color 0.18s ease;
        }
        .tp-radio.is-on .tp-radio__dot { border-color: var(--purple); }
        .tp-radio.is-on .tp-radio__dot::after {
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
      .tp-fld { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
      .tp-fld label, .tp-fld__label-static {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1.6px;
        text-transform: uppercase;
        color: var(--navy);
      }
      .tp-fld label span, .tp-fld__req { color: var(--orange); }
      .tp-fld input, .tp-fld select, .tp-fld textarea {
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
      .tp-fld textarea { resize: vertical; min-height: 88px; line-height: 1.5; }
      .tp-fld input:focus, .tp-fld select:focus, .tp-fld textarea:focus {
        outline: none;
        border-color: var(--purple);
        box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.18);
      }
      .tp-fld__hint { font-size: 11.5px; color: rgba(13, 33, 55, 0.55); }
      .tp-fld__err  { font-size: 12px; color: var(--orange); font-weight: 700; }
      .tp-fld.is-invalid input,
      .tp-fld.is-invalid select,
      .tp-fld.is-invalid textarea {
        border-color: var(--orange);
        box-shadow: 0 0 0 3px rgba(224, 90, 30, 0.12);
      }
      .tp-fld--sel select {
        appearance: none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1l5 5 5-5' stroke='%230D2137' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>");
        background-repeat: no-repeat;
        background-position: right 14px center;
        padding-right: 38px;
      }
    `}</style>
  )
}

// ---- FAQ --------------------------------------------------------------------

function FAQBand() {
  const [openIdx, setOpenIdx] = useState(0)
  return (
    <section className="tp-faq">
      <div className="tp-faq__bg" aria-hidden="true">
        <span className="tp-faq__orb tp-faq__orb--purple" />
        <span className="tp-faq__orb tp-faq__orb--gold" />
      </div>
      <div className="site-container tp-faq__inner">
        <SectionHeader
          tone="light"
          eyebrow="Frequently Asked"
          title={<>The five questions <em>buyers ask first</em>.</>}
          subtitle="If yours is not here, message us on WhatsApp and we will answer directly — usually within the working day."
        />

        <ul className="tp-faq__list">
          {FAQ.map((item, i) => {
            const open = openIdx === i
            return (
              <li key={i} className={`tp-fq ${open ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="tp-fq__q"
                  aria-expanded={open}
                  onClick={() => setOpenIdx(open ? -1 : i)}
                >
                  <span>{item.q}</span>
                  <span className="tp-fq__icon" aria-hidden="true">{open ? '−' : '+'}</span>
                </button>
                <div className="tp-fq__a" role="region" aria-hidden={!open}>
                  <p>{item.a}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <style>{`
        .tp-faq {
          position: relative;
          padding: 100px 0 110px;
          background:
            radial-gradient(ellipse at 12% 0%, rgba(91, 45, 142, 0.36) 0%, transparent 55%),
            radial-gradient(ellipse at 88% 100%, rgba(201, 168, 76, 0.18) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
          isolation: isolate;
        }
        .tp-faq__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .tp-faq__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.42; }
        .tp-faq__orb--purple { width: 460px; height: 460px; top: -160px; left: -140px; background: radial-gradient(circle, rgba(122, 71, 184, 0.5), transparent 70%); }
        .tp-faq__orb--gold   { width: 420px; height: 420px; bottom: -160px; right: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.35), transparent 70%); }
        .tp-faq__inner { position: relative; z-index: 1; }

        .tp-faq__list {
          list-style: none;
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tp-fq {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .tp-fq.is-open {
          border-color: rgba(201, 168, 76, 0.42);
          background: rgba(255, 255, 255, 0.05);
        }
        .tp-fq__q {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          background: transparent;
          border: 0;
          cursor: pointer;
          color: var(--white);
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          text-align: left;
          letter-spacing: -0.1px;
          min-width: 0;
        }
        .tp-fq__q:focus-visible {
          outline: none;
          box-shadow: inset 0 0 0 2px rgba(201, 168, 76, 0.4);
          border-radius: 14px;
        }
        .tp-fq__icon {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(201, 168, 76, 0.15);
          color: var(--gold);
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }
        .tp-fq__a {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }
        .tp-fq.is-open .tp-fq__a { max-height: 460px; }
        .tp-fq__a p {
          padding: 0 22px 20px;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.78);
        }
      `}</style>
    </section>
  )
}

// ---- Final CTA --------------------------------------------------------------

function FinalCTABand() {
  return (
    <section className="tp-final">
      <div className="site-container">
        <div className="tp-final__card">
          <div className="tp-final__copy">
            <span className="tp-final__eyebrow">Two ways in</span>
            <h3>Ready to scope a training engagement?</h3>
            <p>
              Send a written brief and we&rsquo;ll respond with a proposal —
              or jump straight on a 30-minute discovery call if it&rsquo;s
              easier to talk it through. Either route gets you to the same
              place.
            </p>
          </div>
          <div className="tp-final__ctas">
            <CTAButton href="#proposal" variant="gold" size="lg">
              Request a Proposal
            </CTAButton>
            <CTAButton to={DISCOVERY_CALL_URL} variant="outline-light" size="lg" arrow={false}>
              Book a Discovery Call
            </CTAButton>
          </div>
        </div>
      </div>

      <style>{`
        .tp-final {
          padding: 72px 0 120px;
          background:
            radial-gradient(ellipse at 90% 0%, rgba(201, 168, 76, 0.25) 0%, transparent 55%),
            radial-gradient(ellipse at 10% 100%, rgba(91, 45, 142, 0.4) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
        }
        .tp-final__card {
          padding: 34px 26px;
          border-radius: 22px;
          background:
            radial-gradient(ellipse at 0% 0%, rgba(201, 168, 76, 0.25), transparent 60%),
            linear-gradient(135deg, rgba(91, 45, 142, 0.55), rgba(13, 33, 55, 0.6));
          border: 1px solid rgba(201, 168, 76, 0.32);
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: stretch;
        }
        .tp-final__card > * { min-width: 0; }
        @media (min-width: 960px) {
          .tp-final__card {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 44px 52px;
            gap: 40px;
          }
        }

        .tp-final__eyebrow {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 10px;
        }

        .tp-final__copy { max-width: 600px; }
        .tp-final h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(24px, 3.4vw, 32px);
          color: var(--white);
          letter-spacing: -0.3px;
          margin-bottom: 10px;
        }
        .tp-final p {
          font-size: 14.5px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.78);
        }

        .tp-final__ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tp-final__ctas .cta { white-space: normal; text-align: center; line-height: 1.25; }
        @media (min-width: 520px) {
          .tp-final__ctas { flex-direction: row; flex-wrap: wrap; }
          .tp-final__ctas .cta { white-space: nowrap; }
        }
        @media (min-width: 960px) { .tp-final__ctas { flex-direction: column; align-items: stretch; } }
      `}</style>
    </section>
  )
}
