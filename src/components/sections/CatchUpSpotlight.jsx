import { useEffect, useState } from 'react'
import SectionHeader from '../ui/SectionHeader'
import TestimonialCard from '../ui/TestimonialCard'
import CTAButton from '../ui/CTAButton'

/**
 * Section 04 — Catch Up With Lady Adel Spotlight
 *
 * Dedicated feature section — the primary entry into the IWC Concepts
 * community. Contains the key message, upcoming episode card with live
 * countdown, past episode highlights and attendee testimonials.
 *
 * PLACEHOLDER values to replace post-launch:
 *   - UPCOMING.topic      : final topic once confirmed
 *   - UPCOMING.speaker    : guest speaker name / title
 *   - PAST_EPISODES       : real episode titles / speakers / descriptions
 *   - TESTIMONIALS        : real attendee testimonials (name + role)
 */

// ---- Next episode (May 11–12, 2026 · 6:00 PM GMT) ---------------------------
const UPCOMING = {
  episode:   'Episode 3',
  date:      'May 11–12, 2026',
  time:      '6:00 PM GMT',
  // PLACEHOLDER: confirm the real topic
  topic:     'Building with Purpose — Faith, Finance & the Future of African Business',
  // PLACEHOLDER: confirm the guest speaker
  speaker:   'With Lady Adel & featured guests',
  format:    'Live on Zoom · Free to attend',
  startsAt:  new Date('2026-05-11T18:00:00Z'),
}

// ---- Past episodes ----------------------------------------------------------
const PAST_EPISODES = [
  {
    number: 'Episode 01',
    title:  'Faith Meets Finance',
    date:   'February 2026',
    // PLACEHOLDER: replace with real description and speaker name
    speaker: 'With Lady Adel + Guest Speaker',
    summary:
      'An opening conversation on aligning financial wisdom with spiritual calling — what it looks like when banking experience meets biblical stewardship.',
    tag: 'Faith · Finance',
  },
  {
    number: 'Episode 02',
    title:  'Women, Leadership & the Boardroom',
    date:   'March 2026',
    // PLACEHOLDER: replace with real description and speaker name
    speaker: 'With Lady Adel + Guest Speaker',
    summary:
      'A frank discussion on breaking cultural barriers, leading with conviction and building businesses that outlast the person who started them.',
    tag: 'Leadership · Women',
  },
]

// ---- Testimonials -----------------------------------------------------------
// PLACEHOLDER: Replace with real testimonials collected from attendees
const TESTIMONIALS = [
  {
    quote: 'The Catch Up gave me language for things I had been feeling for years. I left with a clearer picture of what my business is actually for.',
    name: 'Ama K.',
    role: 'Founder',
    organisation: 'Tech Startup, Accra',
  },
  {
    quote: 'Lady Adel does not separate faith from business — she teaches you how to integrate them in a way that is practical and profitable.',
    name: 'Kofi M.',
    role: 'Financial Adviser',
    organisation: 'Ghana',
  },
  {
    quote: 'I came for the guest speaker and stayed for the community. This is not just another webinar — it is a room of builders.',
    name: 'Adwoa B.',
    role: 'Pastor & Entrepreneur',
    organisation: 'Kumasi',
  },
]

// ---- Component --------------------------------------------------------------

export default function CatchUpSpotlight() {
  const countdown = useCountdown(UPCOMING.startsAt)

  return (
    <section className="spot" id="catch-up">
      {/* Decorative background */}
      <div className="spot__bg" aria-hidden="true">
        <span className="spot__orb spot__orb--gold" />
        <span className="spot__orb spot__orb--purple" />
        <span className="spot__grid" />
      </div>

      <div className="site-container spot__inner">
        <SectionHeader
          tone="light"
          eyebrow="Catch Up With Lady Adel"
          title={<>A monthly gathering for <em>faith-driven</em> leaders</>}
          subtitle="A free monthly Zoom platform where entrepreneurs, executives and industry leaders sit down with Lady Adel for the conversations that matter."
        />

        {/* Key message */}
        <p className="spot__keymsg">
          <span aria-hidden="true">“</span>
          The Catch Up is not just an event. It is a <em>movement</em> of faith-driven
          leaders committed to building purposeful businesses and impactful lives.
          <span aria-hidden="true">”</span>
        </p>

        {/* Social proof strip */}
        <div className="spot__proof">
          <div><strong>2</strong><span>Episodes completed</span></div>
          <div><strong>500+</strong><span>Community members</span></div>
          <div><strong>3</strong><span>Countries reached</span></div>
          <div><strong>100%</strong><span>Free to attend</span></div>
        </div>

        {/* Upcoming episode — focal card */}
        <div className="spot__upcoming">
          <div className="spot__upcoming-badge">
            <span className="spot__pulse" aria-hidden="true" />
            Upcoming · Next Episode
          </div>

          <div className="spot__upcoming-grid">
            <div className="spot__upcoming-copy">
              <div className="spot__upcoming-eyebrow">{UPCOMING.episode} · {UPCOMING.date}</div>
              <h3 className="spot__upcoming-title">{UPCOMING.topic}</h3>
              <p className="spot__upcoming-meta">{UPCOMING.speaker}</p>

              <ul className="spot__upcoming-list">
                <li><IconClock /><span>{UPCOMING.time}</span></li>
                <li><IconZoom  /><span>{UPCOMING.format}</span></li>
                <li><IconGlobe /><span>Open to anyone with a registered account</span></li>
              </ul>

              <div className="spot__upcoming-ctas">
                <CTAButton to="/catch-up" variant="primary" size="lg">
                  Register — it&rsquo;s free
                </CTAButton>
                <CTAButton to="/catch-up" variant="outline-light" size="lg" arrow={false}>
                  Learn more
                </CTAButton>
              </div>
            </div>

            {/* Countdown */}
            <div className="spot__countdown" aria-label={`Countdown to ${UPCOMING.episode}`}>
              <div className="spot__countdown-label">Starts in</div>
              <div className="spot__countdown-grid">
                <CountUnit value={countdown.days}    label="Days" />
                <CountUnit value={countdown.hours}   label="Hours" />
                <CountUnit value={countdown.minutes} label="Min"  />
                <CountUnit value={countdown.seconds} label="Sec"  />
              </div>
              <div className="spot__countdown-foot">
                Add to calendar after you register →
              </div>
            </div>
          </div>
        </div>

        {/* Past episodes */}
        <div className="spot__past">
          <div className="spot__past-head">
            <span className="eyebrow">Recent Episodes</span>
            <h3>Catch up on what you missed</h3>
          </div>
          <div className="spot__past-grid">
            {PAST_EPISODES.map(ep => (
              <article key={ep.number} className="spot__ep">
                <div className="spot__ep-top">
                  <span className="spot__ep-num">{ep.number}</span>
                  <span className="spot__ep-tag">{ep.tag}</span>
                </div>
                <h4 className="spot__ep-title">{ep.title}</h4>
                <div className="spot__ep-meta">{ep.speaker} · {ep.date}</div>
                <p className="spot__ep-summary">{ep.summary}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Attendee testimonials */}
        <div className="spot__voices">
          <div className="spot__past-head">
            <span className="eyebrow">From the Community</span>
            <h3>What attendees are saying</h3>
          </div>
          <div className="spot__voices-grid">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} {...t} tone="dark" />
            ))}
          </div>
        </div>

        {/* Closing CTA */}
        <div className="spot__final">
          <div>
            <h3>Ready to be in the room?</h3>
            <p>Registration takes under a minute. You&rsquo;ll get the Zoom link and a calendar invite by email.</p>
          </div>
          <CTAButton to="/catch-up" variant="gold" size="lg">
            Reserve your seat — free
          </CTAButton>
        </div>
      </div>

      <style>{`
        .spot {
          position: relative;
          padding: 100px 0 110px;
          background:
            radial-gradient(ellipse at 10% 0%, rgba(91, 45, 142, 0.55) 0%, transparent 55%),
            radial-gradient(ellipse at 90% 100%, rgba(201, 168, 76, 0.15) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 50%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
          isolation: isolate;
        }

        /* Decorative */
        .spot__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .spot__orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.55; }
        .spot__orb--gold   { width: 440px; height: 440px; top: 10%; right: -120px; background: radial-gradient(circle, rgba(201,168,76,0.45), transparent 70%); }
        .spot__orb--purple { width: 520px; height: 520px; bottom: -160px; left: -120px; background: radial-gradient(circle, rgba(122,71,184,0.5), transparent 70%); }
        .spot__grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 70px 70px;
          mask-image: radial-gradient(ellipse at center, black 25%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 25%, transparent 70%);
          opacity: 0.5;
        }

        .spot__inner { position: relative; z-index: 1; }

        /* Key message */
        .spot__keymsg {
          max-width: 820px;
          margin: -20px auto 56px;
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 500;
          font-size: clamp(19px, 2.2vw, 24px);
          line-height: 1.55;
          text-align: center;
          color: rgba(255, 255, 255, 0.88);
        }
        .spot__keymsg em { color: var(--gold); font-style: italic; }
        .spot__keymsg span { color: var(--gold); opacity: 0.5; font-size: 1.4em; margin: 0 2px; vertical-align: -0.2em; }

        /* Proof strip */
        .spot__proof {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 22px 12px;
          padding: 26px 20px;
          margin-bottom: 64px;
          border-top: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        @media (min-width: 720px) { .spot__proof { grid-template-columns: repeat(4, 1fr); padding: 30px 32px; } }
        .spot__proof > div { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
        .spot__proof strong {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(28px, 4vw, 40px);
          color: var(--gold);
          line-height: 1;
          letter-spacing: -0.5px;
        }
        .spot__proof span {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2.2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
        }

        /* Upcoming episode — focal card */
        .spot__upcoming {
          position: relative;
          padding: 26px 18px 28px;
          background: linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02));
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          overflow: hidden;
        }
        .spot__upcoming::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: linear-gradient(90deg, var(--gold), var(--orange), var(--purple));
        }
        @media (min-width: 768px) { .spot__upcoming { padding: 36px 40px 36px; } }

        .spot__upcoming-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 7px 14px;
          background: rgba(201, 168, 76, 0.15);
          color: var(--gold);
          border: 1px solid rgba(201, 168, 76, 0.35);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 22px;
        }
        .spot__pulse {
          width: 8px; height: 8px;
          background: var(--gold);
          border-radius: 50%;
          animation: pulseGold 1.8s infinite;
        }

        .spot__upcoming-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 36px;
          align-items: center;
        }
        .spot__upcoming-grid > * { min-width: 0; }
        @media (min-width: 980px) {
          .spot__upcoming-grid { grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 48px; }
        }

        .spot__upcoming-eyebrow {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin-bottom: 10px;
        }
        .spot__upcoming-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(24px, 3.4vw, 34px);
          line-height: 1.2;
          letter-spacing: -0.4px;
          color: var(--white);
          margin-bottom: 10px;
        }
        .spot__upcoming-meta {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 20px;
        }
        .spot__upcoming-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 26px;
        }
        .spot__upcoming-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.82);
        }
        .spot__upcoming-list svg { color: var(--gold); flex-shrink: 0; }
        .spot__upcoming-list li span { min-width: 0; word-break: break-word; }
        .spot__upcoming-ctas {
          display: flex;
          flex-direction: column;
          flex-wrap: wrap;
          gap: 12px;
        }
        .spot__upcoming-ctas .cta {
          white-space: normal;
          text-align: center;
          line-height: 1.25;
        }
        @media (min-width: 520px) {
          .spot__upcoming-ctas { flex-direction: row; }
          .spot__upcoming-ctas .cta { white-space: nowrap; }
        }

        /* Countdown */
        .spot__countdown {
          padding: 24px 22px;
          background: linear-gradient(160deg, rgba(201, 168, 76, 0.12), rgba(91, 45, 142, 0.18));
          border: 1px solid rgba(201, 168, 76, 0.25);
          border-radius: 18px;
          text-align: center;
        }
        .spot__countdown-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 14px;
        }
        .spot__countdown-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }
        .spot__countdown-foot {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.5px;
        }

        /* Past episodes */
        .spot__past { margin-top: 72px; }
        .spot__past-head { text-align: center; margin-bottom: 28px; }
        .spot__past-head .eyebrow { color: var(--gold); }
        .spot__past-head h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 30px);
          color: var(--white);
          margin-top: 8px;
          letter-spacing: -0.3px;
        }
        .spot__past-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 18px;
        }
        @media (min-width: 700px)  { .spot__past-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

        .spot__ep {
          padding: 26px 24px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
        }
        .spot__ep:hover {
          transform: translateY(-4px);
          border-color: rgba(201, 168, 76, 0.4);
          background: rgba(255, 255, 255, 0.06);
        }
        .spot__ep-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .spot__ep-num {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gold);
        }
        .spot__ep-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(201, 168, 76, 0.12);
          color: var(--gold);
          border: 1px solid rgba(201, 168, 76, 0.25);
        }
        .spot__ep-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 20px;
          color: var(--white);
          line-height: 1.25;
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }
        .spot__ep-meta { font-size: 12px; color: rgba(255,255,255,0.55); margin-bottom: 12px; }
        .spot__ep-summary { font-size: 14px; line-height: 1.65; color: rgba(255,255,255,0.78); }

        /* Voices */
        .spot__voices { margin-top: 72px; }
        .spot__voices-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 18px;
        }
        @media (min-width: 720px)  { .spot__voices-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1080px) { .spot__voices-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        /* Final CTA */
        .spot__final {
          margin-top: 72px;
          padding: 28px 22px;
          border-radius: 22px;
          background:
            radial-gradient(ellipse at 0% 0%, rgba(201, 168, 76, 0.25), transparent 65%),
            linear-gradient(135deg, rgba(91, 45, 142, 0.55), rgba(13, 33, 55, 0.6));
          border: 1px solid rgba(201, 168, 76, 0.3);
          display: flex;
          flex-direction: column;
          gap: 22px;
          align-items: stretch;
        }
        .spot__final > div { min-width: 0; }
        .spot__final .cta { white-space: normal; text-align: center; line-height: 1.25; }
        @media (min-width: 520px) {
          .spot__final { align-items: flex-start; }
          .spot__final .cta { white-space: nowrap; }
        }
        @media (min-width: 768px) {
          .spot__final { flex-direction: row; align-items: center; justify-content: space-between; padding: 36px 44px; }
        }
        .spot__final h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 28px);
          color: var(--white);
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }
        .spot__final p {
          font-size: 14px;
          color: rgba(255,255,255,0.72);
          max-width: 520px;
          line-height: 1.6;
        }
      `}</style>
    </section>
  )
}

// ---- Countdown unit + hook --------------------------------------------------

function CountUnit({ value, label }) {
  return (
    <div className="count">
      <span className="count__value">{String(value).padStart(2, '0')}</span>
      <span className="count__label">{label}</span>
      <style>{`
        .count {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 6px;
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }
        .count__value {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(22px, 3vw, 30px);
          color: var(--white);
          line-height: 1;
          letter-spacing: -0.5px;
          font-variant-numeric: tabular-nums;
        }
        .count__label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
        }
      `}</style>
    </div>
  )
}

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, target.getTime() - now)
  const days    = Math.floor(diff / 86400000)
  const hours   = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { days, hours, minutes, seconds, done: diff === 0 }
}

// ---- Icons ------------------------------------------------------------------

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  )
}
function IconZoom() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <polygon points="22 8 16 12 22 16 22 8" />
    </svg>
  )
}
function IconGlobe() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  )
}
