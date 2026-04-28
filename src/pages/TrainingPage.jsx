import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
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
        {/* Further bands added in Steps 13.2–13.6 */}
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
