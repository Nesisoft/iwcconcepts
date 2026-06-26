import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGroupTrainings, createGroupTraining, saveGroupTraining, deleteGroupTraining, sendGroupTraining, getMembershipPlans } from '../utils/formStorage'
import AdminSelect from '../components/AdminSelect'
import ConfirmModal from '../components/ConfirmModal'
import { ArrowLeft, Building2, Trash2, Copy, Check, Plus, Send, X, Mail } from 'lucide-react'

const ACC  = '#0891b2'
const DARK = '#0e0a1e'

const STATUS = {
  requested: { c: '#fbbf24', label: 'Requested' },
  active:    { c: '#34d399', label: 'Active' },
  closed:    { c: '#9ca3af', label: 'Closed' },
}

function fmtDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '—' }
}

// Turn a sendGroupTraining() result into a human warning when the email didn't go out.
function emailIssue(res, to) {
  if (!res || res.emailed) return null
  switch (res.reason) {
    case 'no_api_key':
    case 'no_sender':
    case 'skipped':
      return `Could not email ${to || 'the organization'} — email (Resend) isn’t configured yet. The link is ready; copy it and share it manually for now.`
    case 'no_recipient':
      return 'This request has no organization email to send to.'
    case 'error':
      return 'The email provider rejected the message' + (res.detail ? ` (${res.detail})` : '') + '.'
    default:
      return 'The email could not be delivered.'
  }
}

const blankNew = () => ({ orgName: '', contactName: '', email: '', phone: '', staffCount: '', customAreas: '', message: '' })

export default function GroupTrainingAdmin() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [nf, setNf] = useState(blankNew())
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmState, setConfirmState] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [g, pls] = await Promise.all([getGroupTrainings(), getMembershipPlans().catch(() => [])])
      setGroups(g || []); setPlans(pls || [])
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const setN = (k, v) => setNf(d => ({ ...d, [k]: v }))
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nf.email)
  const canCreate = nf.orgName.trim() && validEmail

  function openCreate() { setNf(blankNew()); setMsg(''); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function closeForm() { setNf(blankNew()); setShowForm(false) }

  async function create() {
    if (!canCreate) return
    setCreating(true); setMsg('')
    try {
      await createGroupTraining({ ...nf, staffCount: Number(nf.staffCount) || 0 })
      await load()
      closeForm()
      setMsg(`✅ Added ${nf.orgName}. Set the plan, seats & duration below, then activate to generate the join link.`)
    } catch (e) { setMsg('⚠ ' + e.message) } finally { setCreating(false) }
  }

  function requestDelete(group) {
    setConfirmState({
      title: 'Delete group request?',
      message: `Delete the training request from ${group.orgName}? This can’t be undone.`,
      confirmLabel: 'Delete', danger: true,
      onConfirm: async () => { setConfirmState(null); try { await deleteGroupTraining(group.id); await load() } catch (e) { setMsg('⚠ ' + e.message) } },
    })
  }

  const inp = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 12, padding: '9px 11px', fontFamily: 'inherit', outline: 'none' }
  const lbl = { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }
  const isWarn = msg.startsWith('⚠')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={13} /> Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#06b6d4)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={18} color="white" /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Group Training</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: 'white', padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{groups.length} training{groups.length === 1 ? '' : 's'}</div>
            {!showForm && <button onClick={openCreate} style={{ background: `linear-gradient(135deg,${ACC},#06b6d4)`, border: 'none', borderRadius: 9, color: 'white', padding: '9px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}><Plus size={14} /> Create group training</button>}
          </div>

          {/* Status banner */}
          {msg && <div style={{ marginBottom: 14, fontSize: 12.5, fontWeight: 600, padding: '11px 14px', borderRadius: 10, lineHeight: 1.5, background: isWarn ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)', border: `1px solid ${isWarn ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`, color: isWarn ? '#fca5a5' : '#6ee7b7' }}>{msg.replace(/^⚠ /, '').replace(/^✅ /, '')}</div>}

          {/* Create form */}
          {showForm && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>New group / organization training</div>
                <button onClick={closeForm} title="Close" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, color: 'rgba(255,255,255,0.6)', padding: '5px 7px', cursor: 'pointer' }}><X size={14} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Organization name *</label><input style={inp} value={nf.orgName} onChange={e => setN('orgName', e.target.value)} placeholder="e.g. Acme Ltd" /></div>
                <div><label style={lbl}>Organization email *</label><input style={inp} type="email" value={nf.email} onChange={e => setN('email', e.target.value)} placeholder="hr@acme.com" /></div>
                <div><label style={lbl}>Contact person</label><input style={inp} value={nf.contactName} onChange={e => setN('contactName', e.target.value)} placeholder="e.g. Jane Mensah" /></div>
                <div><label style={lbl}>Phone</label><input style={inp} value={nf.phone} onChange={e => setN('phone', e.target.value)} placeholder="+233…" /></div>
                <div><label style={lbl}>Staff to train</label><input style={inp} type="number" min={0} value={nf.staffCount} onChange={e => setN('staffCount', e.target.value)} placeholder="e.g. 20" /></div>
                <div><label style={lbl}>Training focus / areas</label><input style={inp} value={nf.customAreas} onChange={e => setN('customAreas', e.target.value)} placeholder="e.g. Leadership, Sales" /></div>
              </div>
              <div style={{ marginTop: 10 }}><label style={lbl}>Notes (optional)</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 54 }} value={nf.message} onChange={e => setN('message', e.target.value)} placeholder="Anything the team should know about this request…" /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                <div style={{ flex: 1 }} />
                <button onClick={closeForm} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.7)', padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button onClick={create} disabled={!canCreate || creating} style={{ background: (canCreate && !creating) ? `linear-gradient(135deg,${ACC},#06b6d4)` : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', padding: '9px 20px', fontSize: 12, fontWeight: 800, cursor: (canCreate && !creating) ? 'pointer' : 'not-allowed' }}>{creating ? 'Adding…' : 'Add training'}</button>
              </div>
            </div>
          )}

          {loading && <div style={{ textAlign: 'center', padding: '70px 0', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>}
          {error && !loading && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 18px', color: '#f87171', fontSize: 13 }}>{error}</div>}
          {!loading && !error && groups.length === 0 && !showForm && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
              <Building2 size={42} color="rgba(255,255,255,0.2)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 700 }}>No group trainings yet.</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Requests from the public “Train Your Team” page appear here, or create one above.</div>
              <button onClick={openCreate} style={{ marginTop: 16, background: `linear-gradient(135deg,${ACC},#06b6d4)`, border: 'none', borderRadius: 9, color: 'white', padding: '9px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}><Plus size={14} /> Create group training</button>
            </div>
          )}
          {!loading && !error && groups.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {groups.map(g => <GroupCard key={g.id} group={g} plans={plans} onChanged={load} onDelete={requestDelete} />)}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal open={!!confirmState} {...(confirmState || {})} onCancel={() => setConfirmState(null)} />
    </div>
  )
}

function GroupCard({ group, plans, onChanged, onDelete }) {
  const [draft, setDraft] = useState({
    planId: group.planId || '', seats: group.seats ?? group.staffCount ?? 0,
    durationDays: group.durationDays ?? 90, amount: group.amount ?? 0,
    packageLabel: group.packageLabel || '', adminNotes: group.adminNotes || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const s = STATUS[group.status] || STATUS.requested
  const joinLink = group.accessCode ? `${window.location.origin}/#/group-join?code=${group.accessCode}` : ''
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  async function persist(status) {
    setSaving(true); setMsg('')
    try {
      await saveGroupTraining({ id: group.id, ...draft, currency: group.currency || 'GHS', ...(status ? { status } : {}) })
      setMsg(status === 'active' ? '✅ Activated — email or copy the join link below.' : status === 'closed' ? 'Closed.' : 'Saved.')
      onChanged()
    } catch (e) { setMsg('⚠ ' + e.message) } finally { setSaving(false) }
  }

  async function emailOrg() {
    setSaving(true); setMsg('')
    try {
      const res = await sendGroupTraining(group.id)
      if (res?.emailed) setMsg(`✅ Join link emailed to ${group.email}.`)
      else setMsg('⚠ ' + emailIssue(res, group.email))
    } catch (e) { setMsg('⚠ ' + e.message) } finally { setSaving(false) }
  }

  const inp = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 12, padding: '8px 10px', fontFamily: 'inherit', outline: 'none' }
  const lbl = { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }
  const isWarn = msg.startsWith('⚠')

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{group.orgName}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
            {group.contactName || '—'} · <a href={`mailto:${group.email}`} style={{ color: '#74b9e8', textDecoration: 'none' }}>{group.email}</a>{group.phone ? ` · ${group.phone}` : ''}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Requested {fmtDate(group.createdAt)} · {group.staffCount || '?'} staff{group.createdByAdmin ? ' · added by admin' : ''}</div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: `${s.c}22`, color: s.c, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</span>
      </div>

      {(group.areas?.length > 0 || group.customAreas) && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {(group.areas || []).map(a => <span key={a} style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '2px 9px', color: 'rgba(255,255,255,0.7)' }}>{a}</span>)}
          {group.customAreas && <span style={{ fontSize: 10, background: 'rgba(201,168,76,0.15)', borderRadius: 12, padding: '2px 9px', color: '#e8c060' }}>+ {group.customAreas}</span>}
        </div>
      )}
      {group.message && <div style={{ marginTop: 8, fontSize: 11.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontStyle: 'italic' }}>“{group.message}”</div>}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />

      {/* Package / activation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={lbl}>Membership plan (courses staff get)</label>
          <AdminSelect value={draft.planId} onChange={e => set('planId', e.target.value)} options={[{ value: '', label: '— Select plan —' }, ...plans.map(p => ({ value: p.id, label: p.name }))]} style={{ width: '100%' }} />
        </div>
        <div><label style={lbl}>Seats (max staff)</label><input style={inp} type="number" min={0} value={draft.seats} onChange={e => set('seats', Number(e.target.value))} /></div>
        <div><label style={lbl}>Training length (days)</label><input style={inp} type="number" min={0} value={draft.durationDays} onChange={e => set('durationDays', Number(e.target.value))} /></div>
        <div><label style={lbl}>Amount paid (GHS)</label><input style={inp} type="number" min={0} value={draft.amount} onChange={e => set('amount', Number(e.target.value))} /></div>
        <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Package label / internal notes</label><input style={inp} value={draft.packageLabel} onChange={e => set('packageLabel', e.target.value)} placeholder="e.g. Corporate — 20 seats, 3 months" /></div>
      </div>

      {group.status === 'active' && group.accessCode && (
        <div style={{ marginTop: 12, background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.3)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Staff join link · {group.registered ?? 0}/{group.seats} registered · ends {fmtDate(group.expiresAt)}{group.linkSentAt ? ` · emailed ${fmtDate(group.linkSentAt)}` : ''}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ flex: 1, fontSize: 11, color: '#67e8f9', wordBreak: 'break-all' }}>{joinLink}</code>
            <button onClick={() => { navigator.clipboard?.writeText(joinLink); setCopied(true); setTimeout(() => setCopied(false), 1500) }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: copied ? '#34d399' : 'rgba(255,255,255,0.8)', padding: '6px 9px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}</button>
          </div>
          <button onClick={emailOrg} disabled={saving} style={{ marginTop: 10, background: `linear-gradient(135deg,${ACC},#06b6d4)`, border: 'none', borderRadius: 7, color: 'white', padding: '8px 14px', fontSize: 11, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Mail size={13} /> {group.linkSentAt ? 'Re-email join link to organization' : 'Email join link to organization'}</button>
        </div>
      )}

      <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => persist()} disabled={saving} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', padding: '8px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Save</button>
        {group.status !== 'active' && <button onClick={() => persist('active')} disabled={saving} style={{ background: `linear-gradient(135deg,${ACC},#06b6d4)`, border: 'none', borderRadius: 8, color: 'white', padding: '8px 16px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Activate & generate link</button>}
        {group.status === 'active' && <button onClick={() => persist('closed')} disabled={saving} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fbbf24', padding: '8px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Close training</button>}
        <div style={{ flex: 1 }} />
        <button onClick={() => onDelete(group)} title="Delete" style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 8, color: '#f87171', padding: '8px 10px', cursor: 'pointer' }}><Trash2 size={13} /></button>
      </div>
      {msg && <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 600, lineHeight: 1.5, color: isWarn ? '#f87171' : '#34d399' }}>{msg.replace(/^⚠ /, '').replace(/^✅ /, '')}</div>}
    </div>
  )
}
