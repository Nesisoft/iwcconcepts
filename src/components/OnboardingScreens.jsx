/**
 * OnboardingScreens.jsx — shared wizard screens
 *
 * Used by CourseOnboarding (/onboard), MembershipJoin (/join) and the
 * multi-step mode of standalone forms (/register). One source of truth for the
 * question/email/name/terms screens and the step-splitting logic.
 */
import { useState } from 'react'
import { POLICY_SECTIONS } from './PolicyTerms'

export const BRAND  = '#6c3fc5'
export const BRAND2 = '#9333ea'

// ── Shared primitives ──────────────────────────────────────────────────────────

export function primaryBtn(disabled = false) {
  return {
    display: 'inline-block', border: 'none', borderRadius: 50,
    padding: '15px 40px', fontWeight: 800, fontSize: 16,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#e5e7eb' : `linear-gradient(135deg, ${BRAND}, ${BRAND2})`,
    color: disabled ? '#9ca3af' : '#fff',
    boxShadow: disabled ? 'none' : '0 4px 20px rgba(108,63,197,0.4)',
    transition: 'all 0.2s',
  }
}

export function NavButtons({ onBack, onNext, canProceed, nextLabel = 'Continue →' }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {onBack && (
        <button onClick={onBack} style={{
          padding: '13px 24px', border: '1px solid #e5e7eb', borderRadius: 50,
          background: '#fff', color: '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer',
        }}>← Back</button>
      )}
      <button onClick={onNext} disabled={!canProceed} style={{ flex: 1, ...primaryBtn(!canProceed) }}>
        {nextLabel}
      </button>
    </div>
  )
}

export const inputStyle = {
  width: '100%', border: '2px solid #e5e7eb', borderRadius: 12,
  padding: '14px 18px', fontSize: 15, color: '#111827',
  boxSizing: 'border-box', outline: 'none',
  fontFamily: 'inherit',
}

// ── Step helpers ───────────────────────────────────────────────────────────────

export function findFieldId(form, keyword) {
  const f = (form?.fields || []).find(f =>
    f.type === keyword || (f.label || '').toLowerCase().includes(keyword)
  )
  return f?.id ?? null
}

// Split a form into wizard steps (sections → interstitials, fields → questions).
// Returns { steps, hasEmail, hasName } so callers can append email/name screens.
export function splitFormSteps(form) {
  const steps = []
  let hasEmail = false
  let hasName  = false

  for (const f of (form?.fields || [])) {
    if (f.type === 'section') {
      steps.push({ type: 'interstitial', title: f.label, description: f.description })
    } else {
      const lbl = (f.label || '').toLowerCase()
      if (f.type === 'email' || lbl.includes('email')) hasEmail = true
      if ((lbl.includes('name') || lbl.includes('full name')) && f.type !== 'email') hasName = true
      steps.push({ type: 'question', field: f })
    }
  }
  return { steps, hasEmail, hasName }
}

// ── Screen components ──────────────────────────────────────────────────────────

export function QuestionScreen({ field, value, onChange, onNext, onBack, stepNum, totalQuestions }) {
  const isCard  = field.type === 'radio' || field.type === 'select'
  const isMulti = field.type === 'checkbox'
  const isScale = field.type === 'scale'

  const hasAnswer = isMulti
    ? (Array.isArray(value) && value.length > 0)
    : (value !== undefined && value !== '' && value !== null)

  function pickCard(opt) {
    onChange(opt)
    setTimeout(onNext, 320)
  }

  function toggleMulti(opt) {
    const arr = Array.isArray(value) ? value : []
    onChange(arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt])
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 32 }}>
        {totalQuestions > 0 && (
          <div style={{ fontSize: 13, color: BRAND, fontWeight: 700, marginBottom: 10 }}>
            Question {stepNum} of {totalQuestions}
          </div>
        )}
        <h2 style={{ fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1.35 }}>
          {field.label}
          {field.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
        </h2>
        {field.description && (
          <p style={{ color: '#6b7280', fontSize: 14, margin: '8px 0 0' }}>{field.description}</p>
        )}
      </div>

      {/* Card-style radio / select */}
      {isCard && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
          {(field.options || []).map(opt => (
            <button key={opt} onClick={() => pickCard(opt)} style={{
              width: '100%', textAlign: 'left', padding: '16px 20px',
              border: `2px solid ${value === opt ? BRAND : '#e5e7eb'}`,
              borderRadius: 14, background: value === opt ? '#f5f0ff' : '#fff',
              color: '#111827', fontSize: 15, fontWeight: value === opt ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: value === opt ? `0 0 0 3px ${BRAND}18` : 'none',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                border: `2px solid ${value === opt ? BRAND : '#d1d5db'}`,
                background: value === opt ? BRAND : 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {value === opt && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />}
              </span>
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Checkbox multi-select */}
      {isMulti && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {(field.options || []).map(opt => {
              const checked = Array.isArray(value) && value.includes(opt)
              return (
                <button key={opt} onClick={() => toggleMulti(opt)} style={{
                  width: '100%', textAlign: 'left', padding: '16px 20px',
                  border: `2px solid ${checked ? BRAND : '#e5e7eb'}`,
                  borderRadius: 14, background: checked ? '#f5f0ff' : '#fff',
                  color: '#111827', fontSize: 15, fontWeight: checked ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <span style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: 5,
                    border: `2px solid ${checked ? BRAND : '#d1d5db'}`,
                    background: checked ? BRAND : 'transparent',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>
          <NavButtons onBack={onBack} onNext={onNext} canProceed={hasAnswer} />
        </>
      )}

      {/* Scale */}
      {isScale && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {Array.from({ length: (field.scaleMax || 10) - (field.scaleMin || 1) + 1 }, (_, i) => i + (field.scaleMin || 1)).map(n => (
              <button key={n} onClick={() => onChange(String(n))} style={{
                width: 48, height: 48, borderRadius: 10,
                border: `2px solid ${value === String(n) ? BRAND : '#e5e7eb'}`,
                background: value === String(n) ? BRAND : '#fff',
                color: value === String(n) ? '#fff' : '#374151',
                fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}>{n}</button>
            ))}
          </div>
          {(field.scaleLabelMin || field.scaleLabelMax) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginBottom: 28 }}>
              <span>{field.scaleLabelMin || ''}</span>
              <span>{field.scaleLabelMax || ''}</span>
            </div>
          )}
          <NavButtons onBack={onBack} onNext={onNext} canProceed={hasAnswer} />
        </>
      )}

      {/* Text / email / phone / textarea */}
      {!isCard && !isMulti && !isScale && (
        <>
          {field.type === 'textarea' ? (
            <textarea
              value={value || ''} onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder || 'Your answer…'}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, marginBottom: 28 }}
            />
          ) : (
            <input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              value={value || ''} onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder || 'Your answer…'}
              style={{ ...inputStyle, marginBottom: 28 }}
              onKeyDown={e => e.key === 'Enter' && hasAnswer && onNext()}
              autoFocus
            />
          )}
          <NavButtons onBack={onBack} onNext={onNext} canProceed={hasAnswer} />
        </>
      )}
    </div>
  )
}

export function InterstitialScreen({ step, onNext, onBack }) {
  const stats = [
    { icon: '👥', value: '2,400+', label: 'Participants' },
    { icon: '⭐', value: '4.9/5',  label: 'Rating' },
    { icon: '🎯', value: '94%',    label: 'Completion' },
  ]
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>🚀</div>
      <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, color: '#111827', margin: '0 0 12px' }}>
        {step.title || 'Almost there!'}
      </h2>
      {step.description && (
        <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 36px', lineHeight: 1.75 }}>
          {step.description}
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: '#f5f0ff', borderRadius: 14, padding: '16px 18px',
            border: `1px solid ${BRAND}20`, minWidth: 90,
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: BRAND }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} canProceed={true} nextLabel="CONTINUE →" />
    </div>
  )
}

export function EmailScreen({ value, onChange, onNext, onBack, subtitle }) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '')
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
          What's your email address?
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
          {subtitle || "We'll send your confirmation and course access here."}
        </p>
      </div>
      <input
        type="email" value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder="you@example.com"
        style={{ ...inputStyle, marginBottom: 28, fontSize: 16 }}
        onKeyDown={e => e.key === 'Enter' && valid && onNext()}
        autoFocus
      />
      <NavButtons onBack={onBack} onNext={onNext} canProceed={valid} />
    </div>
  )
}

export function NameScreen({ value, onChange, onNext, onBack }) {
  const valid = (value || '').trim().length > 1
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
          What's your name?
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
          So we know what to call you.
        </p>
      </div>
      <input
        type="text" value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder="Your full name"
        style={{ ...inputStyle, marginBottom: 28, fontSize: 16 }}
        onKeyDown={e => e.key === 'Enter' && valid && onNext()}
        autoFocus
      />
      <NavButtons onBack={onBack} onNext={onNext} canProceed={valid} />
    </div>
  )
}

export function TermsScreen({ onAccept, onBack, acceptLabel, submitting }) {
  const [agreed, setAgreed] = useState(false)
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
          Terms &amp; Privacy Policy
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
          Please review and accept the following before you continue.
        </p>
      </div>

      <div style={{
        maxHeight: 320, overflowY: 'auto',
        border: '1px solid #e5e7eb', borderRadius: 12,
        padding: '18px 20px', marginBottom: 22, background: '#fafafa',
      }}>
        {POLICY_SECTIONS.map((s, i) => (
          <div key={i} style={{ marginBottom: i === POLICY_SECTIONS.length - 1 ? 0 : 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: '0 0 5px' }}>{s.title}</h3>
            <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>

      <label style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
        marginBottom: 24, userSelect: 'none',
      }}>
        <span
          onClick={() => setAgreed(a => !a)}
          style={{
            flexShrink: 0, width: 24, height: 24, borderRadius: 6, marginTop: 1,
            border: `2px solid ${agreed ? BRAND : '#d1d5db'}`,
            background: agreed ? BRAND : '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {agreed && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>✓</span>}
        </span>
        <span onClick={() => setAgreed(a => !a)} style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
          I have read and agree to the <strong>Terms &amp; Conditions</strong> and{' '}
          <strong>Privacy Policy</strong>.
        </span>
      </label>

      <NavButtons
        onBack={onBack}
        onNext={onAccept}
        canProceed={agreed && !submitting}
        nextLabel={submitting ? 'Submitting…' : acceptLabel}
      />
    </div>
  )
}

// ── Single-page form screen ────────────────────────────────────────────────────
// Renders all (non-section) fields stacked on one screen. Used when a form's
// display mode is "single". Covers the common field types; anything exotic
// falls back to a text input.

export function SingleFormScreen({ form, formData, setFormData, onNext, onBack, title, subtitle, nextLabel = 'Continue →' }) {
  const fields = (form?.fields || []).filter(f => f.type !== 'section')
  const setVal = (id, v) => setFormData(prev => ({ ...prev, [id]: v }))

  const missing = fields.filter(f => {
    if (!f.required) return false
    const v = formData[f.id]
    if (f.type === 'checkbox') return !Array.isArray(v) || v.length === 0
    return v === undefined || v === null || v === ''
  })

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
          {title || form?.title || 'Your details'}
        </h2>
        {subtitle && <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>{subtitle}</p>}
      </div>

      {fields.map(f => {
        const v = formData[f.id]
        return (
          <div key={f.id} style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              {f.label}{f.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
            </label>

            {(f.type === 'radio' || f.type === 'select') ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(f.options || []).map(opt => (
                  <button key={opt} onClick={() => setVal(f.id, opt)} style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px',
                    border: `2px solid ${v === opt ? BRAND : '#e5e7eb'}`,
                    borderRadius: 12, background: v === opt ? '#f5f0ff' : '#fff',
                    color: '#111827', fontSize: 14, fontWeight: v === opt ? 700 : 500, cursor: 'pointer',
                  }}>{opt}</button>
                ))}
              </div>
            ) : f.type === 'checkbox' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(f.options || []).map(opt => {
                  const arr = Array.isArray(v) ? v : []
                  const checked = arr.includes(opt)
                  return (
                    <button key={opt} onClick={() => setVal(f.id, checked ? arr.filter(x => x !== opt) : [...arr, opt])} style={{
                      width: '100%', textAlign: 'left', padding: '12px 16px',
                      border: `2px solid ${checked ? BRAND : '#e5e7eb'}`,
                      borderRadius: 12, background: checked ? '#f5f0ff' : '#fff',
                      color: '#111827', fontSize: 14, fontWeight: checked ? 700 : 500, cursor: 'pointer',
                    }}>{checked ? '✓ ' : ''}{opt}</button>
                  )
                })}
              </div>
            ) : f.type === 'scale' ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Array.from({ length: (f.scaleMax || 10) - (f.scaleMin || 1) + 1 }, (_, i) => i + (f.scaleMin || 1)).map(n => (
                  <button key={n} onClick={() => setVal(f.id, String(n))} style={{
                    width: 42, height: 42, borderRadius: 9,
                    border: `2px solid ${v === String(n) ? BRAND : '#e5e7eb'}`,
                    background: v === String(n) ? BRAND : '#fff',
                    color: v === String(n) ? '#fff' : '#374151',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}>{n}</button>
                ))}
              </div>
            ) : f.type === 'rating' ? (
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} onClick={() => setVal(f.id, s)} style={{ fontSize: 30, cursor: 'pointer', color: (v || 0) >= s ? '#f59e0b' : '#e5e7eb' }}>★</span>
                ))}
              </div>
            ) : f.type === 'textarea' ? (
              <textarea value={v || ''} onChange={e => setVal(f.id, e.target.value)} rows={4}
                placeholder={f.placeholder || 'Your answer…'}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
            ) : (
              <input
                type={f.type === 'email' ? 'email' : (f.type === 'phone' || f.type === 'whatsapp') ? 'tel' : 'text'}
                value={v || ''} onChange={e => setVal(f.id, e.target.value)}
                placeholder={f.placeholder || 'Your answer…'}
                style={inputStyle}
              />
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 28 }}>
        <NavButtons onBack={onBack} onNext={onNext} canProceed={missing.length === 0} nextLabel={nextLabel} />
      </div>
    </div>
  )
}
