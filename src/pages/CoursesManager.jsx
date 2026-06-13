import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uid, getAllForms, getAllCourses, saveCourse, deleteCourse, getMembershipPlans, notifyEventAudience } from '../utils/formStorage'
import { uploadToCloudinary } from '../utils/cloudinary'
import AdminSelect from '../components/AdminSelect'
import RichTextEditor from '../components/RichTextEditor'
import Loader from '../components/Loader'

const ACC = '#E4600A'
const ACC2 = '#F5B800'
const DARK = '#0e0a1e'

// ── Save-status pill ─────────────────────────────────────────────────────────
function SaveStatus({ state }) {
  const map = {
    saving: { t: '⏳ Saving…',   c: '#fbbf24', b: 'rgba(245,158,11,0.12)' },
    saved:  { t: '✓ Saved',     c: '#34d399', b: 'rgba(16,185,129,0.12)' },
    error:  { t: '⚠ Not saved', c: '#f87171', b: 'rgba(239,68,68,0.12)' },
  }
  const s = map[state] || map.saved
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: s.c, background: s.b, border: `1px solid ${s.c}40`, borderRadius: 20, padding: '4px 10px', whiteSpace: 'nowrap' }}>
      {s.t}
    </span>
  )
}

const STATUS_OPTS = ['draft', 'upcoming', 'open', 'closed', 'completed']
const STATUS_COLORS = { draft: '#6b7280', upcoming: '#8B5CF6', open: '#10B981', closed: '#E4600A', completed: '#3498DB' }

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
function Toggle({ label, checked, onChange }) {
  const C = '#E4600A'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
      <span>{label}</span>
      <label style={{ position: 'relative', width: 36, height: 20, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: checked ? C : 'rgba(255,255,255,0.18)', borderRadius: 20, transition: 'background 0.25s' }}>
          <div style={{ position: 'absolute', width: 13, height: 13, left: checked ? 20 : 3, top: 3.5, background: 'white', borderRadius: '50%', transition: 'left 0.25s' }} />
        </div>
      </label>
    </div>
  )
}

function makeDefault() {
  return {
    id: uid(),
    title: 'New Course',
    tagline: '',
    description: '',
    courseType: 'course',
    type: 'free',
    price: 0,
    discount: 0,
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
    onboardingMode: 'steps',
    paystackPublicKey: '',
    hasPortalAccess: false,
    awardsCertificate: false,
    duration: '',
    accessMode: 'open',                                       // 'open' | 'plan' | 'legacy'
    accessPlanId: '',                                         // when accessMode === 'plan'
    audience: { type: 'public', planIds: [], emails: [] },    // events: who can see it
    eventAccess: { mode: 'online', platform: '', link: '', passcode: '', address: '', notes: '' },
    createdAt: new Date().toISOString(),
  }
}

export default function CoursesManager() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [forms, setForms] = useState([])
  const [plans, setPlans] = useState([])
  const [selected, setSelected] = useState(null)
  const [prog, setProg] = useState(null)
  const [tab, setTab] = useState('details')
  const [tagInput, setTagInput] = useState('')
  const [inviteText, setInviteText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [saveState, setSaveState] = useState('saved')   // 'saving' | 'saved' | 'error'
  const [shortLink, setShortLink] = useState('')
  const [shortLoading, setShortLoading] = useState(false)

  // Refs backing the reliable-autosave logic
  const saveTimerRef    = useRef(null)
  const pendingRef      = useRef(null)
  const skipAutosaveRef = useRef(false)

  const refresh = useCallback(async () => {
    setListLoading(true)
    try {
      const [ps, fs, pls] = await Promise.all([getAllCourses(), getAllForms(), getMembershipPlans().catch(() => [])])
      setCourses(ps)
      setForms(fs)
      setPlans(pls)
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // ── Reliable autosave ──────────────────────────────────────────────────────
  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null }
    const p = pendingRef.current
    if (!p) return
    pendingRef.current = null
    setSaveState('saving')
    try {
      await saveCourse(p)
      setSaveState('saved')
    } catch (e) {
      console.error('[CoursesManager] save failed:', e)
      pendingRef.current = p
      setSaveState('error')
    }
  }, [])

  useEffect(() => {
    if (!prog) return
    if (skipAutosaveRef.current) { skipAutosaveRef.current = false; return }
    pendingRef.current = prog
    setSaveState('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushSave, 800)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [prog, flushSave])

  // Flush a pending save on navigation / tab close instead of dropping it
  useEffect(() => {
    const onBeforeUnload = () => { if (pendingRef.current) saveCourse(pendingRef.current) }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (pendingRef.current) saveCourse(pendingRef.current)
    }
  }, [])

  function set(k, v) { setProg(p => ({ ...p, [k]: v })) }

  // Event audience / access helpers
  const aud      = prog?.audience    || { type: 'public', planIds: [], emails: [] }
  const evAccess = prog?.eventAccess || { mode: 'online', platform: '', link: '', passcode: '', address: '', notes: '' }
  const setAud      = (k, v) => set('audience',    { ...aud,      [k]: v })
  const setEvAccess = (k, v) => set('eventAccess', { ...evAccess, [k]: v })

  function selectCourse(p) {
    skipAutosaveRef.current = true
    setSelected(p.id)
    setProg({ ...p })
    setInviteText((p.audience?.emails || []).join('\n'))
    setTab('details')
    setSaveState('saved')
    setShortLink('')
  }

  async function generateShortLink() {
    if (!prog) return
    // Public registration / onboarding page for this course or event
    const base = window.location.href.split('#')[0]
    const url = `${base}#/onboard?courseId=${prog.id}`
    setShortLoading(true)
    try {
      const res = await fetch(`/api/shorten?url=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (json.shorturl) {
        setShortLink(json.shorturl)
        try { await navigator.clipboard.writeText(json.shorturl) } catch { /* ignore */ }
      } else {
        alert('Could not generate short link: ' + (json.errormessage || 'Unknown error'))
      }
    } catch {
      alert('Could not generate short link. Please check your connection.')
    } finally {
      setShortLoading(false)
    }
  }

  async function notifyAudience() {
    if (!prog) return
    const kind = prog.lastNotifiedAt ? 'updated' : 'created'
    const who = (aud.type || 'public') === 'restricted'
      ? 'its selected plans and invited people'
      : 'all active members'
    if (!confirm(`Announce "${prog.title}" to ${who} now?\n\nThey'll receive an email and see it in their portal.`)) return
    setNotifying(true)
    try {
      const r = await notifyEventAudience(prog.id, kind)
      set('lastNotifiedAt', new Date().toISOString())
      alert(`✅ Sent to ${r.recipients} recipient${r.recipients !== 1 ? 's' : ''} (${r.sent} email${r.sent !== 1 ? 's' : ''} delivered).`)
    } catch (e) {
      alert('Could not send: ' + e.message)
    } finally {
      setNotifying(false)
    }
  }

  async function create() {
    const p = makeDefault()
    await saveCourse(p)
    await refresh()
    skipAutosaveRef.current = true
    setProg(p); setSelected(p.id); setInviteText(''); setTab('details')
    setSaveState('saved'); setShortLink('')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this course?')) return
    await deleteCourse(id)
    await refresh()
    if (selected === id) { setSelected(null); setProg(null) }
  }

  async function toggleFeatured(id, e) {
    e.stopPropagation()
    const p = courses.find(x => x.id === id)
    if (!p) return
    await saveCourse({ ...p, featured: !p.featured })
    await refresh()
    if (selected === id) setProg(prev => ({ ...prev, featured: !prev.featured }))
  }

  function openOnboarding(id) {
    const base = window.location.href.split('#')[0]
    window.open(`${base}#/onboard?courseId=${id}`, '_blank')
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file, { maxPx: 1200, quality: 0.82 })
      set('image', url)
    } finally {
      setUploading(false)
      // reset input so same file can be re-selected
      e.target.value = ''
    }
  }

  // Derive wizard steps preview from linked form
  const linkedForm = forms.find(f => f.id === prog?.registrationFormId)
  const wizardSteps = linkedForm ? (() => {
    const steps = []; let cur = { title: 'Step 1', fields: [] }
    for (const f of (linkedForm.fields || [])) {
      if (f.type === 'section') { if (cur.fields.length) steps.push(cur); cur = { title: f.label, fields: [] } }
      else cur.fields.push(f)
    }
    if (cur.fields.length || steps.length === 0) steps.push(cur)
    return steps
  })() : []

  // Public registration / onboarding link for the selected course or event
  const onboardUrl = prog ? `${window.location.href.split('#')[0]}#/onboard?courseId=${prog.id}` : ''

  const panelStyle = { background: '#130a24', height: '100%', overflowY: 'auto', padding: 16 }
  const tabBtn = (t) => ({
    padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
    borderBottom: tab === t ? `2px solid ${ACC}` : '2px solid transparent',
    background: 'transparent', color: tab === t ? ACC2 : 'rgba(255,255,255,0.45)',
  })
  const divider = { height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},${ACC2})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Courses Manager</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
          {prog && <SaveStatus state={saveState} />}
          <button
            onClick={flushSave}
            disabled={!prog || saveState === 'saving'}
            title="Save all changes now"
            style={{
              background: !prog ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg,${ACC},#c04800)`,
              border: 'none', borderRadius: 7, color: 'white', padding: '7px 16px',
              fontSize: 11, fontWeight: 800, cursor: (!prog || saveState === 'saving') ? 'not-allowed' : 'pointer',
              opacity: !prog ? 0.5 : 1,
            }}
          >
            {saveState === 'saving' ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Left list */}
        <div style={{ ...panelStyle, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={create} style={{ width: '100%', background: `linear-gradient(135deg,${ACC},#c04800)`, border: 'none', borderRadius: 8, color: 'white', padding: '10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>+ New Course</button>
          <div style={divider} />
          {listLoading && courses.length === 0 && (
            <Loader label="Loading courses…" accent={ACC2} style={{ padding: '34px 0' }} />
          )}
          {!listLoading && courses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎓</div>No courses yet
            </div>
          )}
          {courses.map(p => {
            const active = p.id === selected
            return (
              <div key={p.id} onClick={() => selectCourse(p)} style={{ background: active ? 'rgba(228,96,10,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? ACC : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span onClick={e => toggleFeatured(p.id, e)} title={p.featured ? 'Remove from carousel' : 'Feature in carousel'} style={{ fontSize: 14, cursor: 'pointer', opacity: p.featured ? 1 : 0.3 }}>★</span>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: active ? ACC2 : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: `${STATUS_COLORS[p.status] || '#6b7280'}30`, color: STATUS_COLORS[p.status] || '#6b7280', letterSpacing: 1, textTransform: 'uppercase' }}>{p.status}</span>
                  <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: p.accessMode === 'plan' ? 'rgba(108,63,197,0.2)' : p.type === 'paid' && p.accessMode !== 'open' ? 'rgba(245,184,0,0.15)' : 'rgba(16,185,129,0.15)', color: p.accessMode === 'plan' ? '#b79df0' : p.type === 'paid' && p.accessMode !== 'open' ? ACC2 : '#34d399', letterSpacing: 1, textTransform: 'uppercase' }}>
                    {p.accessMode === 'plan'
                      ? `🎫 ${(plans.find(x => x.id === p.accessPlanId)?.name || 'PLAN')}`
                      : p.accessMode === 'open' ? 'OPEN'
                      : p.type === 'paid' ? `GHS ${p.price}` : 'FREE'}
                  </span>
                  {p.courseType === 'event' && (p.audience?.type === 'restricted') && (
                    <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: 'rgba(139,92,246,0.18)', color: '#a78bfa', letterSpacing: 1 }}>🔒</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                  <button onClick={e => { e.stopPropagation(); openOnboarding(p.id) }} style={{ flex: 1, background: 'rgba(52,152,219,0.15)', border: 'none', borderRadius: 6, color: '#74b9e8', fontSize: 9, fontWeight: 700, padding: '5px', cursor: 'pointer' }}>Preview</button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(p.id) }} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, color: '#f87171', fontSize: 9, fontWeight: 700, padding: '5px 8px', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right editor */}
        {!prog ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'rgba(255,255,255,0.25)', gap: 12 }}>
            <div style={{ fontSize: 52 }}>🎓</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Select a course to edit</div>
            <div style={{ fontSize: 11 }}>or create a new one</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Strip */}
            <div style={{ background: '#1a0e30', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 800 }}>{prog.title}</div>
              <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: `${STATUS_COLORS[prog.status]}30`, color: STATUS_COLORS[prog.status], letterSpacing: 1, textTransform: 'uppercase' }}>{prog.status}</span>
              {prog.featured && <span style={{ fontSize: 10, color: ACC2 }}>★ Featured</span>}
            </div>

            {/* Tabs */}
            <div style={{ background: '#160c28', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', padding: '0 20px', flexShrink: 0 }}>
              {['details', 'registration', 'payment', 'carousel', 'publish'].map(t => (
                <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#0e0a1e' }}>
              <div style={{ maxWidth: 600 }}>

                {/* DETAILS */}
                {tab === 'details' && (
                  <>
                    <Fld label="Course Title"><input style={inp()} value={prog.title} onChange={e => set('title', e.target.value)} /></Fld>
                    <Fld label="Tagline (short subtitle shown on card)"><input style={inp()} value={prog.tagline} onChange={e => set('tagline', e.target.value)} placeholder="e.g. Build a business that works for you" /></Fld>
                    <Fld label="Description">
                      <RichTextEditor
                        dark
                        value={prog.description || ''}
                        onChange={v => set('description', v)}
                        placeholder="Full course description…"
                        minRows={5}
                      />
                    </Fld>
                    <Fld label="Content Type">
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[{ v: 'course', label: '🎓 Course' }, { v: 'event', label: '🎪 Event' }].map(opt => (
                          <button key={opt.v} type="button" onClick={() => set('courseType', opt.v)} style={{
                            flex: 1, padding: '8px 0', borderRadius: 8, fontWeight: 700, fontSize: 12,
                            border: `1.5px solid ${(prog.courseType || 'course') === opt.v ? ACC : 'rgba(255,255,255,0.15)'}`,
                            background: (prog.courseType || 'course') === opt.v ? `${ACC}25` : 'transparent',
                            color: (prog.courseType || 'course') === opt.v ? '#fff' : 'rgba(255,255,255,0.45)',
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}>{opt.label}</button>
                        ))}
                      </div>
                    </Fld>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Fld label="Start Date"><input type="datetime-local" style={inp()} value={prog.startDate} onChange={e => set('startDate', e.target.value)} /></Fld>
                      <Fld label="End Date (optional)"><input type="datetime-local" style={inp()} value={prog.endDate} onChange={e => set('endDate', e.target.value)} /></Fld>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Fld label="Venue / Location"><input style={inp()} value={prog.venue} onChange={e => set('venue', e.target.value)} placeholder="Online / Accra, Ghana" /></Fld>
                      <Fld label="Capacity (0 = unlimited)"><input type="number" style={inp()} min={0} value={prog.capacity} onChange={e => set('capacity', Number(e.target.value))} /></Fld>
                    </div>

                    {/* ── Event-only: audience + access details + announce ── */}
                    {prog.courseType === 'event' && (
                      <>
                        <div style={divider} />
                        <Label>Who can see this event?</Label>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                          {[
                            { v: 'public',     icon: '🌐', t: 'Public',            d: 'Everyone — including visitors who are not members.' },
                            { v: 'restricted', icon: '🔒', t: 'Selected audience', d: 'Only chosen plans and/or invited people.' },
                          ].map(o => (
                            <div key={o.v} onClick={() => setAud('type', o.v)} style={{ flex: 1, border: `2px solid ${(aud.type || 'public') === o.v ? ACC : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', background: (aud.type || 'public') === o.v ? `${ACC}15` : 'transparent' }}>
                              <div style={{ fontWeight: 800, fontSize: 11, color: (aud.type || 'public') === o.v ? ACC2 : 'white', marginBottom: 3 }}>{o.icon} {o.t}</div>
                              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{o.d}</div>
                            </div>
                          ))}
                        </div>

                        {(aud.type || 'public') === 'restricted' && (
                          <>
                            <Fld label="Membership plans (groups) that can see it">
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {plans.length === 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>No plans yet — create them in Membership Plans.</span>}
                                {plans.map(pl => {
                                  const on = (aud.planIds || []).includes(pl.id)
                                  return (
                                    <button key={pl.id} type="button" onClick={() => setAud('planIds', on ? (aud.planIds || []).filter(x => x !== pl.id) : [...(aud.planIds || []), pl.id])} style={{
                                      border: `1.5px solid ${on ? (pl.color || ACC) : 'rgba(255,255,255,0.18)'}`,
                                      background: on ? `${pl.color || ACC}28` : 'transparent',
                                      color: on ? 'white' : 'rgba(255,255,255,0.5)',
                                      borderRadius: 18, padding: '5px 13px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    }}>{on ? '✓ ' : ''}{pl.name}</button>
                                  )
                                })}
                              </div>
                            </Fld>
                            <Fld label="Invite specific people (one email per line — works even without a plan)">
                              <textarea
                                style={inp({ minHeight: 70, resize: 'vertical', lineHeight: 1.6 })}
                                value={inviteText}
                                placeholder={'ama@example.com\nkofi@example.com'}
                                onChange={e => {
                                  setInviteText(e.target.value)
                                  setAud('emails', e.target.value.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean))
                                }}
                              />
                            </Fld>
                          </>
                        )}

                        <div style={divider} />
                        <Label>How do attendees join?</Label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                          {[
                            { v: 'online',    label: '💻 Online' },
                            { v: 'in_person', label: '📍 In person' },
                            { v: 'hybrid',    label: '🔀 Hybrid' },
                          ].map(o => (
                            <button key={o.v} type="button" onClick={() => setEvAccess('mode', o.v)} style={{
                              flex: 1, padding: '8px 0', borderRadius: 8, fontWeight: 700, fontSize: 11,
                              border: `1.5px solid ${(evAccess.mode || 'online') === o.v ? ACC : 'rgba(255,255,255,0.15)'}`,
                              background: (evAccess.mode || 'online') === o.v ? `${ACC}25` : 'transparent',
                              color: (evAccess.mode || 'online') === o.v ? '#fff' : 'rgba(255,255,255,0.45)',
                              cursor: 'pointer',
                            }}>{o.label}</button>
                          ))}
                        </div>
                        {(evAccess.mode || 'online') !== 'in_person' && (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <Fld label="Platform"><input style={inp()} value={evAccess.platform || ''} onChange={e => setEvAccess('platform', e.target.value)} placeholder="Zoom / Google Meet / Teams" /></Fld>
                              <Fld label="Passcode (optional)"><input style={inp()} value={evAccess.passcode || ''} onChange={e => setEvAccess('passcode', e.target.value)} placeholder="e.g. 482913" /></Fld>
                            </div>
                            <Fld label="Meeting link"><input style={inp()} value={evAccess.link || ''} onChange={e => setEvAccess('link', e.target.value)} placeholder="https://zoom.us/j/…" /></Fld>
                          </>
                        )}
                        {(evAccess.mode || 'online') !== 'online' && (
                          <Fld label="Address / Directions"><input style={inp()} value={evAccess.address || ''} onChange={e => setEvAccess('address', e.target.value)} placeholder="e.g. IWC Hub, East Legon, Accra" /></Fld>
                        )}
                        <Fld label="Extra notes for attendees (optional)">
                          <textarea style={inp({ minHeight: 56, resize: 'vertical', lineHeight: 1.6 })} value={evAccess.notes || ''} onChange={e => setEvAccess('notes', e.target.value)} placeholder="e.g. Doors open 30 minutes early. Bring a notebook." />
                        </Fld>

                        <div style={{ background: 'rgba(108,63,197,0.1)', border: '1px solid rgba(108,63,197,0.3)', borderRadius: 10, padding: 14, marginTop: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <button onClick={notifyAudience} disabled={notifying} style={{ background: notifying ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#6c3fc5,#9333ea)', border: 'none', borderRadius: 8, color: 'white', fontSize: 11, fontWeight: 800, padding: '10px 18px', cursor: notifying ? 'not-allowed' : 'pointer' }}>
                              {notifying ? '⏳ Sending…' : `📣 ${prog.lastNotifiedAt ? 'Send update to audience' : 'Announce to audience'}`}
                            </button>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', flex: 1, minWidth: 160, lineHeight: 1.6 }}>
                              Emails everyone in the audience and adds it to their portal notifications.
                              {prog.lastNotifiedAt && <><br />Last announced: {new Date(prog.lastNotifiedAt).toLocaleString('en-GB')}</>}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    <Fld label="Duration (e.g. 4 weeks, 3 months)">
                      <input style={inp()} value={prog.duration || ''} onChange={e => set('duration', e.target.value)} placeholder="e.g. 4 weeks" />
                    </Fld>
                    <Fld label="Tags">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                        {prog.tags.map(tag => (
                          <span key={tag} style={{ background: `${ACC}20`, border: `1px solid ${ACC}40`, borderRadius: 5, padding: '3px 8px', fontSize: 10, color: ACC, display: 'flex', alignItems: 'center', gap: 5 }}>
                            {tag} <span onClick={() => set('tags', prog.tags.filter(t => t !== tag))} style={{ cursor: 'pointer', opacity: 0.7 }}>✕</span>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input style={inp({ flex: 1 })} value={tagInput} placeholder="Add tag…" onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { set('tags', [...prog.tags, tagInput.trim()]); setTagInput('') } }} />
                        <button onClick={() => { if (tagInput.trim()) { set('tags', [...prog.tags, tagInput.trim()]); setTagInput('') } }} style={{ background: ACC, border: 'none', borderRadius: 6, color: 'white', padding: '0 12px', cursor: 'pointer', fontWeight: 700 }}>+</button>
                      </div>
                    </Fld>
                    <div style={divider} />
                    <Label>Course Image</Label>
                    {prog.image ? (
                      <div style={{ position: 'relative', marginBottom: 12 }}>
                        <img src={prog.image} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', display: 'block' }} />
                        <button onClick={() => set('image', null)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', width: 24, height: 24, fontSize: 12 }}>✕</button>
                      </div>
                    ) : (
                      <label style={{ display: 'block', border: `2px dashed rgba(228,96,10,0.4)`, borderRadius: 10, padding: '20px', textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', background: 'rgba(228,96,10,0.05)', marginBottom: 12, opacity: uploading ? 0.6 : 1 }}>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                        <div style={{ fontSize: 28, marginBottom: 6 }}>{uploading ? '⏳' : '🖼️'}</div>
                        <div style={{ fontSize: 11, color: ACC2, fontWeight: 700 }}>{uploading ? 'Uploading to Cloudinary…' : 'Click to upload course image'}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>JPG, PNG, WebP</div>
                      </label>
                    )}
                  </>
                )}

                {/* REGISTRATION */}
                {tab === 'registration' && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <Label>Onboarding Mode</Label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {['simple', 'steps'].map(m => (
                          <div key={m} onClick={() => set('onboardingMode', m)} style={{ flex: 1, border: `2px solid ${prog.onboardingMode === m ? ACC : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', background: prog.onboardingMode === m ? `${ACC}15` : 'transparent' }}>
                            <div style={{ fontWeight: 800, fontSize: 12, color: prog.onboardingMode === m ? ACC2 : 'white', marginBottom: 4 }}>{m === 'simple' ? '📝 Simple Form' : '🧭 Multi-Step Wizard'}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{m === 'simple' ? 'One page, all fields at once. Best for free courses with short forms.' : 'Form sections become wizard steps. Best for paid courses with deep intake forms.'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Fld label="Linked Registration Form">
                      <AdminSelect
                        value={prog.registrationFormId}
                        onChange={e => set('registrationFormId', e.target.value)}
                        options={[
                          { value: '', label: '— Select a form —' },
                          ...forms.map(f => ({ value: f.id, label: f.title || 'Untitled' })),
                        ]}
                        style={{ width: '100%' }}
                      />
                    </Fld>
                    {prog.onboardingMode === 'steps' && linkedForm && (
                      <div style={{ marginTop: 16 }}>
                        <Label>Wizard Steps Preview</Label>
                        {wizardSteps.length === 0 ? (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '10px 0' }}>No section dividers found in the form — all fields will appear on one step.</div>
                        ) : wizardSteps.map((s, i) => (
                          <div key={i} style={{ background: 'rgba(228,96,10,0.08)', border: '1px solid rgba(228,96,10,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: ACC2, marginBottom: 3 }}>Step {i + 1}: {s.title}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{s.fields.length} field{s.fields.length !== 1 ? 's' : ''}: {s.fields.map(f => f.label).join(', ')}</div>
                          </div>
                        ))}
                        <div style={{ background: 'rgba(245,184,0,0.08)', border: '1px solid rgba(245,184,0,0.2)', borderRadius: 8, padding: '10px 14px', marginTop: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: ACC2 }}>Step {wizardSteps.length + 1}: {prog.type === 'paid' ? '💳 Payment' : '✅ Confirmation'}</div>
                        </div>
                      </div>
                    )}
                    {!linkedForm && prog.registrationFormId && <div style={{ fontSize: 10, color: '#f87171', marginTop: 8 }}>Form not found — it may have been deleted.</div>}
                    {!prog.registrationFormId && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Select a form built in the Form Builder to use as the registration form.</div>}
                  </>
                )}

                {/* PAYMENT / ACCESS */}
                {tab === 'payment' && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <Label>Who can access this {prog.courseType === 'event' ? 'event' : 'course'}?</Label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {[
                          { v: 'open',   icon: '🌐', t: 'Open',            d: 'Free for everyone. No membership needed.' },
                          { v: 'plan',   icon: '🎫', t: 'Membership',      d: 'Included from a chosen plan and above.' },
                          { v: 'legacy', icon: '💳', t: 'One-time price',  d: 'Classic per-course payment (legacy).' },
                        ].map(o => {
                          const cur = prog.accessMode || 'legacy'
                          return (
                            <div key={o.v} onClick={() => set('accessMode', o.v)} style={{ flex: 1, border: `2px solid ${cur === o.v ? ACC : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, padding: '12px 12px', cursor: 'pointer', background: cur === o.v ? `${ACC}15` : 'transparent', textAlign: 'center' }}>
                              <div style={{ fontSize: 20, marginBottom: 4 }}>{o.icon}</div>
                              <div style={{ fontWeight: 800, fontSize: 12, color: cur === o.v ? ACC2 : 'white' }}>{o.t}</div>
                              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.5 }}>{o.d}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {(prog.accessMode || 'legacy') === 'plan' && (
                      <>
                        <Fld label="Available from this plan and above">
                          <AdminSelect
                            value={prog.accessPlanId || ''}
                            onChange={e => set('accessPlanId', e.target.value)}
                            options={[
                              { value: '', label: '— Select a plan —' },
                              ...plans.map(pl => ({ value: pl.id, label: pl.name })),
                            ]}
                            style={{ width: '100%' }}
                          />
                        </Fld>
                        {plans.length === 0 && (
                          <div style={{ fontSize: 10, color: '#fbbf24', marginBottom: 12 }}>⚠ No plans exist yet — create them in the Membership Plans manager first.</div>
                        )}
                        <div style={{ background: 'rgba(108,63,197,0.08)', border: '1px solid rgba(108,63,197,0.25)', borderRadius: 10, padding: 14, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
                          <strong style={{ color: '#b79df0' }}>How it works:</strong> members on this plan — or any higher tier — open it directly from their portal.
                          Everyone else sees it on the courses page with a "Join to access" button that sends them to the membership registration.
                          No per-course payment is taken.
                        </div>
                      </>
                    )}

                    {(prog.accessMode || 'legacy') === 'open' && (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 1.8 }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🌐</div>
                        Open to everyone, free of charge.<br />
                        Visitors register with the linked form and get portal access (if enabled in Publish).
                      </div>
                    )}

                    {(prog.accessMode || 'legacy') === 'legacy' && (
                      <>
                    <div style={{ marginBottom: 16 }}>
                      <Label>Course Type</Label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {['free', 'paid'].map(t => (
                          <div key={t} onClick={() => set('type', t)} style={{ flex: 1, border: `2px solid ${prog.type === t ? (t === 'paid' ? ACC2 : '#10B981') : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', background: prog.type === t ? 'rgba(255,255,255,0.05)' : 'transparent', textAlign: 'center' }}>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{t === 'free' ? '🎁' : '💳'}</div>
                            <div style={{ fontWeight: 800, fontSize: 12, color: t === 'paid' ? ACC2 : '#34d399' }}>{t === 'free' ? 'Free' : 'Paid'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {prog.type === 'paid' && (
                      <>
                        <Fld label="Price (GHS)"><input type="number" style={inp()} min={0} value={prog.price} onChange={e => set('price', Number(e.target.value))} /></Fld>
                        <Fld label="Discount (%) — applied at registration via spin wheel">
                          <input
                            type="number" style={inp()} min={0} max={100}
                            value={prog.discount || 0}
                            onChange={e => set('discount', Math.max(0, Math.min(100, Number(e.target.value))))}
                            placeholder="0 = no discount (skips the spin wheel)"
                          />
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6, lineHeight: 1.6 }}>
                            Leave at <strong>0</strong> for no discount — the spin wheel is skipped and the
                            participant pays full price. Any value above 0 shows the spin wheel landing on
                            that discount{prog.discount > 0 ? ` (pays GHS ${Math.round(Number(prog.price || 0) * (1 - (prog.discount || 0) / 100)).toLocaleString()})` : ''}.
                          </div>
                        </Fld>
                        <div style={divider} />
                        <div style={{ background: 'rgba(228,96,10,0.08)', border: '1px solid rgba(228,96,10,0.2)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
                          <strong style={{ color: ACC2 }}>Paystack setup:</strong><br />
                          1. Create a free account at <strong>paystack.com</strong><br />
                          2. Go to Settings → API Keys &amp; Webhooks<br />
                          3. Copy your <em>Public Key</em> (starts with pk_live_ or pk_test_)<br />
                          4. Paste it below
                        </div>
                        <Fld label="Paystack Public Key"><input style={inp()} value={prog.paystackPublicKey} onChange={e => set('paystackPublicKey', e.target.value)} placeholder="pk_live_xxxxxxxxxxxxxxxx" /></Fld>
                      </>
                    )}
                    {prog.type === 'free' && (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🎁</div>
                        This course is free — no payment configuration needed.
                      </div>
                    )}
                      </>
                    )}
                  </>
                )}

                {/* CAROUSEL */}
                {tab === 'carousel' && (
                  <>
                    <Toggle label="Show in hero carousel on landing page" checked={prog.featured} onChange={e => set('featured', e.target.checked)} />
                    {prog.featured && (
                      <Fld label="Carousel order (lower = appears first)">
                        <input type="number" style={inp()} min={0} value={prog.featuredOrder} onChange={e => set('featuredOrder', Number(e.target.value))} />
                      </Fld>
                    )}
                    <div style={divider} />
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                      Featured courses appear as full-width slides in the hero carousel on the public landing page. The course image, title, tagline, date, and a CTA button are shown. Non-featured courses still appear in the courses grid below the carousel.
                    </div>
                    {!prog.image && (
                      <div style={{ marginTop: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 10, color: '#fbbf24' }}>
                        ⚠ This course has no image. Upload one in the Details tab for the best carousel appearance.
                      </div>
                    )}
                  </>
                )}

                {/* PUBLISH */}
                {tab === 'publish' && (
                  <>
                    <Fld label="Status">
                      <AdminSelect
                        value={prog.status}
                        onChange={e => set('status', e.target.value)}
                        options={STATUS_OPTS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                        style={{ width: '100%' }}
                      />
                    </Fld>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginBottom: 16 }}>
                      <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Draft</strong> — hidden from public landing page<br />
                      <strong style={{ color: '#8B5CF6' }}>Upcoming</strong> — visible, registration not yet open<br />
                      <strong style={{ color: '#10B981' }}>Open</strong> — visible, registration link active<br />
                      <strong style={{ color: ACC }}>Closed</strong> — visible, registration link disabled<br />
                      <strong style={{ color: '#3498DB' }}>Completed</strong> — visible as past course
                    </div>
                    <Toggle label="Allow portal access (learning portal)" checked={prog.hasPortalAccess} onChange={e => set('hasPortalAccess', e.target.checked)} />
                    <Toggle label="Award a certificate on course completion" checked={prog.awardsCertificate} onChange={e => set('awardsCertificate', e.target.checked)} />
                    <div style={divider} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button onClick={() => openOnboarding(prog.id)} style={{ width: '100%', background: 'rgba(52,152,219,0.2)', border: '1px solid rgba(52,152,219,0.4)', borderRadius: 8, color: '#74b9e8', fontSize: 11, fontWeight: 700, padding: '10px', cursor: 'pointer' }}>
                        🔗 Preview Onboarding Page
                      </button>
                      <button onClick={() => navigate(`/content-admin?courseId=${prog.id}`)} style={{ width: '100%', background: `rgba(201,168,76,0.15)`, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: 8, color: ACC2, fontSize: 11, fontWeight: 700, padding: '10px', cursor: 'pointer' }}>
                        📚 Manage Course Content
                      </button>
                    </div>

                    {/* ── Share registration link (short URL) ── */}
                    <div style={divider} />
                    <Label>{prog.courseType === 'event' ? 'Event' : 'Course'} registration link</Label>
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', fontSize: 10, color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all', marginBottom: 8, lineHeight: 1.6 }}>
                      {onboardUrl}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { navigator.clipboard?.writeText(onboardUrl) }}
                        style={{ flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 11, fontWeight: 700, padding: '9px', cursor: 'pointer' }}
                      >📋 Copy Full Link</button>
                      <button
                        onClick={generateShortLink}
                        disabled={shortLoading}
                        style={{ flex: 1, minWidth: 120, background: shortLoading ? 'rgba(255,255,255,0.05)' : 'rgba(52,152,219,0.15)', border: '1px solid rgba(52,152,219,0.35)', borderRadius: 8, color: '#74b9e8', fontSize: 11, fontWeight: 700, padding: '9px', cursor: shortLoading ? 'not-allowed' : 'pointer' }}
                      >{shortLoading ? '⏳ Generating…' : '🔗 Generate Short Link'}</button>
                    </div>
                    {shortLink && (
                      <div style={{ marginTop: 8, background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.25)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#74b9e8', fontWeight: 700, wordBreak: 'break-all' }}>{shortLink}</span>
                        <button onClick={() => navigator.clipboard?.writeText(shortLink)} style={{ background: 'rgba(52,152,219,0.25)', border: 'none', borderRadius: 6, color: '#74b9e8', fontSize: 10, fontWeight: 700, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}>Copy</button>
                      </div>
                    )}
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 6, lineHeight: 1.5 }}>
                      Short links are generated via TinyURL and copied to your clipboard automatically.
                    </div>
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
