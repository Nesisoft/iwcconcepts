import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  uid, getAllForms, getMembershipPlans, saveMembershipPlans,
  getMembershipConfig, saveMembershipConfig,
  getMembers, saveMemberAdmin, deleteMemberAdmin, getGroupTrainings,
} from '../utils/formStorage'
import AdminSelect from '../components/AdminSelect'

const ACC  = '#C9A84C'
const ACC2 = '#e8c060'
const DARK = '#0e0a1e'

const PLAN_COLORS = ['#6c3fc5', '#0891b2', '#C9A84C', '#E4600A', '#10B981', '#9333ea']

const inp = (extra = {}) => ({
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8, color: 'white', fontFamily: "'Montserrat',sans-serif",
  fontSize: 12, padding: '8px 11px', width: '100%', boxSizing: 'border-box',
  ...extra,
})

function Label({ children }) {
  return <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 4 }}>{children}</label>
}
function Fld({ label, children }) {
  return <div style={{ marginBottom: 12 }}><Label>{label}</Label>{children}</div>
}

function makePlan(n) {
  return {
    id: uid(),
    name: `Plan ${n}`,
    tagline: '',
    perks: [],
    price: 0,
    currency: 'GHS',
    durationDays: 365,
    popular: false,              // highlight as the recommended package
    color: PLAN_COLORS[(n - 1) % PLAN_COLORS.length],
    active: true,
  }
}

export default function PlansManager() {
  const navigate = useNavigate()
  const [tab, setTab]         = useState('plans')
  const [plans, setPlans]     = useState([])
  const [config, setConfig]   = useState({})
  const [forms, setForms]     = useState([])
  const [members, setMembers] = useState([])
  const [groups, setGroups]   = useState([])
  const [selected, setSelected] = useState(null)
  const [perkInput, setPerkInput] = useState('')
  const [memberQuery, setMemberQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('all')   // 'all' | planId
  const [joinFilter, setJoinFilter] = useState('all')   // 'all' | 'individual' | 'group'
  const [loaded, setLoaded]   = useState(false)
  const [copied, setCopied]   = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    Promise.all([getMembershipPlans(), getMembershipConfig(), getAllForms(), getMembers().catch(() => []), getGroupTrainings().catch(() => [])])
      .then(([ps, cfg, fs, ms, gs]) => {
        setPlans(ps); setConfig(cfg || {}); setForms(fs || []); setMembers(ms || []); setGroups(gs || [])
        if (ps.length) setSelected(ps[0].id)
        setLoaded(true)
      })
  }, [])

  // Debounced persist of the whole plans array (order = rank)
  const persistPlans = useCallback((next) => {
    setPlans(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveMembershipPlans(next), 600)
  }, [])

  const persistConfig = useCallback((next) => {
    setConfig(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveMembershipConfig(next), 600)
  }, [])

  const plan = plans.find(p => p.id === selected)
  const setPlan = (k, v) => persistPlans(plans.map(p => p.id === selected ? { ...p, [k]: v } : p))

  function addPlan() {
    const p = makePlan(plans.length + 1)
    persistPlans([...plans, p])
    setSelected(p.id)
  }

  function removePlan(id) {
    if (!confirm('Delete this plan? Existing members on it keep access until their expiry, but new signups can no longer choose it.')) return
    const next = plans.filter(p => p.id !== id)
    persistPlans(next)
    if (selected === id) setSelected(next[0]?.id || null)
  }

  function movePlan(id, dir) {
    const idx = plans.findIndex(p => p.id === id)
    const tgt = idx + dir
    if (tgt < 0 || tgt >= plans.length) return
    const next = [...plans]
    ;[next[idx], next[tgt]] = [next[tgt], next[idx]]
    persistPlans(next)
  }

  function copyJoinLink() {
    const base = window.location.href.split('#')[0]
    navigator.clipboard.writeText(`${base}#/join`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  async function toggleMemberStatus(m) {
    const updated = { ...m, status: m.status === 'active' ? 'inactive' : 'active' }
    await saveMemberAdmin(updated)
    setMembers(ms => ms.map(x => x.email === m.email ? { ...updated, active: updated.status === 'active' } : x))
  }

  async function changeExpiry(m) {
    const cur = m.expiresAt ? m.expiresAt.slice(0, 10) : ''
    const v = prompt('New expiry date (YYYY-MM-DD), empty = lifetime:', cur)
    if (v === null) return
    const expiresAt = v.trim() ? new Date(v.trim() + 'T23:59:59').toISOString() : null
    const updated = { ...m, expiresAt }
    await saveMemberAdmin(updated)
    setMembers(ms => ms.map(x => x.email === m.email ? updated : x))
  }

  async function removeMember(m) {
    if (!confirm(`Remove member ${m.email}? They lose plan access immediately.`)) return
    await deleteMemberAdmin(m.email)
    setMembers(ms => ms.filter(x => x.email !== m.email))
  }

  // A member joined "as a group" when their record carries a group source.
  const groupOf = (m) => {
    const gid = m.groupId || (typeof m.source === 'string' && m.source.startsWith('group:') ? m.source.slice(6) : null)
    if (!gid) return null
    return groups.find(g => g.id === gid) || { id: gid, orgName: 'Unknown group' }
  }

  const visibleMembers = members.filter(m => {
    const q = memberQuery.trim().toLowerCase()
    const grp = groupOf(m)
    if (planFilter !== 'all' && m.planId !== planFilter) return false
    if (joinFilter === 'group' && !grp) return false
    if (joinFilter === 'individual' && grp) return false
    if (!q) return true
    return [m.email, m.name, m.planName, grp?.orgName].filter(Boolean).join(' ').toLowerCase().includes(q)
  })

  const divider = { height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }
  const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: 18, marginBottom: 16 }
  const tabBtn = (t) => ({
    padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
    borderBottom: tab === t ? `2px solid ${ACC}` : '2px solid transparent',
    background: 'transparent', color: tab === t ? ACC2 : 'rgba(255,255,255,0.45)',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},${ACC2})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎫</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Membership Plans</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
          {plans.length} plan{plans.length !== 1 ? 's' : ''} · {members.length} member{members.length !== 1 ? 's' : ''} · Auto-saved
        </div>
      </header>

      {/* Tabs */}
      <div style={{ background: '#160c28', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', padding: '0 20px', flexShrink: 0 }}>
        {['plans', 'registration', 'members'].map(t => (
          <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {!loaded ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading…</div>
        ) : tab === 'plans' ? (

          /* ── PLANS ─────────────────────────────────────────────────────── */
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, maxWidth: 900 }}>
            {/* List — order = tier rank */}
            <div>
              <button onClick={addPlan} style={{ width: '100%', background: `linear-gradient(135deg,${ACC},#a8893a)`, border: 'none', borderRadius: 8, color: '#1a0d2e', padding: '10px', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginBottom: 12 }}>+ New Plan</button>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: 10 }}>
                Order = tier level. Top is the entry plan, bottom the highest tier (e.g. Premium).
                A member can open courses assigned to their own plan <strong>or any plan listed above theirs</strong> — higher tiers include everything below them. Use ↑↓ to reorder.
              </div>
              {plans.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎫</div>No plans yet
                </div>
              )}
              {plans.map((p, i) => {
                const active = p.id === selected
                return (
                  <div key={p.id} onClick={() => setSelected(p.id)} style={{ background: active ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? ACC : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: active ? ACC2 : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>TIER {i + 1}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '4px 0 8px' }}>
                      GHS {Number(p.price || 0).toLocaleString()} · {Number(p.durationDays) > 0 ? `${p.durationDays} days` : 'lifetime'}{!p.active && ' · hidden'}
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button onClick={e => { e.stopPropagation(); movePlan(p.id, -1) }} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: 10, padding: '4px 8px', cursor: 'pointer' }}>↑</button>
                      <button onClick={e => { e.stopPropagation(); movePlan(p.id, 1) }} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: 10, padding: '4px 8px', cursor: 'pointer' }}>↓</button>
                      <div style={{ flex: 1 }} />
                      <button onClick={e => { e.stopPropagation(); removePlan(p.id) }} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, color: '#f87171', fontSize: 9, fontWeight: 700, padding: '4px 8px', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Editor */}
            {!plan ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'rgba(255,255,255,0.25)', gap: 12, minHeight: 300 }}>
                <div style={{ fontSize: 44 }}>🎫</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Select a plan to edit, or create one</div>
              </div>
            ) : (
              <div style={{ maxWidth: 520 }}>
                <Fld label="Plan Name"><input style={inp()} value={plan.name} onChange={e => setPlan('name', e.target.value)} /></Fld>
                <Fld label="Tagline (shown on the plan card during registration)">
                  <input style={inp()} value={plan.tagline || ''} onChange={e => setPlan('tagline', e.target.value)} placeholder="e.g. Everything you need to get started" />
                </Fld>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Fld label="Price (GHS) — revealed only at the final payment step">
                    <input type="number" min={0} style={inp()} value={plan.price} onChange={e => setPlan('price', Number(e.target.value))} />
                  </Fld>
                  <Fld label="Validity (days, 0 = lifetime)">
                    <input type="number" min={0} style={inp()} value={plan.durationDays} onChange={e => setPlan('durationDays', Number(e.target.value))} />
                  </Fld>
                </div>
                <Fld label="What's included (one perk per line — shown to users while choosing)">
                  <div style={{ marginBottom: 6 }}>
                    {(plan.perks || []).map((perk, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 10px', marginBottom: 5, fontSize: 11 }}>
                        <span style={{ color: '#34d399' }}>✓</span>
                        <span style={{ flex: 1 }}>{perk}</span>
                        <span onClick={() => setPlan('perks', plan.perks.filter((_, j) => j !== i))} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>✕</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input style={inp({ flex: 1 })} value={perkInput} placeholder="e.g. Access to all Standard courses" onChange={e => setPerkInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && perkInput.trim()) { setPlan('perks', [...(plan.perks || []), perkInput.trim()]); setPerkInput('') } }} />
                    <button onClick={() => { if (perkInput.trim()) { setPlan('perks', [...(plan.perks || []), perkInput.trim()]); setPerkInput('') } }} style={{ background: ACC, border: 'none', borderRadius: 6, color: '#1a0d2e', padding: '0 12px', cursor: 'pointer', fontWeight: 800 }}>+</button>
                  </div>
                </Fld>
                <Fld label="Card colour">
                  <div style={{ display: 'flex', gap: 8 }}>
                    {PLAN_COLORS.map(c => (
                      <div key={c} onClick={() => setPlan('color', c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: plan.color === c ? '2px solid white' : '2px solid transparent' }} />
                    ))}
                  </div>
                </Fld>
                <div style={divider} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
                  <span>Mark as <strong style={{ color: '#fff' }}>popular</strong> (shows a “Most Popular” badge)</span>
                  <label style={{ position: 'relative', width: 36, height: 20, cursor: 'pointer', flexShrink: 0 }}>
                    <input type="checkbox" checked={!!plan.popular} onChange={e => setPlan('popular', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <div style={{ position: 'absolute', inset: 0, background: plan.popular ? '#C9A84C' : 'rgba(255,255,255,0.18)', borderRadius: 20, transition: 'background 0.25s' }}>
                      <div style={{ position: 'absolute', width: 13, height: 13, left: plan.popular ? 20 : 3, top: 3.5, background: 'white', borderRadius: '50%', transition: 'left 0.25s' }} />
                    </div>
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  <span>Visible during registration</span>
                  <label style={{ position: 'relative', width: 36, height: 20, cursor: 'pointer', flexShrink: 0 }}>
                    <input type="checkbox" checked={!!plan.active} onChange={e => setPlan('active', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <div style={{ position: 'absolute', inset: 0, background: plan.active ? ACC : 'rgba(255,255,255,0.18)', borderRadius: 20, transition: 'background 0.25s' }}>
                      <div style={{ position: 'absolute', width: 13, height: 13, left: plan.active ? 20 : 3, top: 3.5, background: 'white', borderRadius: '50%', transition: 'left 0.25s' }} />
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

        ) : tab === 'registration' ? (

          /* ── REGISTRATION SETTINGS ─────────────────────────────────────── */
          <div style={{ maxWidth: 560 }}>
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>Membership registration form</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 12 }}>
                Built in the Form Builder and linked here — same pattern as course registration forms.
                Users fill this form on the join page, then choose a plan, accept terms, and pay.
                The form's own <strong>display mode</strong> (single page or multi-step) controls how its fields are presented.
              </div>
              <Fld label="Linked Form">
                <AdminSelect
                  value={config.registrationFormId || ''}
                  onChange={e => persistConfig({ ...config, registrationFormId: e.target.value })}
                  options={[
                    { value: '', label: '— No form (plan selection only) —' },
                    ...forms.map(f => ({ value: f.id, label: f.title || 'Untitled' })),
                  ]}
                  style={{ width: '100%' }}
                />
              </Fld>
            </div>

            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>Join page</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 12 }}>
                Public link where users register and pick their plan. Course pages send non-members here automatically.
              </div>
              <button onClick={copyJoinLink} style={{ background: copied ? 'rgba(46,204,113,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${copied ? 'rgba(46,204,113,0.5)' : 'rgba(255,255,255,0.15)'}`, borderRadius: 8, color: copied ? '#2ECC71' : 'white', padding: '9px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {copied ? '✓ Copied!' : '🔗 Copy join link'}
              </button>
            </div>

            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>Membership discount (all packages)</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 12 }}>
                One discount applied to <strong>every</strong> package. When above 0, users see the original price
                struck through with the discounted price shown prominently. Leave at 0 for no discount.
              </div>
              <Fld label="Discount (%) — 0 = none">
                <input type="number" min={0} max={90} style={inp({ maxWidth: 160 })} value={config.discount || 0}
                  onChange={e => persistConfig({ ...config, discount: Math.max(0, Math.min(90, Number(e.target.value))) })} />
              </Fld>
            </div>

            <div style={{ ...card, background: 'rgba(52,152,219,0.06)', border: '1px solid rgba(52,152,219,0.2)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
                <strong style={{ color: '#3498DB' }}>How pricing is shown</strong><br />
                During registration users see each package's name, tagline, what's included, and its
                <strong style={{ color: 'white' }}> price and duration</strong>. Any discount is
                applied to the displayed price, and the final amount is confirmed on the summary step before payment.
              </div>
            </div>
          </div>

        ) : (

          /* ── MEMBERS ───────────────────────────────────────────────────── */
          <div style={{ maxWidth: 920 }}>
            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <input
                style={inp({ maxWidth: 240, marginBottom: 0 })}
                placeholder="Search name, email, group…"
                value={memberQuery}
                onChange={e => setMemberQuery(e.target.value)}
              />
              <AdminSelect value={planFilter} onChange={e => setPlanFilter(e.target.value)} options={[{ value: 'all', label: 'All plans' }, ...plans.map(p => ({ value: p.id, label: p.name }))]} style={{ minWidth: 150 }} />
              {[{ k: 'all', t: 'Everyone' }, { k: 'individual', t: 'Individuals' }, { k: 'group', t: 'Groups' }].map(o => (
                <button key={o.k} onClick={() => setJoinFilter(o.k)} style={{ border: `1.5px solid ${joinFilter === o.k ? ACC : 'rgba(255,255,255,0.15)'}`, background: joinFilter === o.k ? `${ACC}22` : 'transparent', color: joinFilter === o.k ? '#fff' : 'rgba(255,255,255,0.6)', borderRadius: 20, padding: '7px 13px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{o.t}</button>
              ))}
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>{visibleMembers.length} shown</span>
            </div>
            {visibleMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>No members{(memberQuery || planFilter !== 'all' || joinFilter !== 'all') ? ' match your filters' : ' yet'}
              </div>
            ) : (
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1.3fr 0.9fr 1.1fr 140px', gap: 0, background: 'rgba(255,255,255,0.05)', padding: '8px 14px', fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                  <span>Member</span><span>Plan</span><span>Joined as</span><span>Status</span><span>Expires</span><span />
                </div>
                {visibleMembers.map(m => {
                  const grp = groupOf(m)
                  return (
                  <div key={m.email} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1.3fr 0.9fr 1.1fr 140px', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 11 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.name || m.email.split('@')[0]}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{m.email}</div>
                    </div>
                    <span>{m.planName || '—'}</span>
                    <span>
                      {grp
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 8, fontWeight: 800, background: 'rgba(8,145,178,0.2)', color: '#67e8f9', borderRadius: 10, padding: '2px 7px' }}>GROUP</span><span style={{ color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={grp.orgName}>{grp.orgName}</span></span>
                        : <span style={{ fontSize: 8, fontWeight: 800, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '2px 7px' }}>INDIVIDUAL</span>}
                    </span>
                    <span style={{ color: m.active ? '#34d399' : '#f87171', fontWeight: 700 }}>{m.active ? 'Active' : (m.status !== 'active' ? 'Disabled' : 'Expired')}</span>
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>{m.expiresAt ? new Date(m.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Lifetime'}</span>
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                      <button onClick={() => changeExpiry(m)} title="Change expiry" style={{ background: 'rgba(52,152,219,0.15)', border: 'none', borderRadius: 6, color: '#74b9e8', fontSize: 9, fontWeight: 700, padding: '5px 8px', cursor: 'pointer' }}>Expiry</button>
                      <button onClick={() => toggleMemberStatus(m)} style={{ background: 'rgba(245,184,0,0.12)', border: 'none', borderRadius: 6, color: '#F5B800', fontSize: 9, fontWeight: 700, padding: '5px 8px', cursor: 'pointer' }}>{m.status === 'active' ? 'Disable' : 'Enable'}</button>
                      <button onClick={() => removeMember(m)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, color: '#f87171', fontSize: 9, fontWeight: 700, padding: '5px 8px', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
