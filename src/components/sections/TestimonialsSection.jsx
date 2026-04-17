import SectionHeader from '../ui/SectionHeader'
import TestimonialCard from '../ui/TestimonialCard'
import ImpactCounter from '../ui/ImpactCounter'
import CTAButton from '../ui/CTAButton'

/**
 * Section 05 — Testimonials & Impact
 *
 * Real voices + bold numbers. The single highest-converting block on
 * the page once real testimonials are in place.
 *
 * PLACEHOLDER content (replace before launch):
 *   - All TESTIMONIALS quotes, names, roles and avatars
 *   - IMPACT.communityMembers / industriesServed / countriesReached
 *     should be confirmed against the latest live numbers
 */

// ---- Testimonials -----------------------------------------------------------
// Five voices spanning every offering Lady Adel runs: Catch Up, Corporate
// Training, Entrepreneur Programme, One-on-One Coaching, Speaking.
// Each is clearly marked PLACEHOLDER until real quotes are collected.
const TESTIMONIALS = [
  {
    quote:
      'The Catch Up changed how I think about my business. I came in looking for tactics and left with a sense of calling. Six months on, our revenue has doubled — but more importantly, our team finally knows what we are building and why.',
    name: 'Esi A.',
    role: 'Founder & CEO',
    organisation: 'Catch Up Attendee · Accra',
    rating: 5,
    track: 'Catch Up',
  },
  {
    quote:
      'Lady Adel led a two-day leadership intensive for our senior management team. The shift in language, posture and ownership was immediate. She combines corporate rigour with spiritual clarity in a way I have not seen anywhere else.',
    name: 'Dr. Nana O.',
    role: 'Group HR Director',
    organisation: 'Corporate Training Client',
    rating: 5,
    track: 'Corporate Training',
  },
  {
    quote:
      'I had been running my company for four years on instinct. The Entrepreneur Programme gave me frameworks I now use every single week — for hiring, for finance, for setting strategy. The peer cohort alone was worth the application.',
    name: 'Kwame B.',
    role: 'Co-Founder',
    organisation: 'Entrepreneur Programme · Cohort 1',
    rating: 5,
    track: 'Entrepreneur Programme',
  },
  {
    quote:
      'My one-on-one sessions with Lady Adel were the most honest professional conversations of my career. She does not flatter you, she clarifies you. I left every session with a decision made and a next step booked.',
    name: 'Dr. Yaa M.',
    role: 'Executive & Pastor',
    organisation: 'Coaching Client',
    rating: 5,
    track: 'Coaching',
  },
  {
    quote:
      'We invited Lady Adel to keynote our women-in-business summit. She did not give a polished speech — she gave a charge. Three weeks later attendees were still messaging us about what she said. Re-book her if you can.',
    name: 'Akosua D.',
    role: 'Conference Convener',
    organisation: 'Faith & Enterprise Summit',
    rating: 5,
    track: 'Speaking',
  },
  {
    quote:
      'I joined a Catch Up session expecting business advice. I left with a community of believers who actually understand what it costs to build something. This is the room I did not know I was looking for.',
    name: 'Adwoa B.',
    role: 'Pastor & Entrepreneur',
    organisation: 'Catch Up Attendee · Kumasi',
    rating: 5,
    track: 'Catch Up',
  },
]

// ---- Impact metrics ---------------------------------------------------------
// PLACEHOLDER: confirm against the latest live community numbers before launch.
const IMPACT = [
  { value: 500, suffix: '+', label: 'Community Members' },
  { value: 2,   suffix: '',  label: 'Episodes Completed' },
  { value: 5,   suffix: '',  label: 'Industries Served' },
  { value: 3,   suffix: '',  label: 'Countries Reached' },
]

// ---- Component --------------------------------------------------------------

export default function TestimonialsSection() {
  return (
    <section className="proof site-section" id="testimonials">
      {/* Decorative background */}
      <div className="proof__bg" aria-hidden="true">
        <span className="proof__orb proof__orb--gold" />
        <span className="proof__orb proof__orb--purple" />
      </div>

      <div className="site-container proof__inner">
        <SectionHeader
          eyebrow="Testimonials & Impact"
          title={<>Real voices. <em>Real impact.</em></>}
          subtitle="The conversations, training rooms and coaching sessions are working — here is what attendees, clients and cohort members are saying, in their own words."
        />

        {/* Testimonials grid */}
        <div className="proof__grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="proof__cell">
              <span className="proof__track">{t.track}</span>
              <TestimonialCard {...t} tone="light" />
            </div>
          ))}
        </div>

        {/* Impact counter row */}
        <div className="proof__impact" aria-label="Community impact at a glance">
          <div className="proof__impact-head">
            <span className="eyebrow">By the numbers</span>
            <h3>A growing community of faith-driven leaders</h3>
          </div>
          <div className="proof__impact-grid">
            {IMPACT.map(item => (
              <ImpactCounter
                key={item.label}
                value={item.value}
                suffix={item.suffix}
                label={item.label}
                tone="light"
              />
            ))}
          </div>
          <p className="proof__impact-note">
            Updated after every episode and training engagement.
          </p>
        </div>

        {/* Soft CTA strip */}
        <div className="proof__cta">
          <div className="proof__cta-text">
            <span className="eyebrow">Have your own story?</span>
            <h3>Be the next voice in this room.</h3>
            <p>Join an upcoming Catch Up, apply to a programme or book a coaching block — and share what you build.</p>
          </div>
          <div className="proof__cta-actions">
            <CTAButton to="/catch-up" variant="primary" size="lg">
              Join the next Catch Up
            </CTAButton>
            <CTAButton to="/contact" variant="ghost" size="lg" arrow={false}>
              Send a testimonial
            </CTAButton>
          </div>
        </div>
      </div>

      <style>{`
        .proof {
          position: relative;
          background: var(--cream);
          color: var(--ink);
          overflow: hidden;
          isolation: isolate;
        }
        .proof__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .proof__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.55; }
        .proof__orb--gold {
          width: 420px; height: 420px; top: -160px; left: -120px;
          background: radial-gradient(circle, rgba(201, 168, 76, 0.35), transparent 70%);
        }
        .proof__orb--purple {
          width: 480px; height: 480px; bottom: -200px; right: -160px;
          background: radial-gradient(circle, rgba(91, 45, 142, 0.18), transparent 70%);
        }
        .proof__inner { position: relative; z-index: 1; }

        /* Testimonials grid */
        .proof__grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 22px;
          margin-bottom: 80px;
        }
        @media (min-width: 720px)  { .proof__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1080px) { .proof__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; } }

        .proof__cell {
          position: relative;
          display: flex;
        }
        .proof__cell > * { width: 100%; }

        /* Track ribbon — tells visitors which offering each quote is from */
        .proof__track {
          position: absolute;
          top: 14px;
          right: 16px;
          z-index: 2;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(91, 45, 142, 0.1);
          color: var(--purple);
          border: 1px solid rgba(91, 45, 142, 0.18);
          white-space: nowrap;
        }

        /* Impact panel */
        .proof__impact {
          position: relative;
          padding: 44px 26px 36px;
          border-radius: var(--radius-lg);
          background:
            radial-gradient(circle at 0% 0%, rgba(91, 45, 142, 0.07), transparent 60%),
            radial-gradient(circle at 100% 100%, rgba(201, 168, 76, 0.18), transparent 60%),
            var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          box-shadow: 0 22px 60px rgba(13, 33, 55, 0.07);
        }
        @media (min-width: 768px) { .proof__impact { padding: 56px 48px 48px; } }

        .proof__impact-head { text-align: center; margin-bottom: 36px; }
        .proof__impact-head .eyebrow { color: var(--purple); }
        .proof__impact-head h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 30px);
          color: var(--navy);
          margin-top: 8px;
          letter-spacing: -0.3px;
        }

        .proof__impact-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 30px 18px;
        }
        @media (min-width: 768px) {
          .proof__impact-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 32px; }
        }
        .proof__impact-grid > * { min-width: 0; }

        .proof__impact-note {
          margin-top: 28px;
          text-align: center;
          font-size: 12px;
          letter-spacing: 0.3px;
          color: rgba(13, 33, 55, 0.55);
        }

        /* Soft CTA strip */
        .proof__cta {
          margin-top: 56px;
          padding: 30px 24px;
          border-radius: var(--radius-lg);
          background: linear-gradient(120deg, rgba(91, 45, 142, 0.06) 0%, rgba(201, 168, 76, 0.16) 100%);
          border: 1px solid rgba(91, 45, 142, 0.18);
          display: flex;
          flex-direction: column;
          gap: 22px;
          align-items: stretch;
        }
        .proof__cta > * { min-width: 0; }
        @media (min-width: 880px) {
          .proof__cta {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 36px 40px;
            gap: 32px;
          }
        }
        .proof__cta-text { max-width: 560px; }
        .proof__cta-text .eyebrow { color: var(--purple); }
        .proof__cta-text h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 28px);
          color: var(--navy);
          line-height: 1.2;
          margin: 8px 0 6px;
          letter-spacing: -0.2px;
        }
        .proof__cta-text p {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(13, 33, 55, 0.7);
        }
        .proof__cta-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .proof__cta-actions .cta { white-space: normal; text-align: center; line-height: 1.25; }
        @media (min-width: 520px) {
          .proof__cta-actions { flex-direction: row; flex-wrap: wrap; }
          .proof__cta-actions .cta { white-space: nowrap; }
        }
      `}</style>
    </section>
  )
}
