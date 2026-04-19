import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SectionHeader from '../components/ui/SectionHeader'
import CTAButton from '../components/ui/CTAButton'

/**
 * /programmes — dedicated landing page for The Purposeful Entrepreneur
 * Programme.
 *
 * Composition (built across Steps 12.1–12.6):
 *   12.1 · Hero band                    ← this step
 *   12.2 · Who It's For + Curriculum
 *   12.3 · Walk-away benefits + Faculty
 *   12.4 · Cohort timeline
 *   12.5 · Application form (#apply) with Apply ↔ Waitlist toggle
 *   12.6 · FAQ + final CTA
 *
 * PLACEHOLDER values to replace post-launch:
 *   - PROGRAMME.cohortSize (exact cap)
 *   - PROGRAMME.nextCohortStart (real start date once a cohort fills)
 *   - Pricing remains hidden by design ("fees available on application")
 */

const PROGRAMME = {
  name:            'The Purposeful Entrepreneur Programme',
  cohortSize:      '10–30 founders',                      // PLACEHOLDER: confirm exact cap
  duration:        '8–12 weeks',
  format:          'Live on Zoom',
  nextCohortStart: 'Rolling admission',                   // PLACEHOLDER: confirm start date once a cohort fills
}

// Who it's for — 5 archetypes (expanded from the plan with a recognition line)
const AUDIENCE = [
  {
    title: 'You have an idea ready to build',
    line:  'You have turned the same business idea over for months — now you want a structured path from concept to first paying customer.',
  },
  {
    title: 'You are in your first 1–3 years',
    line:  'You have launched, you are making some revenue, but the foundations still feel fragile. You want the fundamentals locked in before you scale.',
  },
  {
    title: 'You have hit a growth ceiling',
    line:  'Revenue has plateaued, the team is stretched and the old playbook has stopped working. You need new frameworks, not louder effort.',
  },
  {
    title: 'You want faith and business aligned',
    line:  'You are done splitting Monday from Sunday. You want a business strategy that honours your calling without apologising for either.',
  },
  {
    title: 'You are leaving employment for entrepreneurship',
    line:  'You have a salary, a plan and a growing conviction it is time. You want a runway, a roadmap and people who have done the jump before.',
  },
]

// Walk-away benefits — same 7 items as the plan, condensed to a single line each
// so the tone differs from the larger cards on /lady-adel#programme.
const BENEFITS = [
  { title: 'Structured curriculum',          line: 'Finance, brand, sales, leadership, systems and scaling — in the order a growing business needs them.' },
  { title: 'Frameworks & templates',         line: 'Practical tools, worksheets and one-pagers you can lift straight into your business.' },
  { title: 'Mentorship',                     line: 'Direct access to experienced entrepreneurs and industry experts for the questions your own team cannot answer yet.' },
  { title: 'Strategic contacts',             line: 'Curated introductions to networks, investors and partners relevant to your sector — not a generic address book.' },
  { title: 'Peer cohort',                    line: 'A small group of like-minded founders for real accountability, honest feedback and lasting collaboration.' },
  { title: 'Accountability structure',       line: 'Check-ins, goal tracking and progress reviews — so momentum is measured, not hoped for.' },
  { title: 'Certificate of completion',      line: 'A recognised participation certificate from IWC Concepts — something tangible for your LinkedIn and your wall.' },
]

// FAQ — 5 items, mirrors the plan (also used on /lady-adel#programme)
const FAQ = [
  {
    q: 'Who is this programme for?',
    a: 'Entrepreneurs, startups, growing business owners and faith-driven professionals who want to build with purpose and strategy — not just inspiration. See the "Who It Is For" section above for the five archetypes we build each cohort around.',
  },
  {
    q: 'How many people are in each cohort?',
    a: 'Cohorts are limited to between 10 and 30 founders to protect personal attention and the quality of peer engagement. Exact numbers are confirmed during the application review so we can keep the mix balanced across sectors and stages.',
  },
  {
    q: 'Is it online or in-person?',
    a: 'Primarily online via Zoom — weekly live sessions of 1.5 to 2 hours — with the possibility of in-person intensive sessions for cohorts based in the same region (typically Accra or Lagos). All sessions are recorded for cohort members.',
  },
  {
    q: 'What does the programme cost?',
    a: 'Fees are available on application. This lets us confirm fit, tailor what is included for your stage of business and offer the most relevant tier — rather than publishing a number that suits no one exactly. Payment plans are available.',
  },
  {
    q: 'When does the next cohort start?',
    a: 'Applications are open on a rolling basis. Once a cohort fills, the next start date is announced and successful applicants are notified directly — apply early as spots fill fast and interviews are scheduled as applications come in.',
  },
]

// Business-stage options for the Apply form
const BUSINESS_STAGE = [
  'Idea stage',
  '0–1 year',
  '1–3 years',
  '3+ years',
  'Transitioning from employment',
]

// Pre-filled WhatsApp number for the success-state handoff CTA.
// TODO: replace with the real business WhatsApp once confirmed.
const WHATSAPP_NUMBER = '233000000000'

// Initial form state — all fields reset to empty
const INITIAL_APPLY = {
  name: '', email: '', whatsapp: '',
  country: '', organisation: '',
  stage: '', sector: '', website: '',
  problem: '', goal: '', why: '',
}
const INITIAL_WAITLIST = {
  name: '', email: '', whatsapp: '',
  country: '', about: '',
}

// Cohort timeline — 4-step flow from application to start
const TIMELINE = [
  {
    step:    '01',
    label:   'Apply',
    title:   'Submit your application',
    detail:  'Takes around 5–10 minutes. Tell us about your business, your stage and what you want from the cohort. No pitch deck required.',
  },
  {
    step:    '02',
    label:   'Interview',
    title:   'Short interview call',
    detail:  '20–30 minutes with the programme team. A two-way fit check — you learn what to expect, we confirm you are ready for this stage of the journey.',
  },
  {
    step:    '03',
    label:   'Onboarding',
    title:   'Welcome & pre-work',
    detail:  'Once confirmed, you receive the welcome pack, the Zoom schedule and the Week 1 pre-work so you walk into the first session already warm.',
  },
  {
    step:    '04',
    label:   'Cohort',
    title:   'Cohort starts',
    detail:  'Weekly live sessions with Lady Adel and the faculty panel. Frameworks, homework, accountability partners, peer review — the full 8–12 weeks.',
  },
]

// Faculty — PLACEHOLDER cards. Real lineup confirmed pre-launch.
const FACULTY = [
  {
    initials: 'LA',
    name:     'Apostle Adelaide (Lady Adel) Clottey',
    role:     'Programme Lead · Founder, IWC Concepts',
    bio:      'Ten years in banking and finance, now leading IWC Concepts. Anchors every cohort in the strategic, spiritual and financial frameworks that have shaped her own journey.',
    accent:   'purple',
    placeholder: false,
  },
  {
    initials: '—',
    name:     'Finance & Strategy Faculty',
    role:     'To be announced',
    bio:      'Senior operators who have run finance and strategy inside growth-stage African and diaspora businesses. Leads the Finance, Numbers and Scaling modules.',
    accent:   'gold',
    placeholder: true,
  },
  {
    initials: '—',
    name:     'Brand, Sales & Growth Faculty',
    role:     'To be announced',
    bio:      'Practitioners with live P&L responsibility for customer acquisition — not agency decks. Leads the Brand, Positioning, Sales and Growth modules.',
    accent:   'orange',
    placeholder: true,
  },
  {
    initials: '—',
    name:     'Leadership & Systems Faculty',
    role:     'To be announced',
    bio:      'Founders and operators who have scaled teams through the painful middle. Leads the Leadership, Team and Systems & Operations modules.',
    accent:   'navy',
    placeholder: true,
  },
]

// Curriculum — 8 weekly modules (PLACEHOLDER: indicative, not the final schedule)
const CURRICULUM = [
  {
    week: 'W1',
    title: 'Foundations & Purpose',
    points: [
      'Clarify your business vision, mission and non-negotiables',
      'Diagnose where you are today — honestly',
      'Set a measurable 12-week outcome',
    ],
  },
  {
    week: 'W2',
    title: 'Finance & Numbers',
    points: [
      'Read your P&L, cash flow and runway with confidence',
      'Price for profit — not for panic',
      'Build a 12-month financial model you can defend',
    ],
  },
  {
    week: 'W3',
    title: 'Brand & Positioning',
    points: [
      'Sharpen your niche until the right buyer self-identifies',
      'Write the one-line positioning statement',
      'Audit and upgrade the customer-facing surface area',
    ],
  },
  {
    week: 'W4',
    title: 'Sales & Growth',
    points: [
      'Design a repeatable outbound + inbound motion',
      'Handle objections and close with conviction',
      'Build the pipeline metrics that actually predict revenue',
    ],
  },
  {
    week: 'W5',
    title: 'Leadership & Team',
    points: [
      'Lead yourself before you lead anyone else',
      'Hire your next 2–3 roles with a scorecard, not vibes',
      'Run a weekly rhythm that keeps the team aligned',
    ],
  },
  {
    week: 'W6',
    title: 'Systems & Operations',
    points: [
      'Map and document the core revenue workflow',
      'Choose the tools that remove friction, not add it',
      'Build dashboards for the 3 numbers that matter most',
    ],
  },
  {
    week: 'W7',
    title: 'Scaling & Capital',
    points: [
      'Decide whether to bootstrap, borrow or raise — with clarity',
      'Prepare the documents investors or lenders actually read',
      'Sequence growth without breaking the business',
    ],
  },
  {
    week: 'W8',
    title: 'Pitch Day · Business Review',
    points: [
      'Present your business to the cohort and faculty panel',
      'Receive structured written and live feedback',
      'Leave with a 90-day post-programme action plan',
    ],
  },
]

// ---- Page -------------------------------------------------------------------

export default function ProgrammesPage() {
  const location = useLocation()
  useEffect(() => {
    if (location.hash) return
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [location.hash, location.pathname])

  return (
    <>
      <Navbar />
      <main>
        <ProgrammesHero />
        <WhoItsForBand />
        <CurriculumBand />
        <WalkAwayBand />
        <FacultyBand />
        <TimelineBand />
        <ApplyBand />
        <FAQBand />
        <FinalCTABand />
      </main>
      <Footer />
    </>
  )
}

// ---- Hero -------------------------------------------------------------------

function ProgrammesHero() {
  return (
    <section className="pp-hero">
      <div className="pp-hero__bg" aria-hidden="true">
        <span className="pp-hero__orb pp-hero__orb--orange" />
        <span className="pp-hero__orb pp-hero__orb--gold" />
        <span className="pp-hero__grid" />
      </div>

      <div className="site-container pp-hero__inner">
        <span className="pp-hero__eyebrow">
          <span className="pp-hero__pulse" aria-hidden="true" />
          Applications open — rolling admission
        </span>
        <h1 className="pp-hero__title">
          The <em>Purposeful Entrepreneur</em> Programme
        </h1>
        <p className="pp-hero__lede">
          A cohort-based growth programme for founders who want frameworks,
          mentors and a clear path to building businesses that are profitable,
          purposeful and built to last.
        </p>

        <dl className="pp-hero__snap">
          <div><dt>Cohort size</dt><dd>{PROGRAMME.cohortSize}</dd></div>
          <div><dt>Duration</dt><dd>{PROGRAMME.duration}</dd></div>
          <div><dt>Format</dt><dd>{PROGRAMME.format}</dd></div>
          <div><dt>Next cohort</dt><dd>{PROGRAMME.nextCohortStart}</dd></div>
        </dl>

        <div className="pp-hero__ctas">
          <CTAButton href="#apply" variant="primary" size="lg">
            Apply now
          </CTAButton>
          <CTAButton href="#apply" variant="outline-light" size="lg" arrow={false}>
            Join the waitlist
          </CTAButton>
        </div>

        <p className="pp-hero__note">
          Fees available on application · Faith · Business · Impact
        </p>
      </div>

      <style>{`
        .pp-hero {
          position: relative;
          padding: 120px 0 90px;
          background:
            radial-gradient(ellipse at 85% 0%, rgba(224, 90, 30, 0.28) 0%, transparent 55%),
            radial-gradient(ellipse at 15% 100%, rgba(201, 168, 76, 0.18) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
          isolation: isolate;
        }
        .pp-hero__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .pp-hero__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.55; }
        .pp-hero__orb--orange { width: 520px; height: 520px; top: -180px; right: -160px; background: radial-gradient(circle, rgba(224, 90, 30, 0.4), transparent 70%); }
        .pp-hero__orb--gold   { width: 440px; height: 440px; bottom: -180px; left: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.35), transparent 70%); }
        .pp-hero__grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse at center, black 25%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 25%, transparent 75%);
          opacity: 0.5;
        }

        .pp-hero__inner { position: relative; z-index: 1; text-align: center; max-width: 880px; }

        .pp-hero__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          color: var(--orange);
          padding: 7px 14px;
          background: rgba(224, 90, 30, 0.14);
          border: 1px solid rgba(224, 90, 30, 0.36);
          border-radius: 999px;
          margin-bottom: 22px;
        }
        .pp-hero__pulse {
          width: 8px; height: 8px;
          background: var(--orange);
          border-radius: 50%;
          animation: ppPulseOrange 1.8s infinite;
        }
        @keyframes ppPulseOrange {
          0%   { box-shadow: 0 0 0 0 rgba(224, 90, 30, 0.7); }
          70%  { box-shadow: 0 0 0 8px rgba(224, 90, 30, 0); }
          100% { box-shadow: 0 0 0 0 rgba(224, 90, 30, 0); }
        }

        .pp-hero__title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(38px, 6.4vw, 70px);
          line-height: 1.05;
          letter-spacing: -1.4px;
          margin-bottom: 18px;
        }
        .pp-hero__title em { font-style: italic; color: var(--gold); }

        .pp-hero__lede {
          max-width: 680px;
          margin: 0 auto 38px;
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.82);
        }

        .pp-hero__snap {
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
          .pp-hero__snap {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 24px;
            padding: 22px 30px;
            text-align: center;
          }
        }
        .pp-hero__snap > div { min-width: 0; }
        .pp-hero__snap dt {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 4px;
        }
        .pp-hero__snap dd {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.92);
          line-height: 1.4;
        }

        .pp-hero__ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 460px;
          margin: 0 auto 22px;
        }
        .pp-hero__ctas .cta { white-space: normal; text-align: center; line-height: 1.25; }
        @media (min-width: 520px) {
          .pp-hero__ctas {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            max-width: none;
          }
          .pp-hero__ctas .cta { white-space: nowrap; }
        }

        .pp-hero__note {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </section>
  )
}

// ---- Who It's For -----------------------------------------------------------

function WhoItsForBand() {
  return (
    <section className="pp-who site-section">
      <div className="site-container">
        <SectionHeader
          eyebrow="Who It Is For"
          title={<>Built for founders at a <em>specific moment</em> in the journey.</>}
          subtitle="This programme is deliberately selective. If one of the five profiles below reads like your own life, you are exactly who we built it for."
        />

        <ul className="pp-who__grid">
          {AUDIENCE.map((a, i) => (
            <li key={a.title} className="pp-who__card">
              <span className="pp-who__n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{a.title}</h3>
              <p className="pp-who__line">
                <span className="pp-who__prefix">You&rsquo;ll recognise yourself if…</span>
                {a.line}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .pp-who { background: var(--cream); color: var(--ink); }

        .pp-who__grid {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 16px;
        }
        @media (min-width: 720px)  { .pp-who__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; } }
        @media (min-width: 1080px) { .pp-who__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        .pp-who__card {
          position: relative;
          padding: 24px 22px 26px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 12px 28px rgba(13, 33, 55, 0.05);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          min-width: 0;
        }
        .pp-who__card:hover {
          transform: translateY(-3px);
          border-color: rgba(201, 168, 76, 0.42);
          box-shadow: 0 22px 48px rgba(13, 33, 55, 0.09);
        }
        /* 5-across never happens, but keep the 5th card centred on the 3-col row */
        @media (min-width: 1080px) {
          .pp-who__card:nth-child(4) { grid-column: 1 / span 1; }
        }

        .pp-who__n {
          display: inline-block;
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 15px;
          letter-spacing: 1.5px;
          color: var(--gold-dark);
          margin-bottom: 10px;
        }
        .pp-who__card h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 19px;
          color: var(--navy);
          line-height: 1.25;
          letter-spacing: -0.3px;
          margin-bottom: 10px;
        }
        .pp-who__line {
          font-size: 14px;
          line-height: 1.65;
          color: rgba(13, 33, 55, 0.74);
        }
        .pp-who__prefix {
          display: block;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: var(--purple);
          margin-bottom: 6px;
        }
      `}</style>
    </section>
  )
}

// ---- Curriculum -------------------------------------------------------------

function CurriculumBand() {
  return (
    <section className="pp-curric site-section">
      <div className="site-container">
        <SectionHeader
          eyebrow="Curriculum"
          title={<>Eight weeks. <em>One disciplined</em> path.</>}
          subtitle="A deliberate sequence — foundations before finance, finance before growth, growth before scaling. Each week is a live session with pre-work, frameworks and a tangible outcome."
        />

        <div className="pp-curric__note" role="note">
          <strong>Indicative schedule.</strong>
          The week-by-week outline below is the standard cohort structure.
          Final session dates, guest faculty and focus areas are confirmed
          for each cohort after applications close.
        </div>

        <ol className="pp-curric__grid">
          {CURRICULUM.map(mod => (
            <li key={mod.week} className="pp-mod">
              <span className="pp-mod__week">{mod.week}</span>
              <h3>{mod.title}</h3>
              <ul className="pp-mod__points">
                {mod.points.map(p => (
                  <li key={p}>
                    <span className="pp-mod__bullet" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <style>{`
        .pp-curric { background: var(--white); color: var(--ink); }

        .pp-curric__note {
          max-width: 760px;
          margin: 0 auto 40px;
          padding: 14px 18px;
          background: rgba(201, 168, 76, 0.1);
          border: 1px dashed rgba(201, 168, 76, 0.5);
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(13, 33, 55, 0.78);
          text-align: center;
        }
        .pp-curric__note strong { color: var(--navy); margin-right: 4px; }

        .pp-curric__grid {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 16px;
          counter-reset: none;
        }
        @media (min-width: 720px)  { .pp-curric__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1080px) { .pp-curric__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

        .pp-mod {
          position: relative;
          padding: 22px 22px 24px;
          background: var(--cream);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          min-width: 0;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pp-mod:hover {
          transform: translateY(-3px);
          border-color: rgba(91, 45, 142, 0.32);
          box-shadow: 0 18px 38px rgba(13, 33, 55, 0.08);
        }

        .pp-mod__week {
          align-self: flex-start;
          padding: 5px 12px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--white);
          background: linear-gradient(135deg, var(--purple), var(--navy));
          border-radius: 999px;
        }
        .pp-mod h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 17px;
          line-height: 1.25;
          letter-spacing: -0.2px;
          color: var(--navy);
        }
        .pp-mod__points {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pp-mod__points li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          line-height: 1.55;
          color: rgba(13, 33, 55, 0.78);
        }
        .pp-mod__bullet {
          flex-shrink: 0;
          width: 6px;
          height: 6px;
          margin-top: 7px;
          background: var(--gold);
          border-radius: 50%;
        }
      `}</style>
    </section>
  )
}

// ---- What you walk away with ------------------------------------------------

function WalkAwayBand() {
  return (
    <section className="pp-walk">
      <div className="pp-walk__bg" aria-hidden="true">
        <span className="pp-walk__orb pp-walk__orb--purple" />
        <span className="pp-walk__orb pp-walk__orb--gold" />
      </div>
      <div className="site-container pp-walk__inner">
        <SectionHeader
          tone="light"
          eyebrow="What You Walk Away With"
          title={<>Seven things that <em>stay with you</em> after the cohort ends.</>}
          subtitle="We optimise for what you can still use six months later — not for the high of the final session. Each item below is built into the programme by design."
        />

        <ul className="pp-walk__list">
          {BENEFITS.map((b, i) => (
            <li key={b.title} className="pp-walk__row">
              <span className="pp-walk__n">{String(i + 1).padStart(2, '0')}</span>
              <div className="pp-walk__body">
                <h3>{b.title}</h3>
                <p>{b.line}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .pp-walk {
          position: relative;
          padding: 100px 0 110px;
          background:
            radial-gradient(ellipse at 12% 0%, rgba(91, 45, 142, 0.38) 0%, transparent 55%),
            radial-gradient(ellipse at 88% 100%, rgba(201, 168, 76, 0.16) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
          isolation: isolate;
        }
        .pp-walk__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .pp-walk__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.45; }
        .pp-walk__orb--purple { width: 500px; height: 500px; top: -180px; left: -160px; background: radial-gradient(circle, rgba(122, 71, 184, 0.5), transparent 70%); }
        .pp-walk__orb--gold   { width: 420px; height: 420px; bottom: -160px; right: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.35), transparent 70%); }
        .pp-walk__inner { position: relative; z-index: 1; }

        .pp-walk__list {
          list-style: none;
          max-width: 860px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 2px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.06);
        }
        .pp-walk__row {
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr);
          gap: 18px;
          padding: 20px 22px;
          background: linear-gradient(160deg, rgba(13, 33, 55, 0.65), rgba(13, 33, 55, 0.4));
          align-items: start;
          transition: background 0.22s ease, transform 0.22s ease;
        }
        .pp-walk__row:hover { background: linear-gradient(160deg, rgba(91, 45, 142, 0.35), rgba(13, 33, 55, 0.4)); }
        @media (min-width: 720px) {
          .pp-walk__row { grid-template-columns: 72px minmax(0, 1fr); padding: 24px 32px; gap: 22px; }
        }

        .pp-walk__n {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 28px;
          line-height: 1;
          letter-spacing: -0.5px;
          color: var(--gold);
          padding-top: 2px;
        }
        @media (min-width: 720px) { .pp-walk__n { font-size: 34px; } }

        .pp-walk__body { min-width: 0; }
        .pp-walk__body h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 17px;
          line-height: 1.25;
          letter-spacing: -0.2px;
          color: var(--white);
          margin-bottom: 4px;
        }
        @media (min-width: 720px) { .pp-walk__body h3 { font-size: 19px; } }
        .pp-walk__body p {
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.74);
        }
        @media (min-width: 720px) { .pp-walk__body p { font-size: 14.5px; } }
      `}</style>
    </section>
  )
}

// ---- Faculty / mentors ------------------------------------------------------

function FacultyBand() {
  return (
    <section className="pp-fac site-section">
      <div className="site-container">
        <SectionHeader
          eyebrow="Faculty & Mentors"
          title={<>A <em>multidisciplinary</em> faculty, one table.</>}
          subtitle="Every cohort is led by Lady Adel and supported by a small panel of senior operators — finance, brand, sales, leadership, systems. Real practitioners with live P&L responsibility."
        />

        <div className="pp-fac__note" role="note">
          <strong>Faculty panel — placeholder.</strong>
          The three specialist tracks below are being finalised. Confirmed
          faculty names, photos and session ownership will be announced to
          applicants during the interview stage.
        </div>

        <ul className="pp-fac__grid">
          {FACULTY.map(f => (
            <li key={f.name} className={`pp-fac__card pp-fac__card--${f.accent}`}>
              {f.placeholder && <span className="pp-fac__tbd">Placeholder</span>}
              <div className="pp-fac__avatar" aria-hidden="true">
                <span>{f.initials}</span>
              </div>
              <h3>{f.name}</h3>
              <p className="pp-fac__role">{f.role}</p>
              <p className="pp-fac__bio">{f.bio}</p>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .pp-fac { background: var(--cream); color: var(--ink); }

        .pp-fac__note {
          max-width: 760px;
          margin: 0 auto 40px;
          padding: 14px 18px;
          background: var(--white);
          border: 1px dashed rgba(91, 45, 142, 0.4);
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(13, 33, 55, 0.78);
          text-align: center;
        }
        .pp-fac__note strong { color: var(--purple); margin-right: 4px; }

        .pp-fac__grid {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 18px;
        }
        @media (min-width: 720px)  { .pp-fac__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1080px) { .pp-fac__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

        .pp-fac__card {
          position: relative;
          padding: 26px 22px 24px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 12px 28px rgba(13, 33, 55, 0.06);
          min-width: 0;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .pp-fac__card:hover {
          transform: translateY(-4px);
          border-color: rgba(201, 168, 76, 0.42);
          box-shadow: 0 22px 48px rgba(13, 33, 55, 0.1);
        }

        .pp-fac__tbd {
          position: absolute;
          top: 14px;
          right: 14px;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--orange);
          background: rgba(224, 90, 30, 0.1);
          border: 1px solid rgba(224, 90, 30, 0.32);
          padding: 3px 8px;
          border-radius: 999px;
        }

        .pp-fac__avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          font-family: var(--font-display);
          font-weight: 900;
          font-style: italic;
          font-size: 22px;
          letter-spacing: 1px;
          color: var(--white);
          box-shadow: inset 0 -8px 20px rgba(0, 0, 0, 0.18);
        }
        .pp-fac__card--purple .pp-fac__avatar { background: linear-gradient(135deg, var(--purple), var(--navy)); }
        .pp-fac__card--gold   .pp-fac__avatar { background: linear-gradient(135deg, var(--gold), var(--gold-dark)); color: var(--navy); }
        .pp-fac__card--orange .pp-fac__avatar { background: linear-gradient(135deg, var(--orange), var(--orange-dark)); }
        .pp-fac__card--navy   .pp-fac__avatar { background: linear-gradient(135deg, #1a3a5f, var(--navy)); }

        .pp-fac__card h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 16.5px;
          line-height: 1.25;
          letter-spacing: -0.2px;
          color: var(--navy);
          margin-bottom: 4px;
        }
        .pp-fac__role {
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: var(--purple);
          margin-bottom: 12px;
        }
        .pp-fac__bio {
          font-size: 13px;
          line-height: 1.6;
          color: rgba(13, 33, 55, 0.74);
        }
      `}</style>
    </section>
  )
}

// ---- Cohort timeline --------------------------------------------------------

function TimelineBand() {
  return (
    <section className="pp-tl site-section">
      <div className="site-container">
        <SectionHeader
          eyebrow="From Application to Cohort"
          title={<>Four steps between <em>apply</em> and <em>start</em>.</>}
          subtitle="We run on rolling admission — applications are reviewed as they come in, not batched. Most applicants move from application to the first live session in two to four weeks."
        />

        <ol className="pp-tl__list">
          {TIMELINE.map((t, i) => (
            <li key={t.step} className="pp-tl__item">
              <div className="pp-tl__marker" aria-hidden="true">
                <span className="pp-tl__dot" />
                {i < TIMELINE.length - 1 && <span className="pp-tl__line" />}
              </div>
              <div className="pp-tl__card">
                <div className="pp-tl__head">
                  <span className="pp-tl__step">Step {t.step}</span>
                  <span className="pp-tl__label">{t.label}</span>
                </div>
                <h3>{t.title}</h3>
                <p>{t.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="pp-tl__note">
          <span aria-hidden="true">●</span>
          Rolling admission — once a cohort fills, the next start date is
          announced and successful applicants are notified directly.
          Apply early; seats go fast.
        </p>
      </div>

      <style>{`
        .pp-tl { background: var(--white); color: var(--ink); }

        .pp-tl__list {
          list-style: none;
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .pp-tl__item {
          display: grid;
          grid-template-columns: 36px minmax(0, 1fr);
          gap: 18px;
          align-items: stretch;
        }
        @media (min-width: 720px) {
          .pp-tl__item { grid-template-columns: 56px minmax(0, 1fr); gap: 24px; }
        }

        .pp-tl__marker {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 24px;
        }
        .pp-tl__dot {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--gold);
          border: 3px solid var(--white);
          box-shadow: 0 0 0 2px var(--gold);
          z-index: 1;
        }
        .pp-tl__line {
          flex-grow: 1;
          width: 2px;
          background: linear-gradient(180deg, var(--gold) 0%, rgba(201, 168, 76, 0.2) 100%);
          margin-top: -2px;
        }

        .pp-tl__card {
          flex-grow: 1;
          padding: 20px 22px 24px;
          background: var(--cream);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          margin-bottom: 16px;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
          min-width: 0;
        }
        .pp-tl__card:hover {
          transform: translateY(-2px);
          border-color: rgba(201, 168, 76, 0.4);
          box-shadow: 0 18px 36px rgba(13, 33, 55, 0.07);
        }
        .pp-tl__item:last-child .pp-tl__card { margin-bottom: 0; }

        .pp-tl__head {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .pp-tl__step {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 1.5px;
          color: var(--gold-dark);
        }
        .pp-tl__label {
          padding: 3px 10px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: var(--white);
          background: var(--purple);
          border-radius: 999px;
        }
        .pp-tl__card h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 18px;
          line-height: 1.25;
          letter-spacing: -0.2px;
          color: var(--navy);
          margin-bottom: 6px;
        }
        .pp-tl__card p {
          font-size: 13.5px;
          line-height: 1.65;
          color: rgba(13, 33, 55, 0.74);
        }

        .pp-tl__note {
          max-width: 720px;
          margin: 40px auto 0;
          padding: 14px 18px;
          text-align: center;
          font-size: 12.5px;
          line-height: 1.65;
          color: rgba(13, 33, 55, 0.72);
          background: rgba(224, 90, 30, 0.06);
          border: 1px solid rgba(224, 90, 30, 0.28);
          border-radius: 999px;
        }
        .pp-tl__note span {
          display: inline-block;
          margin-right: 6px;
          color: var(--orange);
          animation: ppTlPulse 2s infinite;
        }
        @keyframes ppTlPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>
    </section>
  )
}

// ---- Application / Waitlist form --------------------------------------------

function ApplyBand() {
  const [mode, setMode] = useState('apply')       // 'apply' | 'waitlist'
  const [apply, setApply]       = useState(INITIAL_APPLY)
  const [waitlist, setWaitlist] = useState(INITIAL_WAITLIST)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')    // 'idle' | 'submitting' | 'success' | 'error'

  const isApply = mode === 'apply'
  const values  = isApply ? apply : waitlist
  const setVals = isApply ? setApply : setWaitlist

  function switchMode(next) {
    if (next === mode) return
    setMode(next)
    setErrors({})
    setStatus('idle')
  }

  function handleChange(e) {
    const { name, value } = e.target
    setVals(v => ({ ...v, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }))
  }

  function validate() {
    const er = {}
    if (!values.name.trim())  er.name  = 'Please enter your name.'
    if (!values.email.trim()) er.email = 'We need an email to reach you.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) er.email = 'That email does not look right.'

    if (isApply) {
      if (!values.whatsapp.trim()) er.whatsapp = 'WhatsApp helps us move fast on the interview.'
      if (!values.problem.trim())  er.problem  = 'Tell us the problem your business solves.'
      if (!values.goal.trim())     er.goal     = 'Share your #1 goal for the next 12 months.'
      if (!values.why.trim())      er.why      = 'Tell us why this cohort, why now.'
    }
    return er
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const er = validate()
    if (Object.keys(er).length > 0) { setErrors(er); return }
    setStatus('submitting')
    try {
      // TODO: wire to real backend (e.g. Formspree/Resend/custom endpoint).
      // eslint-disable-next-line no-console
      console.info(`[ProgrammesPage] ${mode} submitted`, values)
      await new Promise(r => setTimeout(r, 600))
      setStatus('success')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[ProgrammesPage] ${mode} submission failed`, err)
      setStatus('error')
    }
  }

  function reset() {
    setStatus('idle')
    setErrors({})
    if (isApply) setApply(INITIAL_APPLY)
    else setWaitlist(INITIAL_WAITLIST)
  }

  return (
    <section className="pp-apply" id="apply">
      <div className="site-container">
        <SectionHeader
          eyebrow={isApply ? 'Apply for the Cohort' : 'Join the Waitlist'}
          title={
            isApply
              ? <>Start your <em>application</em></>
              : <>Join the <em>waitlist</em></>
          }
          subtitle={
            isApply
              ? "Applications are reviewed rolling — no deadline. The long version below takes 10–15 minutes and tells us everything we need to schedule the interview."
              : "Not ready to commit? Leave your details and we'll tell you when applications open for the next cohort — or when a seat frees up in the current one."
          }
        />

        {/* Toggle */}
        <div className="pp-apply__toggle" role="tablist" aria-label="Application mode">
          <button
            type="button" role="tab"
            aria-selected={isApply}
            className={`pp-apply__tab ${isApply ? 'is-active' : ''}`}
            onClick={() => switchMode('apply')}
          >
            <span className="pp-apply__tab-label">Apply now</span>
            <span className="pp-apply__tab-hint">Full application · 10–15 min</span>
          </button>
          <button
            type="button" role="tab"
            aria-selected={!isApply}
            className={`pp-apply__tab ${!isApply ? 'is-active' : ''}`}
            onClick={() => switchMode('waitlist')}
          >
            <span className="pp-apply__tab-label">Join waitlist</span>
            <span className="pp-apply__tab-hint">Short form · under 1 min</span>
          </button>
        </div>

        <div className="pp-apply__form-wrap">
          {status === 'success' ? (
            <SuccessState mode={mode} onReset={reset} />
          ) : (
            <form className="pp-apply__form" noValidate onSubmit={handleSubmit}>
              {isApply ? (
                <>
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
                      label="WhatsApp number" name="whatsapp" type="tel" required
                      hint="Include country code, e.g. +233 55 000 0000"
                      value={values.whatsapp} error={errors.whatsapp}
                      onChange={handleChange} autoComplete="tel"
                    />
                    <Field
                      label="Country / City" name="country"
                      hint="Helps us plan cohort timezones"
                      value={values.country} error={errors.country}
                      onChange={handleChange} autoComplete="country-name"
                    />
                  </FormGroup>

                  <FormGroup title="About your business">
                    <Field
                      label="Organisation / Business name" name="organisation"
                      hint="Leave blank if you are still in idea stage"
                      value={values.organisation} error={errors.organisation}
                      onChange={handleChange} autoComplete="organization"
                    />
                    <SelectField
                      label="Business stage" name="stage"
                      placeholder="Pick the stage that fits"
                      options={BUSINESS_STAGE}
                      value={values.stage} error={errors.stage}
                      onChange={handleChange}
                    />
                    <Field
                      label="Business sector" name="sector"
                      hint="Freeform — e.g. fintech, fashion, agribusiness, coaching"
                      value={values.sector} error={errors.sector}
                      onChange={handleChange}
                    />
                    <Field
                      label="Website or primary social" name="website" type="url"
                      hint="Optional — any link where we can learn more"
                      value={values.website} error={errors.website}
                      onChange={handleChange}
                      placeholder="https://…"
                    />
                  </FormGroup>

                  <FormGroup title="Your story">
                    <TextAreaField
                      label="What problem does your business solve?" name="problem" required
                      rows={3}
                      value={values.problem} error={errors.problem}
                      onChange={handleChange}
                    />
                    <TextAreaField
                      label="Your #1 goal for the next 12 months" name="goal" required
                      rows={3}
                      value={values.goal} error={errors.goal}
                      onChange={handleChange}
                    />
                    <TextAreaField
                      label="Why this cohort, why now?" name="why" required
                      rows={3}
                      value={values.why} error={errors.why}
                      onChange={handleChange}
                    />
                  </FormGroup>
                </>
              ) : (
                <FormGroup title="Short form">
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
                    hint="Optional — for updates when a seat frees up"
                    value={values.whatsapp} error={errors.whatsapp}
                    onChange={handleChange} autoComplete="tel"
                  />
                  <Field
                    label="Country" name="country"
                    value={values.country} error={errors.country}
                    onChange={handleChange} autoComplete="country-name"
                  />
                  <TextAreaField
                    label="Tell us a little about your business" name="about"
                    rows={3}
                    hint="A sentence or two is enough"
                    value={values.about} error={errors.about}
                    onChange={handleChange}
                  />
                </FormGroup>
              )}

              <button
                type="submit"
                className="pp-apply__submit"
                disabled={status === 'submitting'}
              >
                {status === 'submitting'
                  ? (isApply ? 'Sending your application…' : 'Adding you to the list…')
                  : (isApply ? 'Submit application' : 'Join the waitlist')}
                {status !== 'submitting' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>

              <p className="pp-apply__privacy">
                We only use your details to review your application and contact
                you about the programme. No third-party sharing, no newsletters
                you did not ask for.
              </p>

              {status === 'error' && (
                <p className="pp-apply__error" role="alert">
                  Something went wrong sending your {isApply ? 'application' : 'waitlist request'}.
                  Please try again — or reach us on WhatsApp.
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      <style>{`
        .pp-apply { background: var(--cream); color: var(--ink); padding: 100px 0 110px; }

        /* Toggle */
        .pp-apply__toggle {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          max-width: 620px;
          margin: 0 auto 32px;
          padding: 8px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.1);
          border-radius: 999px;
          box-shadow: 0 12px 28px rgba(13, 33, 55, 0.06);
        }
        @media (min-width: 520px) { .pp-apply__toggle { gap: 6px; } }

        .pp-apply__tab {
          appearance: none;
          border: 0;
          background: transparent;
          padding: 10px 14px;
          border-radius: 999px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          color: var(--navy);
          transition: background 0.22s ease, color 0.22s ease, box-shadow 0.22s ease;
          min-width: 0;
        }
        .pp-apply__tab:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.3);
        }
        .pp-apply__tab.is-active {
          background: linear-gradient(135deg, var(--purple), var(--navy));
          color: var(--white);
          box-shadow: 0 10px 22px rgba(91, 45, 142, 0.28);
        }
        .pp-apply__tab-label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
        }
        .pp-apply__tab-hint {
          font-size: 10.5px;
          letter-spacing: 0.5px;
          opacity: 0.7;
        }

        /* Form container */
        .pp-apply__form-wrap {
          max-width: 720px;
          margin: 0 auto;
          padding: 28px 22px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 22px 60px rgba(13, 33, 55, 0.08);
          min-width: 0;
        }
        @media (min-width: 768px) { .pp-apply__form-wrap { padding: 40px 44px; } }

        .pp-apply__form { display: flex; flex-direction: column; gap: 28px; }

        .pp-apply__submit {
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
        .pp-apply__submit:hover:not(:disabled) {
          background: var(--orange-dark);
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(224, 90, 30, 0.38);
        }
        .pp-apply__submit:disabled { opacity: 0.65; cursor: not-allowed; }

        .pp-apply__privacy { font-size: 11.5px; line-height: 1.55; color: rgba(13, 33, 55, 0.55); }
        .pp-apply__error {
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(224, 90, 30, 0.08);
          border: 1px solid rgba(224, 90, 30, 0.3);
          color: var(--orange-dark);
          font-size: 13px;
        }
      `}</style>
    </section>
  )
}

// ---- Form helpers -----------------------------------------------------------

function FormGroup({ title, children }) {
  return (
    <fieldset className="pp-grp">
      <legend>{title}</legend>
      <div className="pp-grp__rows">{children}</div>
      <style>{`
        .pp-grp { border: 0; padding: 0; margin: 0; }
        .pp-grp legend {
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
        .pp-grp__rows { display: flex; flex-direction: column; gap: 16px; }
      `}</style>
    </fieldset>
  )
}

function SuccessState({ mode, onReset }) {
  const isApply = mode === 'apply'
  return (
    <div className="pp-succ" role="status" aria-live="polite">
      <div className="pp-succ__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 12 10 18 20 6" />
        </svg>
      </div>
      <h3>{isApply ? 'Your application is in.' : "You're on the waitlist."}</h3>
      <p>
        {isApply
          ? "We'll review it in the next few days and reach out by email or WhatsApp to schedule a short interview call."
          : "We'll be in touch the moment applications open for the next cohort — or when a seat frees up in this one."}
      </p>
      <div className="pp-succ__ctas">
        <CTAButton
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            isApply
              ? "Hi Lady Adel — I just submitted my application for the Purposeful Entrepreneur Programme."
              : "Hi Lady Adel — I just joined the waitlist for the Purposeful Entrepreneur Programme."
          )}`}
          variant="primary"
          size="md"
          external
          arrow={false}
        >
          Message on WhatsApp
        </CTAButton>
        <button type="button" className="pp-succ__reset" onClick={onReset}>
          {isApply ? 'Submit another application' : 'Add someone else'}
        </button>
      </div>

      <style>{`
        .pp-succ { text-align: center; padding: 20px 4px; }
        .pp-succ__icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 64px; height: 64px;
          margin-bottom: 18px;
          border-radius: 50%;
          background: rgba(91, 45, 142, 0.12);
          color: var(--purple);
        }
        .pp-succ__icon svg { width: 28px; height: 28px; }
        .pp-succ h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 28px);
          color: var(--navy);
          margin-bottom: 10px;
        }
        .pp-succ p {
          max-width: 480px;
          margin: 0 auto 24px;
          font-size: 14px;
          line-height: 1.65;
          color: rgba(13, 33, 55, 0.72);
        }
        .pp-succ__ctas {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        @media (min-width: 520px) { .pp-succ__ctas { flex-direction: row; justify-content: center; } }
        .pp-succ__reset {
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

// ---- Field primitives (duplicated locally per-page by design) ---------------

function Field({ label, name, type = 'text', required, hint, value, error, onChange, ...rest }) {
  const id = `pp-${name}`
  return (
    <div className={`pp-fld ${error ? 'is-invalid' : ''}`}>
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
        ? <span className="pp-fld__err" id={`${id}-err`}>{error}</span>
        : hint ? <span className="pp-fld__hint" id={`${id}-hint`}>{hint}</span> : null}
      <FieldStyles />
    </div>
  )
}

function SelectField({ label, name, value, error, onChange, options, placeholder, required }) {
  const id = `pp-${name}`
  return (
    <div className={`pp-fld pp-fld--sel ${error ? 'is-invalid' : ''}`}>
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
      {error && <span className="pp-fld__err" id={`${id}-err`}>{error}</span>}
      <FieldStyles />
    </div>
  )
}

function TextAreaField({ label, name, required, hint, rows = 4, value, error, onChange }) {
  const id = `pp-${name}`
  return (
    <div className={`pp-fld ${error ? 'is-invalid' : ''}`}>
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
        ? <span className="pp-fld__err" id={`${id}-err`}>{error}</span>
        : hint ? <span className="pp-fld__hint" id={`${id}-hint`}>{hint}</span> : null}
      <FieldStyles />
    </div>
  )
}

function FieldStyles() {
  return (
    <style>{`
      .pp-fld { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
      .pp-fld label {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1.6px;
        text-transform: uppercase;
        color: var(--navy);
      }
      .pp-fld label span { color: var(--orange); }
      .pp-fld input, .pp-fld select, .pp-fld textarea {
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
      .pp-fld textarea { resize: vertical; min-height: 88px; line-height: 1.5; }
      .pp-fld input:focus, .pp-fld select:focus, .pp-fld textarea:focus {
        outline: none;
        border-color: var(--purple);
        box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.18);
      }
      .pp-fld__hint { font-size: 11.5px; color: rgba(13, 33, 55, 0.55); }
      .pp-fld__err  { font-size: 12px; color: var(--orange); font-weight: 700; }
      .pp-fld.is-invalid input,
      .pp-fld.is-invalid select,
      .pp-fld.is-invalid textarea {
        border-color: var(--orange);
        box-shadow: 0 0 0 3px rgba(224, 90, 30, 0.12);
      }
      .pp-fld--sel select {
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
    <section className="pp-faq">
      <div className="pp-faq__bg" aria-hidden="true">
        <span className="pp-faq__orb pp-faq__orb--purple" />
        <span className="pp-faq__orb pp-faq__orb--gold" />
      </div>
      <div className="site-container pp-faq__inner">
        <SectionHeader
          tone="light"
          eyebrow="Frequently Asked"
          title={<>Questions answered <em>before</em> you apply.</>}
          subtitle="The five most common questions. If yours is not here, message us on WhatsApp and we will answer directly."
        />

        <ul className="pp-faq__list">
          {FAQ.map((item, i) => {
            const open = openIdx === i
            return (
              <li key={i} className={`pp-fq ${open ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="pp-fq__q"
                  aria-expanded={open}
                  onClick={() => setOpenIdx(open ? -1 : i)}
                >
                  <span>{item.q}</span>
                  <span className="pp-fq__icon" aria-hidden="true">{open ? '−' : '+'}</span>
                </button>
                <div className="pp-fq__a" role="region" aria-hidden={!open}>
                  <p>{item.a}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <style>{`
        .pp-faq {
          position: relative;
          padding: 100px 0 110px;
          background:
            radial-gradient(ellipse at 85% 0%, rgba(91, 45, 142, 0.38) 0%, transparent 55%),
            radial-gradient(ellipse at 15% 100%, rgba(201, 168, 76, 0.16) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
          isolation: isolate;
        }
        .pp-faq__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .pp-faq__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.4; }
        .pp-faq__orb--purple { width: 460px; height: 460px; top: -160px; right: -140px; background: radial-gradient(circle, rgba(122, 71, 184, 0.5), transparent 70%); }
        .pp-faq__orb--gold   { width: 420px; height: 420px; bottom: -160px; left: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.35), transparent 70%); }
        .pp-faq__inner { position: relative; z-index: 1; }

        .pp-faq__list {
          list-style: none;
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pp-fq {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .pp-fq.is-open {
          border-color: rgba(201, 168, 76, 0.42);
          background: rgba(255, 255, 255, 0.05);
        }
        .pp-fq__q {
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
        .pp-fq__q:focus-visible {
          outline: none;
          box-shadow: inset 0 0 0 2px rgba(201, 168, 76, 0.4);
          border-radius: 14px;
        }
        .pp-fq__icon {
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
        .pp-fq__a {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }
        .pp-fq.is-open .pp-fq__a { max-height: 400px; }
        .pp-fq__a p {
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
    <section className="pp-final">
      <div className="site-container">
        <div className="pp-final__card">
          <div className="pp-final__copy">
            <span className="pp-final__eyebrow">
              <span className="pp-final__dot" aria-hidden="true" />
              Applications reviewed rolling
            </span>
            <h3>Apply before the next cohort fills.</h3>
            <p>
              Seats are confirmed on a first-complete, first-interviewed basis.
              If the programme is a fit for your business right now, the next
              15 minutes are the best time to start your application.
            </p>
          </div>
          <div className="pp-final__ctas">
            <CTAButton href="#apply" variant="gold" size="lg">
              Start your application
            </CTAButton>
            <CTAButton to="/lady-adel#contact" variant="outline-light" size="lg" arrow={false}>
              Ask a question first
            </CTAButton>
          </div>
        </div>
      </div>

      <style>{`
        .pp-final {
          padding: 72px 0 120px;
          background:
            radial-gradient(ellipse at 10% 0%, rgba(224, 90, 30, 0.28) 0%, transparent 55%),
            radial-gradient(ellipse at 90% 100%, rgba(201, 168, 76, 0.2) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
        }
        .pp-final__card {
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
        .pp-final__card > * { min-width: 0; }
        @media (min-width: 960px) {
          .pp-final__card {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 44px 52px;
            gap: 40px;
          }
        }

        .pp-final__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          color: var(--orange);
          padding: 6px 13px;
          background: rgba(224, 90, 30, 0.14);
          border: 1px solid rgba(224, 90, 30, 0.36);
          border-radius: 999px;
          margin-bottom: 14px;
        }
        .pp-final__dot {
          width: 7px; height: 7px;
          background: var(--orange);
          border-radius: 50%;
          animation: ppFinalPulse 1.8s infinite;
        }
        @keyframes ppFinalPulse {
          0%   { box-shadow: 0 0 0 0 rgba(224, 90, 30, 0.7); }
          70%  { box-shadow: 0 0 0 8px rgba(224, 90, 30, 0); }
          100% { box-shadow: 0 0 0 0 rgba(224, 90, 30, 0); }
        }

        .pp-final__copy { max-width: 620px; }
        .pp-final h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(24px, 3.4vw, 32px);
          color: var(--white);
          letter-spacing: -0.3px;
          margin-bottom: 10px;
        }
        .pp-final p {
          font-size: 14.5px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.78);
        }

        .pp-final__ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pp-final__ctas .cta { white-space: normal; text-align: center; line-height: 1.25; }
        @media (min-width: 520px) {
          .pp-final__ctas { flex-direction: row; flex-wrap: wrap; }
          .pp-final__ctas .cta { white-space: nowrap; }
        }
        @media (min-width: 960px) { .pp-final__ctas { flex-direction: column; align-items: stretch; } }
      `}</style>
    </section>
  )
}
