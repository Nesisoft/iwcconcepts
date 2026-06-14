/**
 * MembershipJoin.jsx — /join
 *
 * Platform-level registration: fill the linked membership form (built in the
 * Form Builder), choose a plan (perks shown, price hidden), accept terms, see
 * the price on the final summary step, then pay via Paystack.
 *
 * Also handles upgrades/renewals for signed-in members (?upgrade=1 / ?renew=1
 * or just visiting while already a member).
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  getFormById, addSubmission, addMember, uid,
  getMembershipPlans, getMembershipConfig, getMyMembership,
} from '../utils/formStorage'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import {
  BRAND, BRAND2, primaryBtn, NavButtons, findFieldId, splitFormSteps,
  QuestionScreen, InterstitialScreen, EmailScreen, NameScreen, TermsScreen,
  SingleFormScreen, SpinWheel,
} from '../components/OnboardingScreens'

const GOLD = '#C9A84C'

// Effective discount for a package = the bigger of the platform-wide discount
// (the spin-wheel one) and the package's own standing discount, capped at 90%.
function effectiveDiscount(plan, globalDiscount = 0) {
  return Math.max(0, Math.min(90, Math.max(Number(globalDiscount) || 0, Number(plan?.discount) || 0)))
}
function discountedPrice(plan, globalDiscount = 0) {
  const base = Number(plan?.price) || 0
  return Math.round(base * (1 - effectiveDiscount(plan, globalDiscount) / 100))
}

// ── Steps builder ──────────────────────────────────────────────────────────────

function buildJoinSteps(form, { skipForm, knowEmail, knowName, globalDiscount }) {
  let steps = []
  let hasEmail = false
  let hasName  = false

  if (form && !skipForm) {
    if ((form.displayMode || 'single') === 'steps') {
      const r = splitFormSteps(form)
      steps = r.steps; hasEmail = r.hasEmail; hasName = r.hasName
    } else {
      steps = [{ type: 'form' }]
      const r = splitFormSteps(form)          // detect email/name fields either way
      hasEmail = r.hasEmail; hasName = r.hasName
    }
  }

  if (!hasEmail && !knowEmail) steps.push({ type: 'email' })
  if (!hasName  && !knowName)  steps.push({ type: 'name' })
  if (Number(globalDiscount) > 0) steps.push({ type: 'wheel' })   // discount reveal before picking a package
  steps.push({ type: 'plans' })
  steps.push({ type: 'terms' })
  steps.push({ type: 'summary' })
  return steps
}

// ── Plan selection (price + duration shown on each package; details expandable) ──

function humanDuration(days) {
  const d = Number(days) || 0
  if (d <= 0) return 'Lifetime access'
  if (d % 365 === 0) { const y = d / 365; return `${y} year${y > 1 ? 's' : ''}` }
  if (d % 30 === 0)  { const m = d / 30;  return `${m} month${m > 1 ? 's' : ''}` }
  if (d % 7 === 0)   { const w = d / 7;   return `${w} week${w > 1 ? 's' : ''}` }
  return `${d} days`
}

function PlanScreen({ plans, currentPlanId, value, onChange, onNext, onBack, globalDiscount = 0 }) {
  const [openId, setOpenId] = useState(null)
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
          Choose your package
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
          Each membership unlocks its courses for the period shown — higher tiers include everything below them. Renew or upgrade anytime.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 32 }}>
        {plans.map((p, i) => {
          const selected  = value === p.id
          const isCurrent = currentPlanId === p.id
          const isTop     = i === plans.length - 1
          const price     = Number(p.price || 0)
          const disc      = effectiveDiscount(p, globalDiscount)
          const due       = discountedPrice(p, globalDiscount)
          const open      = openId === p.id
          const hasDetails = (p.perks || []).length > 0 || !!p.description
          return (
            <div key={p.id} role="button" tabIndex={0} onClick={() => onChange(p.id)} style={{
              textAlign: 'left', padding: 0, borderRadius: 18, overflow: 'hidden',
              border: `2px solid ${selected ? (p.color || BRAND) : '#e5e7eb'}`,
              background: '#fff', cursor: 'pointer',
              boxShadow: selected ? `0 8px 28px ${(p.color || BRAND)}33` : '0 2px 10px rgba(0,0,0,0.05)',
              transition: 'all 0.18s', position: 'relative',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ height: 7, background: p.color || BRAND }} />
              <div style={{ padding: '18px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: '#111827' }}>{p.name}</span>
                  {isTop && (
                    <span style={{ background: `linear-gradient(135deg, ${GOLD}, #e8c060)`, color: '#1A1A2E', fontSize: 9, fontWeight: 800, borderRadius: 12, padding: '2px 8px', letterSpacing: 0.5 }}>★ PREMIUM</span>
                  )}
                  {isCurrent && (
                    <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 9, fontWeight: 800, borderRadius: 12, padding: '2px 8px' }}>CURRENT</span>
                  )}
                </div>
                {p.tagline && <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#6b7280', lineHeight: 1.55 }}>{p.tagline}</p>}

                {/* Price + duration — shown upfront so people can compare packages */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#111827', lineHeight: 1.1 }}>
                      {price > 0 ? `GHS ${due.toLocaleString()}` : 'Free'}
                    </div>
                    {disc > 0 && price > 0 && (
                      <>
                        <span style={{ fontSize: 15, color: '#9ca3af', textDecoration: 'line-through' }}>GHS {price.toLocaleString()}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', background: '#dcfce7', borderRadius: 20, padding: '2px 8px' }}>{disc}% OFF</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>
                    {price > 0 ? `for ${humanDuration(p.durationDays)}` : humanDuration(p.durationDays)}
                  </div>
                </div>

                {/* Expandable details */}
                {hasDetails && (
                  <div style={{ marginBottom: 12 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenId(open ? null : p.id) }}
                      style={{ background: 'none', border: 'none', padding: 0, color: p.color || BRAND, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      {open ? 'Hide details ▴' : 'See what’s included ▾'}
                    </button>
                    {open && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {p.description && <p style={{ margin: 0, fontSize: 12.5, color: '#6b7280', lineHeight: 1.55 }}>{p.description}</p>}
                        {(p.perks || []).map((perk, j) => (
                          <div key={j} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
                            <span style={{ color: p.color || BRAND, fontWeight: 900, flexShrink: 0 }}>✓</span>{perk}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ flex: 1 }} />
                <div style={{
                  textAlign: 'center', borderRadius: 10, padding: '10px 0',
                  fontWeight: 800, fontSize: 13,
                  background: selected ? (p.color || BRAND) : '#f5f0ff',
                  color: selected ? '#fff' : (p.color || BRAND),
                }}>
                  {selected ? '✓ Selected' : isCurrent ? 'Renew this plan' : 'Select'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <NavButtons onBack={onBack} onNext={onNext} canProceed={!!value} />
      </div>
    </div>
  )
}

// ── Summary + payment (price revealed here) ───────────────────────────────────

function SummaryScreen({ plan, email, name, onBack, onPay, onFree, paying, error, globalDiscount = 0 }) {
  const price = Number(plan?.price || 0)
  const disc  = effectiveDiscount(plan, globalDiscount)
  const due   = discountedPrice(plan, globalDiscount)
  const validity = Number(plan?.durationDays) > 0
    ? `Valid for ${plan.durationDays} days from today`
    : 'Lifetime access'

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🎫</div>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>
          Your membership summary
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
          {name ? `${name.split(' ')[0]}, here's` : "Here's"} what you're getting
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #f5f0ff, #ede9fe)',
        border: `1px solid ${BRAND}28`, borderRadius: 16,
        padding: '22px 24px', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: plan?.color || BRAND }} />
          <span style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>{plan?.name}</span>
        </div>
        {(plan?.perks || []).map((perk, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
            <span style={{ color: plan?.color || BRAND, fontWeight: 900 }}>✓</span>{perk}
          </div>
        ))}
        <div style={{ borderTop: '1px solid #ddd6fe', margin: '14px 0 12px' }} />
        <div style={{ textAlign: 'center' }}>
          {disc > 0 && price > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16, color: '#9ca3af', textDecoration: 'line-through' }}>GHS {price.toLocaleString()}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', background: '#dcfce7', borderRadius: 20, padding: '2px 9px' }}>{disc}% OFF</span>
            </div>
          )}
          <div style={{ fontSize: 36, fontWeight: 900, color: BRAND, lineHeight: 1.1 }}>
            {price > 0 ? `GHS ${due.toLocaleString()}` : 'Free'}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 5 }}>{validity}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{email}</div>
        </div>
      </div>

      {price > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { channel: 'mobile_money', icon: '📱', label: 'Pay with Mobile Money', sub: 'MTN MoMo · Vodafone Cash · AirtelTigo' },
            { channel: 'card',         icon: '💳', label: 'Pay with Card',         sub: 'Visa · Mastercard · bank card' },
          ].map(({ channel, icon, label, sub }) => (
            <button key={channel} onClick={() => onPay(channel)} disabled={paying !== null} style={{
              width: '100%', padding: '18px 22px', borderRadius: 14,
              border: `2px solid ${paying === channel ? BRAND : channel === 'mobile_money' ? BRAND : '#e5e7eb'}`,
              background: paying === channel ? '#f5f0ff' : '#fff',
              cursor: paying ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'all 0.18s', textAlign: 'left',
            }}>
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
      ) : (
        <button onClick={onFree} disabled={paying !== null} style={{ width: '100%', ...primaryBtn(paying !== null) }}>
          {paying ? 'Completing…' : 'Complete My Registration →'}
        </button>
      )}

      {error && (
        <div style={{ marginTop: 16, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#dc2626' }}>{error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
        <button onClick={onBack} disabled={paying !== null} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>← Back</button>
      </div>

      {price > 0 && (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 14 }}>
          🔒 Secured by Paystack. Your payment information is encrypted.
        </p>
      )}
    </div>
  )
}

// ── Confirmation ───────────────────────────────────────────────────────────────

function Confirmation({ plan, paymentRef, name, email, accountSetup, isLoggedIn }) {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
        Welcome aboard{name ? `, ${name.split(' ')[0]}` : ''}!
      </h2>
      <p style={{ color: '#6b7280', fontSize: 16, margin: '0 0 8px' }}>
        Your <strong>{plan?.name || 'membership'}</strong> is now active.
      </p>
      {paymentRef && (
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 24px' }}>
          Ref: <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{paymentRef}</code>
        </p>
      )}

      {accountSetup === 'sent' && (
        <div style={{ background: '#f5f0ff', border: `1px solid ${BRAND}28`, borderRadius: 14, padding: '20px 24px', margin: '0 auto 28px', maxWidth: 420, textAlign: 'left' }}>
          <div style={{ fontWeight: 800, color: BRAND, fontSize: 15, marginBottom: 6 }}>
            📧 Set up your learning portal account
          </div>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            We've sent a verification link to <strong style={{ color: '#374151' }}>{email}</strong>.
            Click it to confirm your email and create a password — then sign in to access every course in your plan.
          </p>
        </div>
      )}
      {accountSetup === 'failed' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 14, padding: '16px 20px', margin: '0 auto 28px', maxWidth: 420, textAlign: 'left' }}>
          <p style={{ color: '#92400e', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            Your membership is confirmed, but we couldn't send your portal setup email just now.
            Use "Forgot password" on the portal login page, or contact support.
          </p>
        </div>
      )}
      {accountSetup === 'pending' && (
        <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 28px' }}>Setting up your portal account…</p>
      )}

      <button onClick={() => navigate(isLoggedIn ? '/portal' : '/portal/login')} style={primaryBtn()}>
        Go to My Portal →
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function MembershipJoin() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const { user, sendAccountSetup, getAccessToken } = useCustomerAuth()
  const upgrading = params.get('upgrade') === '1' || params.get('renew') === '1'

  const [plans,   setPlans]   = useState([])
  const [form,    setForm]    = useState(null)
  const [config,  setConfig]  = useState({})
  const [member,  setMember]  = useState(null)
  const [loading, setLoading] = useState(true)

  // flow state
  const [step,         setStep]         = useState(0)
  const [formData,     setFormData]     = useState({})
  const [email,        setEmail]        = useState('')
  const [name,         setName]         = useState('')
  const [planId,       setPlanId]       = useState('')
  const [confirmed,    setConfirmed]    = useState(false)
  const [payRef,       setPayRef]       = useState(null)
  const [accountSetup, setAccountSetup] = useState(null)
  const [paying,       setPaying]       = useState(null)
  const [error,        setError]        = useState('')

  useEffect(() => {
    async function load() {
      const [allPlans, config] = await Promise.all([getMembershipPlans(), getMembershipConfig()])
      const activePlans = (allPlans || []).filter(p => p.active !== false)
      setPlans(activePlans)
      setConfig(config || {})

      let loadedForm = null
      if (config?.registrationFormId) {
        loadedForm = await getFormById(config.registrationFormId).catch(() => null)
        setForm(loadedForm)
      }

      // Signed-in member context (upgrade / renew)
      if (user?.email) {
        setEmail(user.email)
        try {
          const token = await getAccessToken()
          const m = await getMyMembership(token)
          if (m) { setMember(m); if (m.name) setName(m.name) }
        } catch {}
      }

      // ── Paystack redirect return ──────────────────────────────────────────
      const stashed = sessionStorage.getItem('iwc_paystack_return_membership')
      if (stashed) {
        let ret
        try { ret = JSON.parse(stashed) } catch {}
        sessionStorage.removeItem('iwc_paystack_return_membership')
        if (ret?.reference) {
          let ctx
          try { ctx = JSON.parse(localStorage.getItem('iwc_pending_membership') || 'null') } catch {}
          localStorage.removeItem('iwc_pending_membership')

          const payEmail  = ctx?.email || user?.email || ''
          const payName   = ctx?.name  || ''
          const payPlanId = ctx?.planId || ret.planId
          const plan      = activePlans.find(p => p.id === payPlanId)

          if (payEmail) setEmail(payEmail)
          if (payName)  setName(payName)
          if (payPlanId) setPlanId(payPlanId)

          try {
            const submissionId = uid()
            if (loadedForm && ctx?.formId && ctx?.formData) {
              await addSubmission(ctx.formId, { ...ctx.formData, email: payEmail, name: payName, id: submissionId })
            }
            await addMember({
              email: payEmail, name: payName, planId: payPlanId,
              paymentRef: ret.reference,
              amountPaid: discountedPrice(plan, Number(config?.discount) || 0),
              currency: plan?.currency || 'GHS',
              ...(loadedForm && ctx?.formId ? { formSubmissionId: submissionId } : {}),
            })
            setPayRef(ret.reference)
            setConfirmed(true)
            window.scrollTo({ top: 0 })
            if (!user && payEmail) {
              setAccountSetup('pending')
              try { await sendAccountSetup(payEmail); setAccountSetup('sent') }
              catch { setAccountSetup('failed') }
            }
          } catch (err) {
            console.error('[membership-return]', err)
            alert('Payment was received but activating your membership failed. Please contact support — ref: ' + ret.reference)
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ color: '#9ca3af', fontSize: 16 }}>Loading…</div>
    </div>
  )

  if (!confirmed && plans.length === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div style={{ fontSize: 48 }}>🎫</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>Membership opens soon</div>
      <p style={{ color: '#9ca3af', fontSize: 14, maxWidth: 380, margin: 0 }}>Plans haven't been published yet — check back shortly.</p>
      <button onClick={() => navigate('/courses')} style={primaryBtn()}>Browse Courses</button>
    </div>
  )

  // Known member, already on a plan — only allow moving to a different plan.
  const skipForm  = !!(member && member.active)         // existing members skip the intake form
  const knowEmail = !!email
  const knowName  = !!name

  const globalDiscount = Number(config?.discount) || 0
  const steps        = buildJoinSteps(form, { skipForm, knowEmail, knowName, globalDiscount })
  const currentStep  = steps[step]
  const progress     = Math.round(((step + 1) / steps.length) * 100)
  const questionSteps = steps.filter(s => s.type === 'question')
  const questionIdx   = steps.slice(0, step + 1).filter(s => s.type === 'question').length

  const emailFieldId  = findFieldId(form, 'email')
  const nameFieldId   = findFieldId(form, 'name')
  const resolvedEmail = email || (emailFieldId ? formData[emailFieldId] : '') || ''
  const resolvedName  = name  || (nameFieldId  ? formData[nameFieldId]  : '') || ''
  const chosenPlan    = plans.find(p => p.id === planId)

  function goNext() {
    if (step < steps.length - 1) { setStep(s => s + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }
  function goBack() {
    if (step > 0) { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  async function pay(channel) {
    if (!chosenPlan) return
    setPaying(channel)
    setError('')
    localStorage.setItem('iwc_pending_membership', JSON.stringify({
      email: resolvedEmail, name: resolvedName, planId: chosenPlan.id,
      formId: (form && !skipForm) ? form.id : null,
      formData: formData || {},
    }))
    const callbackUrl = `${window.location.origin}/?paystack_return=1&membership=1&planId=${encodeURIComponent(chosenPlan.id)}`
    try {
      const res = await fetch('/api/paystack-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resolvedEmail || 'customer@example.com',
          amount: discountedPrice(chosenPlan, globalDiscount),
          currency: chosenPlan.currency || 'GHS',
          channels: [channel],
          callback_url: callbackUrl,
          metadata: { type: 'membership', planId: chosenPlan.id, planName: chosenPlan.name, participantName: resolvedName },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.authorization_url) {
        setError(data.error || 'Could not initialise payment. Please try again.')
        setPaying(null)
        localStorage.removeItem('iwc_pending_membership')
        return
      }
      window.location.href = data.authorization_url
    } catch {
      setError('Network error. Please check your connection and try again.')
      setPaying(null)
      localStorage.removeItem('iwc_pending_membership')
    }
  }

  async function completeFree() {
    if (!chosenPlan) return
    setPaying('free')
    setError('')
    try {
      const submissionId = uid()
      if (form && !skipForm) {
        await addSubmission(form.id, { ...formData, email: resolvedEmail, name: resolvedName, id: submissionId })
      }
      await addMember({
        email: resolvedEmail, name: resolvedName, planId: chosenPlan.id,
        paymentRef: null, amountPaid: 0, currency: chosenPlan.currency || 'GHS',
        ...(form && !skipForm ? { formSubmissionId: submissionId } : {}),
      })
      setConfirmed(true)
      window.scrollTo({ top: 0 })
      if (!user && resolvedEmail) {
        setAccountSetup('pending')
        try { await sendAccountSetup(resolvedEmail); setAccountSetup('sent') }
        catch { setAccountSetup('failed') }
      }
    } catch (err) {
      console.error(err)
      setError('Registration failed. Please try again.')
    } finally {
      setPaying(null)
    }
  }

  if (confirmed) return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <JoinHeader navigate={navigate} />
      <div style={{ padding: '56px 0 80px' }}>
        <Confirmation plan={chosenPlan} paymentRef={payRef} name={resolvedName} email={resolvedEmail} accountSetup={accountSetup} isLoggedIn={!!user} />
      </div>
    </div>
  )

  function renderStep() {
    if (!currentStep) return null
    switch (currentStep.type) {
      case 'form':
        return (
          <SingleFormScreen
            form={form} formData={formData} setFormData={setFormData}
            onNext={goNext} onBack={step > 0 ? goBack : null}
            title={form?.title || 'Tell us about you'}
            subtitle="A few details before you choose your plan."
          />
        )
      case 'question':
        return (
          <QuestionScreen
            field={currentStep.field}
            value={formData[currentStep.field.id]}
            onChange={v => setFormData(p => ({ ...p, [currentStep.field.id]: v }))}
            onNext={goNext} onBack={step > 0 ? goBack : null}
            stepNum={questionIdx} totalQuestions={questionSteps.length}
          />
        )
      case 'interstitial':
        return <InterstitialScreen step={currentStep} onNext={goNext} onBack={step > 0 ? goBack : null} />
      case 'wheel':
        return (
          <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>You've unlocked a members' discount!</h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Spin to reveal the discount applied to every package.</p>
            </div>
            <SpinWheel discountPct={globalDiscount} onDone={goNext} doneLabel="See Packages →" />
          </div>
        )
      case 'email':
        return <EmailScreen value={email} onChange={setEmail} onNext={goNext} onBack={step > 0 ? goBack : null}
          subtitle="We'll send your membership confirmation and portal access here." />
      case 'name':
        return <NameScreen value={name} onChange={setName} onNext={goNext} onBack={step > 0 ? goBack : null} />
      case 'plans':
        return (
          <PlanScreen
            plans={plans}
            currentPlanId={member?.active ? member.planId : null}
            value={planId} onChange={setPlanId}
            onNext={goNext} onBack={step > 0 ? goBack : null}
            globalDiscount={globalDiscount}
          />
        )
      case 'terms':
        return (
          <TermsScreen
            onBack={step > 0 ? goBack : null}
            onAccept={goNext}
            acceptLabel="Agree & See My Summary →"
            submitting={false}
          />
        )
      case 'summary':
        return (
          <SummaryScreen
            plan={chosenPlan} email={resolvedEmail} name={resolvedName}
            onBack={goBack} onPay={pay} onFree={completeFree}
            paying={paying} error={error} globalDiscount={globalDiscount}
          />
        )
      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <JoinHeader navigate={navigate} upgrading={upgrading || (member && member.active)} />
      <div style={{ height: 4, background: '#f3f4f6' }}>
        <div style={{ height: '100%', background: `linear-gradient(to right, ${BRAND}, ${BRAND2})`, width: `${progress}%`, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ padding: '48px 0 80px' }}>
        {renderStep()}
      </div>
    </div>
  )
}

function JoinHeader({ navigate, upgrading }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 100%)',
      padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button onClick={() => navigate('/courses')} style={{
        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.8)',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>← Courses</button>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.4 }}>
        {upgrading ? 'Upgrade Your Membership' : 'Become a Member'}
      </div>
      <div style={{ color: GOLD, fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>IWC CONCEPTS</div>
    </div>
  )
}
