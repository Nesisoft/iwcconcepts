import { useState } from 'react'
import CTAButton from '../ui/CTAButton'

/**
 * Section 01 — Hero
 *
 * The hero must work in under 5 seconds and answer
 * "who is this & why should I care?". Layout:
 *   Mobile  — stacked: portrait on top, copy below.
 *   Desktop — two columns: copy left, portrait right.
 *
 * PLACEHOLDER: Replace /images/lady-adel-hero.jpg with the real
 * professional portrait (high-quality, confident, warm, professional
 * attire). If the file is missing, the stylised placeholder frame
 * with her initials renders instead via the onError handler.
 */

export default function HeroSection() {
  const [imgOk, setImgOk] = useState(true)

  // Scroll down to the services section when "Work With Me" is clicked
  function scrollToServices(e) {
    e.preventDefault()
    const el = document.getElementById('services')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="hero" id="top">
      {/* Decorative background orbs */}
      <div className="hero__bg" aria-hidden="true">
        <span className="hero__orb hero__orb--purple" />
        <span className="hero__orb hero__orb--gold" />
        <span className="hero__grid" />
      </div>

      <div className="hero__inner site-container">
        {/* Left — copy */}
        <div className="hero__copy">
          <div className="hero__eyebrow">
            <span className="hero__dot" aria-hidden="true" />
            IWC Concepts Presents
          </div>

          <h1 className="hero__name">
            <span className="hero__name-line">Lady</span>
            <span className="hero__name-line hero__name-line--gold">Adel</span>
          </h1>

          <p className="hero__power">
            Banker. Preacher. Business Coach.
            <br className="hero__br" />
            <span className="hero__power-accent">
              Empowering faith-driven leaders across Africa.
            </span>
          </p>

          <div className="hero__tagline" aria-label="Tagline">
            <span>Faith.</span><span>Business.</span><span>Impact.</span>
          </div>

          <div className="hero__ctas">
            <CTAButton to="/catch-up" variant="primary" size="lg">
              Join the next Catch Up
            </CTAButton>
            <CTAButton href="#services" onClick={scrollToServices} variant="outline-light" size="lg" arrow={false}>
              Work with me
            </CTAButton>
          </div>

          <div className="hero__credentials" role="list">
            <div role="listitem">
              <strong>EMBA</strong>
              <span>Corporate Finance</span>
            </div>
            <div role="listitem">
              <strong>Co-Senior Pastor</strong>
              <span>The HPC Global</span>
            </div>
            <div role="listitem">
              <strong>500+</strong>
              <span>Community Members</span>
            </div>
          </div>
        </div>

        {/* Right — portrait */}
        <div className="hero__portrait">
          <div className="hero__frame">
            {imgOk ? (
              // PLACEHOLDER: Replace with Lady Adel's professional portrait
              <img
                src="/images/lady-adel-hero.jpg"
                alt="Lady Adel — Apostle Adelaide Clottey"
                onError={() => setImgOk(false)}
              />
            ) : (
              <div className="hero__frame-fallback" aria-hidden="true">
                <div className="hero__initials">LA</div>
                <div className="hero__frame-note">
                  <strong>Portrait placeholder</strong>
                  Replace <code>/images/lady-adel-hero.jpg</code>
                </div>
              </div>
            )}
          </div>

          {/* Floating credibility chip */}
          <div className="hero__chip hero__chip--top">
            <span className="hero__chip-icon" aria-hidden="true">🎙</span>
            <div>
              <div className="hero__chip-title">Catch Up With Lady Adel</div>
              <div className="hero__chip-sub">Next episode · May 11–12</div>
            </div>
          </div>

          <div className="hero__chip hero__chip--bottom">
            <span className="hero__chip-icon" aria-hidden="true">⛪</span>
            <div>
              <div className="hero__chip-title">The HPC Global</div>
              <div className="hero__chip-sub">Co-Senior Pastor</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <a href="#about" className="hero__scroll" aria-label="Scroll to about section">
        <span>Scroll</span>
        <svg width="14" height="22" viewBox="0 0 14 22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="1" y="1" width="12" height="20" rx="6" />
          <line x1="7" y1="6" x2="7" y2="10" strokeLinecap="round" />
        </svg>
      </a>

      <style>{`
        .hero {
          position: relative;
          min-height: calc(100svh - 80px);
          color: var(--white);
          padding: 40px 0 72px;
          background:
            radial-gradient(ellipse at 0% 0%, rgba(91, 45, 142, 0.55) 0%, transparent 55%),
            radial-gradient(ellipse at 100% 100%, rgba(13, 33, 55, 0.9) 0%, transparent 60%),
            linear-gradient(160deg, #120a25 0%, #0D2137 55%, #0a1a2e 100%);
          overflow: hidden;
          isolation: isolate;
        }

        /* --- Decorative background --- */
        .hero__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .hero__orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.6;
        }
        .hero__orb--purple {
          width: 520px; height: 520px;
          top: -160px; left: -140px;
          background: radial-gradient(circle, rgba(122, 71, 184, 0.65), transparent 70%);
        }
        .hero__orb--gold {
          width: 420px; height: 420px;
          bottom: -120px; right: -60px;
          background: radial-gradient(circle, rgba(201, 168, 76, 0.45), transparent 70%);
        }
        .hero__grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          opacity: 0.5;
        }

        /* --- Layout --- */
        .hero__inner {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
          padding-top: 24px;
          padding-bottom: 24px;
        }
        @media (min-width: 980px) {
          .hero__inner {
            grid-template-columns: 1.15fr 1fr;
            gap: 64px;
            padding-top: 48px;
            padding-bottom: 48px;
          }
        }

        /* --- Copy --- */
        .hero__copy { animation: fadeUp 0.8s ease-out both; }
        .hero__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--gold);
          padding: 7px 14px;
          border: 1px solid rgba(201, 168, 76, 0.35);
          border-radius: 999px;
          background: rgba(201, 168, 76, 0.08);
          margin-bottom: 24px;
        }
        .hero__dot {
          width: 6px; height: 6px;
          background: var(--gold);
          border-radius: 50%;
          animation: pulseGold 2s infinite;
        }

        .hero__name {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(56px, 13vw, 140px);
          line-height: 0.92;
          letter-spacing: -3px;
          margin-bottom: 22px;
        }
        .hero__name-line { display: block; }
        .hero__name-line--gold {
          background: linear-gradient(135deg, var(--gold) 0%, #e9d18e 50%, var(--gold) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-style: italic;
        }

        .hero__power {
          font-size: clamp(16px, 2vw, 19px);
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.86);
          max-width: 560px;
          margin-bottom: 26px;
          font-weight: 500;
        }
        .hero__power-accent { color: var(--white); font-weight: 600; }
        .hero__br { display: none; }
        @media (min-width: 640px) { .hero__br { display: inline; } }

        .hero__tagline {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 700;
          font-size: 15px;
          color: var(--gold);
          letter-spacing: 1px;
          padding-bottom: 26px;
          margin-bottom: 4px;
          border-bottom: 1px solid rgba(201, 168, 76, 0.2);
        }
        .hero__tagline span { position: relative; }
        .hero__tagline span + span::before {
          content: '';
          position: absolute;
          left: -8px; top: 50%;
          width: 3px; height: 3px;
          background: var(--gold);
          border-radius: 50%;
          transform: translateY(-50%);
        }

        .hero__ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 28px;
          margin-bottom: 36px;
        }

        .hero__credentials {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          max-width: 520px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .hero__credentials > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .hero__credentials strong {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 20px;
          color: var(--white);
          letter-spacing: -0.3px;
        }
        .hero__credentials span {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
        }

        /* --- Portrait --- */
        .hero__portrait {
          position: relative;
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
          aspect-ratio: 4 / 5;
          animation: fadeUp 1s ease-out both;
        }
        @media (min-width: 980px) {
          .hero__portrait { max-width: 480px; }
        }

        .hero__frame {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 28px;
          overflow: hidden;
          background: linear-gradient(160deg, rgba(201, 168, 76, 0.28), rgba(91, 45, 142, 0.3));
          box-shadow:
            0 40px 90px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(201, 168, 76, 0.4) inset,
            0 0 0 10px rgba(201, 168, 76, 0.08) inset;
        }
        .hero__frame::after {
          content: '';
          position: absolute;
          inset: 12px;
          border-radius: 20px;
          border: 1px solid rgba(201, 168, 76, 0.35);
          pointer-events: none;
        }
        .hero__frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .hero__frame-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 22px;
          padding: 32px;
          text-align: center;
          background:
            radial-gradient(circle at 50% 35%, rgba(201, 168, 76, 0.28), transparent 60%),
            linear-gradient(160deg, rgba(91, 45, 142, 0.5), rgba(13, 33, 55, 0.6));
        }
        .hero__initials {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: var(--grad-gold);
          color: var(--navy);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 60px;
          letter-spacing: -2px;
          box-shadow: 0 20px 50px rgba(201, 168, 76, 0.35);
        }
        .hero__frame-note {
          font-size: 12px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.72);
        }
        .hero__frame-note strong {
          display: block;
          color: var(--gold);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .hero__frame-note code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.25);
        }

        /* Floating chips */
        .hero__chip {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.96);
          color: var(--navy);
          border-radius: 14px;
          box-shadow: 0 18px 40px rgba(13, 33, 55, 0.4);
          max-width: 220px;
          backdrop-filter: blur(10px);
        }
        .hero__chip--top    { top: 14px;    left: -14px; animation: fadeUp 1.1s ease-out 0.2s both; }
        .hero__chip--bottom { bottom: 20px; right: -14px; animation: fadeUp 1.1s ease-out 0.35s both; }
        @media (min-width: 640px) {
          .hero__chip--top    { left: -28px; }
          .hero__chip--bottom { right: -28px; }
        }
        .hero__chip-icon {
          width: 36px; height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: var(--cream);
          font-size: 18px;
        }
        .hero__chip-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 13px;
          line-height: 1.15;
        }
        .hero__chip-sub {
          font-size: 11px;
          color: rgba(13, 33, 55, 0.62);
          margin-top: 2px;
        }

        /* Scroll cue */
        .hero__scroll {
          position: absolute;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          display: none;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.45);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .hero__scroll:hover { color: var(--gold); }
        .hero__scroll svg { animation: scrollBob 1.8s ease-in-out infinite; }

        @media (min-width: 980px) {
          .hero__scroll { display: inline-flex; }
        }

        @keyframes scrollBob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero__dot, .hero__scroll svg, .hero__copy, .hero__portrait, .hero__chip {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  )
}
