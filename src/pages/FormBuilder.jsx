import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  uid, getAllForms, saveForm, deleteForm, getFormSubmissions,
  DEFAULT_REGISTRATION_FIELDS, DEFAULT_FEEDBACK_FIELDS, encodeFormConfig,
} from '../utils/formStorage'

// ── Accent ─────────────────────────────────────────────────────────────────
const ACC = '#8B5CF6'
const ACC2 = '#C4B5FD'
const DARK = '#0e0a1e'

const SWATCH_COLORS = [
  { c: '#E4600A', n: 'Orange' }, { c: '#F5B800', n: 'Yellow' }, { c: '#8B5CF6', n: 'Purple' },
  { c: '#3498DB', n: 'Blue' }, { c: '#C9A84C', n: 'Gold' }, { c: '#E74C3C', n: 'Red' },
  { c: '#2ECC71', n: 'Green' }, { c: '#E91E63', n: 'Pink' }, { c: '#1A1A2E', n: 'Dark' },
  { c: '#ffffff', n: 'White' }, { c: '#10B981', n: 'Teal' }, { c: '#F59E0B', n: 'Amber' },
]

const FIELD_TYPES = [
  { type: 'full_name',  icon: '👤', label: 'Full Name' },
  { type: 'email',      icon: '✉️', label: 'Email' },
  { type: 'whatsapp',   icon: '📱', label: 'WhatsApp' },
  { type: 'radio',      icon: '🔘', label: 'Single Choice' },
  { type: 'checkbox',   icon: '☑️', label: 'Multi-Choice' },
  { type: 'text',       icon: '📝', label: 'Short Text' },
  { type: 'textarea',   icon: '📄', label: 'Long Answer' },
  { type: 'rating',     icon: '⭐', label: 'Star Rating' },
  { type: 'picture',    icon: '🖼️', label: 'Photo Upload' },
]

function makeDefaultForm(type) {
  return {
    id: uid(),
    type,
    title: type === 'registration' ? 'Event Registration' : 'Event Feedback',
    description: type === 'registration'
      ? 'Register to secure your spot for this exciting event.'
      : 'Thank you for attending! Please share your experience.',
    eventDate: '',
    brandName: 'IWC Concepts',
    accentColor: '#E4600A',
    accentColor2: '#F5B800',
    fields: (type === 'registration' ? DEFAULT_REGISTRATION_FIELDS : DEFAULT_FEEDBACK_FIELDS).map(f => ({ ...f })),
    speakers: [],
    emailConfig: {
      enabled: false,
      adminEmail: '',
      serviceId: '',
      confirmTemplateId: '',
      notifyTemplateId: '',
      publicKey: '',
      confirmationMessage: 'You are registered! We look forward to seeing you.',
    },
  }
}

// ── Shared small UI ────────────────────────────────────────────────────────
const inp = (extra = {}) => ({
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8, color: 'white', fontFamily: "'Montserrat',sans-serif",
  fontSize: 12, padding: '8px 11px', width: '100%', boxSizing: 'border-box',
  ...extra,
})

function Label({ children }) {
  return <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 4 }}>{children}</label>
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 12 }}><Label>{label}</Label>{children}</div>
}

function SwatchRow({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {SWATCH_COLORS.map(({ c, n }) => (
        <div key={c} title={n} onClick={() => onChange(c)} style={{
          width: 22, height: 22, borderRadius: 4, background: c, cursor: 'pointer',
          border: `2px solid ${value === c ? 'white' : 'transparent'}`,
          transform: value === c ? 'scale(1.18)' : 'scale(1)', transition: 'transform 0.12s',
        }} />
      ))}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
      <span>{label}</span>
      <label style={{ position: 'relative', width: 36, height: 20, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: checked ? ACC : 'rgba(255,255,255,0.18)', borderRadius: 20, transition: 'background 0.25s' }}>
          <div style={{ position: 'absolute', width: 13, height: 13, left: checked ? 20 : 3, top: 3.5, background: 'white', borderRadius: '50%', transition: 'left 0.25s' }} />
        </div>
      </label>
    </div>
  )
}

// ── Field Editor Modal ─────────────────────────────────────────────────────
function FieldEditorModal({ field, onSave, onClose }) {
  const [f, setF] = useState({ ...field, options: field.options ? [...field.options] : [] })
  const [newOpt, setNewOpt] = useState('')
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#1a0e30', border: `1px solid ${ACC}`, borderRadius: 14, padding: 24, width: 420, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 18, color: ACC2 }}>Edit Field</div>

        <Field label="Label"><input style={inp()} value={f.label} onChange={e => set('label', e.target.value)} /></Field>

        {['text', 'email', 'full_name', 'textarea', 'whatsapp'].includes(f.type) && (
          <Field label="Placeholder"><input style={inp()} value={f.placeholder || ''} onChange={e => set('placeholder', e.target.value)} /></Field>
        )}

        <Toggle label="Required" checked={f.required} onChange={e => set('required', e.target.checked)} />

        {f.type === 'picture' && (
          <>
            <Field label="Accepted File Types">
              <select style={inp()} value={f.accept || 'image/*'} onChange={e => set('accept', e.target.value)}>
                <option value="image/*">Images only (JPG, PNG, WebP, etc.)</option>
                <option value="image/jpeg,image/png">JPG & PNG only</option>
                <option value="image/*,.pdf">Images & PDF</option>
                <option value="*">Any file type</option>
              </select>
            </Field>
            <Field label="Max File Size (MB)">
              <input type="number" style={inp()} min="1" max="20" value={f.maxSizeMB || 5}
                onChange={e => set('maxSizeMB', Number(e.target.value))} />
            </Field>
            <Field label="Helper Text (shown below upload button)">
              <input style={inp()} value={f.placeholder || ''} placeholder="e.g. Passport photo required"
                onChange={e => set('placeholder', e.target.value)} />
            </Field>
          </>
        )}

        {(f.type === 'radio' || f.type === 'checkbox') && (
          <div style={{ marginBottom: 12 }}>
            <Label>Options</Label>
            {f.options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                <input style={inp({ flex: 1 })} value={opt} onChange={e => {
                  const opts = [...f.options]; opts[i] = e.target.value; set('options', opts)
                }} />
                <button onClick={() => set('options', f.options.filter((_, j) => j !== i))} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, color: '#f87171', padding: '0 10px', cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <input style={inp({ flex: 1 })} value={newOpt} placeholder="New option..." onChange={e => setNewOpt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newOpt.trim()) { set('options', [...f.options, newOpt.trim()]); setNewOpt('') } }} />
              <button onClick={() => { if (newOpt.trim()) { set('options', [...f.options, newOpt.trim()]); setNewOpt('') } }} style={{ background: ACC, border: 'none', borderRadius: 6, color: 'white', padding: '0 12px', cursor: 'pointer', fontWeight: 700 }}>+</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={() => onSave(f)} style={{ flex: 1, background: ACC, border: 'none', borderRadius: 8, color: 'white', padding: '10px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Save Field</button>
          <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', padding: '10px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function FormBuilder() {
  const navigate = useNavigate()
  const [forms, setForms] = useState([])
  const [subCounts, setSubCounts] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(null)
  const [tab, setTab] = useState('content')
  const [editingField, setEditingField] = useState(null)
  const [copied, setCopied] = useState(false)
  const [submissionCount, setSubmissionCount] = useState(0)

  const refreshForms = useCallback(async () => {
    const all = await getAllForms()
    setForms(all)
    const counts = {}
    await Promise.all(all.map(async f => {
      const subs = await getFormSubmissions(f.id)
      counts[f.id] = subs.length
    }))
    setSubCounts(counts)
  }, [])

  useEffect(() => { refreshForms() }, [refreshForms])

  // Update submission count when selected form changes
  useEffect(() => {
    if (!selectedId) { setSubmissionCount(0); return }
    getFormSubmissions(selectedId).then(subs => setSubmissionCount(subs.length))
  }, [selectedId])

  // Auto-save form after 600ms of no changes
  const debouncedSave = useCallback((f) => {
    if (!f) return
    const t = setTimeout(() => saveForm(f), 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!form) return
    const cleanup = debouncedSave(form)
    return cleanup
  }, [form, debouncedSave])

  async function loadForm(id) {
    const all = await getAllForms()
    const f = all.find(x => x.id === id)
    if (f) { setForm({ ...f, fields: f.fields.map(x => ({ ...x })) }); setSelectedId(id); setTab('content') }
  }

  async function createForm(type) {
    const f = makeDefaultForm(type)
    await saveForm(f)
    await refreshForms()
    setForm(f)
    setSelectedId(f.id)
    setTab('content')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this form? All submissions will also be deleted.')) return
    await deleteForm(id)
    await refreshForms()
    if (selectedId === id) { setSelectedId(null); setForm(null) }
  }

  const setF = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const setEmail = (key, val) => setForm(p => ({ ...p, emailConfig: { ...p.emailConfig, [key]: val } }))

  function moveField(idx, dir) {
    const fields = [...form.fields]
    const target = idx + dir
    if (target < 0 || target >= fields.length) return
    ;[fields[idx], fields[target]] = [fields[target], fields[idx]]
    setF('fields', fields)
  }

  function addField(type) {
    const newField = {
      id: uid(), type, label: FIELD_TYPES.find(t => t.type === type)?.label || 'Field',
      placeholder: '', required: false, options: type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : [],
      defaultCountryCode: type === 'whatsapp' ? '+233' : undefined,
      accept: type === 'picture' ? 'image/*' : undefined,
      maxSizeMB: type === 'picture' ? 5 : undefined,
    }
    setF('fields', [...form.fields, newField])
    setEditingField(newField)
  }

  function saveEditedField(updatedField) {
    setF('fields', form.fields.map(f => f.id === updatedField.id ? updatedField : f))
    setEditingField(null)
  }

  function getShareUrl(type) {
    if (!form) return ''
    const shareConfig = {
      id: form.id, type: form.type, title: form.title, description: form.description,
      eventDate: form.eventDate, brandName: form.brandName,
      accentColor: form.accentColor, accentColor2: form.accentColor2,
      fields: form.fields,
      speakers: form.speakers || [],
      emailConfig: form.emailConfig,
    }
    const encoded = encodeFormConfig(shareConfig)
    if (!encoded) return ''
    const base = window.location.href.split('#')[0]
    return `${base}#/${type === 'feedback' ? 'feedback' : 'register'}?d=${encoded}`
  }

  function copyUrl(type) {
    const url = getShareUrl(type)
    if (!url) return
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  // Styles
  const panelStyle = { background: '#130a24', height: '100%', overflowY: 'auto', padding: 16 }
  const tabBtn = (active) => ({
    padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
    borderBottom: active ? `2px solid ${ACC}` : '2px solid transparent',
    background: 'transparent', color: active ? ACC2 : 'rgba(255,255,255,0.45)',
    transition: 'color 0.2s',
  })
  const divider = { height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }
  const subHead = { fontSize: 8, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', color: ACC, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ACC; e.currentTarget.style.color = ACC }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
          >← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#C4B5FD)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Form Builder</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
          {forms.length} form{forms.length !== 1 ? 's' : ''} · All changes auto-saved
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, overflow: 'hidden' }}>
        {/* ── LEFT: Forms list ── */}
        <div style={{ ...panelStyle, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={subHead}>My Forms <div style={{ flex: 1, height: 1, background: `rgba(139,92,246,0.2)` }} /></div>
            <button onClick={() => createForm('registration')} style={{ width: '100%', background: `linear-gradient(135deg,${ACC},#7C3AED)`, border: 'none', borderRadius: 8, color: 'white', padding: '10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginBottom: 6 }}>
              + New Registration Form
            </button>
            <button onClick={() => createForm('feedback')} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(139,92,246,0.35)`, borderRadius: 8, color: 'white', padding: '9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              + New Feedback Form
            </button>
          </div>

          <div style={divider} />

          {forms.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div>No forms yet</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>Create your first form above</div>
            </div>
          )}

          {forms.map(f => {
            const count = subCounts[f.id] || 0
            const active = f.id === selectedId
            return (
              <div key={f.id} onClick={() => loadForm(f.id)} style={{
                background: active ? `rgba(139,92,246,0.15)` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? ACC : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? ACC2 : 'white', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: f.type === 'registration' ? 'rgba(228,96,10,0.25)' : 'rgba(16,185,129,0.25)', color: f.type === 'registration' ? '#fb923c' : '#34d399', letterSpacing: 1 }}>{f.type.toUpperCase()}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{count} submission{count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                  <button onClick={e => { e.stopPropagation(); loadForm(f.id) }} style={{ flex: 1, background: 'rgba(139,92,246,0.2)', border: 'none', borderRadius: 6, color: ACC2, fontSize: 9, fontWeight: 700, padding: '5px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={e => { e.stopPropagation(); navigate(`/event-dashboard?formId=${f.id}`) }} style={{ flex: 1, background: 'rgba(16,185,129,0.15)', border: 'none', borderRadius: 6, color: '#34d399', fontSize: 9, fontWeight: 700, padding: '5px', cursor: 'pointer' }}>Dashboard</button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(f.id) }} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, color: '#f87171', fontSize: 9, fontWeight: 700, padding: '5px 8px', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── RIGHT: Form Editor ── */}
        {!form ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'rgba(255,255,255,0.25)', gap: 12 }}>
            <div style={{ fontSize: 52 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Select a form to edit</div>
            <div style={{ fontSize: 11 }}>or create a new one from the left panel</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Form header strip */}
            <div style={{ background: '#1a0e30', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{form.title}</span>
                  <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: form.type === 'registration' ? 'rgba(228,96,10,0.25)' : 'rgba(16,185,129,0.25)', color: form.type === 'registration' ? '#fb923c' : '#34d399', letterSpacing: 1 }}>{form.type.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{submissionCount} submission{submissionCount !== 1 ? 's' : ''} · {form.fields.length} fields</div>
              </div>
              <button onClick={() => navigate(`/event-dashboard?formId=${form.id}`)} style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 7, color: '#34d399', fontSize: 10, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>📊 View Dashboard</button>
            </div>

            {/* Tabs */}
            <div style={{ background: '#160c28', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', padding: '0 20px', flexShrink: 0 }}>
              {['content', 'fields', 'email', 'share'].map(t => (
                <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#0e0a1e' }}>

              {/* CONTENT TAB */}
              {tab === 'content' && (
                <div style={{ maxWidth: 600 }}>
                  <Field label="Form Title">
                    <input style={inp()} value={form.title} onChange={e => setF('title', e.target.value)} />
                  </Field>
                  <Field label="Description">
                    <textarea style={inp({ resize: 'vertical', lineHeight: 1.6 })} rows={3} value={form.description} onChange={e => setF('description', e.target.value)} />
                  </Field>
                  <Field label="Event Date & Time">
                    <input type="datetime-local" style={inp()} value={form.eventDate} onChange={e => setF('eventDate', e.target.value)} />
                  </Field>
                  <Field label="Brand / Organisation Name">
                    <input style={inp()} value={form.brandName} onChange={e => setF('brandName', e.target.value)} />
                  </Field>
                  <div style={divider} />
                  <Field label="Primary Accent Color">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: form.accentColor, border: '2px solid rgba(255,255,255,0.2)' }} />
                      <input type="color" value={form.accentColor} onChange={e => setF('accentColor', e.target.value)} style={{ width: 40, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
                    </div>
                    <SwatchRow value={form.accentColor} onChange={v => setF('accentColor', v)} />
                  </Field>
                  <Field label="Secondary Accent Color">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: form.accentColor2, border: '2px solid rgba(255,255,255,0.2)' }} />
                      <input type="color" value={form.accentColor2} onChange={e => setF('accentColor2', e.target.value)} style={{ width: 40, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
                    </div>
                    <SwatchRow value={form.accentColor2} onChange={v => setF('accentColor2', v)} />
                  </Field>
                  <div style={divider} />
                  <Field label="Speaker / Guest Lineup (names & titles)">
                    {form.speakers.map((sp, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input style={inp({ flex: 1 })} placeholder="Name" value={sp.name || ''} onChange={e => { const s = [...form.speakers]; s[i] = { ...s[i], name: e.target.value }; setF('speakers', s) }} />
                        <input style={inp({ flex: 1 })} placeholder="Title / Role" value={sp.title || ''} onChange={e => { const s = [...form.speakers]; s[i] = { ...s[i], title: e.target.value }; setF('speakers', s) }} />
                        <button onClick={() => setF('speakers', form.speakers.filter((_, j) => j !== i))} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 6, color: '#f87171', padding: '0 10px', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => setF('speakers', [...form.speakers, { name: '', title: '' }])} style={{ background: 'rgba(139,92,246,0.15)', border: '1px dashed rgba(139,92,246,0.4)', borderRadius: 7, color: ACC2, fontSize: 11, fontWeight: 700, padding: '8px 14px', cursor: 'pointer', width: '100%', marginTop: 4 }}>+ Add Speaker</button>
                  </Field>
                </div>
              )}

              {/* FIELDS TAB */}
              {tab === 'fields' && (
                <div style={{ maxWidth: 680 }}>
                  <div style={{ marginBottom: 18 }}>
                    <div style={subHead}>Add Field Type</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {FIELD_TYPES.map(ft => (
                        <button key={ft.type} onClick={() => addField(ft.type)} style={{
                          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                          borderRadius: 8, color: 'white', padding: '8px 12px', cursor: 'pointer',
                          fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.25)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)' }}
                        >
                          <span>{ft.icon}</span>{ft.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={divider} />
                  <div style={subHead}>Form Fields ({form.fields.length})</div>

                  {form.fields.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No fields yet — add some above</div>
                  )}

                  {form.fields.map((f, i) => {
                    const ft = FIELD_TYPES.find(t => t.type === f.type)
                    return (
                      <div key={f.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, textAlign: 'center', fontSize: 18, flexShrink: 0 }}>{ft?.icon || '📝'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{f.label}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                            {ft?.label} {f.required && <span style={{ color: '#f87171' }}>• Required</span>}
                            {f.options?.length > 0 && <span> • {f.options.join(', ')}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                          <button onClick={() => moveField(i, -1)} disabled={i === 0} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 5, color: 'white', width: 26, height: 26, cursor: 'pointer', fontSize: 12, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                          <button onClick={() => moveField(i, 1)} disabled={i === form.fields.length - 1} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 5, color: 'white', width: 26, height: 26, cursor: 'pointer', fontSize: 12, opacity: i === form.fields.length - 1 ? 0.3 : 1 }}>↓</button>
                          <button onClick={() => setEditingField(f)} style={{ background: `rgba(139,92,246,0.2)`, border: 'none', borderRadius: 5, color: ACC2, padding: '0 10px', height: 26, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>Edit</button>
                          <button onClick={() => setF('fields', form.fields.filter(x => x.id !== f.id))} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 5, color: '#f87171', width: 26, height: 26, cursor: 'pointer', fontSize: 12 }}>✕</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* EMAIL TAB */}
              {tab === 'email' && (
                <div style={{ maxWidth: 560 }}>
                  <Toggle label="Enable automatic email notifications" checked={form.emailConfig?.enabled} onChange={e => setEmail('enabled', e.target.checked)} />

                  <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
                    <strong style={{ color: ACC2 }}>How to set up email notifications:</strong><br />
                    1. Create a free account at <strong>emailjs.com</strong><br />
                    2. Add an Email Service (connect Gmail, Outlook, etc.)<br />
                    3. Create two Email Templates — one for <em>participant confirmation</em>, one for <em>admin notification</em><br />
                    4. Use template variables: <code style={{ color: '#93c5fd' }}>{'{{to_name}}'}</code>, <code style={{ color: '#93c5fd' }}>{'{{to_email}}'}</code>, <code style={{ color: '#93c5fd' }}>{'{{event_title}}'}</code>, <code style={{ color: '#93c5fd' }}>{'{{event_date}}'}</code>, <code style={{ color: '#93c5fd' }}>{'{{submission_data}}'}</code><br />
                    5. Paste your IDs below
                  </div>

                  {[
                    ['Your Admin Email (notification recipient)', 'adminEmail', 'admin@example.com'],
                    ['EmailJS Service ID', 'serviceId', 'service_xxxxxxx'],
                    ['Confirmation Template ID (for participant)', 'confirmTemplateId', 'template_xxxxxxx'],
                    ['Notification Template ID (for admin)', 'notifyTemplateId', 'template_xxxxxxx'],
                    ['EmailJS Public Key', 'publicKey', 'xxxxxxxxxxxxxxxxxxxx'],
                  ].map(([lbl, key, ph]) => (
                    <Field key={key} label={lbl}>
                      <input style={inp()} type={key === 'publicKey' ? 'password' : 'text'} value={form.emailConfig?.[key] || ''} placeholder={ph} onChange={e => setEmail(key, e.target.value)} />
                    </Field>
                  ))}

                  <Field label="Confirmation Message (shown to participant after registering)">
                    <textarea style={inp({ resize: 'vertical' })} rows={3} value={form.emailConfig?.confirmationMessage || ''} onChange={e => setEmail('confirmationMessage', e.target.value)} />
                  </Field>
                </div>
              )}

              {/* SHARE TAB */}
              {tab === 'share' && (
                <div style={{ maxWidth: 600 }}>
                  <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: 18, marginBottom: 20, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
                    <strong style={{ color: ACC2 }}>Share these links with your audience.</strong><br />
                    The form configuration is embedded in the URL — no server required. Anyone with the link can fill out the form, and submissions will be sent to your email (if configured above).
                  </div>

                  {[
                    { label: form.type === 'registration' ? 'Registration Form Link' : 'Feedback Form Link', type: form.type === 'registration' ? 'register' : 'feedback', icon: form.type === 'registration' ? '📝' : '⭐' },
                  ].map(({ label, type, icon }) => {
                    const url = getShareUrl(type)
                    return (
                      <div key={type} style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: ACC2, marginBottom: 8 }}>{icon} {label}</div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', fontSize: 10, color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all', marginBottom: 8, lineHeight: 1.6 }}>{url || 'Fill in form details to generate link'}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => copyUrl(type)} style={{ flex: 1, background: copied ? 'rgba(16,185,129,0.25)' : `rgba(139,92,246,0.25)`, border: `1px solid ${copied ? 'rgba(16,185,129,0.5)' : 'rgba(139,92,246,0.5)'}`, borderRadius: 8, color: copied ? '#34d399' : ACC2, fontSize: 11, fontWeight: 700, padding: '9px', cursor: 'pointer' }}>
                            {copied ? '✓ Copied!' : '📋 Copy Link'}
                          </button>
                          <button onClick={() => window.open(url, '_blank')} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 11, fontWeight: 700, padding: '9px', cursor: 'pointer' }}>
                            🔗 Open Form
                          </button>
                        </div>
                        {url && (
                          <div style={{ marginTop: 14, textAlign: 'center' }}>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&bgcolor=0e0a1e&color=C4B5FD`} alt="QR" style={{ borderRadius: 10, border: `2px solid rgba(139,92,246,0.35)` }} />
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Scan to open form</div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Auto-add feedback link if registration */}
                  {form.type === 'registration' && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#34d399', marginBottom: 8 }}>⭐ Feedback Form Link (auto-generated)</div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', fontSize: 10, color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all', marginBottom: 8, lineHeight: 1.6 }}>
                        {getShareUrl('feedback') || 'Fill in form details first'}
                      </div>
                      <button onClick={() => copyUrl('feedback')} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 8, color: '#34d399', fontSize: 11, fontWeight: 700, padding: '9px 16px', cursor: 'pointer' }}>📋 Copy Feedback Link</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Field Editor Modal */}
      {editingField && (
        <FieldEditorModal
          field={editingField}
          onSave={saveEditedField}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  )
}
