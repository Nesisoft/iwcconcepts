import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSpeakers, saveSpeaker, deleteSpeaker, uid } from '../utils/formStorage'

// ── Shared styles ────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#0f0a1a', fontFamily: "'Montserrat', sans-serif", color: '#fff' },
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

const TAGS = ['Faith', 'Business', 'Health', 'Leadership', 'Education', 'Technology', 'Arts', 'Finance', 'Ministry', 'Wellness', 'Entrepreneurship', 'Family']

const modalBg = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }
const modalBox = { background: '#1a0d2e', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }

// ── Star rating ───────────────────────────────────────────────────────────────
function StarRating({ value = 0, onChange, size = 20 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{
            fontSize: size,
            cursor: onChange ? 'pointer' : 'default',
            color: n <= (hover || value) ? '#C9A84C' : 'rgba(255,255,255,0.15)',
            lineHeight: 1,
          }}
        >★</span>
      ))}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ speaker, size = 64 }) {
  const initials = (speaker.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #C9A84C, #e8c060)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 900, fontSize: size * 0.3, color: '#1a0d2e',
      overflow: 'hidden', flexShrink: 0,
      border: '2px solid rgba(201,168,76,0.3)',
    }}>
      {speaker.photo
        ? <img src={speaker.photo} alt={speaker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  )
}

// ── Social icon ───────────────────────────────────────────────────────────────
function SocialLinks({ speaker }) {
  const links = [
    { key: 'instagram', icon: '📸', url: h => `https://instagram.com/${h.replace('@', '')}` },
    { key: 'linkedin', icon: '💼', url: h => `https://linkedin.com/in/${h.replace('@', '')}` },
    { key: 'twitter', icon: '🐦', url: h => `https://twitter.com/${h.replace('@', '')}` },
    { key: 'facebook', icon: '👤', url: h => `https://facebook.com/${h.replace('@', '')}` },
  ]
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {links.filter(l => speaker[l.key]).map(l => (
        <a
          key={l.key}
          href={speaker[l.key].startsWith('http') ? speaker[l.key] : l.url(speaker[l.key])}
          target="_blank" rel="noreferrer"
          style={{
            fontSize: 14, textDecoration: 'none', opacity: 0.7,
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 6, padding: '3px 7px',
            transition: 'opacity 0.2s',
          }}
          title={l.key}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
        >{l.icon}</a>
      ))}
    </div>
  )
}

// ── Speaker card ──────────────────────────────────────────────────────────────
function SpeakerCard({ speaker, onEdit, onDelete }) {
  return (
    <div style={{
      ...S.card,
      display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'transform 0.2s, border-color 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <Avatar speaker={speaker} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{speaker.name || 'Unnamed'}</div>
          <div style={{ fontSize: 11, color: '#C9A84C', marginBottom: 4 }}>{speaker.topic || 'No topic'}</div>
          <StarRating value={speaker.rating || 0} size={14} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{ ...S.btn('#C9A84C', 'outline'), padding: '4px 10px', fontSize: 10 }} onClick={() => onEdit(speaker)}>Edit</button>
          <button style={{ ...S.btn('#E4600A', 'outline'), padding: '4px 10px', fontSize: 10 }} onClick={() => onDelete(speaker.id)}>Delete</button>
        </div>
      </div>

      {/* Bio */}
      {speaker.bio && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
          {speaker.bio.length > 160 ? speaker.bio.slice(0, 157) + '…' : speaker.bio}
        </div>
      )}

      {/* Tags + social */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {(speaker.tags || []).map(tag => (
            <span key={tag} style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 4, padding: '2px 7px',
              color: '#C9A84C', textTransform: 'uppercase',
            }}>{tag}</span>
          ))}
        </div>
        <SocialLinks speaker={speaker} />
      </div>

      {/* Contact row */}
      {(speaker.email || speaker.whatsapp) && (
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
          {speaker.email && <span>✉ {speaker.email}</span>}
          {speaker.whatsapp && <span>📱 {speaker.whatsapp}</span>}
        </div>
      )}

      {/* Past events */}
      {speaker.pastEvents && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
          Past events: {speaker.pastEvents}
        </div>
      )}
    </div>
  )
}

// ── Speaker editor modal ──────────────────────────────────────────────────────
function SpeakerModal({ speaker, onSave, onClose }) {
  const [data, setData] = useState({
    name: '', topic: '', bio: '', email: '', phone: '', whatsapp: '',
    instagram: '', linkedin: '', twitter: '', facebook: '',
    rating: 0, tags: [], notes: '', pastEvents: '', photo: '',
    ...speaker,
  })
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  const toggleTag = (tag) => {
    set('tags', data.tags.includes(tag) ? data.tags.filter(t => t !== tag) : [...data.tags, tag])
  }

  return (
    <div style={modalBg} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{data.id ? 'Edit Speaker' : 'Add New Speaker'}</div>
          <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }} onClick={onClose}>×</button>
        </div>

        {/* Photo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Avatar speaker={data} size={64} />
          <div style={{ flex: 1 }}>
            <label style={S.label}>Photo URL</label>
            <input style={S.input} value={data.photo || ''} onChange={e => set('photo', e.target.value)} placeholder="https://example.com/photo.jpg" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {[
            ['name', 'Full Name', 'Dr. Jane Smith'],
            ['topic', 'Talk Topic / Specialty', 'Faith & Business'],
          ].map(([k, l, ph]) => (
            <div key={k}>
              <label style={S.label}>{l}</label>
              <input style={S.input} value={data[k] || ''} onChange={e => set(k, e.target.value)} placeholder={ph} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Bio</label>
          <textarea
            style={{ ...S.input, minHeight: 80, resize: 'vertical' }}
            value={data.bio || ''}
            onChange={e => set('bio', e.target.value)}
            placeholder="Short biography or talk description…"
          />
        </div>

        {/* Contact */}
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Contact</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['email', '✉ Email'],
              ['phone', '📞 Phone'],
              ['whatsapp', '💬 WhatsApp'],
            ].map(([k, l]) => (
              <input key={k} style={S.input} value={data[k] || ''} onChange={e => set(k, e.target.value)} placeholder={l} />
            ))}
          </div>
        </div>

        {/* Social handles */}
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Social Handles</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['instagram', '📸 Instagram'],
              ['linkedin', '💼 LinkedIn'],
              ['twitter', '🐦 Twitter / X'],
              ['facebook', '👤 Facebook'],
            ].map(([k, l]) => (
              <input key={k} style={S.input} value={data[k] || ''} onChange={e => set(k, e.target.value)} placeholder={l} />
            ))}
          </div>
        </div>

        {/* Rating */}
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Attendee Rating</label>
          <StarRating value={data.rating || 0} onChange={v => set('rating', v)} />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Tags / Topics</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  fontSize: 10, fontWeight: 700,
                  background: data.tags.includes(tag) ? 'rgba(201,168,76,0.25)' : 'transparent',
                  border: `1px solid ${data.tags.includes(tag) ? '#C9A84C' : 'rgba(255,255,255,0.15)'}`,
                  color: data.tags.includes(tag) ? '#C9A84C' : 'rgba(255,255,255,0.5)',
                  borderRadius: 5, padding: '4px 10px',
                  cursor: 'pointer',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >{tag}</button>
            ))}
          </div>
        </div>

        {/* Past events / notes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={S.label}>Past Events</label>
            <input style={S.input} value={data.pastEvents || ''} onChange={e => set('pastEvents', e.target.value)} placeholder="Catch Up #1, #3…" />
          </div>
          <div>
            <label style={S.label}>Private Notes</label>
            <input style={S.input} value={data.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Internal notes…" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button style={S.btn('#C9A84C', 'outline')} onClick={onClose}>Cancel</button>
          <button style={S.btn('#C9A84C')} onClick={() => onSave({ ...data, id: data.id || uid() })}>
            {data.id ? 'Save Changes' : 'Add Speaker'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SpeakerDatabase() {
  const navigate = useNavigate()
  const [speakers, setSpeakers] = useState([])
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [sortBy, setSortBy] = useState('name') // name | rating | date
  const [editing, setEditing] = useState(null) // null | 'new' | speaker

  const reload = useCallback(() => setSpeakers(getAllSpeakers()), [])
  useEffect(() => { reload() }, [reload])

  const handleSave = (spk) => {
    saveSpeaker(spk)
    reload()
    setEditing(null)
  }

  const handleDelete = (id) => {
    if (!window.confirm('Remove this speaker from the database?')) return
    deleteSpeaker(id)
    reload()
  }

  // Filter + sort
  const displayed = speakers
    .filter(s => {
      const q = search.toLowerCase()
      if (q && !`${s.name} ${s.topic} ${s.bio || ''}`.toLowerCase().includes(q)) return false
      if (filterTag && !(s.tags || []).includes(filterTag)) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'date') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      return (a.name || '').localeCompare(b.name || '')
    })

  // All tags in use
  const allTags = [...new Set(speakers.flatMap(s => s.tags || []))].sort()

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
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.5 }}>Speaker Database</div>
          <div style={{ fontSize: 9, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase' }}>Private Speaker Directory</div>
        </div>
        <div style={{ flex: 1 }} />
        <button style={S.btn('#C9A84C')} onClick={() => setEditing('new')}>+ Add Speaker</button>
        <button style={S.btn('#C9A84C', 'outline')} onClick={() => navigate('/event-dashboard')}>Event Dashboard</button>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 28px 60px' }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ ...S.card, flex: '0 0 auto', textAlign: 'center', padding: '14px 24px' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#C9A84C' }}>{speakers.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>TOTAL SPEAKERS</div>
          </div>
          {speakers.length > 0 && (
            <div style={{ ...S.card, flex: '0 0 auto', textAlign: 'center', padding: '14px 24px' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#C9A84C' }}>
                {(speakers.reduce((s, sp) => s + (sp.rating || 0), 0) / speakers.filter(s => s.rating).length || 0).toFixed(1)}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>AVG RATING</div>
            </div>
          )}
          <div style={{ ...S.card, flex: '0 0 auto', textAlign: 'center', padding: '14px 24px' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#C9A84C' }}>{allTags.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>TOPIC AREAS</div>
          </div>
        </div>

        {/* Search + filter + sort toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            style={{ ...S.input, maxWidth: 280 }}
            placeholder="Search speakers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            style={{ ...S.input, width: 'auto', padding: '8px 12px', cursor: 'pointer' }}
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
          >
            <option value="">All Topics</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            style={{ ...S.input, width: 'auto', padding: '8px 12px', cursor: 'pointer' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="name">Sort: Name</option>
            <option value="rating">Sort: Rating</option>
            <option value="date">Sort: Newest</option>
          </select>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
            {displayed.length} of {speakers.length}
          </div>
        </div>

        {/* Grid */}
        {displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.3)' }}>
            {speakers.length === 0 ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎙️</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>No speakers yet</div>
                <div style={{ fontSize: 13, marginBottom: 24 }}>Start building your private speaker directory</div>
                <button style={S.btn('#C9A84C')} onClick={() => setEditing('new')}>Add First Speaker</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 30, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 14 }}>No speakers match your search</div>
              </>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {displayed.map(spk => (
            <SpeakerCard key={spk.id} speaker={spk} onEdit={setEditing} onDelete={handleDelete} />
          ))}
        </div>
      </div>

      {/* Modal */}
      {editing && (
        <SpeakerModal
          speaker={editing === 'new' ? {} : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
