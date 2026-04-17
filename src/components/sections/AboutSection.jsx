import { useState } from 'react'
import SectionHeader from '../ui/SectionHeader'

/**
 * Section 02 — About Lady Adel
 *
 * Story-format biography (first person, warm), 4 credibility highlight
 * boxes, and a large pull-quote.
 *
 * PLACEHOLDER: Replace /images/lady-adel-about.jpg with a second
 * professional portrait (3:4 portrait orientation works best). If
 * the image is missing the styled fallback frame renders.
 */

const HIGHLIGHTS = [
  {
    icon:  '🏦',
    title: 'Corporate Banking',
    detail: 'A decade+ inside the boardroom — risk, finance, leadership.',
  },
  {
    icon:  '🎓',
    title: 'EMBA · Corporate Finance',
    detail: 'Strategic finance training applied to real-world growth.',
  },
  {
    icon:  '⛪',
    title: 'Co-Senior Pastor',
    detail: 'The HPC Global — shepherding leaders, families and founders.',
  },
  {
    icon:  '🎙',
    title: 'Host · Catch Up With Lady Adel',
    detail: 'Monthly platform raising Kingdom-minded leaders across Africa.',
  },
]

export default function AboutSection() {
  const [imgOk, setImgOk] = useState(true)

  return (
    <section className="about" id="about">
      <div className="site-container about__inner">
        <SectionHeader
          align="center"
          eyebrow="About Lady Adel"
          title={<>The bridge between <em>purpose</em> and <em>profit</em></>}
          subtitle="A short story about how a banker became a pastor became a business coach — and why that combination matters now more than ever."
        />

        <div className="about__grid">
          {/* Portrait + decorative frame */}
          <div className="about__media">
            <div className="about__frame">
              {imgOk ? (
                <img
                  src="/images/lady-adel-about.jpg"
                  alt="Lady Adel — Apostle Adelaide Clottey"
                  onError={() => setImgOk(false)}
                />
              ) : (
                <div className="about__frame-fallback" aria-hidden="true">
                  <div className="about__initials">LA</div>
                  <div className="about__frame-note">
                    <strong>Portrait placeholder</strong>
                    Replace <code>/images/lady-adel-about.jpg</code>
                  </div>
                </div>
              )}
            </div>

            {/* Signature card overlay */}
            <div className="about__signature">
              <div className="about__signature-name">Apostle Adelaide Clottey</div>
              <div className="about__signature-role">Founder · IWC Concepts</div>
            </div>
          </div>

          {/* Story */}
          <div className="about__story">
            <p>
              My name is <strong>Apostle Adelaide Clottey</strong>. Most people know me as <strong>Lady Adel</strong>.
            </p>
            <p>
              I have spent more than a decade inside the world of corporate banking,
              watching brilliant professionals build successful careers while quietly losing
              the connection between their work and their purpose. That gap — between
              spiritual calling and professional excellence — is the reason I started
              <span className="about__highlight"> IWC Concepts</span>.
            </p>
            <p>
              I am co-senior pastor at <strong>The HPC Global</strong> and hold an
              <strong> EMBA in Corporate Finance</strong>. That means I get to sit at a
              rare intersection — the boardroom and the pulpit, the spreadsheet and the
              scripture. I have never believed these worlds compete; I believe they were
              always meant to work together.
            </p>
            <p>
              I call myself a <span className="about__highlight">Purpose-Profit Bridge</span>.
              My work is to equip faith-driven leaders, pastors and entrepreneurs with
              practical tools to combine biblical wisdom with business excellence — through
              teaching, mentorship and leadership development.
            </p>
            <p>
              Whether I am preaching on a Sunday or hosting <em>Catch Up With Lady Adel</em>
              mid-month, the mission is the same: to raise Kingdom-minded leaders who build
              with integrity, purpose and lasting influence.
            </p>
          </div>
        </div>

        {/* Credibility highlights */}
        <div className="about__highlights" role="list">
          {HIGHLIGHTS.map(h => (
            <div key={h.title} className="about__highlight-card" role="listitem">
              <span className="about__highlight-icon" aria-hidden="true">{h.icon}</span>
              <div className="about__highlight-title">{h.title}</div>
              <div className="about__highlight-detail">{h.detail}</div>
            </div>
          ))}
        </div>

        {/* Pull-quote */}
        <figure className="about__quote">
          <svg className="about__quote-mark" width="64" height="64" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9.5 6C5.91 6 3 8.91 3 12.5v5.5h6.5V12H6c0-1.93 1.57-3.5 3.5-3.5V6zm11 0C16.91 6 14 8.91 14 12.5v5.5h6.5V12H17c0-1.93 1.57-3.5 3.5-3.5V6z" />
          </svg>
          <blockquote>
            Your purpose was not given to you to be hidden in a pew. It was given to
            you to be <em>built</em> — into a business, a boardroom, a movement.
          </blockquote>
          <figcaption>
            <span className="about__quote-line" aria-hidden="true" />
            Lady Adel
          </figcaption>
        </figure>
      </div>

      <style>{`
        .about {
          position: relative;
          background: var(--cream);
          color: var(--ink);
          padding: 88px 0 96px;
          overflow: hidden;
        }
        @media (min-width: 980px) {
          .about { padding: 120px 0 130px; }
        }

        .about::before, .about::after {
          content: '';
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          filter: blur(110px);
          opacity: 0.45;
          pointer-events: none;
          z-index: 0;
        }
        .about::before { background: rgba(91, 45, 142, 0.18); top: -120px; right: -120px; }
        .about::after  { background: rgba(201, 168, 76, 0.22); bottom: -140px; left: -120px; }

        .about__inner { position: relative; z-index: 1; }

        .about__grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 36px;
          align-items: center;
          margin-top: 24px;
        }
        @media (min-width: 980px) {
          .about__grid {
            grid-template-columns: 0.95fr 1.1fr;
            gap: 64px;
            margin-top: 12px;
          }
        }

        /* Media column */
        .about__media {
          position: relative;
          width: 100%;
          max-width: 460px;
          margin: 0 auto;
          aspect-ratio: 3 / 4;
        }
        .about__frame {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 22px;
          overflow: hidden;
          background: linear-gradient(160deg, rgba(91, 45, 142, 0.18), rgba(201, 168, 76, 0.18));
          box-shadow: 0 30px 70px rgba(13, 33, 55, 0.18);
        }
        .about__frame::before {
          content: '';
          position: absolute;
          inset: -14px -14px auto auto;
          width: 110px;
          height: 110px;
          border: 2px solid var(--gold);
          border-radius: 22px;
          z-index: -1;
        }
        .about__frame::after {
          content: '';
          position: absolute;
          inset: auto auto -14px -14px;
          width: 130px;
          height: 130px;
          background: var(--purple);
          border-radius: 22px;
          z-index: -1;
          opacity: 0.85;
        }
        .about__frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .about__frame-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 22px;
          padding: 32px;
          text-align: center;
          color: rgba(13, 33, 55, 0.72);
          background:
            radial-gradient(circle at 50% 35%, rgba(201, 168, 76, 0.28), transparent 60%),
            linear-gradient(160deg, rgba(91, 45, 142, 0.12), rgba(13, 33, 55, 0.08));
        }
        .about__initials {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: var(--grad-gold);
          color: var(--navy);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 54px;
          letter-spacing: -1px;
          box-shadow: 0 18px 36px rgba(201, 168, 76, 0.3);
        }
        .about__frame-note { font-size: 12px; line-height: 1.5; }
        .about__frame-note strong {
          display: block;
          color: var(--purple);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .about__frame-note code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(13, 33, 55, 0.08);
        }

        .about__signature {
          position: absolute;
          bottom: -22px;
          right: -8px;
          background: var(--white);
          padding: 14px 20px;
          border-radius: 14px;
          box-shadow: 0 18px 40px rgba(13, 33, 55, 0.18);
          border-left: 4px solid var(--gold);
          max-width: 240px;
        }
        @media (min-width: 640px) {
          .about__signature { right: -22px; }
        }
        .about__signature-name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 15px;
          color: var(--navy);
          line-height: 1.2;
        }
        .about__signature-role {
          font-size: 11px;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: var(--purple);
          margin-top: 4px;
          font-weight: 700;
        }

        /* Story column */
        .about__story p {
          font-size: 16px;
          line-height: 1.8;
          color: rgba(13, 33, 55, 0.82);
          margin-bottom: 18px;
        }
        .about__story p:first-child {
          font-family: var(--font-display);
          font-size: 22px;
          line-height: 1.45;
          color: var(--navy);
          font-weight: 600;
          letter-spacing: -0.3px;
          margin-bottom: 22px;
        }
        .about__story p:first-child::first-letter {
          font-weight: 900;
          color: var(--purple);
        }
        .about__story strong { color: var(--navy); font-weight: 700; }
        .about__story em     { color: var(--purple); font-style: italic; font-weight: 600; }
        .about__highlight {
          background: linear-gradient(120deg, transparent 50%, rgba(201, 168, 76, 0.4) 50%);
          padding: 0 4px;
          font-weight: 700;
          color: var(--navy);
        }

        /* Highlight cards */
        .about__highlights {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-top: 64px;
        }
        @media (min-width: 560px) { .about__highlights { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 980px) { .about__highlights { grid-template-columns: repeat(4, 1fr); } }

        .about__highlight-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 24px 22px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: 18px;
          box-shadow: 0 6px 18px rgba(13, 33, 55, 0.05);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .about__highlight-card:hover {
          transform: translateY(-4px);
          border-color: rgba(91, 45, 142, 0.25);
          box-shadow: 0 16px 40px rgba(13, 33, 55, 0.12);
        }
        .about__highlight-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--cream);
          font-size: 24px;
          margin-bottom: 4px;
          box-shadow: inset 0 0 0 1px rgba(201, 168, 76, 0.3);
        }
        .about__highlight-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 16px;
          color: var(--navy);
          line-height: 1.25;
        }
        .about__highlight-detail {
          font-size: 13px;
          color: rgba(13, 33, 55, 0.62);
          line-height: 1.55;
        }

        /* Pull-quote */
        .about__quote {
          position: relative;
          margin: 80px auto 0;
          max-width: 880px;
          padding: 56px 32px 46px;
          text-align: center;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(201, 168, 76, 0.18), transparent 65%),
            linear-gradient(160deg, var(--navy) 0%, #1a3756 100%);
          color: var(--white);
          border-radius: 24px;
          box-shadow: 0 30px 70px rgba(13, 33, 55, 0.25);
          overflow: hidden;
        }
        .about__quote::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: linear-gradient(90deg, var(--gold), var(--orange), var(--purple));
        }
        .about__quote-mark {
          color: var(--gold);
          opacity: 0.5;
          margin: 0 auto 18px;
        }
        .about__quote blockquote {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 600;
          font-size: clamp(22px, 3.2vw, 32px);
          line-height: 1.4;
          letter-spacing: -0.3px;
          color: var(--white);
          max-width: 720px;
          margin: 0 auto 28px;
        }
        .about__quote em { color: var(--gold); font-style: italic; }
        .about__quote figcaption {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-weight: 800;
          color: var(--gold);
        }
        .about__quote-line {
          display: inline-block;
          width: 30px;
          height: 1px;
          background: var(--gold);
          opacity: 0.7;
        }

        @media (min-width: 768px) {
          .about__quote { padding: 64px 56px 56px; }
        }
      `}</style>
    </section>
  )
}
