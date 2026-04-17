import { useState } from 'react'

/**
 * Sticky floating WhatsApp button — shown on every public page.
 * Links to a pre-filled WhatsApp message per the plan (Section 08).
 *
 * Uses the IWC Concepts WhatsApp number. The number below is a
 * PLACEHOLDER — swap in the confirmed business number.
 */

// PLACEHOLDER: Replace with the confirmed IWC Concepts WhatsApp number
const WHATSAPP_NUMBER = '233000000000'
const DEFAULT_MESSAGE =
  'Hi Lady Adel, I found your website and I am interested in learning more.'

export default function WhatsAppButton({
  number  = WHATSAPP_NUMBER,
  message = DEFAULT_MESSAGE,
  label   = 'Chat with Lady Adel',
}) {
  const [hover, setHover] = useState(false)
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`

  return (
    <a
      className="wa-fab"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className={`wa-fab__tooltip ${hover ? 'is-shown' : ''}`}>{label}</span>
      <span className="wa-fab__circle" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor">
          <path d="M16 2C8.3 2 2 8.3 2 16c0 2.8.8 5.4 2.2 7.6L2 30l6.6-2.1A13.9 13.9 0 0 0 16 30c7.7 0 14-6.3 14-14S23.7 2 16 2zm0 25.3c-2.4 0-4.6-.7-6.5-2l-.5-.3-3.9 1.2 1.3-3.8-.3-.5A11.3 11.3 0 1 1 27.3 16 11.3 11.3 0 0 1 16 27.3zm6.5-8.5c-.4-.2-2.1-1-2.4-1.2-.3-.1-.6-.2-.8.2-.2.4-.9 1.2-1.1 1.4-.2.2-.4.2-.8.1-.4-.2-1.5-.6-2.9-1.8-1.1-1-1.8-2.2-2-2.5-.2-.4 0-.6.2-.8l.6-.7c.2-.2.2-.4.4-.6.1-.2 0-.4 0-.6s-.8-1.9-1-2.6c-.3-.7-.5-.6-.8-.6h-.7c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.5 3.8 6.1 5.3.8.3 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.1-.8 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.1-.3-.2-.7-.4z" />
        </svg>
      </span>

      <style>{`
        .wa-fab {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 90;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          animation: waPulseSoft 2.4s ease-out infinite;
        }
        .wa-fab__circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #25D366;
          color: #ffffff;
          box-shadow: 0 12px 28px rgba(37, 211, 102, 0.45),
                      0 0 0 6px rgba(37, 211, 102, 0.12);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .wa-fab:hover .wa-fab__circle {
          transform: translateY(-2px) scale(1.04);
          background: #1ebe57;
          box-shadow: 0 18px 32px rgba(37, 211, 102, 0.5),
                      0 0 0 8px rgba(37, 211, 102, 0.18);
        }
        .wa-fab__tooltip {
          display: none;
          background: #ffffff;
          color: #0D2137;
          font-size: 12px;
          font-weight: 700;
          padding: 9px 14px;
          border-radius: 999px;
          box-shadow: 0 12px 28px rgba(13, 33, 55, 0.18);
          white-space: nowrap;
          transform: translateX(8px);
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          pointer-events: none;
        }
        .wa-fab__tooltip.is-shown { opacity: 1; transform: translateX(0); }

        @media (min-width: 900px) {
          .wa-fab { right: 28px; bottom: 28px; gap: 12px; }
          .wa-fab__tooltip { display: inline-block; }
          .wa-fab__circle { width: 64px; height: 64px; }
        }

        @keyframes waPulseSoft {
          0%, 100% { filter: drop-shadow(0 0 0 rgba(37,211,102,0)); }
          50%      { filter: drop-shadow(0 0 10px rgba(37,211,102,0.35)); }
        }

        @media (prefers-reduced-motion: reduce) {
          .wa-fab { animation: none; }
        }
      `}</style>
    </a>
  )
}
