/**
 * Testimonial card for Section 05 (Testimonials & Impact) and the
 * Catch Up Spotlight (Section 04).
 *
 * Props:
 *   quote        — the testimonial text (required)
 *   name         — full or short name (required)
 *   role         — job title or relationship to Lady Adel
 *   organisation — company / church / programme
 *   avatar       — image URL (optional; falls back to initials disc)
 *   rating       — 1–5 star rating (optional)
 *   tone         — 'light' (default — for cream/white sections) or
 *                  'dark' (for navy sections)
 */
export default function TestimonialCard({
  quote,
  name,
  role,
  organisation,
  avatar,
  rating,
  tone = 'light',
}) {
  const initials = (name || '??')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('')

  return (
    <figure className={`tm tm--${tone}`}>
      <svg className="tm__quote" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9.5 6C5.91 6 3 8.91 3 12.5v5.5h6.5V12H6c0-1.93 1.57-3.5 3.5-3.5V6zm11 0C16.91 6 14 8.91 14 12.5v5.5h6.5V12H17c0-1.93 1.57-3.5 3.5-3.5V6z" />
      </svg>

      <blockquote className="tm__body">{quote}</blockquote>

      {rating > 0 && (
        <div className="tm__rating" aria-label={`${rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} width="14" height="14" viewBox="0 0 24 24"
              fill={i < rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"
              aria-hidden="true">
              <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />
            </svg>
          ))}
        </div>
      )}

      <figcaption className="tm__person">
        <div className="tm__avatar" aria-hidden="true">
          {avatar
            ? <img src={avatar} alt="" />
            : <span>{initials}</span>
          }
        </div>
        <div className="tm__meta">
          <div className="tm__name">{name}</div>
          {(role || organisation) && (
            <div className="tm__role">
              {role}
              {role && organisation && <span aria-hidden="true"> · </span>}
              {organisation}
            </div>
          )}
        </div>
      </figcaption>

      <style>{`
        .tm {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 32px 28px 26px;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          height: 100%;
          transition: transform 0.24s ease, box-shadow 0.24s ease;
        }
        .tm:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 54px rgba(13, 33, 55, 0.14);
        }

        .tm--light {
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          color: var(--navy);
        }
        .tm--dark {
          background: linear-gradient(150deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--white);
          backdrop-filter: blur(6px);
        }

        .tm__quote {
          color: var(--gold);
          opacity: 0.9;
        }

        .tm__body {
          font-family: var(--font-display);
          font-weight: 500;
          font-style: italic;
          font-size: 17px;
          line-height: 1.6;
          letter-spacing: -0.1px;
          color: inherit;
        }
        .tm--light .tm__body { color: rgba(13, 33, 55, 0.88); }
        .tm--dark  .tm__body { color: rgba(255, 255, 255, 0.92); }

        .tm__rating { color: var(--gold); display: inline-flex; gap: 3px; }

        .tm__person {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: auto;
          padding-top: 4px;
        }
        .tm__avatar {
          flex-shrink: 0;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: var(--grad-purple-navy);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.5px;
          overflow: hidden;
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.25);
        }
        .tm__avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tm__name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 15px;
        }
        .tm__role {
          font-size: 12px;
          margin-top: 3px;
          opacity: 0.7;
          letter-spacing: 0.2px;
        }
      `}</style>
    </figure>
  )
}
