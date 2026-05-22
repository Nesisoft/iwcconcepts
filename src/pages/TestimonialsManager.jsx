import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllTestimonials, saveTestimonial, deleteTestimonial, getAllPrograms } from '../utils/formStorage'
import { uid } from '../utils/formStorage'
import { uploadToCloudinary } from '../utils/cloudinary'

const ACCENT = '#6c3fc5'

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => !readonly && onChange(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: 24,
            cursor: readonly ? 'default' : 'pointer',
            color: n <= (hovered || value) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.15s',
          }}
        >★</span>
      ))}
    </div>
  )
}

function makeDefault() {
  return {
    id: uid(),
    programId: '',
    authorName: '',
    authorTitle: '',
    authorPhoto: '',
    quote: '',
    rating: 5,
    visible: true,
    createdAt: new Date().toISOString(),
  }
}

export default function TestimonialsManager() {
  const navigate = useNavigate()
  const [testimonials, setTestimonials] = useState([])
  const [programs, setPrograms] = useState([])
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterVisible, setFilterVisible] = useState('all')
  const saveTimer = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [ts, ps] = await Promise.all([getAllTestimonials(), getAllPrograms()])
    setTestimonials(ts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    setPrograms(ps)
  }

  function selectTestimonial(t) {
    setSelected(t.id)
    setDraft({ ...t })
    setSaveMsg('')
  }

  function newTestimonial() {
    const t = makeDefault()
    setTestimonials(prev => [t, ...prev])
    selectTestimonial(t)
  }

  function patch(updates) {
    const next = { ...draft, ...updates }
    setDraft(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persistDraft(next), 600)
  }

  async function persistDraft(t) {
    setSaving(true)
    try {
      await saveTestimonial({ ...t, updatedAt: new Date().toISOString() })
      setTestimonials(prev => prev.map(x => x.id === t.id ? { ...t } : x))
      setSaveMsg('Saved')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch {
      setSaveMsg('Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this testimonial?')) return
    await deleteTestimonial(id)
    setTestimonials(prev => prev.filter(t => t.id !== id))
    if (selected === id) { setSelected(null); setDraft(null) }
  }

  async function toggleVisible(t, e) {
    e.stopPropagation()
    const updated = { ...t, visible: !t.visible }
    await saveTestimonial(updated)
    setTestimonials(prev => prev.map(x => x.id === t.id ? updated : x))
    if (selected === t.id) setDraft(updated)
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file, { maxPx: 200, quality: 0.75 })
      patch({ authorPhoto: url })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const filtered = testimonials.filter(t => {
    if (filterVisible === 'visible' && !t.visible) return false
    if (filterVisible === 'hidden' && t.visible) return false
    const q = search.toLowerCase()
    return !q || t.authorName?.toLowerCase().includes(q) || t.quote?.toLowerCase().includes(q)
  })

  const programName = id => programs.find(p => p.id === id)?.title || ''

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate('/admin')}
          style={{ background: 'none', border: 'none', color: ACCENT, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
        >← Dashboard</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827', flex: 1 }}>Testimonials Manager</h1>
        <button
          onClick={newTestimonial}
          style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >+ New Testimonial</button>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Left panel */}
        <div style={{ width: 320, borderRight: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              placeholder="Search testimonials…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'visible', 'hidden'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterVisible(f)}
                  style={{
                    flex: 1, border: 'none', borderRadius: 6, padding: '5px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: filterVisible === f ? ACCENT : '#f3f4f6',
                    color: filterVisible === f ? '#fff' : '#6b7280',
                  }}
                >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: 32, fontSize: 14 }}>No testimonials found</div>
            )}
            {filtered.map(t => (
              <div
                key={t.id}
                onClick={() => selectTestimonial(t)}
                style={{
                  padding: '14px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                  background: selected === t.id ? '#f5f0ff' : '#fff',
                  borderLeft: selected === t.id ? `3px solid ${ACCENT}` : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  {t.authorPhoto
                    ? <img src={t.authorPhoto} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: ACCENT }}>{(t.authorName || '?')[0].toUpperCase()}</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.authorName || 'Unnamed'}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.authorTitle || 'No title'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <button
                      onClick={e => toggleVisible(t, e)}
                      title={t.visible ? 'Hide' : 'Show'}
                      style={{ background: t.visible ? '#d1fae5' : '#f3f4f6', border: 'none', borderRadius: 12, padding: '2px 8px', fontSize: 11, color: t.visible ? '#065f46' : '#6b7280', cursor: 'pointer', fontWeight: 600 }}
                    >{t.visible ? '● Visible' : '○ Hidden'}</button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(t.id) }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                    >Delete</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.quote || 'No quote yet'}
                </div>
                {t.programId && (
                  <div style={{ fontSize: 11, color: ACCENT, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📌 {programName(t.programId)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — editor */}
        {draft ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {/* Save indicator */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, minHeight: 20 }}>
                {saving && <span style={{ fontSize: 13, color: '#9ca3af' }}>Saving…</span>}
                {!saving && saveMsg && <span style={{ fontSize: 13, color: saveMsg === 'Saved' ? '#059669' : '#ef4444', fontWeight: 600 }}>{saveMsg}</span>}
              </div>

              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {/* Preview header */}
                <div style={{ background: 'linear-gradient(135deg, #6c3fc5 0%, #9333ea 100%)', padding: '24px 32px', color: '#fff' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Preview</div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    {draft.authorPhoto
                      ? <img src={draft.authorPhoto} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} />
                      : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>{(draft.authorName || '?')[0].toUpperCase()}</div>
                    }
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{draft.authorName || 'Author Name'}</div>
                      <div style={{ fontSize: 13, opacity: 0.85 }}>{draft.authorTitle || 'Title / Organization'}</div>
                      <div style={{ marginTop: 4 }}><StarRating value={draft.rating} readonly /></div>
                    </div>
                  </div>
                  {draft.quote && (
                    <div style={{ marginTop: 16, fontSize: 15, fontStyle: 'italic', lineHeight: 1.6, opacity: 0.95 }}>
                      "{draft.quote}"
                    </div>
                  )}
                </div>

                {/* Form fields */}
                <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Author photo */}
                  <div>
                    <label style={labelStyle}>Author Photo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {draft.authorPhoto
                        ? <img src={draft.authorPhoto} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${ACCENT}` }} />
                        : <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>No photo</div>
                      }
                      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
                      <button onClick={() => !uploading && fileRef.current?.click()} disabled={uploading} style={{ ...btnSecondary, opacity: uploading ? 0.6 : 1 }}>{uploading ? 'Uploading…' : 'Upload Photo'}</button>
                      {draft.authorPhoto && (
                        <button onClick={() => patch({ authorPhoto: '' })} style={{ ...btnSecondary, color: '#ef4444', borderColor: '#fca5a5' }}>Remove</button>
                      )}
                    </div>
                  </div>

                  {/* Author name */}
                  <div>
                    <label style={labelStyle}>Author Name *</label>
                    <input
                      value={draft.authorName}
                      onChange={e => patch({ authorName: e.target.value })}
                      placeholder="e.g. Kwame Mensah"
                      style={inputStyle}
                    />
                  </div>

                  {/* Author title */}
                  <div>
                    <label style={labelStyle}>Title / Organization</label>
                    <input
                      value={draft.authorTitle}
                      onChange={e => patch({ authorTitle: e.target.value })}
                      placeholder="e.g. CEO, Mensah Ventures"
                      style={inputStyle}
                    />
                  </div>

                  {/* Quote */}
                  <div>
                    <label style={labelStyle}>Quote *</label>
                    <textarea
                      value={draft.quote}
                      onChange={e => patch({ quote: e.target.value })}
                      placeholder="Write the testimonial quote here…"
                      rows={4}
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label style={labelStyle}>Rating</label>
                    <StarRating value={draft.rating} onChange={v => patch({ rating: v })} />
                  </div>

                  {/* Program link */}
                  <div>
                    <label style={labelStyle}>Linked Program <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                    <select
                      value={draft.programId}
                      onChange={e => patch({ programId: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">— Global testimonial —</option>
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>
                      Global testimonials appear on the landing page. Linked ones also appear on the program's onboarding page.
                    </p>
                  </div>

                  {/* Visible toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid #f3f4f6' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                      <div
                        onClick={() => patch({ visible: !draft.visible })}
                        style={{
                          width: 44, height: 24, borderRadius: 12, background: draft.visible ? ACCENT : '#d1d5db',
                          position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 2, left: draft.visible ? 22 : 2, width: 20, height: 20,
                          borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Show publicly</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>Visible testimonials appear on the landing page and onboarding pages</div>
                      </div>
                    </label>
                  </div>

                  {/* Save button */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => persistDraft(draft)}
                      disabled={saving}
                      style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                    >{saving ? 'Saving…' : 'Save Testimonial'}</button>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      style={{ background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                    >Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>No testimonial selected</div>
              <div style={{ fontSize: 14, marginBottom: 20 }}>Select a testimonial from the list or create a new one</div>
              <button
                onClick={newTestimonial}
                style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >+ New Testimonial</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6,
}

const inputStyle = {
  width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px',
  fontSize: 14, color: '#111827', boxSizing: 'border-box', outline: 'none',
}

const btnSecondary = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 16px',
  fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
}
