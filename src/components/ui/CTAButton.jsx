import { Link } from 'react-router-dom'

/**
 * Reusable call-to-action button for the Lady Adel site.
 *
 * Variants:
 *   primary   — Orange fill (Action colour). Use for the #1 CTA per section.
 *   secondary — Purple fill. Use for supporting CTAs.
 *   gold      — Gold fill on dark backgrounds.
 *   ghost     — Transparent, navy text + border. Use on light backgrounds
 *               when the primary CTA is nearby and we need a quieter option.
 *   outline-light — Transparent with white border. Use on dark hero sections.
 *
 * Renders a <Link> when `to` is provided, an <a> when `href` is provided,
 * or a <button> otherwise. Pass `arrow` to include the trailing arrow.
 */
export default function CTAButton({
  children,
  to,
  href,
  onClick,
  type       = 'button',
  variant    = 'primary',
  size       = 'md',
  arrow      = true,
  fullWidth  = false,
  disabled   = false,
  external   = false,
  className  = '',
  ...rest
}) {
  const classes = [
    'cta',
    `cta--${variant}`,
    `cta--${size}`,
    fullWidth ? 'cta--full' : '',
    disabled ? 'is-disabled' : '',
    className,
  ].filter(Boolean).join(' ')

  const content = (
    <>
      <span className="cta__label">{children}</span>
      {arrow && (
        <svg className="cta__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      )}
      <CtaStyles />
    </>
  )

  if (to && !disabled) {
    return <Link to={to} className={classes} onClick={onClick} {...rest}>{content}</Link>
  }
  if (href && !disabled) {
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        {...rest}
      >{content}</a>
    )
  }
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} {...rest}>
      {content}
    </button>
  )
}

function CtaStyles() {
  return (
    <style>{`
      .cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border: 1.5px solid transparent;
        border-radius: 999px;
        font-family: var(--font-body);
        font-weight: 800;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        text-decoration: none;
        cursor: pointer;
        line-height: 1;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          background 0.18s ease,
          color 0.18s ease,
          border-color 0.18s ease;
        white-space: nowrap;
        user-select: none;
      }
      .cta:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.35);
      }
      .cta.is-disabled,
      .cta:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        transform: none !important;
      }

      /* Sizes */
      .cta--sm { padding: 9px 18px;  font-size: 11px; }
      .cta--md { padding: 13px 24px; font-size: 12px; }
      .cta--lg { padding: 16px 30px; font-size: 13px; letter-spacing: 1.5px; }

      .cta--full { width: 100%; }

      .cta__arrow { transition: transform 0.18s ease; flex-shrink: 0; }
      .cta:hover .cta__arrow { transform: translateX(4px); }

      /* Primary — orange */
      .cta--primary {
        background: var(--orange);
        color: var(--white);
        box-shadow: 0 12px 28px rgba(224, 90, 30, 0.28);
      }
      .cta--primary:hover {
        background: var(--orange-dark);
        transform: translateY(-2px);
        box-shadow: 0 18px 36px rgba(224, 90, 30, 0.38);
      }

      /* Secondary — purple */
      .cta--secondary {
        background: var(--purple);
        color: var(--white);
        box-shadow: 0 12px 28px rgba(91, 45, 142, 0.28);
      }
      .cta--secondary:hover {
        background: var(--purple-dark);
        transform: translateY(-2px);
        box-shadow: 0 18px 36px rgba(91, 45, 142, 0.38);
      }

      /* Gold */
      .cta--gold {
        background: var(--gold);
        color: var(--navy);
        box-shadow: 0 12px 28px rgba(201, 168, 76, 0.3);
      }
      .cta--gold:hover {
        background: var(--gold-light);
        transform: translateY(-2px);
        box-shadow: 0 18px 36px rgba(201, 168, 76, 0.4);
      }

      /* Ghost — light background */
      .cta--ghost {
        background: transparent;
        color: var(--navy);
        border-color: rgba(13, 33, 55, 0.25);
      }
      .cta--ghost:hover {
        background: var(--navy);
        color: var(--white);
        border-color: var(--navy);
      }

      /* Outline light — dark background */
      .cta--outline-light {
        background: transparent;
        color: var(--white);
        border-color: rgba(255, 255, 255, 0.45);
      }
      .cta--outline-light:hover {
        background: var(--white);
        color: var(--navy);
        border-color: var(--white);
      }
    `}</style>
  )
}
