import SectionHeader from '../ui/SectionHeader'
import ServiceCard from '../ui/ServiceCard'
import CTAButton from '../ui/CTAButton'

/**
 * Section 03 — What I Offer (Services)
 *
 * The "money section" per the plan: five specific offerings, each with
 * clear bullets and a CTA that matches the buyer journey. The Catch Up
 * card is flagged as "Start Here" because it is the primary entry into
 * the IWC Concepts community.
 */

const SERVICES = [
  {
    icon: '🎙',
    title: 'Catch Up With Lady Adel',
    description:
      'A free monthly Zoom platform bringing together faith-driven leaders, entrepreneurs and professionals for meaningful conversations and expert insights.',
    bullets: [
      'Monthly live sessions — first available days of each month',
      'Guest speakers: entrepreneurs, executives, industry leaders',
      'Topics span faith, business, leadership, finance and growth',
      'Free to attend — open to anyone with a registered account',
      'Growing community across West Africa and beyond',
    ],
    cta: { label: 'Register for free', to: '/catch-up' },
    accent: 'purple',
    featured: true,
    ribbon: 'Start Here',
  },
  {
    icon: '🏢',
    title: 'Corporate & Staff Training',
    description:
      'Custom-designed training programmes for organisations that want to develop their people, build leadership capacity and create a purpose-driven culture.',
    bullets: [
      'Leadership development for management teams',
      'Financial literacy & business acumen workshops',
      'Faith & purpose in the workplace sessions',
      'Customised to the industry and the people in the room',
      'SMEs, NGOs, churches, corporates and government agencies',
      'Delivered online, in-person or hybrid',
    ],
    cta: { label: 'Request a training proposal', to: '/training' },
    accent: 'navy',
  },
  {
    icon: '🚀',
    title: 'Entrepreneur Growth Programme',
    description:
      'A structured, cohort-based programme for startups and scaling businesses that want frameworks, mentors and a clear path to growth — not just inspiration.',
    bullets: [
      'Business frameworks and practical templates you can use today',
      'Mentorship from experienced entrepreneurs and industry experts',
      'Strategic networking — curated connections in key industries',
      'Accountability structure and a peer cohort community',
      'Training on finance, brand, sales, leadership, systems, scaling',
      'Limited spots per cohort to ensure quality engagement',
    ],
    cta: { label: 'Apply now / Join the waitlist', to: '/programmes' },
    accent: 'orange',
  },
  {
    icon: '🎤',
    title: 'Speaking Engagements',
    description:
      'A distinctive voice bridging faith, finance and entrepreneurship — for conferences, corporate events, church conferences, summits and leadership forums.',
    bullets: [
      'Faith & Business: Integrating Purpose and Profit',
      'Women in Leadership: Breaking Cultural Barriers',
      'Financial Empowerment for Entrepreneurs',
      'The Boaz Blueprint: Purposeful Entrepreneurship',
      'AI, Innovation and the Future of African Business',
      'Custom topics available on request',
    ],
    cta: { label: 'Book Lady Adel to speak', to: '/contact' },
    accent: 'gold',
  },
  {
    icon: '👤',
    title: 'One-on-One Coaching & Mentoring',
    description:
      'Private coaching sessions for executives, entrepreneurs and professionals who need focused, personalised guidance. Limited availability — serious applicants only.',
    bullets: [
      'Tailored to your specific business or career challenge',
      'Confidential, professional engagement',
      'Structured around clear goals and measurable outcomes',
      'Flexible scheduling — online via Zoom',
      'Session packages available (3, 6 or 12 sessions)',
    ],
    cta: { label: 'Apply for coaching', to: '/contact' },
    accent: 'purple',
  },
]

export default function ServicesSection() {
  return (
    <section className="services site-section" id="services">
      <div className="site-container">
        <SectionHeader
          eyebrow="What I Offer"
          title={<>Five ways to <em>work with me</em></>}
          subtitle="Pick the door that fits where you are right now. Every offering leads back to the same mission — equipping leaders to build with integrity, purpose and lasting influence."
        />

        <div className="services__grid">
          {SERVICES.map(svc => (
            <div key={svc.title} className={svc.featured ? 'services__cell services__cell--featured' : 'services__cell'}>
              <ServiceCard {...svc} />
            </div>
          ))}
        </div>

        {/* Secondary CTA strip */}
        <div className="services__footer">
          <div className="services__footer-text">
            <span className="eyebrow">Not sure which one?</span>
            <h3>Let&rsquo;s talk it through.</h3>
            <p>Send a short message about what you&rsquo;re building or leading and we&rsquo;ll point you to the right starting place.</p>
          </div>
          <CTAButton to="/contact" variant="primary" size="lg">
            Send an enquiry
          </CTAButton>
        </div>
      </div>

      <style>{`
        .services {
          background: var(--white);
          color: var(--ink);
          position: relative;
          overflow: hidden;
        }
        .services::before {
          content: '';
          position: absolute;
          top: -160px; right: -160px;
          width: 360px; height: 360px;
          border-radius: 50%;
          background: rgba(91, 45, 142, 0.08);
          filter: blur(100px);
          pointer-events: none;
        }
        .services::after {
          content: '';
          position: absolute;
          bottom: -200px; left: -160px;
          width: 420px; height: 420px;
          border-radius: 50%;
          background: rgba(201, 168, 76, 0.12);
          filter: blur(110px);
          pointer-events: none;
        }

        .services__grid {
          position: relative;
          display: grid;
          grid-template-columns: 1fr;
          gap: 22px;
          align-items: stretch;
        }
        @media (min-width: 680px) {
          .services__grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1080px) {
          .services__grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 26px;
          }
          /* Make the featured Catch Up card span two columns on wide screens */
          .services__cell--featured { grid-column: span 2; }
        }

        /* Featured card gets a bit more breathing room on desktop */
        @media (min-width: 1080px) {
          .services__cell--featured > * {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            align-items: start;
          }
          .services__cell--featured > * > :nth-child(1),
          .services__cell--featured > * > :nth-child(2) {
            grid-column: span 2;
          }
          .services__cell--featured > * > :nth-child(3) { grid-column: span 2; }
          /* re-flow the bullet list to two columns on the featured card */
          .services__cell--featured .svc-card__list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 9px 22px;
          }
        }

        /* Footer CTA strip */
        .services__footer {
          position: relative;
          margin-top: 56px;
          padding: 32px 28px;
          border-radius: var(--radius-lg);
          background: linear-gradient(120deg, var(--cream) 0%, rgba(201, 168, 76, 0.22) 100%);
          border: 1px solid rgba(201, 168, 76, 0.35);
          display: flex;
          flex-direction: column;
          gap: 22px;
          align-items: flex-start;
          z-index: 1;
        }
        @media (min-width: 768px) {
          .services__footer {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 36px 40px;
            gap: 32px;
          }
        }
        .services__footer-text { max-width: 620px; }
        .services__footer-text .eyebrow {
          display: inline-block;
          color: var(--purple);
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .services__footer-text h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 28px);
          color: var(--navy);
          line-height: 1.2;
          margin-bottom: 6px;
          letter-spacing: -0.2px;
        }
        .services__footer-text p {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(13, 33, 55, 0.65);
        }
      `}</style>
    </section>
  )
}
