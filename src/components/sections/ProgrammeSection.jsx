import { useState } from 'react'
import SectionHeader from '../ui/SectionHeader'
import CTAButton from '../ui/CTAButton'

/**
 * Section 07 — The Entrepreneur Programme
 *
 * The paid flagship offering. Detailed enough for a serious entrepreneur
 * to self-select into applying, with enough mystery around price that
 * qualification happens via the application form.
 *
 * PLACEHOLDER values to replace post-launch:
 *   - PROGRAMME.cohortSize / PROGRAMME.nextCohortStart
 *   - Pricing remains hidden by design ("Fees available on application")
 */

// Chosen from the plan's name options — matches the faith-driven,
// mission-aligned positioning used elsewhere on the site.
const PROGRAMME = {
  name:             'The Purposeful Entrepreneur Programme',
  shortName:        'Purposeful Entrepreneur Programme',
  cohortSize:       '10–30 participants per cohort',       // PLACEHOLDER: confirm exact cap
  duration:         '8–12 weeks · weekly live sessions',
  format:           'Live on Zoom · 1.5–2 hours per session',
  nextCohortStart:  'Applications open — next cohort date announced soon', // PLACEHOLDER
}

// Who it's for — 5 items per plan
const AUDIENCE = [
  'Entrepreneurs with a business idea they are ready to build',
  'Startups in their first 1–3 years looking to get the fundamentals right',
  'Small business owners who have hit a growth ceiling and need a breakthrough',
  'Faith-driven professionals who want to align business with purpose',
  'Professionals transitioning from employment into entrepreneurship',
]

// What participants get — 7 items per plan
const BENEFITS = [
  {
    title:   'Structured curriculum',
    body:    'Weekly live sessions covering finance, brand, sales, leadership, systems and scaling — in the exact order a growing business needs them.',
    icon:    IconBook,
  },
  {
    title:   'Business frameworks & templates',
    body:    'Practical tools, worksheets and one-pagers you can lift straight into your business — no vague inspiration.',
    icon:    IconTemplate,
  },
  {
    title:   'Mentorship',
    body:    'Direct access to experienced entrepreneurs and industry experts — for the questions your own team cannot answer yet.',
    icon:    IconMentor,
  },
  {
    title:   'Strategic contacts',
    body:    'Curated introductions to networks, investors and partners relevant to your sector — not a generic address book.',
    icon:    IconNetwork,
  },
  {
    title:   'Peer cohort',
    body:    'A small group of like-minded founders for real accountability, honest feedback and the collaborations that outlast the programme.',
    icon:    IconCohort,
  },
  {
    title:   'Accountability structure',
    body:    'Regular check-ins, goal tracking and progress reviews — so momentum is measured, not hoped for.',
    icon:    IconCheck,
  },
  {
    title:   'Certificate of completion',
    body:    'A recognised participation certificate from IWC Concepts — something tangible to add to your LinkedIn and your wall.',
    icon:    IconCertificate,
  },
]

// FAQ — mirrors the questions specified in the plan
const FAQ = [
  {
    q: 'Who is this programme for?',
    a: 'Entrepreneurs, startups, growing business owners and faith-driven professionals who want to build with purpose and strategy — not just inspiration.',
  },
  {
    q: 'How many people are in each cohort?',
    a: 'Cohorts are limited to between 10 and 30 participants to protect personal attention and quality of engagement. Exact numbers are confirmed during the application review.',
  },
  {
    q: 'Is it online or in-person?',
    a: 'Primarily online via Zoom, with the possibility of in-person intensive sessions for cohorts based in the same region.',
  },
  {
    q: 'What does the programme cost?',
    a: 'Fees are available on application. This lets us confirm fit, tailor what is included for your stage of business and offer the most relevant tier.',
  },
  {
    q: 'When does the next cohort start?',
    a: 'Applications are open on a rolling basis. Once a cohort fills, the next start date is announced and successful applicants are notified directly — apply early as spots fill fast.',
  },
]

// ---- Component --------------------------------------------------------------

export default function ProgrammeSection() {
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <section className="prog" id="programme">
      {/* Decorative background */}
      <div className="prog__bg" aria-hidden="true">
        <span className="prog__orb prog__orb--orange" />
        <span className="prog__orb prog__orb--gold" />
        <span className="prog__grid" />
      </div>

      <div className="site-container prog__inner">
        <SectionHeader
          tone="light"
          eyebrow="The Flagship Programme"
          title={<>The <em>Purposeful Entrepreneur</em> Programme</>}
          subtitle="A cohort-based growth programme for startups and scaling businesses that want frameworks, mentors and a clear path to growth — not just inspiration."
        />

        {/* Programme header card */}
        <div className="prog__lede">
          <div className="prog__lede-body">
            <span className="prog__badge">
              <span className="prog__pulse" aria-hidden="true" />
              Applications open — rolling admission
            </span>
            <h3 className="prog__lede-title">{PROGRAMME.name}</h3>
            <p className="prog__lede-sub">
              A structured, mentor-led path for founders who want to build
              businesses that are profitable, purposeful and built to last.
            </p>
            <dl className="prog__facts">
              <div><dt>Cohort size</dt><dd>{PROGRAMME.cohortSize}</dd></div>
              <div><dt>Duration</dt><dd>{PROGRAMME.duration}</dd></div>
              <div><dt>Format</dt><dd>{PROGRAMME.format}</dd></div>
              <div><dt>Next cohort</dt><dd>{PROGRAMME.nextCohortStart}</dd></div>
            </dl>
            <div className="prog__lede-ctas">
              <CTAButton to="/programmes" variant="primary" size="lg">
                Apply now
              </CTAButton>
              <CTAButton to="/programmes" variant="outline-light" size="lg" arrow={false}>
                Join the waitlist
              </CTAButton>
            </div>
          </div>
        </div>

        {/* Who it's for */}
        <div className="prog__who">
          <div className="prog__who-head">
            <span className="eyebrow">Who It Is For</span>
            <h3>Built for founders at a specific moment in the journey.</h3>
          </div>
          <ul className="prog__who-list">
            {AUDIENCE.map((item, i) => (
              <li key={i}>
                <span className="prog__who-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="prog__who-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What you get */}
        <div className="prog__what">
          <div className="prog__what-head">
            <span className="eyebrow">What Participants Get</span>
            <h3>Seven things you walk away with.</h3>
          </div>
          <div className="prog__what-grid">
            {BENEFITS.map(b => {
              const Icon = b.icon
              return (
                <article key={b.title} className="bn">
                  <span className="bn__icon" aria-hidden="true"><Icon /></span>
                  <h4>{b.title}</h4>
                  <p>{b.body}</p>
                </article>
              )
            })}
          </div>
        </div>

        {/* Investment note */}
        <div className="prog__price">
          <div className="prog__price-copy">
            <span className="eyebrow">Investment</span>
            <h3>Fees available on application.</h3>
            <p>Pricing is confirmed after a short application review. This lets us understand your stage, tailor what is included and recommend the most relevant tier — rather than publishing a number that suits no one exactly.</p>
          </div>
          <div className="prog__price-cta">
            <CTAButton to="/programmes" variant="gold" size="lg">
              Start your application
            </CTAButton>
            <span className="prog__price-note">Takes under 5 minutes.</span>
          </div>
        </div>

        {/* FAQ */}
        <div className="prog__faq">
          <div className="prog__faq-head">
            <span className="eyebrow">Frequently Asked</span>
            <h3>Questions answered before you apply.</h3>
          </div>
          <ul className="prog__faq-list">
            {FAQ.map((item, i) => {
              const open = openIdx === i
              return (
                <li key={i} className={`fq ${open ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="fq__q"
                    aria-expanded={open}
                    onClick={() => setOpenIdx(open ? -1 : i)}
                  >
                    <span>{item.q}</span>
                    <span className="fq__icon" aria-hidden="true">{open ? '−' : '+'}</span>
                  </button>
                  <div className="fq__a" role="region" aria-hidden={!open}>
                    <p>{item.a}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <style>{`
        .prog {
          position: relative;
          padding: 100px 0 110px;
          background:
            radial-gradient(ellipse at 85% 0%, rgba(224, 90, 30, 0.25) 0%, transparent 55%),
            radial-gradient(ellipse at 15% 100%, rgba(201, 168, 76, 0.18) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
          isolation: isolate;
        }
        .prog__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .prog__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.5; }
        .prog__orb--orange { width: 520px; height: 520px; top: -180px; right: -160px; background: radial-gradient(circle, rgba(224, 90, 30, 0.4), transparent 70%); }
        .prog__orb--gold   { width: 440px; height: 440px; bottom: -180px; left: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.35), transparent 70%); }
        .prog__grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          opacity: 0.45;
        }
        .prog__inner { position: relative; z-index: 1; }

        /* Lede card */
        .prog__lede {
          position: relative;
          padding: 30px 22px 32px;
          margin-bottom: 80px;
          border-radius: 24px;
          background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 30px 80px rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          overflow: hidden;
        }
        .prog__lede::before {
          content: '';
          position: absolute; inset: 0 0 auto 0;
          height: 3px;
          background: linear-gradient(90deg, var(--orange), var(--gold), var(--purple));
        }
        @media (min-width: 768px) { .prog__lede { padding: 40px 44px 44px; } }

        .prog__badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 7px 14px;
          background: rgba(224, 90, 30, 0.15);
          color: var(--orange);
          border: 1px solid rgba(224, 90, 30, 0.38);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .prog__pulse {
          width: 8px; height: 8px;
          background: var(--orange);
          border-radius: 50%;
          animation: pulseOrange 1.8s infinite;
        }
        @keyframes pulseOrange {
          0% { box-shadow: 0 0 0 0 rgba(224, 90, 30, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(224, 90, 30, 0); }
          100% { box-shadow: 0 0 0 0 rgba(224, 90, 30, 0); }
        }

        .prog__lede-title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(28px, 4.2vw, 42px);
          line-height: 1.15;
          letter-spacing: -0.6px;
          color: var(--white);
          margin-bottom: 10px;
        }
        .prog__lede-sub {
          font-size: 15px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.78);
          max-width: 680px;
          margin-bottom: 28px;
        }

        .prog__facts {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 16px 24px;
          margin-bottom: 28px;
          padding: 18px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        @media (min-width: 640px)  { .prog__facts { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1080px) { .prog__facts { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .prog__facts > div { min-width: 0; }
        .prog__facts dt {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 4px;
        }
        .prog__facts dd {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.92);
          line-height: 1.45;
        }

        .prog__lede-ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .prog__lede-ctas .cta { white-space: normal; text-align: center; line-height: 1.25; }
        @media (min-width: 520px) {
          .prog__lede-ctas { flex-direction: row; flex-wrap: wrap; }
          .prog__lede-ctas .cta { white-space: nowrap; }
        }

        /* Who it's for */
        .prog__who { margin-bottom: 80px; }
        .prog__who-head, .prog__what-head, .prog__faq-head { text-align: center; margin-bottom: 32px; max-width: 680px; margin-left: auto; margin-right: auto; }
        .prog__who-head .eyebrow, .prog__what-head .eyebrow, .prog__faq-head .eyebrow { color: var(--gold); }
        .prog__who-head h3, .prog__what-head h3, .prog__faq-head h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 30px);
          color: var(--white);
          margin-top: 8px;
          letter-spacing: -0.3px;
        }

        .prog__who-list {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
        }
        @media (min-width: 760px)  { .prog__who-list { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; } }
        .prog__who-list li {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          min-width: 0;
        }
        .prog__who-n {
          flex-shrink: 0;
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 700;
          color: var(--gold);
          font-size: 16px;
          letter-spacing: 1px;
        }
        .prog__who-text {
          font-size: 14.5px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.86);
        }

        /* What you get */
        .prog__what { margin-bottom: 80px; }
        .prog__what-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 18px;
        }
        @media (min-width: 720px)  { .prog__what-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1080px) { .prog__what-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        .bn {
          padding: 26px 24px;
          border-radius: 18px;
          background:
            linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.22s ease, border-color 0.22s ease;
        }
        .bn:hover { transform: translateY(-4px); border-color: rgba(201, 168, 76, 0.45); }
        .bn__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(201, 168, 76, 0.15);
          color: var(--gold);
          margin-bottom: 14px;
        }
        .bn__icon svg { width: 22px; height: 22px; }
        .bn h4 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 17px;
          color: var(--white);
          letter-spacing: -0.2px;
          margin-bottom: 6px;
        }
        .bn p {
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.74);
        }

        /* Investment note */
        .prog__price {
          margin-bottom: 80px;
          padding: 30px 26px;
          border-radius: 22px;
          background:
            radial-gradient(ellipse at 0% 0%, rgba(201, 168, 76, 0.25), transparent 60%),
            linear-gradient(135deg, rgba(91, 45, 142, 0.45), rgba(13, 33, 55, 0.55));
          border: 1px solid rgba(201, 168, 76, 0.32);
          display: flex;
          flex-direction: column;
          gap: 22px;
          align-items: stretch;
        }
        .prog__price > * { min-width: 0; }
        @media (min-width: 880px) {
          .prog__price {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 38px 44px;
            gap: 36px;
          }
        }
        .prog__price-copy { max-width: 620px; }
        .prog__price-copy .eyebrow { color: var(--gold); }
        .prog__price-copy h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 28px);
          color: var(--white);
          margin: 8px 0 10px;
          letter-spacing: -0.2px;
        }
        .prog__price-copy p {
          font-size: 14px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.72);
        }
        .prog__price-cta {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        @media (min-width: 880px) { .prog__price-cta { align-items: flex-end; } }
        .prog__price-note {
          font-size: 11.5px;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.55);
        }

        /* FAQ */
        .prog__faq-list {
          list-style: none;
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fq {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .fq.is-open {
          border-color: rgba(201, 168, 76, 0.4);
          background: rgba(255, 255, 255, 0.05);
        }
        .fq__q {
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
        .fq__q:focus-visible {
          outline: none;
          box-shadow: inset 0 0 0 2px rgba(201, 168, 76, 0.4);
          border-radius: 14px;
        }
        .fq__icon {
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
        .fq__a {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.28s ease;
        }
        .fq.is-open .fq__a { max-height: 320px; }
        .fq__a p {
          padding: 0 22px 20px;
          font-size: 14px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.78);
        }
      `}</style>
    </section>
  )
}

// ---- Icons ------------------------------------------------------------------

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2V5z" />
      <line x1="9" y1="7" x2="16" y2="7" />
      <line x1="9" y1="11" x2="16" y2="11" />
    </svg>
  )
}
function IconTemplate() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  )
}
function IconMentor() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  )
}
function IconNetwork() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5" cy="6" r="2.5" />
      <circle cx="19" cy="6" r="2.5" />
      <circle cx="5" cy="18" r="2.5" />
      <circle cx="19" cy="18" r="2.5" />
      <circle cx="12" cy="12" r="2.5" />
      <line x1="7" y1="7" x2="10" y2="10" />
      <line x1="17" y1="7" x2="14" y2="10" />
      <line x1="7" y1="17" x2="10" y2="14" />
      <line x1="17" y1="17" x2="14" y2="14" />
    </svg>
  )
}
function IconCohort() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M3 19v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
      <path d="M15 19v-0.5a3.5 3.5 0 0 1 3.5-3.5H19a3 3 0 0 1 3 3v1" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}
function IconCertificate() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="9" r="5" />
      <path d="M8.5 13l-1.5 7 5-2 5 2-1.5-7" />
    </svg>
  )
}
