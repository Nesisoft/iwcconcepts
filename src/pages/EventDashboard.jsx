import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  getAllForms, saveForm, getFormSubmissions, deleteSubmission, exportCSV,
  getEventTasks, saveEventTasks, formatDate, getTimeLeft, uid,
} from '../utils/formStorage'

// ── Shared styles ────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#0f0a1a',
    fontFamily: "'Montserrat', sans-serif",
    color: '#fff',
  },
  header: {
    background: 'linear-gradient(135deg, #1a0d2e, #2d1654)',
    borderBottom: '2px solid #C9A84C',
    padding: '14px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  btn: (accent = '#C9A84C', variant = 'fill') => ({
    background: variant === 'fill' ? accent : 'transparent',
    border: `1px solid ${accent}`,
    color: variant === 'fill' ? '#1a0d2e' : accent,
    borderRadius: 7,
    padding: '7px 14px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
    letterSpacing: 0.5,
  }),
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12,
    padding: 20,
  },
  label: {
    fontSize: 10,
    color: '#C9A84C',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: 700,
    marginBottom: 6,
    display: 'block',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 7,
    padding: '8px 12px',
    color: '#fff',
    fontSize: 13,
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: 'border-box',
  },
}

// ── Countdown display ─────────────────────────────────────────────────────────
function Countdown({ dateStr }) {
  const [t, setT] = useState(getTimeLeft(dateStr))
  useEffect(() => {
    const iv = setInterval(() => setT(getTimeLeft(dateStr)), 1000)
    return () => clearInterval(iv)
  }, [dateStr])
  if (!t) return null
  if (t.past) return (
    <div style={{ color: '#E4600A', fontWeight: 700, fontSize: 14 }}>Event has passed</div>
  )
  const box = (n, l) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        background: 'rgba(201,168,76,0.15)',
        border: '1px solid rgba(201,168,76,0.4)',
        borderRadius: 10,
        padding: '12px 18px',
        minWidth: 60,
      }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#C9A84C', lineHeight: 1 }}>{String(n).padStart(2, '0')}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginTop: 4 }}>{l}</div>
      </div>
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {box(t.days, 'DAYS')}
      {box(t.hours, 'HRS')}
      {box(t.minutes, 'MIN')}
      {box(t.seconds, 'SEC')}
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            background: active === t.id ? 'rgba(201,168,76,0.12)' : 'transparent',
            border: 'none',
            borderBottom: active === t.id ? '2px solid #C9A84C' : '2px solid transparent',
            color: active === t.id ? '#C9A84C' : 'rgba(255,255,255,0.5)',
            padding: '10px 18px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'Montserrat', sans-serif",
            letterSpacing: 0.5,
            marginBottom: -1,
          }}
        >{t.label}</button>
      ))}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = '#C9A84C' }) {
  return (
    <div style={{ ...S.card, borderLeft: `3px solid ${accent}` }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color: accent, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ form, subs }) {
  const today = new Date().toDateString()
  const todayCount = subs.filter(s => new Date(s.timestamp).toDateString() === today).length
  const recent = [...subs].reverse().slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <StatCard label="Total Registrations" value={subs.length} sub="all time" />
        <StatCard label="Today" value={todayCount} sub={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} accent="#3498DB" />
        <StatCard label="Event Date" value={form.eventDate ? formatDate(form.eventDate).split(',')[0] : '—'} sub={form.eventDate ? formatDate(form.eventDate).split(',').slice(1).join(',').trim() : 'Not set'} accent="#E4600A" />
      </div>

      {/* Countdown */}
      {form.eventDate && (
        <div style={S.card}>
          <div style={S.label}>Countdown to Event</div>
          <Countdown dateStr={form.eventDate} />
        </div>
      )}

      {/* Recent submissions */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={S.label}>Recent Registrations</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Last {recent.length}</div>
        </div>
        {recent.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', padding: 20 }}>No submissions yet</div>
        )}
        {recent.map(s => {
          const name = s.data?.f_name || s.data?.[form.fields?.[0]?.id] || 'Unknown'
          const email = s.data?.f_email || ''
          return (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{email}</div>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>
                {new Date(s.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick links */}
      <div style={S.card}>
        <div style={S.label}>Quick Links</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {form.shareUrl && (
            <a href={form.shareUrl} target="_blank" rel="noreferrer" style={{ ...S.btn('#C9A84C', 'outline'), textDecoration: 'none' }}>
              Open Registration Form ↗
            </a>
          )}
          <button style={S.btn('#3498DB', 'outline')} onClick={() => exportCSV(form.id)}>
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Submissions tab ───────────────────────────────────────────────────────────
function SubmissionsTab({ form, subs, onDelete }) {
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)

  const filtered = subs.filter(s => {
    if (!search) return true
    const str = JSON.stringify(s.data).toLowerCase()
    return str.includes(search.toLowerCase())
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          style={{ ...S.input, maxWidth: 260 }}
          placeholder="Search submissions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button style={S.btn('#2ECC71', 'outline')} onClick={() => exportCSV(form.id)}>
          ↓ Export CSV ({subs.length})
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 36 }}>#</th>
              <th style={thStyle}>Time</th>
              {form.fields?.slice(0, 4).map(f => (
                <th key={f.id} style={thStyle}>{f.label}</th>
              ))}
              <th style={{ ...thStyle, width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)' }}>
                  No submissions found
                </td>
              </tr>
            )}
            {filtered.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={tdStyle}>{subs.length - subs.indexOf(s)}</td>
                <td style={tdStyle}>
                  {new Date(s.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                {form.fields?.slice(0, 4).map(f => {
                  const v = s.data?.[f.id]
                  const display = f.type === 'whatsapp'
                    ? `${v?.code || ''} ${v?.number || ''}`
                    : Array.isArray(v) ? v.join(', ') : (v || '—')
                  return <td key={f.id} style={tdStyle}>{String(display).slice(0, 40)}</td>
                })}
                <td style={{ ...tdStyle, display: 'flex', gap: 6 }}>
                  <button style={{ ...S.btn('#C9A84C', 'outline'), padding: '4px 8px', fontSize: 10 }} onClick={() => setDetail(s)}>View</button>
                  <button style={{ ...S.btn('#E4600A', 'outline'), padding: '4px 8px', fontSize: 10 }} onClick={() => onDelete(s.id)}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {detail && (
        <div style={modalBg} onClick={() => setDetail(null)}>
          <div style={{ ...modalBox, maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Submission Detail</div>
              <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }} onClick={() => setDetail(null)}>×</button>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
              {new Date(detail.timestamp).toLocaleString()}
            </div>
            {form.fields?.map(f => {
              const v = detail.data?.[f.id]
              const display = f.type === 'whatsapp'
                ? `${v?.code || ''} ${v?.number || ''}`
                : Array.isArray(v) ? v.join(', ') : (v || '—')
              return (
                <div key={f.id} style={{ marginBottom: 12 }}>
                  <div style={S.label}>{f.label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>{String(display)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle = { background: 'rgba(255,255,255,0.05)', padding: '8px 10px', textAlign: 'left', fontSize: 10, color: '#C9A84C', letterSpacing: 1, fontWeight: 700 }
const tdStyle = { padding: '9px 10px', color: 'rgba(255,255,255,0.75)', verticalAlign: 'middle' }
const modalBg = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
const modalBox = { background: '#1a0d2e', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 14, padding: 28, width: '100%', maxHeight: '90vh', overflowY: 'auto' }

// ── Speakers tab ──────────────────────────────────────────────────────────────
function SpeakersTab({ form, onChange }) {
  const [speakers, setSpeakers] = useState(form.speakers || [])
  const [editing, setEditing] = useState(null) // null | 'new' | speaker obj

  const save = (spk) => {
    const updated = editing === 'new'
      ? [...speakers, { ...spk, id: uid() }]
      : speakers.map(s => s.id === spk.id ? spk : s)
    setSpeakers(updated)
    onChange({ ...form, speakers: updated })
    setEditing(null)
  }

  const remove = (id) => {
    const updated = speakers.filter(s => s.id !== id)
    setSpeakers(updated)
    onChange({ ...form, speakers: updated })
  }

  const move = (id, dir) => {
    const idx = speakers.findIndex(s => s.id === id)
    if (idx < 0) return
    const arr = [...speakers]
    const swap = idx + dir
    if (swap < 0 || swap >= arr.length) return
    ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
    setSpeakers(arr)
    onChange({ ...form, speakers: arr })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{speakers.length} speaker{speakers.length !== 1 ? 's' : ''} on lineup</div>
        <button style={S.btn('#C9A84C')} onClick={() => setEditing('new')}>+ Add Speaker</button>
      </div>

      {speakers.map((spk, i) => (
        <div key={spk.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C9A84C, #e8c060)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 16, color: '#1a0d2e', flexShrink: 0,
            overflow: 'hidden',
          }}>
            {spk.photo ? <img src={spk.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (spk.name || '?')[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{spk.name || 'Unnamed'}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{spk.topic || 'No topic set'}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ ...S.btn('rgba(255,255,255,0.3)', 'outline'), padding: '4px 8px' }} onClick={() => move(spk.id, -1)} disabled={i === 0}>↑</button>
            <button style={{ ...S.btn('rgba(255,255,255,0.3)', 'outline'), padding: '4px 8px' }} onClick={() => move(spk.id, 1)} disabled={i === speakers.length - 1}>↓</button>
            <button style={{ ...S.btn('#C9A84C', 'outline'), padding: '4px 8px', fontSize: 10 }} onClick={() => setEditing(spk)}>Edit</button>
            <button style={{ ...S.btn('#E4600A', 'outline'), padding: '4px 8px', fontSize: 10 }} onClick={() => remove(spk.id)}>Remove</button>
          </div>
        </div>
      ))}

      {speakers.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
          No speakers yet. Click "Add Speaker" to build your lineup.
        </div>
      )}

      {editing && (
        <SpeakerEditorModal
          speaker={editing === 'new' ? { name: '', topic: '', bio: '', email: '' } : editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function SpeakerEditorModal({ speaker, onSave, onClose }) {
  const [data, setData] = useState(speaker)
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  return (
    <div style={modalBg} onClick={onClose}>
      <div style={{ ...modalBox, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{data.id ? 'Edit Speaker' : 'Add Speaker'}</div>
          <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }} onClick={onClose}>×</button>
        </div>
        {[
          ['name', 'Full Name', 'Dr. Jane Smith'],
          ['topic', 'Talk Topic', 'Faith & Business Strategy'],
          ['email', 'Email', 'speaker@example.com'],
          ['instagram', 'Instagram handle', '@username'],
        ].map(([k, l, ph]) => (
          <div key={k} style={{ marginBottom: 14 }}>
            <label style={S.label}>{l}</label>
            <input style={S.input} value={data[k] || ''} onChange={e => set(k, e.target.value)} placeholder={ph} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Bio / Notes</label>
          <textarea
            style={{ ...S.input, minHeight: 80, resize: 'vertical' }}
            value={data.bio || ''}
            onChange={e => set('bio', e.target.value)}
            placeholder="Short bio or talk description…"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Photo URL (optional)</label>
          <input style={S.input} value={data.photo || ''} onChange={e => set('photo', e.target.value)} placeholder="https://…" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button style={S.btn('#C9A84C', 'outline')} onClick={onClose}>Cancel</button>
          <button style={S.btn('#C9A84C')} onClick={() => onSave(data)}>Save Speaker</button>
        </div>
      </div>
    </div>
  )
}

// ── Checklist tab ─────────────────────────────────────────────────────────────
function ChecklistTab({ formId }) {
  const [tasks, setTasks] = useState(() => getEventTasks(formId))
  const [newText, setNewText] = useState({ pre: '', during: '', post: '' })

  const toggle = (phase, id) => {
    const updated = {
      ...tasks,
      [phase]: tasks[phase].map(t => t.id === id ? { ...t, done: !t.done } : t),
    }
    setTasks(updated)
    saveEventTasks(formId, updated)
  }

  const addTask = (phase) => {
    if (!newText[phase].trim()) return
    const updated = {
      ...tasks,
      [phase]: [...tasks[phase], { id: uid(), text: newText[phase].trim(), done: false }],
    }
    setTasks(updated)
    saveEventTasks(formId, updated)
    setNewText(n => ({ ...n, [phase]: '' }))
  }

  const removeTask = (phase, id) => {
    const updated = { ...tasks, [phase]: tasks[phase].filter(t => t.id !== id) }
    setTasks(updated)
    saveEventTasks(formId, updated)
  }

  const phases = [
    { key: 'pre', label: 'Pre-Event', accent: '#3498DB' },
    { key: 'during', label: 'During Event', accent: '#C9A84C' },
    { key: 'post', label: 'Post-Event', accent: '#2ECC71' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {phases.map(({ key, label, accent }) => {
        const list = tasks[key] || []
        const done = list.filter(t => t.done).length
        const pct = list.length ? Math.round((done / list.length) * 100) : 0
        return (
          <div key={key} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: accent }}>{label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{done}/{list.length} · {pct}%</div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: accent, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            {list.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div
                  onClick={() => toggle(key, t.id)}
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${t.done ? accent : 'rgba(255,255,255,0.25)'}`,
                    background: t.done ? accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {t.done && <span style={{ color: '#1a0d2e', fontSize: 11, fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ flex: 1, fontSize: 12, color: t.done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)', textDecoration: t.done ? 'line-through' : 'none' }}>
                  {t.text}
                </div>
                <button onClick={() => removeTask(key, t.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 14, cursor: 'pointer', padding: '0 4px' }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                style={{ ...S.input, flex: 1 }}
                placeholder="Add a task…"
                value={newText[key]}
                onChange={e => setNewText(n => ({ ...n, [key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addTask(key)}
              />
              <button style={{ ...S.btn(accent), padding: '8px 14px' }} onClick={() => addTask(key)}>+</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Reminders tab ─────────────────────────────────────────────────────────────
const EMAIL_TEMPLATES = (form, subs) => [
  {
    id: 'week',
    label: '1 Week Before',
    subject: `[Reminder] ${form.title || 'Event'} is one week away!`,
    body: `Hi [Name],

Just a friendly reminder that "${form.title || 'our event'}" is happening in one week!

📅 Date: ${form.eventDate ? formatDate(form.eventDate) : '[Event Date]'}
📍 Location/Link: [Add your meeting link here]

We have ${subs.length} registered attendee${subs.length !== 1 ? 's' : ''} so far and we can't wait to see everyone.

Speakers confirmed:
${(form.speakers || []).map(s => `• ${s.name}${s.topic ? ` – ${s.topic}` : ''}`).join('\n') || '• [Speakers to be confirmed]'}

See you there!
${form.brandName || 'The IWC Concepts Team'}`,
  },
  {
    id: '48h',
    label: '48 Hours Before',
    subject: `[Tomorrow] ${form.title || 'Event'} starts in 48 hours`,
    body: `Hi [Name],

${form.title || 'The event'} is just 48 hours away! Here's everything you need:

📅 Date & Time: ${form.eventDate ? formatDate(form.eventDate) : '[Event Date]'}
🔗 Meeting Link: [Add your link here]
📌 Meeting ID: [Add ID]  Password: [Add password]

We have an incredible lineup ready for you. Come with your questions!

${form.brandName || 'The IWC Concepts Team'}`,
  },
  {
    id: 'dayof',
    label: 'Day of Event',
    subject: `🔴 LIVE TODAY – ${form.title || 'Event'} starts in 1 hour!`,
    body: `Hi [Name],

Today is the day! "${form.title || 'Our event'}" starts in 1 hour.

🔗 Join here: [Meeting Link]
🕐 Start time: [Time]

We're looking forward to seeing you!

${form.brandName || 'The IWC Concepts Team'}`,
  },
  {
    id: 'thankyou',
    label: 'Post-Event Thank You',
    subject: `Thank you for joining ${form.title || 'us'}! 🙏`,
    body: `Hi [Name],

Thank you so much for joining us at "${form.title || 'our event'}"!

We hope it was as impactful for you as it was for us. Here's what comes next:

🎥 Recording: [Will be shared here]
📝 Feedback Form: [feedback link]
📅 Next Event: [Date TBC]

Your presence made the difference. We'd love to hear your thoughts — please take 2 minutes to fill in our feedback form.

With gratitude,
${form.brandName || 'The IWC Concepts Team'}`,
  },
]

function RemindersTab({ form, subs }) {
  const [copied, setCopied] = useState(null)
  const templates = EMAIL_TEMPLATES(form, subs)

  const copy = async (id, text) => {
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
        Pre-built email templates for each stage of your event. Copy and paste into your email client or newsletter tool.
      </div>
      {templates.map(t => (
        <div key={t.id} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#C9A84C' }}>{t.label}</div>
            <button
              style={S.btn(copied === t.id ? '#2ECC71' : '#C9A84C', copied === t.id ? 'fill' : 'outline')}
              onClick={() => copy(t.id, `Subject: ${t.subject}\n\n${t.body}`)}
            >
              {copied === t.id ? '✓ Copied!' : 'Copy Template'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Subject: {t.subject}</div>
          <pre style={{
            fontSize: 11, color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre-wrap',
            background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: 14,
            fontFamily: "'Montserrat', sans-serif", lineHeight: 1.7, margin: 0,
          }}>
            {t.body}
          </pre>
        </div>
      ))}
    </div>
  )
}

// ── Form selector ─────────────────────────────────────────────────────────────
function FormSelector({ forms, selected, onSelect }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '12px 28px',
      background: 'rgba(255,255,255,0.02)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>FORM:</span>
      <select
        value={selected || ''}
        onChange={e => onSelect(e.target.value)}
        style={{
          ...S.input,
          width: 'auto',
          maxWidth: 340,
          padding: '6px 12px',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        <option value="">— Select a form —</option>
        {forms.map(f => (
          <option key={f.id} value={f.id}>{f.title || 'Untitled'} ({f.type === 'feedback' ? 'Feedback' : 'Registration'})</option>
        ))}
      </select>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EventDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initId = searchParams.get('id')

  const [forms, setForms] = useState([])
  const [selectedId, setSelectedId] = useState(initId || null)
  const [tab, setTab] = useState('overview')
  const [subs, setSubs] = useState([])

  // Reload forms and subs
  const reload = useCallback(() => {
    const all = getAllForms()
    setForms(all)
    if (selectedId) setSubs(getFormSubmissions(selectedId))
  }, [selectedId])

  useEffect(() => { reload() }, [reload])

  // Auto-select first form
  useEffect(() => {
    if (!selectedId && forms.length > 0) setSelectedId(forms[0].id)
  }, [forms, selectedId])

  // Auto-refresh every 30s
  useEffect(() => {
    const iv = setInterval(reload, 30000)
    return () => clearInterval(iv)
  }, [reload])

  const form = forms.find(f => f.id === selectedId) || null

  const handleDeleteSub = (subId) => {
    if (!window.confirm('Delete this submission?')) return
    deleteSubmission(selectedId, subId)
    reload()
  }

  const handleFormChange = (updated) => {
    saveForm(updated)
    setForms(getAllForms())
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'submissions', label: `Submissions (${subs.length})` },
    { id: 'speakers', label: 'Speakers' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'reminders', label: 'Reminders' },
  ]

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: 18, cursor: 'pointer', padding: '0 4px 0 0' }}
        >←</button>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #C9A84C, #e8c060)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Playfair Display', serif",
          fontWeight: 900, fontSize: 15, color: '#1A1A2E',
        }}>IW</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.5 }}>Event Dashboard</div>
          <div style={{ fontSize: 9, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase' }}>Live Event Management</div>
        </div>
        <div style={{ flex: 1 }} />
        <button style={S.btn('#C9A84C', 'outline')} onClick={() => navigate('/form-builder')}>
          ← Form Builder
        </button>
        <button style={S.btn('#C9A84C', 'outline')} onClick={() => navigate('/speakers')}>
          Speaker DB
        </button>
        <button style={{ ...S.btn('#C9A84C', 'outline'), fontSize: 10 }} onClick={reload}>
          ↺ Refresh
        </button>
      </header>

      {/* Form selector */}
      <FormSelector forms={forms} selected={selectedId} onSelect={id => { setSelectedId(id); setSubs(getFormSubmissions(id)) }} />

      {/* No forms */}
      {forms.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>No forms yet</div>
          <div style={{ fontSize: 13, marginBottom: 24 }}>Create a registration or feedback form first</div>
          <button style={S.btn('#C9A84C')} onClick={() => navigate('/form-builder')}>Open Form Builder</button>
        </div>
      )}

      {/* No form selected */}
      {forms.length > 0 && !form && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ fontSize: 13 }}>Select a form above to view its dashboard</div>
        </div>
      )}

      {/* Dashboard content */}
      {form && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px 60px' }}>
          {/* Form title */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
              {form.title || 'Untitled Form'}
            </h1>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {form.type === 'feedback' ? 'Feedback Form' : 'Registration Form'}
              {form.eventDate ? ` · ${formatDate(form.eventDate)}` : ''}
              {form.brandName ? ` · ${form.brandName}` : ''}
            </div>
          </div>

          <TabBar tabs={tabs} active={tab} onChange={setTab} />

          {tab === 'overview' && <OverviewTab form={form} subs={subs} />}
          {tab === 'submissions' && <SubmissionsTab form={form} subs={subs} onDelete={handleDeleteSub} />}
          {tab === 'speakers' && <SpeakersTab form={form} onChange={f => { handleFormChange(f); setForms(getAllForms()) }} />}
          {tab === 'checklist' && <ChecklistTab formId={form.id} />}
          {tab === 'reminders' && <RemindersTab form={form} subs={subs} />}
        </div>
      )}
    </div>
  )
}
