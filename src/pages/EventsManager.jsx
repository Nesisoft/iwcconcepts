import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  uid, getAllForms, getAllEvents, saveEvent, deleteEvent,
  getMembershipPlans, notifyEventAudience,
} from '../utils/formStorage'
import {
  accessModeOf, eventAudienceFor, normalizePromoCode,
} from '../utils/access'
import { uploadToCloudinary } from '../utils/cloudinary'
import AdminSelect from '../components/AdminSelect'
import RichTextEditor from '../components/RichTextEditor'
import Loader from '../components/Loader'

const EV   = '#f59e0b'   // events accent (amber)
const EV2  = '#fbbf24'
const DARK = '#0e0a1e'

// ── Small styled helpers (self-contained, mirrors the admin look) ──────────────
function SaveStatus({ state }) {
  const map = {
    saving: { t: '⏳ Saving…',   c: '#fbbf24' },
    saved:  { t: '✓ Saved',     c: '#34d399' },
    error:  { t: '⚠ Not saved', c: '#f87171' },
  }
  const s = map[state] || map.saved
  return <span style={{ fontSize: 10, fontWeight: 700, color: s.c, background: `${s.c}1f`, border: `1px solid ${s.c}40`, borderRadius: 20, padding: '4px 10px', whiteSpace: 'nowrap' }}>{s.t}</span>
}

const STATUS_OPTS = ['draft', 'upcoming', 'open', 'closed', 'completed']
const STATUS_COLORS = { draft: '#6b7280', upcoming: '#8B5CF6', open: '#10B981', closed: '#E4600A', completed: '#3498DB' }

const inp = (extra = {}) => ({
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8, color: 'white', fontFamily: "'Montserrat',sans-serif",
  fontSize: 12, padding: '8px 11px', width: '100%', boxSizing: 'border-box', ...extra,
})
function Label({ children }) {
  return <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 4 }}>{children}</label>
}
function Fld({ label, children }) {
  return <div style={{ marginBottom: 12 }}><Label>{label}</Label>{children}</div>
}

function makeDefault() {
  return {
    id: uid(),
    title: 'New Event',
    tagline: '',
    description: '',
    courseType: 'event',
    accessMode: 'open',          // 'open' (free) | 'standalone' (paid) | 'plan' (membership)
    accessPlanId: '',
    type: 'free',
    price: 0,
    currency: 'GHS',
    promoCodes: [],              // [{ code, kind:'free'|'percent', value }]
    discount: 0,
    paystackPublicKey: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    image: null,
    registrationFormId: '',
    venue: '',
    capacity: 0,
    tags: [],
    featured: false,
    featuredOrder: 0,
    audience: { type: 'public', planIds: [], emails: [] },
    eventAccess: { mode: 'online', platform: '', link: '', passcode: '', address: '', notes: '' },
    hasPortalAccess: false,
    createdAt: new Date().toISOString(),
  }
}

export default function EventsManager() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [forms, setForms] = useState([])
  const [plans, setPlans] = useState([])
  const [selected, setSelected] = useState(null)
  const [ev, setEv] = useState(null)
  const [tab, setTab] = useState('details')
  const [tagInput, setTagInput] = useState('')
  const [inviteText, setInviteText] = useState('')
  const [promoDraft, setPromoDraft] = useState({ code: '', kind: 'percent', value: 10 })
  const [uploading, setUploading] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [saveState, setSaveState] = useState('saved')

  const saveTimerRef    = useRef(null)
  const pendingRef      = useRef(null)
  const skipAutosaveRef = useRef(false)

  const refresh = useCallback(async () => {
    setListLoading(true)
    try {
      const [es, fs, pls] = await Promise.all([getAllEvents(), getAllForms(), getMembershipPlans().catch(() => [])])
      setEvents(es); setForms(fs); setPlans(pls)
    } finally {
      setListLoading(false)
    }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  // ── Autosave ────────────────────────────────────────────────────────────────
  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null }
    const p = pendingRef.current
    if (!p) return
    pendingRef.current = null
    setSaveState('saving')
    try { await saveEvent(p); setSaveState('saved') }
    catch (e) { console.error('[EventsManager] save failed:', e); pendingRef.current = p; setSaveState('error') }
  }, [])

  useEffect(() => {
    if (!ev) return
    if (skipAutosaveRef.current) { skipAutosaveRef.current = false; return }
    pendingRef.current = ev
    setSaveState('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushSave, 800)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [ev, flushSave])

  useEffect(() => {
    const onBeforeUnload = () => { if (pendingRef.current) saveEvent(pendingRef.current) }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (pendingRef.current) saveEvent(pendingRef.current)
    }
  }, [])

  function set(k, v) { setEv(p => ({ ...p, [k]: v })) }
  const evAccess = ev?.eventAccess || { mode: 'online', platform: '', link: '', passcode: '', address: '', notes: '' }
  const setEvAccess = (k, v) => set('eventAccess', { ...evAccess, [k]: v })

  // ── Access model → audience translation ───────────────────────────────────────
  // Keep the persisted `audience` object in sync with the chosen mode so the
  // existing server visibility engine keeps working untouched.
  function applyAccess(next) {
    const merged = { ...ev, ...next }
    const mode = merged.accessMode || 'open'
    merged.type = mode === 'standalone' ? 'paid' : 'free'
    const emails = (merged.audience?.emails) || []
    merged.audience = eventAudienceFor(mode, merged.accessPlanId, plans, emails)
    setEv(merged)
  }
  function chooseMode(mode) { applyAccess({ accessMode: mode }) }
  function choosePlan(planId) { applyAccess({ accessPlanId: planId }) }
  function setInvites(text) {
    setInviteText(text)
    const emails = text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
    // Recompute the whole audience from the current mode so invites merge cleanly
    // (membership keeps its plan tiers; free/paid stay public + invited people).
    setEv(p => ({ ...p, audience: eventAudienceFor(accessModeOf(p), p.accessPlanId, plans, emails) }))
  }
  function addPromo() {
    const p = normalizePromoCode(promoDraft)
    if (!p.code) return
    const exists = (ev.promoCodes || []).some(x => x.code === p.code)
    set('promoCodes', exists ? ev.promoCodes.map(x => x.code === p.code ? p : x) : [...(ev.promoCodes || []), p])
    setPromoDraft({ code: '', kind: 'percent', value: 10 })
  }
  function removePromo(code) { set('promoCodes', (ev.promoCodes || []).filter(x => x.code !== code)) }

  function selectEvent(e) {
    skipAutosaveRef.current = true
    setSelected(e.id)
    setEv({ ...e })
    setInviteText((e.audience?.emails || []).join('\n'))
    setTab('details'); setSaveState('saved')
  }
  async function create() {
    const e = makeDefault()
    await saveEvent(e)
    await refresh()
    skipAutosaveRef.current = true
    setEv(e); setSelected(e.id); setInviteText(''); setTab('details'); setSaveState('saved')
  }
  async function handleDelete(id) {
    if (!confirm('Delete this event?')) return
    await deleteEvent(id); await refresh()
    if (selected === id) { setSelected(null); setEv(null) }
  }
  async function notifyAudience() {
    if (!ev) return
    const kind = ev.lastNotifiedAt ? 'updated' : 'created'
    const who = accessModeOf(ev) === 'plan' ? 'its plan tiers and invited people' : 'all active members'
    if (!confirm(`Announce "${ev.title}" to ${who} now?\n\nThey'll get an email and a portal notification.`)) return
    setNotifying(true)
    try {
      const r = await notifyEventAudience(ev.id, kind)
      set('lastNotifiedAt', new Date().toISOString())
      alert(`✅ Sent to ${r.recipients} recipient${r.recipients !== 1 ? 's' : ''} (${r.sent} email${r.sent !== 1 ? 's' : ''} delivered).`)
    } catch (e) { alert('Could not send: ' + e.message) }
    finally { setNotifying(false) }
  }
  async function handleImageUpload(e) {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try { set('image', await uploadToCloudinary(file, { maxPx: 1200, quality: 0.82 })) }
    finally { setUploading(false); e.target.value = '' }
  }

  const onboardUrl = ev ? `${window.location.href.split('#')[0]}#/onboard?courseId=${ev.id}` : ''
  const mode = ev ? accessModeOf(ev) : 'open'
  const panelStyle = { background: '#130a24', height: '100%', overflowY: 'auto', padding: 16 }
  const tabBtn = (t) => ({ padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', borderBottom: tab === t ? `2px solid ${EV}` : '2px solid transparent', background: 'transparent', color: tab === t ? EV2 : 'rgba(255,255,255,0.45)' })
  const divider = { height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${EV}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${EV},${EV2})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎪</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Events Manager</div>
              <div style={{ fontSize: 8, color: EV, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{events.length} event{events.length !== 1 ? 's' : ''}</span>
          {ev && <SaveStatus state={saveState} />}
          <button onClick={flushSave} disabled={!ev || saveState === 'saving'} style={{ background: !ev ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg,${EV},#c2700a)`, border: 'none', borderRadius: 7, color: 'white', padding: '7px 16px', fontSize: 11, fontWeight: 800, cursor: (!ev || saveState === 'saving') ? 'not-allowed' : 'pointer', opacity: !ev ? 0.5 : 1 }}>
            {saveState === 'saving' ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Left list */}
        <div style={{ ...panelStyle, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={create} style={{ width: '100%', background: `linear-gradient(135deg,${EV},#c2700a)`, border: 'none', borderRadius: 8, color: 'white', padding: '10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>+ New Event</button>
          <div style={divider} />
          {listLoading && events.length === 0 && <Loader label="Loading events…" accent={EV2} style={{ padding: '34px 0' }} />}
          {!listLoading && events.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎪</div>No events yet
            </div>
          )}
          {events.map(e => {
            const active = e.id === selected
            const m = accessModeOf(e)
            const accColor = m === 'plan' ? '#b79df0' : m === 'standalone' ? EV2 : '#34d399'
            return (
              <div key={e.id} onClick={() => selectEvent(e)} style={{ background: active ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? EV : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? EV2 : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{e.title}</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: `${STATUS_COLORS[e.status] || '#6b7280'}30`, color: STATUS_COLORS[e.status] || '#6b7280', letterSpacing: 1, textTransform: 'uppercase' }}>{e.status}</span>
                  <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: `${accColor}26`, color: accColor, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {m === 'plan' ? '🎫 Members' : m === 'standalone' ? `GHS ${e.price || 0}` : 'FREE'}
                  </span>
                  {(e.audience?.type === 'restricted') && <span style={{ fontSize: 8 }}>🔒</span>}
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                  <button onClick={evt => { evt.stopPropagation(); window.open(`${window.location.href.split('#')[0]}#/onboard?courseId=${e.id}`, '_blank') }} style={{ flex: 1, background: 'rgba(52,152,219,0.15)', border: 'none', borderRadius: 6, color: '#74b9e8', fontSize: 9, fontWeight: 700, padding: '5px', cursor: 'pointer' }}>Preview</button>
                  <button onClick={evt => { evt.stopPropagation(); handleDelete(e.id) }} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, color: '#f87171', fontSize: 9, fontWeight: 700, padding: '5px 8px', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right editor */}
        {!ev ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'rgba(255,255,255,0.25)', gap: 12 }}>
            <div style={{ fontSize: 52 }}>🎪</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Select an event to edit</div>
            <div style={{ fontSize: 11 }}>or create a new one</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ background: '#1a0e30', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 800 }}>{ev.title}</div>
              <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: `${STATUS_COLORS[ev.status]}30`, color: STATUS_COLORS[ev.status], letterSpacing: 1, textTransform: 'uppercase' }}>{ev.status}</span>
            </div>

            <div style={{ background: '#160c28', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', padding: '0 20px', flexShrink: 0, flexWrap: 'wrap' }}>
              {['details', 'access', 'join', 'registration', 'publish'].map(t => (
                <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}>{t === 'join' ? 'Join Details' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#0e0a1e' }}>
              <div style={{ maxWidth: 600 }}>

                {/* DETAILS */}
                {tab === 'details' && (
                  <>
                    <Fld label="Event Title"><input style={inp()} value={ev.title} onChange={e => set('title', e.target.value)} /></Fld>
                    <Fld label="Tagline (short subtitle on the card)"><input style={inp()} value={ev.tagline} onChange={e => set('tagline', e.target.value)} placeholder="e.g. A live masterclass on faith & business" /></Fld>
                    <Fld label="Description">
                      <RichTextEditor dark value={ev.description || ''} onChange={v => set('description', v)} placeholder="Full event description…" minRows={5} />
                    </Fld>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Fld label="Start Date"><input type="datetime-local" style={inp()} value={ev.startDate} onChange={e => set('startDate', e.target.value)} /></Fld>
                      <Fld label="End Date (optional)"><input type="datetime-local" style={inp()} value={ev.endDate} onChange={e => set('endDate', e.target.value)} /></Fld>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Fld label="Venue / Location"><input style={inp()} value={ev.venue} onChange={e => set('venue', e.target.value)} placeholder="Online / Accra, Ghana" /></Fld>
                      <Fld label="Capacity (0 = unlimited)"><input type="number" style={inp()} min={0} value={ev.capacity} onChange={e => set('capacity', Number(e.target.value))} /></Fld>
                    </div>
                    <Fld label="Tags">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                        {(ev.tags || []).map(tag => (
                          <span key={tag} style={{ background: `${EV}20`, border: `1px solid ${EV}40`, borderRadius: 5, padding: '3px 8px', fontSize: 10, color: EV2, display: 'flex', alignItems: 'center', gap: 5 }}>
                            {tag} <span onClick={() => set('tags', ev.tags.filter(t => t !== tag))} style={{ cursor: 'pointer', opacity: 0.7 }}>✕</span>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input style={inp({ flex: 1 })} value={tagInput} placeholder="Add tag…" onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { set('tags', [...(ev.tags || []), tagInput.trim()]); setTagInput('') } }} />
                        <button onClick={() => { if (tagInput.trim()) { set('tags', [...(ev.tags || []), tagInput.trim()]); setTagInput('') } }} style={{ background: EV, border: 'none', borderRadius: 6, color: 'white', padding: '0 12px', cursor: 'pointer', fontWeight: 700 }}>+</button>
                      </div>
                    </Fld>
                    <div style={divider} />
                    <Label>Event Image</Label>
                    {ev.image ? (
                      <div style={{ position: 'relative', marginBottom: 12 }}>
                        <img src={ev.image} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', display: 'block' }} />
                        <button onClick={() => set('image', null)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', width: 24, height: 24, fontSize: 12 }}>✕</button>
                      </div>
                    ) : (
                      <label style={{ display: 'block', border: `2px dashed ${EV}66`, borderRadius: 10, padding: '20px', textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', background: `${EV}0d`, marginBottom: 12, opacity: uploading ? 0.6 : 1 }}>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                        <div style={{ fontSize: 28, marginBottom: 6 }}>{uploading ? '⏳' : '🖼️'}</div>
                        <div style={{ fontSize: 11, color: EV2, fontWeight: 700 }}>{uploading ? 'Uploading…' : 'Click to upload event image'}</div>
                      </label>
                    )}
                  </>
                )}

                {/* ACCESS */}
                {tab === 'access' && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <Label>How do people get access to this event?</Label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {[
                          { v: 'open',       icon: '🌐', t: 'Free',       d: 'Anyone can attend, free of charge.' },
                          { v: 'plan',       icon: '🎫', t: 'Membership', d: 'A plan tier and every tier above it.' },
                          { v: 'standalone', icon: '🎟️', t: 'Paid',       d: 'A one-time ticket (checkout in the next step).' },
                        ].map(o => (
                          <div key={o.v} onClick={() => chooseMode(o.v)} style={{ flex: 1, border: `2px solid ${mode === o.v ? EV : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, padding: '12px 12px', cursor: 'pointer', background: mode === o.v ? `${EV}15` : 'transparent', textAlign: 'center' }}>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{o.icon}</div>
                            <div style={{ fontWeight: 800, fontSize: 12, color: mode === o.v ? EV2 : 'white' }}>{o.t}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.5 }}>{o.d}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {mode === 'plan' && (
                      <>
                        <Fld label="Visible from this plan and above">
                          <AdminSelect value={ev.accessPlanId || ''} onChange={e => choosePlan(e.target.value)} options={[{ value: '', label: '— Select a plan —' }, ...plans.map(pl => ({ value: pl.id, label: pl.name }))]} style={{ width: '100%' }} />
                        </Fld>
                        {plans.length === 0 && <div style={{ fontSize: 10, color: '#fbbf24', marginBottom: 12 }}>⚠ No plans exist yet — create them in Membership Plans first.</div>}
                        <div style={{ background: 'rgba(108,63,197,0.08)', border: '1px solid rgba(108,63,197,0.25)', borderRadius: 10, padding: 14, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
                          <strong style={{ color: '#b79df0' }}>Members of this tier — and every higher tier — see this event in their portal and get announcements. Use promo codes below to let specific outsiders in.
                          </strong>
                        </div>
                      </>
                    )}

                    {mode === 'standalone' && (
                      <>
                        <Fld label="Ticket price (GHS)"><input type="number" style={inp()} min={0} value={ev.price} onChange={e => set('price', Number(e.target.value))} /></Fld>
                        <div style={{ background: `${EV}14`, border: `1px solid ${EV}33`, borderRadius: 10, padding: 12, fontSize: 11, color: EV2, lineHeight: 1.6, marginBottom: 12 }}>
                          ⚙ Ticket checkout (Paystack) activates in the ticketing step. For now the event is publicly visible with its price shown.
                        </div>
                        <Fld label="Paystack Public Key (for ticket checkout)"><input style={inp()} value={ev.paystackPublicKey} onChange={e => set('paystackPublicKey', e.target.value)} placeholder="pk_live_xxxxxxxx" /></Fld>
                      </>
                    )}

                    {mode === 'open' && (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 1.8 }}>
                        <div style={{ fontSize: 32, marginBottom: 6 }}>🌐</div>
                        Free and open. Anyone can see it and RSVP with the registration form.
                      </div>
                    )}

                    {/* Promo codes — apply to paid & membership events */}
                    {(mode === 'standalone' || mode === 'plan') && (
                      <>
                        <div style={divider} />
                        <Label>Promo codes (let outsiders attend — free or discounted)</Label>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, lineHeight: 1.6 }}>
                          Codes are saved now; redemption at checkout/registration activates in the ticketing step.
                        </div>
                        {(ev.promoCodes || []).length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                            {ev.promoCodes.map(pc => (
                              <div key={pc.code} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: 'white', letterSpacing: 1 }}>{pc.code}</span>
                                <span style={{ fontSize: 10, color: EV2, fontWeight: 700 }}>{pc.kind === 'free' ? 'Free entry' : `${pc.value}% off`}</span>
                                <div style={{ flex: 1 }} />
                                <button onClick={() => removePromo(pc.code)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, color: '#f87171', fontSize: 10, fontWeight: 700, padding: '4px 9px', cursor: 'pointer' }}>Remove</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <input style={inp({ flex: '2 1 120px', textTransform: 'uppercase' })} value={promoDraft.code} placeholder="CODE" onChange={e => setPromoDraft(d => ({ ...d, code: e.target.value }))} />
                          <select value={promoDraft.kind} onChange={e => setPromoDraft(d => ({ ...d, kind: e.target.value }))} style={inp({ flex: '1 1 90px', cursor: 'pointer' })}>
                            <option value="percent">% off</option>
                            <option value="free">Free</option>
                          </select>
                          {promoDraft.kind === 'percent' && (
                            <input type="number" min={1} max={100} style={inp({ flex: '1 1 70px' })} value={promoDraft.value} onChange={e => setPromoDraft(d => ({ ...d, value: Number(e.target.value) }))} />
                          )}
                          <button onClick={addPromo} style={{ background: EV, border: 'none', borderRadius: 7, color: 'white', padding: '8px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Add</button>
                        </div>
                      </>
                    )}

                    {/* Invite specific people — additive allow-list, any mode */}
                    <div style={divider} />
                    <Fld label="Invite specific people by email (one per line — they get access regardless of plan)">
                      <textarea style={inp({ minHeight: 70, resize: 'vertical', lineHeight: 1.6 })} value={inviteText} placeholder={'ama@example.com\nkofi@example.com'} onChange={e => setInvites(e.target.value)} />
                    </Fld>
                  </>
                )}

                {/* JOIN DETAILS */}
                {tab === 'join' && (
                  <>
                    <Label>How do attendees join?</Label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      {[{ v: 'online', label: '💻 Online' }, { v: 'in_person', label: '📍 In person' }, { v: 'hybrid', label: '🔀 Hybrid' }].map(o => (
                        <button key={o.v} type="button" onClick={() => setEvAccess('mode', o.v)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontWeight: 700, fontSize: 11, border: `1.5px solid ${(evAccess.mode || 'online') === o.v ? EV : 'rgba(255,255,255,0.15)'}`, background: (evAccess.mode || 'online') === o.v ? `${EV}25` : 'transparent', color: (evAccess.mode || 'online') === o.v ? '#fff' : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>{o.label}</button>
                      ))}
                    </div>
                    {(evAccess.mode || 'online') !== 'in_person' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <Fld label="Platform"><input style={inp()} value={evAccess.platform || ''} onChange={e => setEvAccess('platform', e.target.value)} placeholder="Zoom / Google Meet" /></Fld>
                          <Fld label="Passcode (optional)"><input style={inp()} value={evAccess.passcode || ''} onChange={e => setEvAccess('passcode', e.target.value)} placeholder="e.g. 482913" /></Fld>
                        </div>
                        <Fld label="Meeting link"><input style={inp()} value={evAccess.link || ''} onChange={e => setEvAccess('link', e.target.value)} placeholder="https://zoom.us/j/…" /></Fld>
                      </>
                    )}
                    {(evAccess.mode || 'online') !== 'online' && (
                      <Fld label="Address / Directions"><input style={inp()} value={evAccess.address || ''} onChange={e => setEvAccess('address', e.target.value)} placeholder="e.g. IWC Hub, East Legon, Accra" /></Fld>
                    )}
                    <Fld label="Extra notes for attendees (optional)">
                      <textarea style={inp({ minHeight: 56, resize: 'vertical', lineHeight: 1.6 })} value={evAccess.notes || ''} onChange={e => setEvAccess('notes', e.target.value)} placeholder="e.g. Doors open 30 minutes early." />
                    </Fld>
                    <div style={divider} />
                    <div style={{ background: 'rgba(108,63,197,0.1)', border: '1px solid rgba(108,63,197,0.3)', borderRadius: 10, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={notifyAudience} disabled={notifying} style={{ background: notifying ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#6c3fc5,#9333ea)', border: 'none', borderRadius: 8, color: 'white', fontSize: 11, fontWeight: 800, padding: '10px 18px', cursor: notifying ? 'not-allowed' : 'pointer' }}>
                          {notifying ? '⏳ Sending…' : `📣 ${ev.lastNotifiedAt ? 'Send update to audience' : 'Announce to audience'}`}
                        </button>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', flex: 1, minWidth: 160, lineHeight: 1.6 }}>
                          Emails everyone who can access it and adds a portal notification.
                          {ev.lastNotifiedAt && <><br />Last announced: {new Date(ev.lastNotifiedAt).toLocaleString('en-GB')}</>}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* REGISTRATION */}
                {tab === 'registration' && (
                  <>
                    <Fld label="Linked RSVP / Registration Form">
                      <AdminSelect value={ev.registrationFormId} onChange={e => set('registrationFormId', e.target.value)} options={[{ value: '', label: '— Select a form —' }, ...forms.map(f => ({ value: f.id, label: f.title || 'Untitled' }))]} style={{ width: '100%' }} />
                    </Fld>
                    {!ev.registrationFormId && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Pick a form built in the Form Builder for attendees to RSVP.</div>}
                  </>
                )}

                {/* PUBLISH */}
                {tab === 'publish' && (
                  <>
                    <Fld label="Status">
                      <AdminSelect value={ev.status} onChange={e => set('status', e.target.value)} options={STATUS_OPTS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} style={{ width: '100%' }} />
                    </Fld>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginBottom: 16 }}>
                      <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Draft</strong> — hidden · <strong style={{ color: '#8B5CF6' }}>Upcoming</strong> — visible, RSVP not open · <strong style={{ color: '#10B981' }}>Open</strong> — RSVP active · <strong style={{ color: '#E4600A' }}>Closed</strong> — RSVP ended · <strong style={{ color: '#3498DB' }}>Completed</strong> — past
                    </div>
                    <div style={divider} />
                    <Label>Event registration link</Label>
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', fontSize: 10, color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all', marginBottom: 8, lineHeight: 1.6 }}>{onboardUrl}</div>
                    <button onClick={() => { navigator.clipboard?.writeText(onboardUrl) }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 11, fontWeight: 700, padding: '9px 16px', cursor: 'pointer' }}>📋 Copy Link</button>
                  </>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
