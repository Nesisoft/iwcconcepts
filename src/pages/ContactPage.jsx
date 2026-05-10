import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SectionHeader from '../components/ui/SectionHeader'
import CTAButton from '../components/ui/CTAButton'

/**
 * /contact — full Contact page.
 *
 * Sits alongside the existing /lady-adel#contact section. This page
 * goes deeper: instant-contact tiles, a wider form, a "right place?"
 * routing band, dedicated paths for press / speaking / partnerships,
 * social + office info and a final CTA.
 *
 * Composition (built across Steps 14.1–14.6):
 *   14.1 · Hero + 3 instant-contact tiles      ← this step
 *   14.2 · Main form band (#message)
 *   14.3 · "Right place?" routing band
 *   14.4 · Press / Speaking / Partnerships
 *   14.5 · Socials + Office / Hours
 *   14.6 · Final CTA
 *
 * PLACEHOLDERS to replace post-launch:
 *   - WHATSAPP_NUMBER, CONTACT_EMAIL — confirm real values
 *   - OFFICE.* — confirm real address / hours
 *   - Specialist emails (press@ / speaking@ / partnerships@)
 *   - Form submit handler (stubbed in Step 14.2)
 */

// PLACEHOLDER values — confirm with the team before launch.
const WHATSAPP_NUMBER = '233000000000'
const CONTACT_EMAIL   = 'hello@iwcconcepts.com'

const RESPONSE_WINDOW = 'Within 2 working days'
const OFFICE_HOURS    = 'Mon – Fri · 9am – 5pm GMT'

// Enquiry routing — keep order matching the routing-band cards in 14.3
const ENQUIRY_TYPES = [
  'Corporate / Staff Training',
  'Speaking engagement',
  'One-on-one Coaching',
  'Entrepreneur Programme',
  'Catch Up registration',
  'Media / Press',
  'Partnership / Sponsorship',
  'General enquiry',
]
const PREFERRED_CONTACT = ['Email', 'WhatsApp', 'Either']

const INITIAL_MESSAGE = {
  name: '', email: '', whatsapp: '',
  organisation: '', country: '',
  enquiry: '', preferred: '',
  subject: '', message: '',
}

// ---- Page -------------------------------------------------------------------

export default function ContactPage() {
  const location = useLocation()
  useEffect(() => {
    if (location.hash) return
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [location.hash, location.pathname])

  return (
    <>
      <Navbar />
      <main>
        <ContactHero />
        <MessageBand />
        {/* Further bands added in Steps 14.3–14.6 */}
      </main>
      <Footer />
    </>
  )
}

// ---- Hero -------------------------------------------------------------------

function ContactHero() {
  return (
    <section className="cp-hero">
      <div className="cp-hero__bg" aria-hidden="true">
        <span className="cp-hero__orb cp-hero__orb--purple" />
        <span className="cp-hero__orb cp-hero__orb--gold" />
        <span className="cp-hero__grid" />
      </div>

      <div className="site-container cp-hero__inner">
        <span className="cp-hero__eyebrow">Get In Touch</span>

        <h1 className="cp-hero__title">
          Let&rsquo;s <em>talk</em> about what you&rsquo;re building
        </h1>

        <p className="cp-hero__lede">
          Whether you&rsquo;re scoping a training engagement, applying to the
          programme, planning a speaking slot or just saying hello — start
          here. Pick the channel that suits you and we&rsquo;ll come back
          quickly.
        </p>

        <ul className="cp-hero__tiles">
          <li className="cp-tile">
            <a className="cp-tile__link" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
              <span className="cp-tile__icon cp-tile__icon--green" aria-hidden="true"><IconWhatsApp /></span>
              <div>
                <span className="cp-tile__label">WhatsApp</span>
                <span className="cp-tile__value">Fastest route</span>
                <span className="cp-tile__sub">Tap to open a chat</span>
              </div>
            </a>
          </li>
          <li className="cp-tile">
            <a className="cp-tile__link" href={`mailto:${CONTACT_EMAIL}`}>
              <span className="cp-tile__icon cp-tile__icon--purple" aria-hidden="true"><IconMail /></span>
              <div>
                <span className="cp-tile__label">Email</span>
                <span className="cp-tile__value cp-tile__value--mono">{CONTACT_EMAIL}</span>
                <span className="cp-tile__sub">For longer briefs &amp; documents</span>
              </div>
            </a>
          </li>
          <li className="cp-tile cp-tile--info">
            <div className="cp-tile__link cp-tile__link--static">
              <span className="cp-tile__icon cp-tile__icon--gold" aria-hidden="true"><IconClock /></span>
              <div>
                <span className="cp-tile__label">Response window</span>
                <span className="cp-tile__value">{RESPONSE_WINDOW}</span>
                <span className="cp-tile__sub">{OFFICE_HOURS}</span>
              </div>
            </div>
          </li>
        </ul>

        <div className="cp-hero__ctas">
          <CTAButton href="#message" variant="primary" size="lg">
            Send a message
          </CTAButton>
          <CTAButton
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            variant="outline-light"
            size="lg"
            arrow={false}
            external
          >
            Message on WhatsApp
          </CTAButton>
        </div>
      </div>

      <style>{`
        .cp-hero {
          position: relative;
          padding: 120px 0 80px;
          background:
            radial-gradient(ellipse at 12% 0%, rgba(91, 45, 142, 0.5) 0%, transparent 55%),
            radial-gradient(ellipse at 88% 100%, rgba(201, 168, 76, 0.2) 0%, transparent 55%),
            linear-gradient(160deg, #0D2137 0%, #14294a 55%, #1a0d2e 100%);
          color: var(--white);
          overflow: hidden;
          isolation: isolate;
        }
        .cp-hero__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .cp-hero__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.55; }
        .cp-hero__orb--purple { width: 520px; height: 520px; top: -180px; left: -160px; background: radial-gradient(circle, rgba(122, 71, 184, 0.5), transparent 70%); }
        .cp-hero__orb--gold   { width: 460px; height: 460px; bottom: -180px; right: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.38), transparent 70%); }
        .cp-hero__grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse at center, black 25%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 25%, transparent 75%);
          opacity: 0.5;
        }

        .cp-hero__inner { position: relative; z-index: 1; text-align: center; max-width: 940px; }

        .cp-hero__eyebrow {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.6px;
          text-transform: uppercase;
          color: var(--gold);
          padding: 7px 16px;
          background: rgba(201, 168, 76, 0.12);
          border: 1px solid rgba(201, 168, 76, 0.32);
          border-radius: 999px;
          margin-bottom: 22px;
        }

        .cp-hero__title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(38px, 6.4vw, 70px);
          line-height: 1.05;
          letter-spacing: -1.4px;
          margin-bottom: 18px;
        }
        .cp-hero__title em { font-style: italic; color: var(--gold); }

        .cp-hero__lede {
          max-width: 700px;
          margin: 0 auto 42px;
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.82);
        }

        /* Tiles */
        .cp-hero__tiles {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 14px;
          margin: 0 auto 38px;
          max-width: 880px;
          text-align: left;
        }
        @media (min-width: 720px)  { .cp-hero__tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        .cp-tile { min-width: 0; }
        .cp-tile__link {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px 20px;
          height: 100%;
          background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          color: var(--white);
          text-decoration: none;
          transition: border-color 0.22s ease, transform 0.22s ease, background 0.22s ease;
        }
        .cp-tile__link:hover { border-color: rgba(201, 168, 76, 0.45); transform: translateY(-3px); }
        .cp-tile__link--static { cursor: default; }
        .cp-tile__link--static:hover { transform: none; border-color: rgba(255, 255, 255, 0.12); }

        .cp-tile__icon {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: var(--white);
        }
        .cp-tile__icon svg { width: 20px; height: 20px; }
        .cp-tile__icon--green  { background: linear-gradient(135deg, #25D366, #1da851); }
        .cp-tile__icon--purple { background: linear-gradient(135deg, var(--purple), #7a47b8); }
        .cp-tile__icon--gold   { background: linear-gradient(135deg, var(--gold), var(--gold-dark)); color: var(--navy); }

        .cp-tile__label {
          display: block;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
          margin-bottom: 4px;
        }
        .cp-tile__value {
          display: block;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 17px;
          color: var(--white);
          letter-spacing: -0.2px;
          margin-bottom: 4px;
          word-break: break-word;
        }
        .cp-tile__value--mono {
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 600;
        }
        .cp-tile__sub {
          display: block;
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.62);
          line-height: 1.45;
        }

        /* CTAs */
        .cp-hero__ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 460px;
          margin: 0 auto;
        }
        .cp-hero__ctas .cta { white-space: normal; text-align: center; line-height: 1.25; }
        @media (min-width: 520px) {
          .cp-hero__ctas {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            max-width: none;
          }
          .cp-hero__ctas .cta { white-space: nowrap; }
        }
      `}</style>
    </section>
  )
}

// ---- Hero icons -------------------------------------------------------------

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.2.3-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2.1-.2-.5-.4-.5-.6-.5-.1 0-.3 0-.5 0-.2 0-.5.1-.7.3-.3.3-1 .9-1 2.3 0 1.3 1 2.7 1.2 2.9.1.2 2 3.1 4.9 4.4.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.4c1.4.8 2.9 1.2 4.6 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  )
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  )
}

// ---- Main contact form ------------------------------------------------------

function MessageBand() {
  const [values, setValues] = useState(INITIAL_MESSAGE)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')   // 'idle' | 'submitting' | 'success' | 'error'

  function handleChange(e) {
    const { name, value } = e.target
    setValues(v => ({ ...v, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }))
  }

  function validate() {
    const er = {}
    if (!values.name.trim())    er.name    = 'Please enter your name.'
    if (!values.email.trim())   er.email   = 'We need an email to reply on.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) er.email = 'That email does not look right.'
    if (!values.subject.trim()) er.subject = 'A short subject helps us route this.'
    if (!values.message.trim()) er.message = 'Please tell us what we can help with.'
    return er
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const er = validate()
    if (Object.keys(er).length > 0) { setErrors(er); return }
    setStatus('submitting')
    try {
      // TODO: wire to real backend (Formspree/Resend/internal endpoint).
      // eslint-disable-next-line no-console
      console.info('[ContactPage] message submitted', values)
      await new Promise(r => setTimeout(r, 600))
      setStatus('success')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ContactPage] submission failed', err)
      setStatus('error')
    }
  }

  function reset() {
    setStatus('idle')
    setErrors({})
    setValues(INITIAL_MESSAGE)
  }

  return (
    <section className="cp-msg" id="message">
      <div className="site-container">
        <SectionHeader
          eyebrow="Send a Message"
          title={<>Tell us what you&rsquo;re <em>thinking about</em></>}
          subtitle="A few short fields and one paragraph is plenty. Pick the enquiry type so we route it to the right person on the team — and we'll come back within 2 working days."
        />

        <div className="cp-msg__wrap">
          {status === 'success' ? (
            <MessageSuccess values={values} onReset={reset} />
          ) : (
            <form className="cp-msg__form" noValidate onSubmit={handleSubmit}>
              <FormGroup title="About you">
                <Field
                  label="Full name" name="name" required
                  value={values.name} error={errors.name}
                  onChange={handleChange} autoComplete="name"
                />
                <Field
                  label="Email address" name="email" type="email" required
                  value={values.email} error={errors.email}
                  onChange={handleChange} autoComplete="email"
                />
                <Field
                  label="WhatsApp number" name="whatsapp" type="tel"
                  hint="Optional — speeds things up if we end up chatting"
                  value={values.whatsapp} error={errors.whatsapp}
                  onChange={handleChange} autoComplete="tel"
                />
                <Field
                  label="Organisation" name="organisation"
                  hint="Optional — leave blank for personal enquiries"
                  value={values.organisation} error={errors.organisation}
                  onChange={handleChange} autoComplete="organization"
                />
                <Field
                  label="Country / City" name="country"
                  value={values.country} error={errors.country}
                  onChange={handleChange} autoComplete="country-name"
                />
              </FormGroup>

              <FormGroup title="Your enquiry">
                <SelectField
                  label="Enquiry type" name="enquiry"
                  placeholder="Pick the one that fits"
                  options={ENQUIRY_TYPES}
                  value={values.enquiry} error={errors.enquiry}
                  onChange={handleChange}
                />
                <RadioGroup
                  label="Preferred contact method" name="preferred"
                  options={PREFERRED_CONTACT}
                  value={values.preferred} error={errors.preferred}
                  onChange={handleChange}
                />
                <Field
                  label="Subject" name="subject" required
                  hint="A short headline — e.g. “Board training for 12 directors”"
                  value={values.subject} error={errors.subject}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup title="Message">
                <TextAreaField
                  label="What can we help with?" name="message" required
                  rows={5}
                  hint="A short paragraph is plenty — we&rsquo;ll come back with the right questions."
                  value={values.message} error={errors.message}
                  onChange={handleChange}
                />
              </FormGroup>

              <button
                type="submit"
                className="cp-msg__submit"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending your message…' : 'Send message'}
                {status !== 'submitting' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>

              <p className="cp-msg__privacy">
                We use your details only to reply to this enquiry. No
                marketing list, no third-party sharing. If we&rsquo;re not the
                right fit we&rsquo;ll say so directly.
              </p>

              {status === 'error' && (
                <p className="cp-msg__error" role="alert">
                  Something went wrong sending your message. Please try
                  again — or email us directly at{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      <style>{`
        .cp-msg { background: var(--cream); color: var(--ink); padding: 100px 0 110px; }

        .cp-msg__wrap {
          max-width: 760px;
          margin: 0 auto;
          padding: 28px 22px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 22px 60px rgba(13, 33, 55, 0.08);
          min-width: 0;
        }
        @media (min-width: 768px) { .cp-msg__wrap { padding: 40px 44px; } }

        .cp-msg__form { display: flex; flex-direction: column; gap: 28px; }

        .cp-msg__submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--orange);
          color: var(--white);
          border: 0;
          border-radius: 999px;
          padding: 15px 28px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(224, 90, 30, 0.28);
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          margin-top: 6px;
        }
        .cp-msg__submit:hover:not(:disabled) {
          background: var(--orange-dark);
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(224, 90, 30, 0.38);
        }
        .cp-msg__submit:disabled { opacity: 0.65; cursor: not-allowed; }

        .cp-msg__privacy { font-size: 11.5px; line-height: 1.6; color: rgba(13, 33, 55, 0.55); }
        .cp-msg__error {
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(224, 90, 30, 0.08);
          border: 1px solid rgba(224, 90, 30, 0.3);
          color: var(--orange-dark);
          font-size: 13px;
        }
        .cp-msg__error a { color: var(--purple); font-weight: 700; }
      `}</style>
    </section>
  )
}

// ---- Success state ----------------------------------------------------------

function MessageSuccess({ values, onReset }) {
  const waMsg = encodeURIComponent(
    `Hi Lady Adel — I just sent a message via the website${
      values.subject ? ` about "${values.subject}"` : ''
    }.`
  )
  return (
    <div className="cp-succ" role="status" aria-live="polite">
      <div className="cp-succ__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 12 10 18 20 6" />
        </svg>
      </div>
      <h3>Message sent.</h3>
      <p>
        We&rsquo;ll come back within 2 working days. If your timeline is
        tighter, the fastest route is a direct WhatsApp.
      </p>
      <div className="cp-succ__ctas">
        <CTAButton
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
          variant="primary"
          size="md"
          external
          arrow={false}
        >
          Message on WhatsApp
        </CTAButton>
        <CTAButton
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(values.subject || 'Follow-up')}`}
          variant="ghost"
          size="md"
          arrow={false}
        >
          Email the team
        </CTAButton>
      </div>
      <button type="button" className="cp-succ__reset" onClick={onReset}>
        Send another message
      </button>

      <style>{`
        .cp-succ { text-align: center; padding: 20px 4px; }
        .cp-succ__icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 64px; height: 64px;
          margin-bottom: 18px;
          border-radius: 50%;
          background: rgba(91, 45, 142, 0.12);
          color: var(--purple);
        }
        .cp-succ__icon svg { width: 28px; height: 28px; }
        .cp-succ h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 28px);
          color: var(--navy);
          margin-bottom: 10px;
        }
        .cp-succ p {
          max-width: 520px;
          margin: 0 auto 24px;
          font-size: 14px;
          line-height: 1.65;
          color: rgba(13, 33, 55, 0.72);
        }
        .cp-succ__ctas {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }
        @media (min-width: 520px) {
          .cp-succ__ctas {
            flex-direction: row;
            justify-content: center;
            flex-wrap: wrap;
          }
        }
        .cp-succ__reset {
          background: transparent;
          border: 0;
          cursor: pointer;
          color: var(--purple);
          font-weight: 800;
          font-size: 13px;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      `}</style>
    </div>
  )
}

// ---- Form primitives (cp- prefix) -------------------------------------------

function FormGroup({ title, children }) {
  return (
    <fieldset className="cp-grp">
      <legend>{title}</legend>
      <div className="cp-grp__rows">{children}</div>
      <style>{`
        .cp-grp { border: 0; padding: 0; margin: 0; }
        .cp-grp legend {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--purple);
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(91, 45, 142, 0.15);
          width: 100%;
        }
        .cp-grp__rows { display: flex; flex-direction: column; gap: 16px; }
      `}</style>
    </fieldset>
  )
}

function Field({ label, name, type = 'text', required, hint, value, error, onChange, ...rest }) {
  const id = `cp-${name}`
  return (
    <div className={`cp-fld ${error ? 'is-invalid' : ''}`}>
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
        ? <span className="cp-fld__err" id={`${id}-err`}>{error}</span>
        : hint ? <span className="cp-fld__hint" id={`${id}-hint`}>{hint}</span> : null}
      <FieldStyles />
    </div>
  )
}

function SelectField({ label, name, value, error, onChange, options, placeholder, required }) {
  const id = `cp-${name}`
  return (
    <div className={`cp-fld cp-fld--sel ${error ? 'is-invalid' : ''}`}>
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <select
        id={id} name={name}
        value={value} onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {error && <span className="cp-fld__err" id={`${id}-err`}>{error}</span>}
      <FieldStyles />
    </div>
  )
}

function TextAreaField({ label, name, required, hint, rows = 4, value, error, onChange }) {
  const id = `cp-${name}`
  return (
    <div className={`cp-fld ${error ? 'is-invalid' : ''}`}>
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <textarea
        id={id} name={name} rows={rows}
        required={required}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      />
      {error
        ? <span className="cp-fld__err" id={`${id}-err`}>{error}</span>
        : hint ? <span className="cp-fld__hint" id={`${id}-hint`}>{hint}</span> : null}
      <FieldStyles />
    </div>
  )
}

function RadioGroup({ label, name, options, value, error, onChange, required }) {
  const errId = `cp-${name}-err`
  return (
    <div className={`cp-fld ${error ? 'is-invalid' : ''}`}>
      <span className="cp-fld__label-static">
        {label}{required && <span aria-hidden="true" className="cp-fld__req"> *</span>}
      </span>
      <div
        className="cp-radio__row"
        role="radiogroup"
        aria-label={label}
        aria-describedby={error ? errId : undefined}
      >
        {options.map(opt => {
          const id = `cp-${name}-${opt.replace(/\s+/g, '-').toLowerCase()}`
          const on = value === opt
          return (
            <label key={opt} htmlFor={id} className={`cp-radio ${on ? 'is-on' : ''}`}>
              <input
                id={id} type="radio"
                name={name} value={opt}
                checked={on}
                onChange={onChange}
              />
              <span className="cp-radio__dot" aria-hidden="true" />
              <span>{opt}</span>
            </label>
          )
        })}
      </div>
      {error && <span className="cp-fld__err" id={errId}>{error}</span>}
      <style>{`
        .cp-radio__row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        @media (min-width: 520px) {
          .cp-radio__row { flex-direction: row; flex-wrap: wrap; gap: 10px; }
        }
        .cp-radio {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          background: var(--white);
          border: 1.5px solid rgba(13, 33, 55, 0.15);
          border-radius: 12px;
          cursor: pointer;
          font-size: 13.5px;
          color: var(--navy);
          transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
          flex: 1 1 auto;
          min-width: 0;
        }
        .cp-radio:hover { border-color: rgba(91, 45, 142, 0.32); }
        .cp-radio.is-on {
          border-color: var(--purple);
          box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.14);
          background: rgba(91, 45, 142, 0.04);
        }
        .cp-radio input { position: absolute; opacity: 0; pointer-events: none; }
        .cp-radio__dot {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(13, 33, 55, 0.2);
          background: var(--white);
          position: relative;
          transition: border-color 0.18s ease;
        }
        .cp-radio.is-on .cp-radio__dot { border-color: var(--purple); }
        .cp-radio.is-on .cp-radio__dot::after {
          content: '';
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          background: var(--purple);
        }
      `}</style>
      <FieldStyles />
    </div>
  )
}

function FieldStyles() {
  return (
    <style>{`
      .cp-fld { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
      .cp-fld label, .cp-fld__label-static {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1.6px;
        text-transform: uppercase;
        color: var(--navy);
      }
      .cp-fld label span, .cp-fld__req { color: var(--orange); }
      .cp-fld input, .cp-fld select, .cp-fld textarea {
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
      .cp-fld textarea { resize: vertical; min-height: 120px; line-height: 1.55; }
      .cp-fld input:focus, .cp-fld select:focus, .cp-fld textarea:focus {
        outline: none;
        border-color: var(--purple);
        box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.18);
      }
      .cp-fld__hint { font-size: 11.5px; color: rgba(13, 33, 55, 0.55); }
      .cp-fld__err  { font-size: 12px; color: var(--orange); font-weight: 700; }
      .cp-fld.is-invalid input,
      .cp-fld.is-invalid select,
      .cp-fld.is-invalid textarea {
        border-color: var(--orange);
        box-shadow: 0 0 0 3px rgba(224, 90, 30, 0.12);
      }
      .cp-fld--sel select {
        appearance: none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1l5 5 5-5' stroke='%230D2137' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>");
        background-repeat: no-repeat;
        background-position: right 14px center;
        padding-right: 38px;
      }
    `}</style>
  )
}
