import SectionHeader from '../ui/SectionHeader'
import CTAButton from '../ui/CTAButton'

/**
 * Section 06 — Media · Podcast & Content
 *
 * Signals that Lady Adel is an active, consistent thought leader.
 * Contains: featured podcast episodes, pull-quote cards from recent
 * conversations, and a social platform strip linking every active
 * channel.
 *
 * PLACEHOLDER values to replace post-launch:
 *   - EPISODES.spotify / youtube — real share links per episode
 *   - QUOTES speakers / attribution if any change
 *   - SOCIALS href values for YouTube, Spotify, TikTok, X (all TBC)
 */

// ---- Featured episodes ------------------------------------------------------
const EPISODES = [
  {
    number: 'Episode 03',
    date:   'May 11–12, 2026',
    title:  'Building with Purpose — Faith, Finance & the Future of African Business',
    blurb:
      'The next Catch Up. A live conversation on building businesses that are both profitable and purposeful — streaming on Zoom, then released as a podcast episode.',
    status: 'upcoming',
    // PLACEHOLDER: replay links go live after the episode airs
    spotify: '#',
    youtube: '#',
  },
  {
    number: 'Episode 02',
    date:   'March 2026',
    title:  'Women, Leadership & the Boardroom',
    blurb:
      'A frank discussion on breaking cultural barriers, leading with conviction and building businesses that outlast the person who started them.',
    status: 'released',
    // PLACEHOLDER: replace with real Spotify + YouTube links
    spotify: '#',
    youtube: '#',
  },
  {
    number: 'Episode 01',
    date:   'February 2026',
    title:  'Faith Meets Finance',
    blurb:
      'An opening conversation on aligning financial wisdom with spiritual calling — what it looks like when banking experience meets biblical stewardship.',
    status: 'released',
    // PLACEHOLDER: replace with real Spotify + YouTube links
    spotify: '#',
    youtube: '#',
  },
]

// ---- Pull quotes ------------------------------------------------------------
// Shareable quote cards pulled from recent episodes / sessions.
const QUOTES = [
  {
    text: 'Your purpose was not given to you to be hidden in a pew. It was given to you to be built — into a business, a boardroom, a movement.',
    source: 'Keynote · Faith & Enterprise Summit',
  },
  {
    text: 'Profit without purpose is just income. Purpose without profit is just pressure. The Kingdom entrepreneur refuses to choose.',
    source: 'Episode 01 · Faith Meets Finance',
  },
  {
    text: 'Do not confuse visibility for influence. Influence is measured by who trusts you enough to change because of you.',
    source: 'Episode 02 · Women, Leadership & the Boardroom',
  },
]

// ---- Social platforms -------------------------------------------------------
const SOCIALS = [
  {
    name: 'Facebook',
    handle: '@theladyadel',
    content: 'Lives, events, community posts',
    href: 'https://facebook.com/theladyadel',
    confirmed: true,
    icon: IconFacebook,
  },
  {
    name: 'Instagram',
    handle: '@theladyadele',
    content: 'Quote cards, Reels, Stories',
    href: 'https://instagram.com/theladyadele',
    confirmed: true,
    icon: IconInstagram,
  },
  {
    name: 'LinkedIn',
    handle: 'Adelaide Clottey',
    content: 'Thought leadership, business tips',
    href: 'https://linkedin.com/in/adelaide-clottey-07a0983b2',
    confirmed: true,
    icon: IconLinkedIn,
  },
  {
    name: 'YouTube',
    handle: 'Coming soon',
    content: 'Full podcast episodes, session highlights',
    href: '#',
    confirmed: false,
    icon: IconYouTube,
  },
  {
    name: 'Spotify',
    handle: 'Coming soon',
    content: 'Catch Up With Lady Adel — audio podcast',
    href: '#',
    confirmed: false,
    icon: IconSpotify,
  },
  {
    name: 'TikTok',
    handle: 'Coming soon',
    content: 'Short-form, behind the scenes',
    href: '#',
    confirmed: false,
    icon: IconTikTok,
  },
  {
    name: 'X',
    handle: 'Coming soon',
    content: 'Quick takes, scripture, engagement',
    href: '#',
    confirmed: false,
    icon: IconX,
  },
]

// ---- Component --------------------------------------------------------------

export default function MediaSection() {
  return (
    <section className="media site-section" id="media">
      <div className="media__bg" aria-hidden="true">
        <span className="media__orb media__orb--purple" />
        <span className="media__orb media__orb--gold" />
      </div>

      <div className="site-container media__inner">
        <SectionHeader
          eyebrow="Media · Podcast & Content"
          title={<>Listen to <em>Catch Up With Lady Adel</em></>}
          subtitle="New episodes every month, with pull-quotes, clips and conversations that continue across every platform."
        />

        {/* Episodes */}
        <div className="media__episodes">
          {EPISODES.map(ep => (
            <article key={ep.number} className={`ep ep--${ep.status}`}>
              <div className="ep__thumb" aria-hidden="true">
                <span className="ep__thumb-num">{ep.number.replace('Episode ', 'EP ')}</span>
                <span className="ep__thumb-play"><IconPlay /></span>
              </div>
              <div className="ep__body">
                <div className="ep__meta">
                  <span className="ep__num">{ep.number}</span>
                  <span className="ep__dot" aria-hidden="true">·</span>
                  <span className="ep__date">{ep.date}</span>
                  {ep.status === 'upcoming' && <span className="ep__tag">Upcoming</span>}
                </div>
                <h3 className="ep__title">{ep.title}</h3>
                <p className="ep__blurb">{ep.blurb}</p>
                <div className="ep__actions">
                  {ep.status === 'upcoming' ? (
                    <CTAButton to="/catch-up" variant="primary" size="sm">
                      Register free
                    </CTAButton>
                  ) : (
                    <>
                      <a className="ep__link ep__link--spotify" href={ep.spotify} target="_blank" rel="noreferrer">
                        <IconSpotify /> Listen on Spotify
                      </a>
                      <a className="ep__link ep__link--youtube" href={ep.youtube} target="_blank" rel="noreferrer">
                        <IconYouTube /> Watch on YouTube
                      </a>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Pull quotes */}
        <div className="media__quotes">
          <div className="media__quotes-head">
            <span className="eyebrow">Shareable Moments</span>
            <h3>Quotes from recent conversations</h3>
          </div>
          <div className="media__quotes-grid">
            {QUOTES.map((q, i) => (
              <figure key={i} className="qc">
                <svg className="qc__mark" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9.5 6C5.91 6 3 8.91 3 12.5v5.5h6.5V12H6c0-1.93 1.57-3.5 3.5-3.5V6zm11 0C16.91 6 14 8.91 14 12.5v5.5h6.5V12H17c0-1.93 1.57-3.5 3.5-3.5V6z" />
                </svg>
                <blockquote className="qc__text">{q.text}</blockquote>
                <figcaption className="qc__source">{q.source}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Social platform strip */}
        <div className="media__social">
          <div className="media__social-head">
            <span className="eyebrow">Follow Along</span>
            <h3>Lady Adel across every platform</h3>
            <p>Every channel carries a different piece of the conversation. Pick the one that suits how you like to listen, read or watch.</p>
          </div>
          <div className="media__social-grid">
            {SOCIALS.map(s => {
              const Icon = s.icon
              const disabled = !s.confirmed
              const Tag = disabled ? 'span' : 'a'
              const extra = disabled ? {} : { href: s.href, target: '_blank', rel: 'noreferrer' }
              return (
                <Tag
                  key={s.name}
                  className={`sp sp--${s.name.toLowerCase()} ${disabled ? 'is-disabled' : ''}`}
                  aria-label={disabled ? `${s.name} — coming soon` : `Follow Lady Adel on ${s.name}`}
                  {...extra}
                >
                  <span className="sp__icon"><Icon /></span>
                  <span className="sp__body">
                    <span className="sp__name">{s.name}</span>
                    <span className="sp__handle">{s.handle}</span>
                    <span className="sp__content">{s.content}</span>
                  </span>
                </Tag>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        .media {
          position: relative;
          background: var(--white);
          color: var(--ink);
          overflow: hidden;
          isolation: isolate;
        }
        .media__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .media__orb { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.5; }
        .media__orb--purple {
          width: 460px; height: 460px; top: -180px; right: -140px;
          background: radial-gradient(circle, rgba(91, 45, 142, 0.18), transparent 70%);
        }
        .media__orb--gold {
          width: 400px; height: 400px; bottom: -180px; left: -120px;
          background: radial-gradient(circle, rgba(201, 168, 76, 0.22), transparent 70%);
        }
        .media__inner { position: relative; z-index: 1; }

        /* Episodes */
        .media__episodes {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 22px;
          margin-bottom: 80px;
        }
        @media (min-width: 900px)  { .media__episodes { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; } }

        .ep {
          display: flex;
          flex-direction: column;
          background: var(--cream);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
        }
        .ep:hover {
          transform: translateY(-4px);
          border-color: rgba(201, 168, 76, 0.45);
          box-shadow: 0 22px 54px rgba(13, 33, 55, 0.12);
        }

        .ep__thumb {
          position: relative;
          aspect-ratio: 16 / 9;
          background:
            radial-gradient(circle at 30% 30%, rgba(201, 168, 76, 0.35), transparent 60%),
            linear-gradient(135deg, var(--purple) 0%, var(--navy) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ep--upcoming .ep__thumb {
          background:
            radial-gradient(circle at 70% 30%, rgba(201, 168, 76, 0.4), transparent 60%),
            linear-gradient(135deg, var(--orange) 0%, #8a1e07 100%);
        }
        .ep__thumb-num {
          font-family: var(--font-display);
          font-weight: 900;
          font-style: italic;
          font-size: clamp(34px, 5vw, 46px);
          color: rgba(255, 255, 255, 0.92);
          letter-spacing: 1.5px;
        }
        .ep__thumb-play {
          position: absolute;
          right: 16px;
          bottom: 16px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--gold);
          color: var(--navy);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .ep__body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 22px 22px 24px;
          flex: 1;
        }
        .ep__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
        }
        .ep__num  { color: var(--purple); }
        .ep__date { color: rgba(13, 33, 55, 0.55); }
        .ep__dot  { color: rgba(13, 33, 55, 0.3); }
        .ep__tag {
          margin-left: 4px;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(224, 90, 30, 0.12);
          color: var(--orange);
          border: 1px solid rgba(224, 90, 30, 0.3);
          font-size: 10px;
          letter-spacing: 1.4px;
        }
        .ep__title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 19px;
          line-height: 1.3;
          color: var(--navy);
          letter-spacing: -0.3px;
          margin: 2px 0 2px;
        }
        .ep__blurb {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(13, 33, 55, 0.7);
          margin-bottom: 10px;
        }
        .ep__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: auto;
        }
        .ep__link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.3px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(13, 33, 55, 0.14);
          color: var(--navy);
          background: var(--white);
          text-decoration: none;
          transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;
        }
        .ep__link svg { width: 14px; height: 14px; }
        .ep__link--spotify:hover { background: #1db954; color: var(--white); border-color: #1db954; transform: translateY(-1px); }
        .ep__link--youtube:hover { background: #ff0033; color: var(--white); border-color: #ff0033; transform: translateY(-1px); }

        /* Pull quotes */
        .media__quotes-head { text-align: center; margin-bottom: 32px; }
        .media__quotes-head .eyebrow { color: var(--gold-dark); }
        .media__quotes-head h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 30px);
          color: var(--navy);
          margin-top: 8px;
          letter-spacing: -0.3px;
        }
        .media__quotes-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 22px;
          margin-bottom: 88px;
        }
        @media (min-width: 720px)  { .media__quotes-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        .qc {
          position: relative;
          padding: 30px 26px 28px;
          border-radius: var(--radius-lg);
          background:
            radial-gradient(circle at 0% 0%, rgba(201, 168, 76, 0.16), transparent 55%),
            linear-gradient(135deg, var(--navy) 0%, #14294a 70%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
        }
        .qc__mark { color: var(--gold); opacity: 0.9; margin-bottom: 12px; }
        .qc__text {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 500;
          font-size: 18px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.92);
          margin-bottom: 18px;
        }
        .qc__source {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gold);
        }

        /* Social platform grid */
        .media__social-head { text-align: center; max-width: 620px; margin: 0 auto 34px; }
        .media__social-head .eyebrow { color: var(--purple); }
        .media__social-head h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 30px);
          color: var(--navy);
          margin: 8px 0 10px;
          letter-spacing: -0.3px;
        }
        .media__social-head p {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(13, 33, 55, 0.7);
        }

        .media__social-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 14px;
        }
        @media (min-width: 600px)  { .media__social-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 980px)  { .media__social-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

        .sp {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border-radius: var(--radius-lg);
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.1);
          text-decoration: none;
          color: var(--navy);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          min-width: 0;
        }
        .sp:hover:not(.is-disabled) {
          transform: translateY(-3px);
          border-color: rgba(201, 168, 76, 0.45);
          box-shadow: 0 18px 40px rgba(13, 33, 55, 0.1);
        }
        .sp.is-disabled { opacity: 0.55; cursor: not-allowed; }

        .sp__icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          background: var(--navy);
        }
        .sp__icon svg { width: 20px; height: 20px; }
        .sp--facebook  .sp__icon { background: #1877f2; }
        .sp--instagram .sp__icon { background: linear-gradient(135deg, #405de6 0%, #c13584 50%, #f77737 100%); }
        .sp--linkedin  .sp__icon { background: #0a66c2; }
        .sp--youtube   .sp__icon { background: #ff0033; }
        .sp--spotify   .sp__icon { background: #1db954; }
        .sp--tiktok    .sp__icon { background: #000; }
        .sp--x         .sp__icon { background: #000; }

        .sp__body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .sp__name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 15px;
          color: var(--navy);
          letter-spacing: -0.1px;
        }
        .sp__handle {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: var(--gold-dark);
        }
        .sp__content {
          font-size: 12px;
          color: rgba(13, 33, 55, 0.6);
          line-height: 1.4;
        }
      `}</style>
    </section>
  )
}

// ---- Icons ------------------------------------------------------------------

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4v16l14-8L7 4z" />
    </svg>
  )
}
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.4h2.5l.4-2.9h-2.9V8.9c0-.84.24-1.41 1.46-1.41H16.5V4.9c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9v2.17H8v2.9h2.42V21h3.08z" />
    </svg>
  )
}
function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9.5h4V21H3V9.5zm7 0h3.8v1.6h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.55 4.76 5.86V21h-4v-5.22c0-1.25-.03-2.86-1.8-2.86-1.8 0-2.08 1.35-2.08 2.76V21h-4V9.5z" />
    </svg>
  )
}
function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2c-.2-1.4-.9-2.1-2.3-2.3C17.4 4.6 12 4.6 12 4.6s-5.4 0-7.3.3c-1.4.2-2.1.9-2.3 2.3C2.1 9.1 2.1 12 2.1 12s0 2.9.3 4.8c.2 1.4.9 2.1 2.3 2.3 1.9.3 7.3.3 7.3.3s5.4 0 7.3-.3c1.4-.2 2.1-.9 2.3-2.3.3-1.9.3-4.8.3-4.8s0-2.9-.3-4.8zM10 15.4V8.6L15.8 12 10 15.4z" />
    </svg>
  )
}
function IconSpotify() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.6 14.4c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4.1-.9 7.6-.5 10.5 1.2.3.2.4.6.1.9zm1.2-2.7c-.3.4-.7.5-1.1.3-2.9-1.8-7.3-2.3-10.7-1.3-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.9-1.2 8.8-.6 12.1 1.5.4.2.5.7.2 1zm.1-2.8c-3.4-2-9.1-2.2-12.4-1.2-.5.2-1.1-.1-1.2-.6-.2-.5.1-1.1.6-1.2 3.8-1.2 10.1-.9 14 1.4.5.3.6.9.3 1.3-.2.5-.8.6-1.3.3z" />
    </svg>
  )
}
function IconTikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.6 8.3a6.1 6.1 0 0 1-3.6-1.2v7.3a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v2.9a2.9 2.9 0 1 0 2 2.8V2h2.9a3.9 3.9 0 0 0 3.6 3.5v2.8z" />
    </svg>
  )
}
function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.5L4.5 21H1.3l7.5-8.5L1 3h6.5l4.5 6 5.5-6z" />
    </svg>
  )
}
