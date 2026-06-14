import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCourseById, getFormById, addSubmission, addEnrollment, uid } from '../utils/formStorage'
import { findPromoCode, priceAfterPromo } from '../utils/access'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import {
  primaryBtn, inputStyle, NavButtons, findFieldId, splitFormSteps,
  QuestionScreen, InterstitialScreen, EmailScreen, NameScreen, TermsScreen,
} from '../components/OnboardingScreens'

const BRAND  = '#6c3fc5'
const BRAND2 = '#9333ea'
const GOLD   = '#C9A84C'

// ── Spin Wheel ─────────────────────────────────────────────────────────────────

const SEG_COLORS = ['#ede9fe', '#c4b5f8', '#a78bfa', '#6c3fc5', '#7c3aed', '#8b5cf6']
const WINNER_IDX = 3       // wheel always lands on this segment
const SEG_COUNT  = 6
const SEG_ANGLE  = 360 / SEG_COUNT

// When CSS rotation = R (clockwise), pointer (fixed at top) aligns with angle
// (360 - R%360) degrees CW from top. We want that to equal winner center.
// winnerCenter = WINNER_IDX * SEG_ANGLE + SEG_ANGLE/2 degrees CW from top (wheel at rest)
// → R = 360 - winnerCenter + 360*N
const WINNER_CENTER = WINNER_IDX * SEG_ANGLE + SEG_ANGLE / 2
const SPIN_TARGET   = 360 - WINNER_CENTER + 360 * 5  // = 1950°

// Build 6 wheel segments where the winning slot (index 3) shows the real
// discount and the rest are plausible decoys, all sorted to look natural.
function buildSegments(winPct) {
  const pool = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70].filter(d => d !== winPct)
  const decoys = pool.slice(0, SEG_COUNT - 1)
  const labels = [...decoys]
  labels.splice(WINNER_IDX, 0, winPct)
  return labels.map((pct, i) => ({ label: `${pct}% OFF`, color: SEG_COLORS[i] }))
}

function SpinWheel({ onDone, discountPct = 50 }) {
  const [rotation, setRotation] = useState(0)
  const [phase, setPhase] = useState('idle') // idle | spinning | done
  const segments = useMemo(() => buildSegments(discountPct), [discountPct])

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
          {segments.map((seg, i) => {
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
          <h3 style={{ fontSize: 26, fontWeight: 900, color: BRAND, margin: '0 0 8px' }}>You Won {discountPct}% OFF!</h3>
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

function buildSteps(form, course) {
  const { steps, hasEmail, hasName } = splitFormSteps(form)

  if (!hasEmail) steps.push({ type: 'email' })
  if (!hasName)  steps.push({ type: 'name' })

  // "Open" courses always follow the free path, regardless of legacy pricing.
  const paid = course?.accessMode === 'open' ? false : course?.type === 'paid'
  if (paid) {
    // Only show the spin wheel when the course has a discount configured.
    if (Number(course.discount) > 0) steps.push({ type: 'wheel' })
    steps.push({ type: 'terms' })
    steps.push({ type: 'payment' })
  } else {
    // Free courses end on the terms screen — agreeing completes registration.
    steps.push({ type: 'terms' })
  }
  return steps
}

function PaymentScreen({ course, discountedPrice, discountPct, email, name, form, formData, onFreeComplete, submitting }) {
  const [paying, setPaying]   = useState(null)
  const [error,  setError]    = useState('')
  const [code,   setCode]     = useState('')
  const [promo,  setPromo]    = useState(null)
  const [promoMsg, setPromoMsg] = useState('')
  const originalPrice = Number(course.price || 0)
  const isEvent = (course.courseType || 'course') === 'event'
  const currency = course.currency || 'GHS'

  // Promo applies on top of any spin-wheel discount. due === 0 → free path.
  const due  = promo ? priceAfterPromo(discountedPrice, promo) : discountedPrice
  const free = due <= 0

  function applyPromo() {
    const p = findPromoCode(course, code)
    if (!p) { setPromo(null); setPromoMsg(`That code isn't valid for this ${isEvent ? 'event' : 'course'}.`); return }
    setPromo(p)
    setPromoMsg(p.kind === 'free' ? '✅ Free entry unlocked with this code!' : `✅ ${p.value}% off applied!`)
  }

  async function pay(channel) {
    setPaying(channel)
    setError('')

    // Stash context (incl. the charged amount + any promo) so the return handler
    // records the correct enrollment after Paystack redirects back.
    localStorage.setItem('iwc_pending_payment', JSON.stringify({
      email, name, courseId: course.id,
      formId:   form?.id   || null,
      formData: formData   || {},
      amount:   due,
      promoCode: promo?.code || null,
      channel,
    }))

    const callbackUrl = `${window.location.origin}/?paystack_return=1&courseId=${encodeURIComponent(course.id)}`

    try {
      const res = await fetch('/api/paystack-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || 'customer@example.com',
          amount: due,
          currency,
          channels: [channel],
          callback_url: callbackUrl,
          metadata: { courseId: course.id, courseTitle: course.title, participantName: name, promoCode: promo?.code || null },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.authorization_url) {
        setError(data.error || 'Could not initialise payment. Please try again.')
        setPaying(null)
        localStorage.removeItem('iwc_pending_payment')
        return
      }
      // Redirect to Paystack hosted checkout — page will unload
      window.location.href = data.authorization_url
    } catch {
      setError('Network error. Please check your connection and try again.')
      setPaying(null)
      localStorage.removeItem('iwc_pending_payment')
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{isEvent ? '🎟️' : '💳'}</div>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>
          {isEvent ? 'Get Your Ticket' : 'Complete Your Enrollment'}
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
          {free ? 'Confirm your spot below' : `Choose how you'd like to pay${name ? `, ${name.split(' ')[0]}` : ''}`}
        </p>
      </div>

      {/* Price summary */}
      <div style={{
        background: 'linear-gradient(135deg, #f5f0ff, #ede9fe)',
        border: `1px solid ${BRAND}28`, borderRadius: 16,
        padding: '20px 24px', marginBottom: 22, textAlign: 'center',
      }}>
        {(discountPct > 0 || (promo && !free)) && (
          <div style={{ marginBottom: 6, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: 14 }}>
              GHS {originalPrice.toLocaleString()}
            </span>
            {discountPct > 0 && <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{discountPct}% OFF</span>}
            {promo && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{promo.code}</span>}
          </div>
        )}
        <div style={{ fontSize: 38, fontWeight: 900, color: free ? '#16a34a' : BRAND, lineHeight: 1 }}>
          {free ? 'FREE' : `${currency} ${due.toLocaleString()}`}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{course.title}</div>
      </div>

      {/* Promo / invite code */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={code}
            onChange={e => { setCode(e.target.value); setPromoMsg('') }}
            placeholder="Promo / invite code (optional)"
            style={{ ...inputStyle, flex: 1, textTransform: 'uppercase' }}
          />
          <button onClick={applyPromo} disabled={!code.trim()} style={{
            border: 'none', borderRadius: 10, padding: '0 18px', fontWeight: 800, fontSize: 13,
            cursor: code.trim() ? 'pointer' : 'not-allowed',
            background: code.trim() ? BRAND : '#e5e7eb', color: code.trim() ? '#fff' : '#9ca3af',
          }}>Apply</button>
        </div>
        {promoMsg && <div style={{ fontSize: 12.5, fontWeight: 600, color: promo ? '#16a34a' : '#dc2626', marginTop: 7 }}>{promoMsg}</div>}
      </div>

      {/* Action area: free → register without payment; otherwise pay */}
      {free ? (
        <button onClick={() => onFreeComplete(promo?.code || null)} disabled={submitting} style={primaryBtn(submitting)}>
          {submitting ? 'Completing…' : (isEvent ? 'Complete Free Registration →' : 'Complete Registration →')}
        </button>
      ) : (
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
      )}

      {error && (
        <div style={{
          marginTop: 16, background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#dc2626',
        }}>{error}</div>
      )}

      {!free && (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 20 }}>
          🔒 Secured by Paystack. Your payment information is encrypted.
        </p>
      )}
    </div>
  )
}

// ── Confirmation ───────────────────────────────────────────────────────────────

function Confirmation({ course, paymentRef, name, email, accountSetup }) {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
        You're In{name ? `, ${name.split(' ')[0]}` : ''}!
      </h2>
      <p style={{ color: '#6b7280', fontSize: 16, margin: '0 0 8px' }}>
        You've successfully enrolled in <strong>{course.title}</strong>.
      </p>
      {paymentRef && (
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 24px' }}>
          Ref: <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{paymentRef}</code>
        </p>
      )}

      {/* Portal account setup notice */}
      {accountSetup === 'sent' && (
        <div style={{
          background: '#f5f0ff', border: `1px solid ${BRAND}28`, borderRadius: 14,
          padding: '20px 24px', margin: '0 auto 28px', maxWidth: 420, textAlign: 'left',
        }}>
          <div style={{ fontWeight: 800, color: BRAND, fontSize: 15, marginBottom: 6 }}>
            📧 Set up your learning portal account
          </div>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            We've sent a verification link to{' '}
            <strong style={{ color: '#374151' }}>{email}</strong>. Click it to confirm your
            email and create a password — then you can sign in to access your course content.
          </p>
        </div>
      )}
      {accountSetup === 'failed' && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 14,
          padding: '16px 20px', margin: '0 auto 28px', maxWidth: 420, textAlign: 'left',
        }}>
          <p style={{ color: '#92400e', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            Your enrollment is confirmed, but we couldn't send your portal setup email just now.
            Please contact support to get access to your learning content.
          </p>
        </div>
      )}
      {accountSetup === 'pending' && (
        <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 28px' }}>Setting up your portal account…</p>
      )}

      {!accountSetup && (
        <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 380, margin: '0 auto 36px', lineHeight: 1.75 }}>
          Check your email for confirmation and course access details. We look forward to seeing you!
        </p>
      )}

      <button onClick={() => navigate('/')} style={primaryBtn()}>← Back to Courses</button>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────────────────────────

function Header({ course, navigate }) {
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
      }}>← Courses</button>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.4 }}>
        {course?.title || ''}
      </div>
      <div style={{ color: GOLD, fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>IWC CONCEPTS</div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CourseOnboarding() {
  const [params]    = useSearchParams()
  const courseId   = params.get('courseId')
  const navigate    = useNavigate()
  const { sendAccountSetup } = useCustomerAuth()

  const [course,   setCourse]   = useState(null)
  const [form,      setForm]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)

  // flow state
  const [step,         setStep]         = useState(0)
  const [formData,     setFormData]     = useState({})
  const [email,        setEmail]        = useState('')
  const [name,         setName]         = useState('')
  const [confirmed,    setConfirmed]    = useState(false)
  const [payRef,       setPayRef]       = useState(null)
  const [accountSetup, setAccountSetup] = useState(null) // null | 'pending' | 'sent' | 'failed'
  const [submitting,   setSubmitting]   = useState(false)

  useEffect(() => {
    if (!courseId) { setNotFound(true); setLoading(false); return }
    getCourseById(courseId).then(async p => {
      if (!p) { setNotFound(true); setLoading(false); return }
      setCourse(p)
      let loadedForm = null
      if (p.registrationFormId) {
        loadedForm = await getFormById(p.registrationFormId)
        setForm(loadedForm)
      }

      // ── Paystack redirect return ──────────────────────────────────────────
      // main.jsx captured ?paystack_return=1 params into sessionStorage before
      // HashRouter booted, then navigated here. Process the enrollment now.
      const stashed = sessionStorage.getItem('iwc_paystack_return')
      if (stashed) {
        let ret
        try { ret = JSON.parse(stashed) } catch {}
        if (ret?.courseId === p.id && ret?.reference) {
          sessionStorage.removeItem('iwc_paystack_return')
          let ctx
          try { ctx = JSON.parse(localStorage.getItem('iwc_pending_payment') || 'null') } catch {}
          localStorage.removeItem('iwc_pending_payment')

          const payEmail    = ctx?.email    || ''
          const payName     = ctx?.name     || ''
          const payFormData = ctx?.formData || {}
          const payFormId   = ctx?.formId   || null
          const payAmount   = (ctx && typeof ctx.amount === 'number') ? ctx.amount : null
          const payPromo    = ctx?.promoCode || null

          if (payEmail) setEmail(payEmail)
          if (payName)  setName(payName)

          try {
            const submissionId = uid()
            if (loadedForm && payFormId) {
              await addSubmission(payFormId, { ...payFormData, email: payEmail, name: payName, id: submissionId })
            }
            await addEnrollment({
              id: `ref_${ret.reference}`, courseId: p.id, courseTitle: p.title,
              participantName: payName, participantEmail: payEmail,
              paymentRef: ret.reference,
              amountPaid: payAmount != null ? payAmount : Math.round(Number(p.price || 0) * (1 - (Number(p.discount) || 0) / 100)),
              currency: p.currency || 'GHS', promoCode: payPromo, enrolledAt: new Date().toISOString(),
              ...(loadedForm && payFormId ? { formSubmissionId: submissionId } : {}),
            })
            setPayRef(ret.reference)
            setConfirmed(true)
            window.scrollTo({ top: 0 })
            if (p.hasPortalAccess && payEmail) {
              setAccountSetup('pending')
              try {
                await sendAccountSetup(payEmail)
                setAccountSetup('sent')
              } catch {
                setAccountSetup('failed')
              }
            }
          } catch (err) {
            console.error('[paystack-return]', err)
            alert('Payment was received but enrollment saving failed. Please contact support — ref: ' + ret.reference)
          }
          setLoading(false)
          return
        }
      }
      // ── Normal load ───────────────────────────────────────────────────────
      setLoading(false)
    })
  }, [courseId])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ color: '#9ca3af', fontSize: 16 }}>Loading…</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>Course not found</div>
      <button onClick={() => navigate('/')} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
    </div>
  )

  // Courses are membership-only (no per-course registration), so every course
  // routes to /join. Membership-gated events route here too; free/paid events
  // fall through to their normal registration/ticket flow below.
  const itemIsEvent = (course?.courseType || 'course') === 'event'
  if (course && !confirmed && (!itemIsEvent || course.accessMode === 'plan')) {
    const noun = itemIsEvent ? 'event' : 'course'
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        <div style={{ fontSize: 48 }}>🎫</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>This {noun} is part of our membership</div>
        <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 420, margin: 0, lineHeight: 1.7 }}>
          <strong>{course.title}</strong> is included in a membership plan. Become a member to unlock it — along with every other {noun} in your plan.
        </p>
        <button onClick={() => navigate('/join')} style={primaryBtn()}>Become a Member →</button>
        <button onClick={() => navigate(itemIsEvent ? '/' : '/courses')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>← Back</button>
      </div>
    )
  }

  const steps        = buildSteps(form, course)
  const currentStep  = steps[step]
  const progress     = Math.round(((step + 1) / steps.length) * 100)
  const questionSteps = steps.filter(s => s.type === 'question')
  const questionIdx   = steps.slice(0, step + 1).filter(s => s.type === 'question').length

  // Resolve email / name from either the dedicated steps or form fields
  const emailFieldId = findFieldId(form, 'email')
  const nameFieldId  = findFieldId(form, 'name')
  const resolvedEmail = email || (emailFieldId ? formData[emailFieldId] : '') || ''
  const resolvedName  = name  || (nameFieldId  ? formData[nameFieldId]  : '') || ''

  const originalPrice    = Number(course?.price || 0)
  const discountPct      = Number(course?.discount) || 0
  const discountedPrice  = Math.round(originalPrice * (1 - discountPct / 100))
  const paidFlow         = course?.accessMode === 'open' ? false : course?.type === 'paid'

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

  // After a successful paid enrollment, show confirmation and — if the course
  // grants portal access — send the account-setup / email-verification link.
  async function completePaidEnrollment(ref) {
    setPayRef(ref)
    setConfirmed(true)
    window.scrollTo({ top: 0 })
    if (course.hasPortalAccess && resolvedEmail) {
      setAccountSetup('pending')
      try {
        await sendAccountSetup(resolvedEmail)
        setAccountSetup('sent')
      } catch (err) {
        console.error('[portal] account setup email failed:', err)
        setAccountSetup('failed')
      }
    }
  }

  async function submitFree(promoCode = null) {
    if (submitting) return
    // Guard against an event object being passed when used directly as an onClick.
    const code = typeof promoCode === 'string' ? promoCode : null
    setSubmitting(true)
    try {
      const submissionId = uid()
      if (form) {
        await addSubmission(form.id, { ...formData, email: resolvedEmail, name: resolvedName, id: submissionId })
      }
      await addEnrollment({
        id: uid(), courseId: course.id, courseTitle: course.title,
        participantName: resolvedName,
        participantEmail: resolvedEmail,
        paymentRef: null, amountPaid: 0, currency: course.currency || 'GHS',
        promoCode: code,
        enrolledAt: new Date().toISOString(),
        ...(form ? { formSubmissionId: submissionId } : {}),
      })
      setConfirmed(true)
      window.scrollTo({ top: 0 })
      // Free courses that grant portal access still need an account: send the
      // same email-verification / password-setup link as the paid flow.
      if (course.hasPortalAccess && resolvedEmail) {
        setAccountSetup('pending')
        try {
          await sendAccountSetup(resolvedEmail)
          setAccountSetup('sent')
        } catch (err) {
          console.error('[portal] account setup email failed:', err)
          setAccountSetup('failed')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Enrollment failed. Please try again.')
      setSubmitting(false)
    }
  }

  if (confirmed) return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <Header course={course} navigate={navigate} />
      <div style={{ padding: '56px 0 80px' }}>
        <Confirmation course={course} paymentRef={payRef} name={resolvedName} email={resolvedEmail} accountSetup={accountSetup} />
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
              Spin the wheel for an exclusive discount on <strong>{course.title}</strong>.
            </p>
            <SpinWheel onDone={goNext} discountPct={discountPct} />
          </div>
        )

      case 'terms':
        return (
          <TermsScreen
            onBack={step > 0 ? goBack : null}
            onAccept={paidFlow ? goNext : submitFree}
            acceptLabel={paidFlow ? 'Agree & Continue to Payment →' : 'Agree & Complete Registration →'}
            submitting={submitting}
          />
        )

      case 'payment':
        return (
          <PaymentScreen
            course={course}
            discountedPrice={discountedPrice}
            discountPct={discountPct}
            email={resolvedEmail}
            name={resolvedName}
            form={form}
            formData={formData}
            onFreeComplete={submitFree}
            submitting={submitting}
          />
        )

      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <Header course={course} navigate={navigate} />

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
