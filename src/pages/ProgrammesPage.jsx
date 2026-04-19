import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
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
        {/* Further bands added in Steps 12.2–12.6 */}
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
