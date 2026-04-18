import { useState } from 'react'
import SectionHeader from '../ui/SectionHeader'
import CTAButton from '../ui/CTAButton'

/**
 * Section 08 — Contact & Enquiry
 *
 * Makes it easy for serious visitors to take the final step. Includes
 * the full enquiry form specified in the plan plus WhatsApp, email and
 * social alternatives for the Ghana-first audience that often prefers
 * chat over email.
 *
 * PLACEHOLDER values to replace post-launch:
 *   - WHATSAPP_NUMBER — current value is not a real line
 *   - CONTACT_EMAIL   — replace with Lady Adel's dedicated inbox
 *   - Wire the onSubmit handler to a real backend (Formspree /
 *     Resend / Zoho / custom). For now the form collects the payload,
 *     logs it to the console and shows a local success state so the
 *     UX is testable end-to-end ahead of integration.
 */

// PLACEHOLDER — replace with the real WhatsApp number
const WHATSAPP_NUMBER = '233000000000'
// PLACEHOLDER — replace with the real contact inbox
const CONTACT_EMAIL   = 'hello@iwcconcepts.com'

const ENQUIRY_TYPES = [
  'Training',
  'Speaking',
  'Coaching',
  'Entrepreneur Programme',
  'Catch Up Registration',
  'General Enquiry',
]

const INITIAL = {
  name: '',
  email: '',
  whatsapp: '',
  organisation: '',
  enquiryType: '',
  message: '',
}

// ---- Component --------------------------------------------------------------

export default function ContactSection() {
  const [values, setValues]   = useState(INITIAL)
  const [errors, setErrors]   = useState({})
  const [status, setStatus]   = useState('idle') // idle | submitting | success | error

  function handleChange(e) {
    const { name, value } = e.target
    setValues(v => ({ ...v, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }))
  }

  function validate(v) {
    const er = {}
    if (!v.name.trim())    er.name    = 'Please enter your name.'
    if (!v.email.trim())   er.email   = 'We need an email to reply to.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) er.email = 'That email does not look right.'
    if (!v.enquiryType)    er.enquiryType = 'Pick the option that best fits.'
    if (!v.message.trim()) er.message = 'Tell us a little about what you need.'
    return er
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const er = validate(values)
    if (Object.keys(er).length > 0) {
      setErrors(er)
      return
    }
    setStatus('submitting')
    try {
      // TODO: replace with a real backend endpoint (Formspree / Resend / custom).
      // For now we log the payload so the form can be tested end-to-end.
      // eslint-disable-next-line no-console
      console.info('[ContactSection] enquiry submitted', values)
      await new Promise(r => setTimeout(r, 600))
      setStatus('success')
      setValues(INITIAL)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ContactSection] submission failed', err)
      setStatus('error')
    }
  }

  const waMessage = encodeURIComponent(
    `Hi Lady Adel, I found your website and I am interested in discussing an enquiry.`
  )
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`

  return (
    <section className="contact site-section" id="contact">
      <div className="contact__bg" aria-hidden="true">
        <span className="contact__orb contact__orb--gold" />
        <span className="contact__orb contact__orb--purple" />
      </div>

      <div className="site-container contact__inner">
        <SectionHeader
          eyebrow="Contact & Enquiry"
          title={<>Let&rsquo;s start a <em>conversation</em></>}
          subtitle="Whether you want to book Lady Adel for training, invite her to speak, explore coaching, or simply ask a question — we would love to hear from you. Fill in the form below and a member of the IWC Concepts team will respond within 24–48 hours."
        />

        <div className="contact__grid">
          {/* Form column */}
          <div className="contact__form-wrap">
            {status === 'success' ? (
              <div className="contact__thanks" role="status" aria-live="polite">
                <div className="contact__thanks-icon"><IconCheck /></div>
                <h3>Your enquiry is in.</h3>
                <p>
                  Thank you for reaching out. A member of the IWC Concepts team
                  will be in touch within 24–48 hours. If your matter is urgent,
                  please continue the conversation on WhatsApp.
                </p>
                <div className="contact__thanks-actions">
                  <CTAButton href={waHref} external variant="primary" size="md">
                    Continue on WhatsApp
                  </CTAButton>
                  <button
                    type="button"
                    className="contact__thanks-reset"
                    onClick={() => setStatus('idle')}
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form className="contact__form" noValidate onSubmit={handleSubmit}>
                <div className="contact__row">
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
                </div>

                <div className="contact__row">
                  <Field
                    label="WhatsApp number" name="whatsapp" type="tel"
                    hint="Optional — preferred for Ghana-based enquiries"
                    value={values.whatsapp} error={errors.whatsapp}
                    onChange={handleChange} autoComplete="tel"
                  />
                  <Field
                    label="Organisation / company" name="organisation"
                    hint="Optional"
                    value={values.organisation} error={errors.organisation}
                    onChange={handleChange} autoComplete="organization"
                  />
                </div>

                <SelectField
                  label="Type of enquiry" name="enquiryType" required
                  value={values.enquiryType} error={errors.enquiryType}
                  onChange={handleChange}
                  options={ENQUIRY_TYPES}
                  placeholder="Pick the option that best fits"
                />

                <TextAreaField
                  label="Your message" name="message" required rows={5}
                  value={values.message} error={errors.message}
                  onChange={handleChange}
                  placeholder="Tell us about what you're building, the audience you serve, dates you have in mind, or the question you'd like answered."
                />

                <div className="contact__submit">
                  <button
                    type="submit"
                    className="contact__send"
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? 'Sending…' : 'Send your enquiry'}
                    {status !== 'submitting' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    )}
                  </button>
                  <span className="contact__submit-note">We respond within 24–48 hours.</span>
                </div>

                {status === 'error' && (
                  <p className="contact__error" role="alert">
                    Something went wrong sending your message. Please try again or
                    reach us on WhatsApp.
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Sidebar — alternative contact methods */}
          <aside className="contact__side">
            <div className="side-card">
              <div className="side-card__icon side-card__icon--wa"><IconWhatsApp /></div>
              <div>
                <h4>Chat on WhatsApp</h4>
                <p>Fastest route for quick questions, bookings and follow-ups.</p>
                <a className="side-card__link" href={waHref} target="_blank" rel="noreferrer">
                  Open chat →
                </a>
              </div>
            </div>

            <div className="side-card">
              <div className="side-card__icon side-card__icon--mail"><IconMail /></div>
              <div>
                <h4>Email the team</h4>
                <p>Ideal for detailed proposals, media enquiries and documents.</p>
                <a className="side-card__link" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>

            <div className="side-card side-card--muted">
              <div className="side-card__icon side-card__icon--clock"><IconClock /></div>
              <div>
                <h4>Response time</h4>
                <p>A member of the IWC Concepts team responds within 24–48 hours, Monday to Friday.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .contact {
          position: relative;
          background: var(--cream);
          color: var(--ink);
          overflow: hidden;
          isolation: isolate;
        }
        .contact__bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .contact__orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.5; }
        .contact__orb--gold   { width: 460px; height: 460px; top: -180px; left: -140px; background: radial-gradient(circle, rgba(201, 168, 76, 0.28), transparent 70%); }
        .contact__orb--purple { width: 440px; height: 440px; bottom: -180px; right: -140px; background: radial-gradient(circle, rgba(91, 45, 142, 0.14), transparent 70%); }
        .contact__inner { position: relative; z-index: 1; }

        /* Layout */
        .contact__grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 28px;
        }
        @media (min-width: 980px) {
          .contact__grid { grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 40px; align-items: start; }
        }

        /* Form wrap */
        .contact__form-wrap {
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 22px 60px rgba(13, 33, 55, 0.08);
          padding: 28px 22px;
          min-width: 0;
        }
        @media (min-width: 768px) { .contact__form-wrap { padding: 40px 44px; } }

        .contact__form { display: flex; flex-direction: column; gap: 22px; }
        .contact__row {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 22px;
        }
        @media (min-width: 640px) { .contact__row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

        /* Field primitives */
        .fld { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .fld__label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: var(--navy);
        }
        .fld__label .req { color: var(--orange); margin-left: 3px; }
        .fld__input,
        .fld__textarea,
        .fld__select {
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
        .fld__input::placeholder,
        .fld__textarea::placeholder { color: rgba(13, 33, 55, 0.4); }
        .fld__input:focus,
        .fld__textarea:focus,
        .fld__select:focus {
          outline: none;
          border-color: var(--purple);
          box-shadow: 0 0 0 3px rgba(91, 45, 142, 0.18);
        }
        .fld__textarea { resize: vertical; min-height: 120px; line-height: 1.55; }
        .fld__select {
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1l5 5 5-5' stroke='%230D2137' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 38px;
        }
        .fld__select:invalid,
        .fld__select option[value=""][disabled] { color: rgba(13, 33, 55, 0.4); }
        .fld__hint  { font-size: 11.5px; color: rgba(13, 33, 55, 0.55); }
        .fld__error { font-size: 12px; color: var(--orange); font-weight: 700; }
        .fld.is-invalid .fld__input,
        .fld.is-invalid .fld__textarea,
        .fld.is-invalid .fld__select {
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(224, 90, 30, 0.12);
        }

        /* Submit */
        .contact__submit {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
        }
        .contact__send {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--orange);
          color: var(--white);
          border: 0;
          border-radius: 999px;
          padding: 14px 28px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(224, 90, 30, 0.28);
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }
        .contact__send:hover:not(:disabled) {
          background: var(--orange-dark);
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(224, 90, 30, 0.38);
        }
        .contact__send:disabled { opacity: 0.65; cursor: not-allowed; }
        .contact__submit-note { font-size: 12px; color: rgba(13, 33, 55, 0.55); }
        .contact__error {
          margin-top: 4px;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(224, 90, 30, 0.08);
          border: 1px solid rgba(224, 90, 30, 0.3);
          color: var(--orange-dark);
          font-size: 13px;
        }

        /* Success state */
        .contact__thanks {
          text-align: center;
          padding: 20px 8px;
        }
        .contact__thanks-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 60px; height: 60px;
          margin-bottom: 18px;
          border-radius: 50%;
          background: rgba(91, 45, 142, 0.12);
          color: var(--purple);
        }
        .contact__thanks h3 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 28px);
          color: var(--navy);
          letter-spacing: -0.3px;
          margin-bottom: 10px;
        }
        .contact__thanks p {
          max-width: 480px;
          margin: 0 auto 20px;
          font-size: 14px;
          line-height: 1.6;
          color: rgba(13, 33, 55, 0.7);
        }
        .contact__thanks-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }
        .contact__thanks-reset {
          background: transparent;
          border: 0;
          color: var(--purple);
          font-weight: 800;
          letter-spacing: 0.3px;
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
          text-decoration-thickness: 1.5px;
          text-underline-offset: 3px;
        }

        /* Sidebar */
        .contact__side {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
        }
        .side-card {
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr);
          gap: 14px;
          align-items: flex-start;
          padding: 20px 22px;
          background: var(--white);
          border: 1px solid rgba(13, 33, 55, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 28px rgba(13, 33, 55, 0.06);
        }
        .side-card--muted { background: transparent; box-shadow: none; border-style: dashed; }
        .side-card__icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--white);
        }
        .side-card__icon svg { width: 22px; height: 22px; }
        .side-card__icon--wa    { background: #25d366; }
        .side-card__icon--mail  { background: var(--purple); }
        .side-card__icon--clock { background: var(--gold-dark); }
        .side-card h4 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 16px;
          color: var(--navy);
          letter-spacing: -0.2px;
          margin-bottom: 4px;
        }
        .side-card p {
          font-size: 13px;
          line-height: 1.55;
          color: rgba(13, 33, 55, 0.65);
          margin-bottom: 8px;
        }
        .side-card__link {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.3px;
          color: var(--purple);
          text-decoration: none;
          word-break: break-word;
        }
        .side-card__link:hover { text-decoration: underline; }
      `}</style>
    </section>
  )
}

// ---- Field primitives -------------------------------------------------------

function Field({ label, name, type = 'text', required, hint, value, error, onChange, ...rest }) {
  const id = `f-${name}`
  return (
    <div className={`fld ${error ? 'is-invalid' : ''}`}>
      <label className="fld__label" htmlFor={id}>
        {label}{required && <span className="req" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className="fld__input"
        required={required}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {error
        ? <span className="fld__error" id={`${id}-err`}>{error}</span>
        : hint ? <span className="fld__hint" id={`${id}-hint`}>{hint}</span> : null}
    </div>
  )
}

function SelectField({ label, name, required, value, error, onChange, options, placeholder }) {
  const id = `f-${name}`
  return (
    <div className={`fld ${error ? 'is-invalid' : ''}`}>
      <label className="fld__label" htmlFor={id}>
        {label}{required && <span className="req" aria-hidden="true">*</span>}
      </label>
      <select
        id={id}
        name={name}
        className="fld__select"
        required={required}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {error && <span className="fld__error" id={`${id}-err`}>{error}</span>}
    </div>
  )
}

function TextAreaField({ label, name, required, rows = 4, value, error, onChange, placeholder }) {
  const id = `f-${name}`
  return (
    <div className={`fld ${error ? 'is-invalid' : ''}`}>
      <label className="fld__label" htmlFor={id}>
        {label}{required && <span className="req" aria-hidden="true">*</span>}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        className="fld__textarea"
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      {error && <span className="fld__error" id={`${id}-err`}>{error}</span>}
    </div>
  )
}

// ---- Icons ------------------------------------------------------------------

function IconCheck() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 12 10 18 20 6" />
    </svg>
  )
}
function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.5 3.5A10.4 10.4 0 0 0 3.4 16l-1.4 5.1 5.2-1.4a10.4 10.4 0 0 0 5 1.3A10.4 10.4 0 0 0 20.5 3.5zm-8.3 16a8.6 8.6 0 0 1-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.6 8.6 0 1 1 7.2 3.9zm4.8-6.5c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a7 7 0 0 1-2.1-1.3 8.4 8.4 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.4.2-.4.1-.4-.1-.3-.7-1.6c-.2-.4-.4-.4-.6-.4H9c-.2 0-.4.1-.6.3a2.2 2.2 0 0 0-.7 1.6c0 .9.7 1.8.8 2a8.6 8.6 0 0 0 3.4 3.1c.5.2.9.4 1.2.5.5.1 1 .1 1.4.1.4-.1 1.2-.5 1.4-1s.2-.9.2-1l-.6-.4z"/>
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
      <polyline points="12 7 12 12 15 14" />
    </svg>
  )
}
