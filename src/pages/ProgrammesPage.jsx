import { useEffect } from 'react'
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
        {/* Further bands added in Steps 12.3–12.6 */}
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
