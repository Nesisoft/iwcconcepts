import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getProgramById, getFormById, addSubmission, addEnrollment, uid } from '../utils/formStorage'

const BRAND  = '#6c3fc5'
const BRAND2 = '#9333ea'
const GOLD   = '#C9A84C'

// ── Spin Wheel ─────────────────────────────────────────────────────────────────

const SEGMENTS = [
  { label: '10% OFF', color: '#ede9fe' },
  { label: '20% OFF', color: '#c4b5f8' },
  { label: '30% OFF', color: '#a78bfa' },
  { label: '50% OFF', color: '#6c3fc5' }, // WINNER — always lands here
  { label: '40% OFF', color: '#7c3aed' },
  { label: '15% OFF', color: '#8b5cf6' },
]
const WINNER_IDX = 3
const SEG_ANGLE  = 360 / SEGMENTS.length

// When CSS rotation = R (clockwise), pointer (fixed at top) aligns with angle
// (360 - R%360) degrees CW from top. We want that to equal winner center.
// winnerCenter = WINNER_IDX * SEG_ANGLE + SEG_ANGLE/2 degrees CW from top (wheel at rest)
// → R = 360 - winnerCenter + 360*N
const WINNER_CENTER = WINNER_IDX * SEG_ANGLE + SEG_ANGLE / 2
const SPIN_TARGET   = 360 - WINNER_CENTER + 360 * 5  // = 1950°

function SpinWheel({ onDone }) {
  const [rotation, setRotation] = useState(0)
  const [phase, setPhase] = useState('idle') // idle | spinning | done

  function spin() {
    if (phase !== 'idle') return
    setPhase('spinning')
    setRotation(SPIN_TARGET)
    setTimeout(() => setPhase('done'), 3600)
  }

  const cx = 150, cy = 150, r = 120

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 28 }}>
        {/* pointer triangle */}
        <div style={{
          position: 'absolute', top: -2, left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '11px solid transparent',
          borderRight: '11px solid transparent',
          borderTop: '24px solid #dc2626',
          zIndex: 10,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }} />
        <svg width={300} height={300} style={{
          display: 'block',
          transform: `rotate(${rotation}deg)`,
          transition: phase === 'spinning'
            ? 'transform 3.5s cubic-bezier(0.1, 0.5, 0.1, 1)'
            : 'none',
          filter: 'drop-shadow(0 8px 24px rgba(108,63,197,0.25))',
        }}>
          {SEGMENTS.map((seg, i) => {
            const startRad = (i * SEG_ANGLE - 90) * Math.PI / 180
            const endRad   = ((i + 1) * SEG_ANGLE - 90) * Math.PI / 180
            const midRad   = ((i + 0.5) * SEG_ANGLE - 90) * Math.PI / 180
            const x1 = cx + r * Math.cos(startRad)
            const y1 = cy + r * Math.sin(startRad)
            const x2 = cx + r * Math.cos(endRad)
            const y2 = cy + r * Math.sin(endRad)
            const tx = cx + r * 0.64 * Math.cos(midRad)
            const ty = cy + r * 0.64 * Math.sin(midRad)
            const textRot = (i + 0.5) * SEG_ANGLE - 90
            return (
              <g key={i}>
                <path
                  d={`M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`}
                  fill={seg.color} stroke="#fff" strokeWidth={3}
                />
                <text
                  x={tx} y={ty}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fontWeight="800"
                  fill={i === WINNER_IDX ? '#fff' : '#4c1d95'}
                  transform={`rotate(${textRot}, ${tx}, ${ty})`}
                >{seg.label}</text>
              </g>
            )
          })}
          <circle cx={cx} cy={cy} r={17} fill="white" stroke={BRAND} strokeWidth={3} />
          <circle cx={cx} cy={cy} r={8}  fill={BRAND} />
        </svg>
      </div>

      {phase === 'done' ? (
        <div>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
          <h3 style={{ fontSize: 26, fontWeight: 900, color: BRAND, margin: '0 0 8px' }}>You Won 50% OFF!</h3>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>
            Your discount has been applied automatically.
          </p>
          <button onClick={onDone} style={primaryBtn()}>Claim My Discount →</button>
        </div>
      ) : (
        <div>
          <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 24px' }}>
            Spin the wheel to reveal your exclusive discount!
          </p>
          <button onClick={spin} disabled={phase === 'spinning'} style={primaryBtn(phase === 'spinning')}>
            {phase === 'spinning' ? '🎰 Spinning…' : '🎰 SPIN THE WHEEL'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Steps builder ──────────────────────────────────────────────────────────────

function buildSteps(form, program) {
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

  if (!hasEmail) steps.push({ type: 'email' })
  if (!hasName)  steps.push({ type: 'name' })
  if (program?.type === 'paid') {
    steps.push({ type: 'wheel' })
    steps.push({ type: 'payment' })
  }
  return steps
}

function findFieldId(form, keyword) {
  const f = (form?.fields || []).find(f =>
    f.type === keyword || (f.label || '').toLowerCase().includes(keyword)
  )
  return f?.id ?? null
}

// ── Shared primitives ──────────────────────────────────────────────────────────

function primaryBtn(disabled = false) {
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

function NavButtons({ onBack, onNext, canProceed, nextLabel = 'Continue →' }) {
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

const inputStyle = {
  width: '100%', border: '2px solid #e5e7eb', borderRadius: 12,
  padding: '14px 18px', fontSize: 15, color: '#111827',
  boxSizing: 'border-box', outline: 'none',
  fontFamily: 'inherit',
}

// ── Screen components ──────────────────────────────────────────────────────────

function QuestionScreen({ field, value, onChange, onNext, onBack, stepNum, totalQuestions }) {
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

function InterstitialScreen({ step, onNext, onBack }) {
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

function EmailScreen({ value, onChange, onNext, onBack }) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '')
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
          What's your email address?
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
          We'll send your confirmation and program access here.
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

function NameScreen({ value, onChange, onNext, onBack }) {
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

function PaymentScreen({ program, discountedPrice, email, name, form, formData, onSuccess }) {
  const [paying, setPaying]  = useState(null)
  const [error,  setError]   = useState('')
  const originalPrice = Number(program.price || 0)

  function pay(channel) {
    if (!window.PaystackPop) { setError('Payment system is loading — try again in a moment.'); return }
    setPaying(channel)
    setError('')
    const ref = `IWC-${uid()}`
    const handler = window.PaystackPop.setup({
      key: program.paystackPublicKey,
      email: email || 'customer@example.com',
      amount: Math.round(discountedPrice * 100),
      currency: 'GHS',
      ref,
      channels: [channel],
      onSuccess: async (tx) => {
        try {
          const submissionId = uid()
          if (form) {
            await addSubmission(form.id, { ...formData, email, name, id: submissionId })
          }
          await addEnrollment({
            id: uid(), programId: program.id, programTitle: program.title,
            participantName: name || '',
            participantEmail: email || '',
            paymentRef: tx.reference,
            amountPaid: discountedPrice,
            currency: 'GHS',
            enrolledAt: new Date().toISOString(),
            ...(form ? { formSubmissionId: submissionId } : {}),
          })
          onSuccess(tx.reference)
        } catch {
          setError('Payment succeeded but enrollment saving failed. Please contact support — ref: ' + tx.reference)
        } finally { setPaying(null) }
      },
      onCancel: () => setPaying(null),
    })
    handler.openIframe()
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>💳</div>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>
          Complete Your Enrollment
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
          Choose how you'd like to pay{name ? `, ${name.split(' ')[0]}` : ''}
        </p>
      </div>

      {/* Price summary */}
      <div style={{
        background: 'linear-gradient(135deg, #f5f0ff, #ede9fe)',
        border: `1px solid ${BRAND}28`, borderRadius: 16,
        padding: '20px 24px', marginBottom: 28, textAlign: 'center',
      }}>
        <div style={{ marginBottom: 6 }}>
          <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: 14, marginRight: 10 }}>
            GHS {originalPrice.toLocaleString()}
          </span>
          <span style={{
            background: '#dcfce7', color: '#16a34a',
            borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700,
          }}>50% OFF</span>
        </div>
        <div style={{ fontSize: 38, fontWeight: 900, color: BRAND, lineHeight: 1 }}>
          GHS {discountedPrice.toLocaleString()}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{program.title}</div>
      </div>

      {/* Payment option buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { channel: 'mobile_money', icon: '📱', label: 'Pay with Mobile Money', sub: 'MTN MoMo · Vodafone Cash · AirtelTigo' },
          { channel: 'card',         icon: '💳', label: 'Pay with Card',         sub: 'Visa · Mastercard · bank card' },
        ].map(({ channel, icon, label, sub }) => (
          <button
            key={channel}
            onClick={() => pay(channel)}
            disabled={paying !== null}
            style={{
              width: '100%', padding: '18px 22px', borderRadius: 14,
              border: `2px solid ${paying === channel ? BRAND : channel === 'mobile_money' ? BRAND : '#e5e7eb'}`,
              background: paying === channel ? '#f5f0ff' : '#fff',
              cursor: paying ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'all 0.18s', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 34, lineHeight: 1 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
                {paying === channel ? 'Processing…' : label}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          marginTop: 16, background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#dc2626',
        }}>{error}</div>
      )}

      <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 20 }}>
        🔒 Secured by Paystack. Your payment information is encrypted.
      </p>
    </div>
  )
}

// ── Confirmation ───────────────────────────────────────────────────────────────

function Confirmation({ program, paymentRef, name }) {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
        You're In{name ? `, ${name.split(' ')[0]}` : ''}!
      </h2>
      <p style={{ color: '#6b7280', fontSize: 16, margin: '0 0 8px' }}>
        You've successfully enrolled in <strong>{program.title}</strong>.
      </p>
      {paymentRef && (
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 24px' }}>
          Ref: <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{paymentRef}</code>
        </p>
      )}
      <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 380, margin: '0 auto 36px', lineHeight: 1.75 }}>
        Check your email for confirmation and program access details. We look forward to seeing you!
      </p>
      <button onClick={() => navigate('/')} style={primaryBtn()}>← Back to Programs</button>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────────────────────────

function Header({ program, navigate }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 100%)',
      padding: '14px 24px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button onClick={() => navigate('/')} style={{
        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.8)',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>← Programs</button>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.4 }}>
        {program?.title || ''}
      </div>
      <div style={{ color: GOLD, fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>IWC CONCEPTS</div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ProgramOnboarding() {
  const [params]    = useSearchParams()
  const programId   = params.get('programId')
  const navigate    = useNavigate()

  const [program,   setProgram]   = useState(null)
  const [form,      setForm]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)

  // flow state
  const [step,      setStep]      = useState(0)
  const [formData,  setFormData]  = useState({})
  const [email,     setEmail]     = useState('')
  const [name,      setName]      = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [payRef,    setPayRef]    = useState(null)

  // Load Paystack SDK once
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

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ color: '#9ca3af', fontSize: 16 }}>Loading…</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>Program not found</div>
      <button onClick={() => navigate('/')} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
    </div>
  )

  const steps        = buildSteps(form, program)
  const currentStep  = steps[step]
  const progress     = Math.round(((step + 1) / steps.length) * 100)
  const questionSteps = steps.filter(s => s.type === 'question')
  const questionIdx   = steps.slice(0, step + 1).filter(s => s.type === 'question').length

  // Resolve email / name from either the dedicated steps or form fields
  const emailFieldId = findFieldId(form, 'email')
  const nameFieldId  = findFieldId(form, 'name')
  const resolvedEmail = email || (emailFieldId ? formData[emailFieldId] : '') || ''
  const resolvedName  = name  || (nameFieldId  ? formData[nameFieldId]  : '') || ''

  const originalPrice    = Number(program?.price || 0)
  const discountedPrice  = Math.round(originalPrice * 0.5)

  function goNext() {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  function goBack() {
    if (step > 0) {
      setStep(s => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function submitFree() {
    try {
      const submissionId = uid()
      if (form) {
        await addSubmission(form.id, { ...formData, email: resolvedEmail, name: resolvedName, id: submissionId })
      }
      await addEnrollment({
        id: uid(), programId: program.id, programTitle: program.title,
        participantName: resolvedName,
        participantEmail: resolvedEmail,
        paymentRef: null, amountPaid: 0, currency: 'GHS',
        enrolledAt: new Date().toISOString(),
        ...(form ? { formSubmissionId: submissionId } : {}),
      })
      setConfirmed(true)
      window.scrollTo({ top: 0 })
    } catch (err) {
      console.error(err)
      alert('Enrollment failed. Please try again.')
    }
  }

  if (confirmed) return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <Header program={program} navigate={navigate} />
      <div style={{ padding: '56px 0 80px' }}>
        <Confirmation program={program} paymentRef={payRef} name={resolvedName} />
      </div>
    </div>
  )

  function renderStep() {
    if (!currentStep) return null

    switch (currentStep.type) {
      case 'question':
        return (
          <QuestionScreen
            field={currentStep.field}
            value={formData[currentStep.field.id]}
            onChange={v => setFormData(p => ({ ...p, [currentStep.field.id]: v }))}
            onNext={goNext}
            onBack={step > 0 ? goBack : null}
            stepNum={questionIdx}
            totalQuestions={questionSteps.length}
          />
        )

      case 'interstitial':
        return (
          <InterstitialScreen
            step={currentStep}
            onNext={goNext}
            onBack={step > 0 ? goBack : null}
          />
        )

      case 'email':
        return (
          <EmailScreen
            value={email}
            onChange={setEmail}
            onNext={goNext}
            onBack={step > 0 ? goBack : null}
          />
        )

      case 'name':
        return (
          <NameScreen
            value={name}
            onChange={setName}
            onNext={goNext}
            onBack={step > 0 ? goBack : null}
          />
        )

      case 'wheel':
        return (
          <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
              {resolvedName ? `Great news, ${resolvedName.split(' ')[0]}!` : 'Great news!'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 36px' }}>
              Spin the wheel for an exclusive discount on <strong>{program.title}</strong>.
            </p>
            <SpinWheel onDone={goNext} />
          </div>
        )

      case 'payment':
        return (
          <PaymentScreen
            program={program}
            discountedPrice={discountedPrice}
            email={resolvedEmail}
            name={resolvedName}
            form={form}
            formData={formData}
            onSuccess={ref => { setPayRef(ref); setConfirmed(true); window.scrollTo({ top: 0 }) }}
          />
        )

      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <Header program={program} navigate={navigate} />

      {/* Progress bar */}
      <div style={{ height: 4, background: '#f3f4f6' }}>
        <div style={{
          height: '100%',
          background: `linear-gradient(to right, ${BRAND}, ${BRAND2})`,
          width: `${progress}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Content area */}
      <div style={{ padding: '48px 0 80px' }}>
        {renderStep()}
      </div>
    </div>
  )
}
