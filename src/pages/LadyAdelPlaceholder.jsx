import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

/**
 * Temporary scaffolding page used for Step 1 — it lets us verify the
 * shared Navbar and Footer render correctly on every public route.
 * This will be replaced in Steps 3–14 as each section is built.
 */

const LABELS = {
  'lady-adel':   { title: 'Lady Adel',                     note: 'Main profile page — Sections 01–09 land here in Steps 3–10.' },
  'catch-up':    { title: 'Catch Up With Lady Adel',       note: 'Dedicated Catch Up programme page — Step 11.' },
  'programmes':  { title: 'Entrepreneur Growth Programme', note: 'Full programme details + FAQ + application — Step 12.' },
  'training':    { title: 'Corporate & Staff Training',    note: 'Training offering + Request-a-Proposal form — Step 13.' },
  'contact':     { title: 'Contact Lady Adel',             note: 'Full contact form + WhatsApp + socials — Step 14.' },
}

export default function LadyAdelPlaceholder({ page = 'lady-adel' }) {
  const { title, note } = LABELS[page] || LABELS['lady-adel']

  return (
    <>
      <Navbar />
      <main className="placeholder">
        <div className="site-container placeholder__inner">
          <span className="eyebrow">Faith · Business · Impact</span>
          <h1>{title}</h1>
          <p className="placeholder__lead">
            This page is scaffolded and ready. Content for each section is being built in sequence — check back after each step is confirmed.
          </p>
          <div className="placeholder__card">
            <strong>Next up:</strong> {note}
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        .placeholder {
          min-height: calc(100vh - 80px);
          background:
            radial-gradient(ellipse at 10% 0%, rgba(91, 45, 142, 0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 90% 20%, rgba(201, 168, 76, 0.12) 0%, transparent 55%),
            var(--cream);
          padding: 96px 0 120px;
          display: flex;
          align-items: center;
        }
        .placeholder__inner {
          max-width: 760px;
          text-align: center;
          color: var(--ink);
        }
        .placeholder h1 {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(36px, 6vw, 64px);
          line-height: 1.05;
          margin: 16px 0 22px;
          background: linear-gradient(135deg, var(--purple) 0%, var(--navy) 80%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .placeholder__lead {
          font-size: 17px;
          line-height: 1.7;
          color: rgba(13, 33, 55, 0.7);
          max-width: 560px;
          margin: 0 auto 32px;
        }
        .placeholder__card {
          display: inline-block;
          padding: 14px 22px;
          border-radius: 999px;
          background: var(--white);
          border: 1px solid rgba(91, 45, 142, 0.15);
          color: var(--navy);
          font-size: 13px;
          box-shadow: var(--shadow-sm);
        }
        .placeholder__card strong { color: var(--purple); margin-right: 6px; }
      `}</style>
    </>
  )
}
