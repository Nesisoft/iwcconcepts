/**
 * Consistent section title block used by every content section on the
 * Lady Adel site. Supports eyebrow + title + subtitle.
 *
 * Props:
 *   eyebrow   — short uppercase label (e.g. "What I Offer")
 *   title     — display-font headline (string or JSX)
 *   subtitle  — supporting paragraph under the title
 *   align     — 'left' | 'center'  (default 'center')
 *   tone      — 'dark' on light bg, 'light' on dark bg  (default 'dark')
 *   divider   — show a gold underline flourish under the eyebrow (default true)
 *   children  — optional extra content rendered below the subtitle
 */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align    = 'center',
  tone     = 'dark',
  divider  = true,
  children,
}) {
  return (
    <header className={`sh sh--${align} sh--${tone}`}>
      {eyebrow && (
        <div className="sh__eyebrow">
          {divider && <span className="sh__rule" aria-hidden="true" />}
          <span>{eyebrow}</span>
          {divider && <span className="sh__rule" aria-hidden="true" />}
        </div>
      )}
      {title && <h2 className="sh__title">{title}</h2>}
      {subtitle && <p className="sh__subtitle">{subtitle}</p>}
      {children && <div className="sh__extra">{children}</div>}

      <style>{`
        .sh { display: flex; flex-direction: column; gap: 14px; margin: 0 auto 48px; max-width: 760px; }
        .sh--left   { align-items: flex-start; text-align: left; margin-left: 0; }
        .sh--center { align-items: center;     text-align: center; }

        .sh__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--gold-dark);
        }
        .sh--light .sh__eyebrow { color: var(--gold); }
        .sh__rule {
          display: inline-block;
          width: 28px;
          height: 2px;
          background: currentColor;
          opacity: 0.7;
          border-radius: 2px;
        }
        .sh--left .sh__rule:first-child { display: none; }

        .sh__title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(30px, 4.6vw, 48px);
          line-height: 1.1;
          color: var(--navy);
          letter-spacing: -0.5px;
        }
        .sh--light .sh__title { color: var(--white); }

        .sh__subtitle {
          font-size: 16px;
          line-height: 1.7;
          color: rgba(13, 33, 55, 0.68);
          max-width: 620px;
        }
        .sh--light .sh__subtitle { color: rgba(255, 255, 255, 0.72); }
        .sh--left .sh__subtitle  { margin-left: 0; }

        .sh__extra { margin-top: 10px; }
      `}</style>
    </header>
  )
}
