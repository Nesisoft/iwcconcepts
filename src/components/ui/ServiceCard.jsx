import CTAButton from './CTAButton'

/**
 * Service card used in Section 03 (What I Offer) and elsewhere.
 *
 * Props:
 *   icon        — emoji or JSX node shown in the top-left
 *   title       — service name
 *   description — short pitch paragraph
 *   bullets     — string[] of inclusions / features
 *   cta         — { label, to?, href? } optional CTA at the bottom
 *   accent      — brand token used for the accent glow (default purple)
 *                 accepts: 'purple' | 'gold' | 'orange' | 'navy'
 *   featured    — bool: adds a gold border + "Most Popular" ribbon
 *   ribbon      — optional string override for the ribbon label
 */
export default function ServiceCard({
  icon,
  title,
  description,
  bullets = [],
  cta,
  accent   = 'purple',
  featured = false,
  ribbon,
}) {
  const accentColor = {
    purple: 'var(--purple)',
    gold:   'var(--gold-dark)',
    orange: 'var(--orange)',
    navy:   'var(--navy)',
  }[accent] || 'var(--purple)'

  return (
    <article className={`svc-card ${featured ? 'is-featured' : ''}`} style={{ '--svc-accent': accentColor }}>
      {featured && (
        <span className="svc-card__ribbon">{ribbon || 'Most Popular'}</span>
      )}

      <div className="svc-card__icon" aria-hidden="true">{icon}</div>
      <h3 className="svc-card__title">{title}</h3>
      {description && <p className="svc-card__desc">{description}</p>}

      {bullets.length > 0 && (
        <ul className="svc-card__list">
          {bullets.map((b, i) => (
            <li key={i}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {cta && (
        <div className="svc-card__cta">
          <CTAButton
            variant={featured ? 'primary' : 'secondary'}
            size="md"
            to={cta.to}
            href={cta.href}
            external={cta.external}
            fullWidth
          >
            {cta.label}
          </CTAButton>
        </div>
      )}

      <style>{`
        .svc-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          padding: 30px 26px 26px;
          box-shadow: var(--shadow-sm);
          transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
          overflow: hidden;
          height: 100%;
        }
        .svc-card::before {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 180px; height: 180px;
          background: radial-gradient(circle, color-mix(in srgb, var(--svc-accent) 18%, transparent) 0%, transparent 65%);
          pointer-events: none;
        }
        .svc-card:hover {
          transform: translateY(-6px);
          border-color: color-mix(in srgb, var(--svc-accent) 35%, transparent);
          box-shadow: 0 24px 60px rgba(13, 33, 55, 0.14);
        }
        .svc-card.is-featured {
          border: 2px solid var(--gold);
          box-shadow: 0 20px 48px rgba(201, 168, 76, 0.25);
        }

        .svc-card__ribbon {
          position: absolute;
          top: 14px;
          right: 14px;
          padding: 5px 12px;
          border-radius: 999px;
          background: var(--gold);
          color: var(--navy);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          z-index: 1;
        }

        .svc-card__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          border-radius: 14px;
          background: color-mix(in srgb, var(--svc-accent) 12%, var(--cream));
          color: var(--svc-accent);
          font-size: 28px;
          flex-shrink: 0;
        }

        .svc-card__title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 22px;
          line-height: 1.2;
          color: var(--navy);
          letter-spacing: -0.3px;
        }
        .svc-card__desc {
          font-size: 14px;
          line-height: 1.7;
          color: rgba(13, 33, 55, 0.7);
        }

        .svc-card__list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-top: 2px;
        }
        .svc-card__list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13.5px;
          line-height: 1.55;
          color: rgba(13, 33, 55, 0.82);
        }
        .svc-card__list svg {
          flex-shrink: 0;
          margin-top: 2px;
          color: var(--svc-accent);
        }

        .svc-card__cta {
          margin-top: auto;
          padding-top: 14px;
        }
      `}</style>
    </article>
  )
}
