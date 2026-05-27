import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getProgramById, getFormById, addSubmission, addEnrollment } from '../utils/formStorage'
import { uid } from '../utils/formStorage'

const BRAND = '#6c3fc5'
const GOLD  = '#C9A84C'

// ── Field renderer (subset of EventRegistration) ──────────────────────────────

function FieldInput({ field, value, onChange, accent }) {
  const s = {
    input: {
      width: '100%', border: '1px solid #e5e7eb', borderRadius: 8,
      padding: '10px 14px', fontSize: 14, color: '#111827', boxSizing: 'border-box',
    },
  }

  switch (field.type) {
    case 'section':
      return (
        <div style={{ marginBottom: 0 }}>
          <div style={{ height: 1, background: `linear-gradient(to right, ${accent}, transparent)`, marginBottom: 16 }} />
          {field.description && <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{field.description}</p>}
        </div>
      )
    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          rows={4}
          style={{ ...s.input, resize: 'vertical', lineHeight: 1.6 }}
        />
      )
    case 'select':
      return (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={s.input}>
          <option value="">Select…</option>
          {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    case 'radio':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(field.options || []).map(o => (
            <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
              <input type="radio" checked={value === o} onChange={() => onChange(o)} style={{ accentColor: accent }} />
              {o}
            </label>
          ))}
        </div>
      )
    case 'checkbox':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(field.options || []).map(o => {
            const arr = Array.isArray(value) ? value : []
            return (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={arr.includes(o)}
                  onChange={() => {
                    const next = arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o]
                    onChange(next)
                  }}
                  style={{ accentColor: accent }}
                />
                {o}
              </label>
            )
          })}
        </div>
      )
    case 'scale':
      return (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: (field.scaleMax || 10) - (field.scaleMin || 1) + 1 }, (_, i) => i + (field.scaleMin || 1)).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(String(n))}
                style={{
                  width: 40, height: 40, border: `2px solid ${value === String(n) ? accent : '#e5e7eb'}`,
                  borderRadius: 8, background: value === String(n) ? accent : '#fff',
                  color: value === String(n) ? '#fff' : '#374151',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >{n}</button>
            ))}
          </div>
          {(field.scaleLabelMin || field.scaleLabelMax) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#9ca3af' }}>
              <span>{field.scaleLabelMin || ''}</span>
              <span>{field.scaleLabelMax || ''}</span>
            </div>
          )}
        </div>
      )
    case 'rating_matrix':
      return (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: '6px 12px', textAlign: 'left' }} />
                {Array.from({ length: field.scaleMax || 5 }, (_, i) => i + 1).map(n => (
                  <th key={n} style={{ padding: '6px 12px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(field.items || []).map(item => {
                const rowVal = (value || {})[item]
                return (
                  <tr key={item} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', color: '#374151', fontWeight: 500 }}>{item}</td>
                    {Array.from({ length: field.scaleMax || 5 }, (_, i) => i + 1).map(n => (
                      <td key={n} style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <input
                          type="radio"
                          checked={rowVal === String(n)}
                          onChange={() => onChange({ ...(value || {}), [item]: String(n) })}
                          style={{ accentColor: accent, width: 16, height: 16, cursor: 'pointer' }}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    case 'ranking':
      return <RankingInput field={field} value={value} onChange={onChange} accent={accent} />
    default:
      return (
        <input
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          style={s.input}
        />
      )
  }
}

function RankingInput({ field, value, onChange, accent }) {
  const items = value || [...(field.items || [])]
  const [dragging, setDragging] = useState(null)

  function onDragStart(i) { setDragging(i) }
  function onDrop(i) {
    if (dragging === null || dragging === i) return
    const next = [...items]
    const [moved] = next.splice(dragging, 1)
    next.splice(i, 0, moved)
    onChange(next)
    setDragging(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <div
          key={item}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={e => e.preventDefault()}
          onDrop={() => onDrop(i)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', background: '#f9fafb',
            border: `1px solid ${dragging === i ? accent : '#e5e7eb'}`,
            borderRadius: 8, cursor: 'grab', userSelect: 'none', fontSize: 14,
          }}
        >
          <span style={{ color: accent, fontWeight: 700, fontSize: 13 }}>{i + 1}.</span>
          <span style={{ flex: 1, color: '#374151' }}>{item}</span>
          <span style={{ color: '#9ca3af', fontSize: 18 }}>⠿</span>
        </div>
      ))}
    </div>
  )
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateFields(fields, formData) {
  for (const f of fields) {
    if (f.type === 'section') continue
    if (!f.required) continue
    const val = formData[f.id]
    if (f.type === 'rating_matrix') {
      const rowsFilled = (f.items || []).every(item => (val || {})[item])
      if (!rowsFilled) return `Please complete the rating for "${f.label}"`
    } else if (f.type === 'checkbox') {
      if (!Array.isArray(val) || val.length === 0) return `"${f.label}" is required`
    } else if (f.type === 'ranking') {
      // ranking always has a default
    } else {
      if (!val || String(val).trim() === '') return `"${f.label}" is required`
    }
  }
  return null
}

// ── Simple mode ───────────────────────────────────────────────────────────────

function SimpleMode({ program, form, onSuccess }) {
  const [formData, setFormData] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function patch(id, val) { setFormData(p => ({ ...p, [id]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const nonSection = (form.fields || []).filter(f => f.type !== 'section')
    const err = validateFields(nonSection, formData)
    if (err) { setError(err); return }
    setError('')

    if (program.type === 'paid') {
      initPaystack(program, formData, form, setSubmitting, onSuccess)
    } else {
      setSubmitting(true)
      try {
        const submissionId = uid()
        await addSubmission(form.id, { ...formData, id: submissionId })
        await addEnrollment({
          id: uid(), programId: program.id, programTitle: program.title,
          participantName: formData[findEmailOrName(form, 'name')] || '',
          participantEmail: formData[findEmailOrName(form, 'email')] || '',
          paymentRef: null, amountPaid: 0, currency: 'GHS',
          enrolledAt: new Date().toISOString(), formSubmissionId: submissionId,
        })
        onSuccess()
      } catch { setError('Submission failed. Please try again.') }
      finally { setSubmitting(false) }
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {(form.fields || []).map(field => (
        <div key={field.id}>
          {field.type !== 'section' && (
            <label style={labelStyle}>
              {field.label}{field.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
          )}
          {field.type === 'section' && (
            <div style={{ marginTop: 8, marginBottom: -8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: BRAND, margin: '0 0 4px' }}>{field.label}</h3>
            </div>
          )}
          <FieldInput field={field} value={formData[field.id]} onChange={v => patch(field.id, v)} accent={BRAND} />
        </div>
      ))}

      {error && <div style={errorBox}>{error}</div>}

      <button type="submit" disabled={submitting} style={submitBtn(submitting)}>
        {submitting ? 'Processing…' : program.type === 'paid' ? `Pay ${program.price ? `GHS ${Number(program.price).toLocaleString()}` : ''}` : 'Submit Registration'}
      </button>
    </form>
  )
}

// ── Steps mode ────────────────────────────────────────────────────────────────

function buildSteps(form) {
  const fields = form.fields || []
  const steps = []
  let current = { title: 'Your Details', fields: [] }
  for (const f of fields) {
    if (f.type === 'section') {
      if (current.fields.length > 0) steps.push(current)
      current = { title: f.label, description: f.description, fields: [] }
    } else {
      current.fields.push(f)
    }
  }
  if (current.fields.length > 0) steps.push(current)
  return steps
}

function StepsMode({ program, form, onSuccess }) {
  const steps = buildSteps(form)
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function patch(id, val) { setFormData(p => ({ ...p, [id]: val })) }

  function handleNext() {
    const err = validateFields(steps[step].fields, formData)
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    const err = validateFields(steps[step].fields, formData)
    if (err) { setError(err); return }
    setError('')

    if (program.type === 'paid') {
      initPaystack(program, formData, form, setSubmitting, onSuccess)
    } else {
      setSubmitting(true)
      try {
        const submissionId = uid()
        await addSubmission(form.id, { ...formData, id: submissionId })
        await addEnrollment({
          id: uid(), programId: program.id, programTitle: program.title,
          participantName: formData[findEmailOrName(form, 'name')] || '',
          participantEmail: formData[findEmailOrName(form, 'email')] || '',
          paymentRef: null, amountPaid: 0, currency: 'GHS',
          enrolledAt: new Date().toISOString(), formSubmissionId: submissionId,
        })
        onSuccess()
      } catch { setError('Submission failed. Please try again.') }
      finally { setSubmitting(false) }
    }
  }

  const isLast = step === steps.length - 1
  const current = steps[step]

  const progressPct = ((step) / steps.length) * 100

  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#6b7280' }}>
          <span style={{ fontWeight: 600 }}>Step {step + 1} of {steps.length}</span>
          <span>{current.title}</span>
        </div>
        <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: `linear-gradient(to right, ${BRAND}, #9333ea)`,
            width: `${((step + 1) / steps.length) * 100}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Step heading */}
      {current.title && step > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{current.title}</h2>
          {current.description && <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>{current.description}</p>}
        </div>
      )}

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
        {current.fields.map(field => (
          <div key={field.id}>
            <label style={labelStyle}>
              {field.label}{field.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <FieldInput field={field} value={formData[field.id]} onChange={v => patch(field.id, v)} accent={BRAND} />
          </div>
        ))}
      </div>

      {/* Order summary on last step for paid */}
      {isLast && program.type === 'paid' && (
        <div style={{ background: '#f5f0ff', border: `1px solid ${BRAND}30`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Order Summary</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, color: '#374151', fontWeight: 600 }}>{program.title}</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: BRAND }}>GHS {Number(program.price).toLocaleString()}</span>
          </div>
        </div>
      )}

      {error && <div style={{ ...errorBox, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 12 }}>
        {step > 0 && (
          <button
            onClick={() => { setError(''); setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            style={{ flex: 1, border: `1px solid #e5e7eb`, borderRadius: 10, padding: '13px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer', background: '#fff', color: '#374151' }}
          >← Back</button>
        )}
        <button
          onClick={isLast ? handleSubmit : handleNext}
          disabled={submitting}
          style={{ flex: step > 0 ? 2 : 1, ...submitBtn(submitting) }}
        >
          {submitting ? 'Processing…' : isLast
            ? (program.type === 'paid' ? `Pay Now — GHS ${Number(program.price || 0).toLocaleString()}` : 'Submit Registration')
            : 'Continue →'
          }
        </button>
      </div>
    </div>
  )
}

// ── Paystack helper ───────────────────────────────────────────────────────────

function initPaystack(program, formData, form, setSubmitting, onSuccess) {
  if (!window.PaystackPop) {
    alert('Payment system is loading. Please try again in a moment.')
    return
  }
  const emailField = findEmailOrName(form, 'email')
  const email = formData[emailField] || 'customer@example.com'
  const ref = `IWC-${uid()}`

  const handler = window.PaystackPop.setup({
    key: program.paystackPublicKey,
    email,
    amount: Math.round(Number(program.price) * 100),
    currency: 'GHS',
    ref,
    onSuccess: async (tx) => {
      setSubmitting(true)
      try {
        const submissionId = uid()
        await addSubmission(form.id, { ...formData, id: submissionId })
        await addEnrollment({
          id: uid(), programId: program.id, programTitle: program.title,
          participantName: formData[findEmailOrName(form, 'name')] || '',
          participantEmail: email,
          paymentRef: tx.reference, amountPaid: Number(program.price), currency: 'GHS',
          enrolledAt: new Date().toISOString(), formSubmissionId: submissionId,
        })
        onSuccess(tx.reference)
      } catch {
        alert('Payment succeeded but enrollment saving failed. Please contact support with your reference: ' + tx.reference)
      } finally {
        setSubmitting(false)
      }
    },
    onCancel: () => {},
  })
  handler.openIframe()
}

function findEmailOrName(form, type) {
  const fields = form?.fields || []
  const f = fields.find(f => f.type === type || f.label?.toLowerCase().includes(type))
  return f?.id || ''
}

// ── Confirmation screen ───────────────────────────────────────────────────────

function Confirmation({ program, paymentRef }) {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', marginBottom: 8 }}>You're In!</h2>
      <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 8 }}>
        You've successfully registered for <strong>{program.title}</strong>.
      </p>
      {paymentRef && (
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
          Payment reference: <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{paymentRef}</code>
        </p>
      )}
      <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 400, margin: '0 auto 32px' }}>
        Check your email for a confirmation. We look forward to seeing you!
      </p>
      <button
        onClick={() => navigate('/')}
        style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
      >← Back to Programs</button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProgramOnboarding() {
  const [params] = useSearchParams()
  const programId = params.get('programId')
  const [program, setProgram] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [paymentRef, setPaymentRef] = useState(null)
  const navigate = useNavigate()

  // Load Paystack SDK
  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    document.head.appendChild(s)
    return () => { try { document.head.removeChild(s) } catch {} }
  }, [])

  useEffect(() => {
    if (!programId) { setNotFound(true); setLoading(false); return }
    getProgramById(programId).then(async p => {
      if (!p) { setNotFound(true); setLoading(false); return }
      setProgram(p)
      if (p.registrationFormId) {
        const f = await getFormById(p.registrationFormId)
        setForm(f)
      }
      setLoading(false)
    })
  }, [programId])

  function handleSuccess(ref = null) {
    setPaymentRef(ref)
    setConfirmed(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ color: '#9ca3af', fontSize: 16 }}>Loading program…</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>Program not found</div>
      <button onClick={() => navigate('/')} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>← Back to Programs</button>
    </div>
  )

  if (!form) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>Registration not available yet</div>
      <div style={{ color: '#6b7280' }}>No registration form has been linked to this program.</div>
      <button onClick={() => navigate('/')} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>← Back to Programs</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 100%)', padding: '0 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >← Programs</button>
          <div style={{ flex: 1 }} />
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>IWC CONCEPTS</div>
        </div>

        {/* Program hero */}
        <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 40 }}>
          {program.image && (
            <div style={{ height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
              <img src={program.image} alt={program.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ fontSize: 12, color: GOLD, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            {program.type === 'paid' ? `GHS ${Number(program.price).toLocaleString()}` : 'Free Program'}
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900, color: 'white', margin: '0 0 8px' }}>{program.title}</h1>
          {program.tagline && <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: 15 }}>{program.tagline}</p>}
        </div>
      </div>

      {/* Form card */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '36px 40px',
          marginTop: -24,
          position: 'relative',
        }}>
          {confirmed ? (
            <Confirmation program={program} paymentRef={paymentRef} />
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                {program.type === 'paid' ? 'Register & Pay' : 'Register for Free'}
              </h2>
              <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 28px' }}>
                Fill in the form below to secure your spot.
              </p>

              {program.onboardingMode === 'steps'
                ? <StepsMode program={program} form={form} onSuccess={handleSuccess} />
                : <SimpleMode program={program} form={form} onSuccess={handleSuccess} />
              }
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6,
}

const errorBox = {
  background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
  padding: '10px 14px', fontSize: 13, color: '#dc2626',
}

function submitBtn(disabled) {
  return {
    width: '100%', border: 'none', borderRadius: 10, padding: '14px 0',
    fontWeight: 800, fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#e5e7eb' : `linear-gradient(135deg, ${BRAND}, #9333ea)`,
    color: disabled ? '#9ca3af' : '#fff',
    boxShadow: disabled ? 'none' : '0 4px 16px rgba(108,63,197,0.35)',
  }
}
