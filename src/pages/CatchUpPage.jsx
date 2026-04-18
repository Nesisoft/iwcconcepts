import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SectionHeader from '../components/ui/SectionHeader'
import CTAButton from '../components/ui/CTAButton'

/**
 * /catch-up — dedicated landing page for the free monthly Zoom
 * platform "Catch Up With Lady Adel".
 *
 * PLACEHOLDER values to replace post-launch:
 *   - UPCOMING.speaker, topic — confirm before the episode airs
 *   - PAST_EPISODES replay links
 *   - Wire the registration handler to a real backend / mailing list
 */

// ---- Upcoming episode -------------------------------------------------------
const UPCOMING = {
  episode:  'Episode 03',
  date:     'May 11–12, 2026',
  time:     '6:00 PM GMT',
  // PLACEHOLDER: confirm the real topic
  topic:    'Building with Purpose — Faith, Finance & the Future of African Business',
  // PLACEHOLDER: confirm the guest speaker
  speaker:  'With Lady Adel & featured guests',
  startsAt: new Date('2026-05-11T18:00:00Z'),
}

const PAST_EPISODES = [
  {
    number:  'Episode 02',
    date:    'March 2026',
    title:   'Women, Leadership & the Boardroom',
    speaker: 'With Lady Adel + Guest Speaker', // PLACEHOLDER
    summary: 'A frank discussion on breaking cultural barriers, leading with conviction and building businesses that outlast the person who started them.',
  },
  {
    number:  'Episode 01',
    date:    'February 2026',
    title:   'Faith Meets Finance',
    speaker: 'With Lady Adel + Guest Speaker', // PLACEHOLDER
    summary: 'An opening conversation on aligning financial wisdom with spiritual calling — what it looks like when banking experience meets biblical stewardship.',
  },
]

const HOW_DID_YOU_HEAR = [
  'Instagram',
  'Facebook',
  'LinkedIn',
  'WhatsApp',
  'A friend or colleague',
  'Previous Catch Up episode',
  'Other',
]

const INITIAL = {
  name: '',
  email: '',
  whatsapp: '',
  country: '',
  heardFrom: '',
}

// ---- Page -------------------------------------------------------------------

export default function CatchUpPage() {
  const location = useLocation()
  useEffect(() => {
    if (location.hash) return
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [location.hash, location.pathname])

  return (
    <>
      <Navbar />
      <main>
        <CatchUpHero />
        <RegisterBand />
        <PastEpisodesBand />
        <FinalBand />
      </main>
      <Footer />
    </>
  )
}

// ---- Hero -------------------------------------------------------------------

function CatchUpHero() {
  const countdown = useCountdown(UPCOMING.startsAt)
  return (
    <section className="cu-hero">
      <div className="cu-hero__bg" aria-hidden="true">
        <span className="cu-hero__orb cu-hero__orb--gold" />
        <span className="cu-hero__orb cu-hero__orb--purple" />
        <span className="cu-hero__grid" />
      </div>

      <div className="site-container cu-hero__inner">
        <span className="cu-hero__eyebrow">
          <span className="cu-hero__pulse" aria-hidden="true" />
          Free · Live on Zoom · Monthly
        </span>
        <h1 className="cu-hero__title">
          Catch Up With <em>Lady Adel</em>
        </h1>
        <p className="cu-hero__lede">
          A free monthly Zoom platform bringing faith-driven leaders,
          entrepreneurs and professionals together for honest conversations
          and expert insights. Register once, show up every month.
        </p>

        <div className="cu-hero__card">
          <div className="cu-hero__card-top">
            <span className="cu-hero__badge">
              <span className="cu-hero__pulse" aria-hidden="true" />
              Next episode
            </span>
            <span className="cu-hero__meta">{UPCOMING.episode} · {UPCOMING.date}</span>
          </div>
          <h2 className="cu-hero__ep-title">{UPCOMING.topic}</h2>
          <p className="cu-hero__speaker">{UPCOMING.speaker} · {UPCOMING.time}</p>

          <div className="cu-hero__countdown" aria-label={`Countdown to ${UPCOMING.episode}`}>
            <CountUnit value={countdown.days}    label="Days" />
            <CountUnit value={countdown.hours}   label="Hours" />
            <CountUnit value={countdown.minutes} label="Min"  />
            <CountUnit value={countdown.seconds} label="Sec"  />
          </div>

          <div className="cu-hero__ctas">
            <CTAButton href="#register" variant="primary" size="lg">
              Register — it&rsquo;s free
            </CTAButton>
            <CTAButton to="/lady-adel#about" variant="outline-light" size="lg" arrow={false}>
              About Lady Adel
            </CTAButton>
          </div>
        </div>
      </div>

      <style>{`
        .cu-hero {
          position: relative;
          padding: 120px 0 90px;
          background:
            radial-gradient(ellipse at 12% 10%, rgba(91, 45, 142, 0.55) 0%, transparent 55%),
            radial-gradient(ellipse at 90% 90%, rgba(201, 168, 76, 0.18) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
          isolation: isolate;
        }
        .cu-hero__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .cu-hero__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.55; }
        .cu-hero__orb--gold   { width: 480px; height: 480px; top: -160px; right: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.42), transparent 70%); }
        .cu-hero__orb--purple { width: 520px; height: 520px; bottom: -200px; left: -160px; background: radial-gradient(circle, rgba(122, 71, 184, 0.5), transparent 70%); }
        .cu-hero__grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse at center, black 25%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 25%, transparent 75%);
          opacity: 0.5;
        }

        .cu-hero__inner { position: relative; z-index: 1; text-align: center; }
        .cu-hero__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          color: var(--gold);
          padding: 7px 14px;
          background: rgba(201, 168, 76, 0.12);
          border: 1px solid rgba(201, 168, 76, 0.3);
          border-radius: 999px;
          margin-bottom: 22px;
        }
        .cu-hero__pulse { width: 8px; height: 8px; background: var(--gold); border-radius: 50%; animation: pulseGoldCU 1.8s infinite; }
        @keyframes pulseGoldCU {
          0% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.6); }
          70% { box-shadow: 0 0 0 8px rgba(201, 168, 76, 0); }
          100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0); }
        }
        .cu-hero__title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(38px, 6.2vw, 68px);
          line-height: 1.05;
          letter-spacing: -1.4px;
          margin-bottom: 16px;
        }
        .cu-hero__title em {
          font-style: italic;
          color: var(--gold);
        }
        .cu-hero__lede {
          max-width: 640px;
          margin: 0 auto 44px;
          font-size: 16px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.82);
        }

        .cu-hero__card {
          max-width: 820px;
          margin: 0 auto;
          padding: 26px 20px 28px;
          background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 24px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(10px);
          text-align: left;
        }
        @media (min-width: 768px) { .cu-hero__card { padding: 32px 40px 36px; } }

        .cu-hero__card-top {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 10px 16px;
          margin-bottom: 14px;
        }
        .cu-hero__badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          background: rgba(201, 168, 76, 0.15);
          color: var(--gold);
          border: 1px solid rgba(201, 168, 76, 0.35);
          border-radius: 999px;
        }
        .cu-hero__meta {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
        }
        .cu-hero__ep-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3.4vw, 32px);
          line-height: 1.2;
          letter-spacing: -0.4px;
          margin-bottom: 8px;
        }
        .cu-hero__speaker { font-size: 14px; color: rgba(255, 255, 255, 0.72); margin-bottom: 20px; }

        .cu-hero__countdown {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 22px;
        }

        .cu-hero__ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cu-hero__ctas .cta { white-space: normal; text-align: center; line-height: 1.25; }
        @media (min-width: 520px) {
          .cu-hero__ctas { flex-direction: row; flex-wrap: wrap; }
          .cu-hero__ctas .cta { white-space: nowrap; }
        }
      `}</style>
    </section>
  )
}

// ---- Registration band ------------------------------------------------------

function RegisterBand() {
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  function handleChange(e) {
    const { name, value } = e.target
    setValues(v => ({ ...v, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }))
  }

  function validate(v) {
    const er = {}
    if (!v.name.trim())  er.name  = 'Please enter your name.'
    if (!v.email.trim()) er.email = 'We need an email for the Zoom link.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) er.email = 'That email does not look right.'
    return er
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const er = validate(values)
    if (Object.keys(er).length > 0) { setErrors(er); return }
    setStatus('submitting')
    try {
      // TODO: replace with real registration endpoint / mailing list.
      // eslint-disable-next-line no-console
      console.info('[CatchUpPage] registration submitted', values)
      await new Promise(r => setTimeout(r, 600))
      setStatus('success')
      setValues(INITIAL)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[CatchUpPage] submission failed', err)
      setStatus('error')
    }
  }

  return (
    <section className="cu-reg site-section" id="register">
      <div className="site-container cu-reg__inner">
        <div className="cu-reg__grid">
          <div className="cu-reg__lede">
            <SectionHeader
              eyebrow="Register for the next episode"
              title={<>Save your seat in <em>under a minute</em></>}
              subtitle="We'll send the Zoom link, a calendar invite and a reminder the day before. No spam — just the episode details and notice of upcoming sessions."
              align="left"
            />

            <ul className="cu-reg__perks">
              <li><span className="cu-reg__tick"><IconCheck /></span>Live Q&amp;A with Lady Adel and the guest speaker</li>
              <li><span className="cu-reg__tick"><IconCheck /></span>Replay link sent after the session</li>
              <li><span className="cu-reg__tick"><IconCheck /></span>Invitation to the private community follow-ups</li>
              <li><span className="cu-reg__tick"><IconCheck /></span>Early notice of future episodes and guest speakers</li>
            </ul>
          </div>

          <div className="cu-reg__form-wrap">
            {status === 'success' ? (
              <div className="cu-reg__thanks" role="status" aria-live="polite">
                <div className="cu-reg__thanks-icon"><IconCheck /></div>
                <h3>You&rsquo;re in.</h3>
                <p>
                  Check your inbox for the Zoom link and calendar invite.
                  If it hasn&rsquo;t arrived in a few minutes, peek at your
                  promotions or spam folder.
                </p>
                <button type="button" className="cu-reg__reset" onClick={() => setStatus('idle')}>
                  Register another person
                </button>
              </div>
            ) : (
              <form className="cu-reg__form" noValidate onSubmit={handleSubmit}>
                <div className="cu-reg__head">
                  <span className="cu-reg__head-eyebrow">Free · Takes under a minute</span>
                  <h3>{UPCOMING.episode} · {UPCOMING.date}</h3>
                </div>

                <Field
                  label="Full name" name="name" required
                  value={values.name} error={errors.name}
                  onChange={handleChange} autoComplete="name"
                />
                <Field
                  label="Email address" name="email" type="email" required
                  hint="We'll send the Zoom link here"
                  value={values.email} error={errors.email}
                  onChange={handleChange} autoComplete="email"
                />
                <Field
                  label="WhatsApp number" name="whatsapp" type="tel"
                  hint="Optional — for session reminders"
                  value={values.whatsapp} error={errors.whatsapp}
                  onChange={handleChange} autoComplete="tel"
                />
                <Field
                  label="Country" name="country"
                  hint="Optional — helps us plan regional sessions"
                  value={values.country} error={errors.country}
                  onChange={handleChange} autoComplete="country-name"
                />
                <SelectField
                  label="How did you hear about Catch Up?" name="heardFrom"
                  value={values.heardFrom} error={errors.heardFrom}
                  onChange={handleChange}
                  options={HOW_DID_YOU_HEAR}
                  placeholder="Pick the one that fits"
                />

                <button
                  type="submit"
                  className="cu-reg__submit"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? 'Reserving your seat…' : 'Reserve my seat'}
                  {status !== 'submitting' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                </button>

                <p className="cu-reg__privacy">
                  By registering you agree to receive the Zoom link and episode
                  reminders by email. Unsubscribe anytime.
                </p>

                {status === 'error' && (
                  <p className="cu-reg__error" role="alert">
                    Something went wrong sending your registration. Please try again.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .cu-reg { background: var(--cream); color: var(--ink); position: relative; overflow: hidden; }
        .cu-reg__grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 32px;
          align-items: start;
        }
        @media (min-width: 980px) {
          .cu-reg__grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 48px; }
        }
        .cu-reg__perks {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 18px;
        }
        .cu-reg__perks li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14.5px;
          line-height: 1.55;
          color: rgba(13, 33, 55, 0.82);
        }
        .cu-reg__tick {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(91, 45, 142, 0.12);
          color: var(--purple);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .cu-reg__tick svg { width: 14px; height: 14px; }

        .cu-reg__form-wrap {
          padding: 28px 22px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 22px 60px rgba(13, 33, 55, 0.08);
          min-width: 0;
        }
        @media (min-width: 768px) { .cu-reg__form-wrap { padding: 36px 40px; } }

        .cu-reg__head { margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid rgba(13, 33, 55, 0.08); }
        .cu-reg__head-eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          color: var(--purple);
          margin-bottom: 6px;
        }
        .cu-reg__head h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 20px;
          color: var(--navy);
          letter-spacing: -0.3px;
        }

        .cu-reg__form { display: flex; flex-direction: column; gap: 18px; }
        .cu-reg__submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--orange);
          color: var(--white);
          border: 0;
          border-radius: 999px;
          padding: 14px 24px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(224, 90, 30, 0.28);
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          margin-top: 4px;
        }
        .cu-reg__submit:hover:not(:disabled) {
          background: var(--orange-dark);
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(224, 90, 30, 0.38);
        }
        .cu-reg__submit:disabled { opacity: 0.65; cursor: not-allowed; }
        .cu-reg__privacy { font-size: 11.5px; color: rgba(13, 33, 55, 0.55); line-height: 1.55; }
        .cu-reg__error {
          padding: 12px 14px; border-radius: 10px;
          background: rgba(224, 90, 30, 0.08);
          border: 1px solid rgba(224, 90, 30, 0.3);
          color: var(--orange-dark);
          font-size: 13px;
        }

        .cu-reg__thanks { text-align: center; padding: 20px 4px; }
        .cu-reg__thanks-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 60px; height: 60px;
          margin-bottom: 18px;
          border-radius: 50%;
          background: rgba(91, 45, 142, 0.12);
          color: var(--purple);
        }
        .cu-reg__thanks-icon svg { width: 28px; height: 28px; }
        .cu-reg__thanks h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 28px);
          color: var(--navy);
          margin-bottom: 10px;
        }
        .cu-reg__thanks p {
          max-width: 460px;
          margin: 0 auto 18px;
          font-size: 14px;
          line-height: 1.6;
          color: rgba(13, 33, 55, 0.7);
        }
        .cu-reg__reset {
          background: transparent; border: 0; cursor: pointer;
          color: var(--purple); font-weight: 800; font-size: 13px;
          text-decoration: underline; text-underline-offset: 3px;
        }
      `}</style>
    </section>
  )
}

// ---- Past episodes ----------------------------------------------------------

function PastEpisodesBand() {
  return (
    <section className="cu-past site-section">
      <div className="site-container">
        <SectionHeader
          eyebrow="Past Episodes"
          title={<>Catch up on the <em>conversations</em> so far</>}
          subtitle="Previous Catch Up sessions are released as replays. Watch what you missed — then register to join us live next month."
        />
        <div className="cu-past__grid">
          {PAST_EPISODES.map(ep => (
            <article key={ep.number} className="cu-past__card">
              <div className="cu-past__thumb" aria-hidden="true">
                <span>{ep.number.replace('Episode ', 'EP ')}</span>
              </div>
              <div className="cu-past__body">
                <div className="cu-past__meta">{ep.number} · {ep.date}</div>
                <h3>{ep.title}</h3>
                <p className="cu-past__speaker">{ep.speaker}</p>
                <p className="cu-past__summary">{ep.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .cu-past { background: var(--white); color: var(--ink); }
        .cu-past__grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 22px;
        }
        @media (min-width: 720px) { .cu-past__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

        .cu-past__card {
          display: grid;
          grid-template-columns: 140px minmax(0, 1fr);
          overflow: hidden;
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          background: var(--cream);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .cu-past__card:hover {
          transform: translateY(-3px);
          border-color: rgba(201, 168, 76, 0.4);
          box-shadow: 0 20px 46px rgba(13, 33, 55, 0.09);
        }
        .cu-past__thumb {
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 30% 30%, rgba(201, 168, 76, 0.35), transparent 60%),
            linear-gradient(135deg, var(--purple) 0%, var(--navy) 100%);
          color: rgba(255, 255, 255, 0.92);
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 22px;
          letter-spacing: 1.5px;
        }
        .cu-past__body { padding: 22px 22px 24px; }
        .cu-past__meta {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: var(--purple);
          margin-bottom: 6px;
        }
        .cu-past__body h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 19px;
          color: var(--navy);
          line-height: 1.25;
          letter-spacing: -0.3px;
          margin-bottom: 6px;
        }
        .cu-past__speaker { font-size: 12.5px; color: rgba(13, 33, 55, 0.6); margin-bottom: 10px; }
        .cu-past__summary { font-size: 13.5px; line-height: 1.6; color: rgba(13, 33, 55, 0.78); }
      `}</style>
    </section>
  )
}

// ---- Final band -------------------------------------------------------------

function FinalBand() {
  return (
    <section className="cu-final">
      <div className="site-container">
        <div className="cu-final__card">
          <div>
            <span className="cu-final__eyebrow">Join the room</span>
            <h3>The Catch Up is free. The community is the reward.</h3>
            <p>One hour a month. Honest conversation. Leaders who show up for each other. Reserve your seat for the next episode.</p>
          </div>
          <CTAButton href="#register" variant="gold" size="lg">
            Reserve my seat — free
          </CTAButton>
        </div>
      </div>

      <style>{`
        .cu-final {
          padding: 72px 0 110px;
          background:
            radial-gradient(ellipse at 10% 0%, rgba(91, 45, 142, 0.35) 0%, transparent 55%),
            radial-gradient(ellipse at 90% 100%, rgba(201, 168, 76, 0.18) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
        }
        .cu-final__card {
          padding: 32px 26px;
          border-radius: 22px;
          background:
            radial-gradient(ellipse at 0% 0%, rgba(201, 168, 76, 0.25), transparent 60%),
            linear-gradient(135deg, rgba(91, 45, 142, 0.55), rgba(13, 33, 55, 0.6));
          border: 1px solid rgba(201, 168, 76, 0.3);
          display: flex;
          flex-direction: column;
          gap: 22px;
          align-items: stretch;
        }
        .cu-final__card > * { min-width: 0; }
        @media (min-width: 880px) {
          .cu-final__card {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 40px 48px;
            gap: 36px;
          }
        }
        .cu-final__eyebrow {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 8px;
        }
        .cu-final h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 28px);
          color: var(--white);
          letter-spacing: -0.2px;
          margin-bottom: 8px;
        }
        .cu-final p { font-size: 14px; line-height: 1.65; color: rgba(255, 255, 255, 0.72); max-width: 580px; }
      `}</style>
    </section>
  )
}

// ---- Countdown --------------------------------------------------------------

function CountUnit({ value, label }) {
  return (
    <div className="cu-count">
      <span className="cu-count__value">{String(value).padStart(2, '0')}</span>
      <span className="cu-count__label">{label}</span>
      <style>{`
        .cu-count {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 6px;
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }
        .cu-count__value {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(22px, 3vw, 30px);
          color: var(--white);
          line-height: 1;
          letter-spacing: -0.5px;
          font-variant-numeric: tabular-nums;
        }
        .cu-count__label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
        }
      `}</style>
    </div>
  )
}

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, target.getTime() - now)
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    done:    diff === 0,
  }
}

// ---- Form primitives --------------------------------------------------------

function Field({ label, name, type = 'text', required, hint, value, error, onChange, ...rest }) {
  const id = `cu-${name}`
  return (
    <div className={`cu-fld ${error ? 'is-invalid' : ''}`}>
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <input
        id={id} name={name} type={type}
        required={required}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {error
        ? <span className="cu-fld__err" id={`${id}-err`}>{error}</span>
        : hint ? <span className="cu-fld__hint" id={`${id}-hint`}>{hint}</span> : null}

      <style>{`
        .cu-fld { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .cu-fld label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: var(--navy);
        }
        .cu-fld label span { color: var(--orange); }
        .cu-fld input, .cu-fld select, .cu-fld textarea {
          width: 100%;
          font: inherit;
          font-size: 15px;
          color: var(--navy);
          padding: 12px 14px;
          border: 1.5px solid rgba(13, 33, 55, 0.15);
          border-radius: 12px;
          background: var(--white);
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .cu-fld input:focus, .cu-fld select:focus {
          outline: none;
          border-color: var(--purple);
          box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.18);
        }
        .cu-fld__hint { font-size: 11.5px; color: rgba(13, 33, 55, 0.55); }
        .cu-fld__err  { font-size: 12px; color: var(--orange); font-weight: 700; }
        .cu-fld.is-invalid input, .cu-fld.is-invalid select {
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(224, 90, 30, 0.12);
        }
      `}</style>
    </div>
  )
}

function SelectField({ label, name, value, error, onChange, options, placeholder }) {
  const id = `cu-${name}`
  return (
    <div className={`cu-fld ${error ? 'is-invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <select id={id} name={name} value={value} onChange={onChange} aria-invalid={!!error}>
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {error && <span className="cu-fld__err">{error}</span>}
      <style>{`
        .cu-fld select {
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1l5 5 5-5' stroke='%230D2137' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 38px;
        }
      `}</style>
    </div>
  )
}

// ---- Icons ------------------------------------------------------------------

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 12 10 18 20 6" />
    </svg>
  )
}
