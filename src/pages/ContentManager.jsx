import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AdminSelect from '../components/AdminSelect'
import {
  getProgramById,
  getContentSections, saveContentSection, deleteContentSection,
  getContentItems,    saveContentItem,    deleteContentItem,
  uid,
} from '../utils/formStorage'

const ACC  = '#C9A84C'
const ACC2 = '#e8a020'
const DARK = '#0f0a1a'

function parseVideo(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { provider: 'youtube', embed: `https://www.youtube.com/embed/${yt[1]}?rel=0` }
  const vi = url.match(/vimeo\.com\/(\d+)/)
  if (vi) return { provider: 'vimeo', embed: `https://player.vimeo.com/video/${vi[1]}` }
  return null
}

const BLANK_ITEM = (programId, sectionId = null) => ({
  id: uid(), programId, sectionId,
  title: '', type: 'video',
  videoUrl: '', body: '', fileUrl: '', fileName: '',
  description: '', duration: '', order: 0,
  isPublished: false,
})

const BLANK_SECTION = (programId) => ({
  id: uid(), programId,
  title: '', description: '', order: 0,
})

// ── Shared styles ──────────────────────────────────────────────────────────────

const inp = (extra = {}) => ({
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, color: 'white', fontFamily: 'inherit', fontSize: 13,
  padding: '10px 13px', ...extra,
})
const label  = { display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 5, letterSpacing: 0.5 }
const divider = { height: 1, background: 'rgba(255,255,255,0.07)', margin: '18px 0' }

function Fld({ label: l, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {l && <div style={label}>{l.toUpperCase()}</div>}
      {children}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ContentManager() {
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const programId    = params.get('programId')

  const [program,  setProgram]  = useState(null)
  const [sections, setSections] = useState([])
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)

  const [editItem,    setEditItem]    = useState(null)   // content item being edited
  const [editSection, setEditSection] = useState(null)   // section being edited
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(null)

  useEffect(() => {
    if (!programId) { setLoading(false); return }
    Promise.all([
      getProgramById(programId),
      getContentSections(programId),
      getContentItems(programId),
    ]).then(([p, s, it]) => {
      setProgram(p)
      setSections(s || [])
      setItems(it || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [programId])

  async function handleSaveItem(item) {
    setSaving(true)
    try {
      const saved = await saveContentItem(item)
      setItems(prev => {
        const idx = prev.findIndex(i => i.id === saved.id)
        return idx >= 0 ? prev.map(i => i.id === saved.id ? saved : i) : [...prev, saved]
      })
      setEditItem(null)
    } catch (e) { alert('Save failed: ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteItem(id) {
    if (!confirm('Delete this content item?')) return
    setDeleting(id)
    try {
      await deleteContentItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e) { alert('Delete failed: ' + e.message) }
    finally { setDeleting(null) }
  }

  async function handleSaveSection(sec) {
    setSaving(true)
    try {
      const saved = await saveContentSection(sec)
      setSections(prev => {
        const idx = prev.findIndex(s => s.id === saved.id)
        return idx >= 0 ? prev.map(s => s.id === saved.id ? saved : s) : [...prev, saved]
      })
      setEditSection(null)
    } catch (e) { alert('Save failed: ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteSection(id) {
    if (!confirm('Delete this module and ALL its content items?')) return
    setDeleting(id)
    try {
      await deleteContentSection(programId, id)
      setSections(prev => prev.filter(s => s.id !== id))
      setItems(prev => prev.filter(i => i.sectionId !== id))
    } catch (e) { alert('Delete failed: ' + e.message) }
    finally { setDeleting(null) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
      Loading…
    </div>
  )

  if (!programId || !program) return (
    <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: 'white', fontSize: 18 }}>Course not found</div>
      <button onClick={() => navigate('/programs-admin')} style={{ background: ACC, border: 'none', borderRadius: 8, color: '#1A1A2E', padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>← Back</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: DARK, fontFamily: 'Inter, sans-serif', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/programs-admin')} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.7)', padding: '6px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>← Programs</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Content Manager</div>
          <div style={{ fontSize: 11, color: ACC, marginTop: 1 }}>{program.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEditSection(BLANK_SECTION(programId))} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            + Module
          </button>
          <button onClick={() => setEditItem(BLANK_ITEM(programId, sections[0]?.id || null))} style={{ background: ACC, border: 'none', borderRadius: 8, color: '#1A1A2E', padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            + Lesson
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Left: course outline */}
        <div style={{ width: 320, borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', padding: 16 }}>
          {sections.length === 0 && items.filter(i => !i.sectionId).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
              No content yet.<br />Add a module or lesson above.
            </div>
          ) : null}

          {/* Items not in any section */}
          {items.filter(i => !i.sectionId).map(item => (
            <ItemRow key={item.id} item={item} onEdit={setEditItem} onDelete={handleDeleteItem} deleting={deleting} />
          ))}

          {/* Sections with their items */}
          {sections.map(sec => (
            <div key={sec.id} style={{ marginBottom: 16 }}>
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 14 }}>📂</div>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: ACC }}>{sec.title || 'Untitled Module'}</div>
                  <button onClick={() => setEditSection({ ...sec })} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12, padding: '2px 6px' }}>✏</button>
                  <button onClick={() => handleDeleteSection(sec.id)} disabled={deleting === sec.id} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, padding: '2px 6px' }}>✕</button>
                </div>
                {sec.description && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sec.description}</div>}
              </div>
              {items.filter(i => i.sectionId === sec.id).map(item => (
                <ItemRow key={item.id} item={item} onEdit={setEditItem} onDelete={handleDeleteItem} deleting={deleting} indent />
              ))}
              <button onClick={() => setEditItem(BLANK_ITEM(programId, sec.id))} style={{ width: '100%', background: 'none', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.35)', fontSize: 11, padding: '6px', cursor: 'pointer', marginTop: 4 }}>
                + Add lesson to this module
              </button>
            </div>
          ))}
        </div>

        {/* Right: editor panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {editSection ? (
            <SectionEditor
              section={editSection}
              onChange={setEditSection}
              onSave={() => handleSaveSection(editSection)}
              onCancel={() => setEditSection(null)}
              saving={saving}
            />
          ) : editItem ? (
            <ItemEditor
              item={editItem}
              sections={sections}
              onChange={setEditItem}
              onSave={() => handleSaveItem(editItem)}
              onCancel={() => setEditItem(null)}
              saving={saving}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.2)', fontSize: 14, flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 48 }}>🎓</div>
              Select or create a lesson to edit it
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ItemRow({ item, onEdit, onDelete, deleting, indent = false }) {
  const icons = { video: '▶', text: '📄', file: '📎' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 4, marginLeft: indent ? 12 : 0, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span style={{ fontSize: 12, opacity: 0.6 }}>{icons[item.type] || '📄'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: item.isPublished ? 'white' : 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title || 'Untitled'}
        </div>
        {item.duration && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.duration}</div>}
      </div>
      {!item.isPublished && <span style={{ fontSize: 8, fontWeight: 700, background: 'rgba(107,114,128,0.3)', color: '#9ca3af', borderRadius: 4, padding: '2px 5px' }}>DRAFT</span>}
      <button onClick={() => onEdit({ ...item })} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12, padding: '2px 6px', flexShrink: 0 }}>✏</button>
      <button onClick={() => onDelete(item.id)} disabled={deleting === item.id} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, padding: '2px 6px', flexShrink: 0 }}>✕</button>
    </div>
  )
}

function SectionEditor({ section, onChange, onSave, onCancel, saving }) {
  function set(k, v) { onChange(s => ({ ...s, [k]: v })) }
  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 800 }}>
        {section.createdAt ? 'Edit Module' : 'New Module'}
      </h3>
      <Fld label="Module Title"><input style={inp()} value={section.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Week 1 — Introduction" autoFocus /></Fld>
      <Fld label="Description (optional)"><textarea style={inp({ resize: 'vertical' })} rows={3} value={section.description || ''} onChange={e => set('description', e.target.value)} placeholder="Brief overview of what this module covers…" /></Fld>
      <Fld label="Order (lower = first)"><input type="number" style={inp()} value={section.order || 0} min={0} onChange={e => set('order', Number(e.target.value))} /></Fld>
      <EditorActions onSave={onSave} onCancel={onCancel} saving={saving} disabled={!section.title.trim()} />
    </div>
  )
}

function ItemEditor({ item, sections, onChange, onSave, onCancel, saving }) {
  function set(k, v) { onChange(i => ({ ...i, [k]: v })) }
  const video = item.type === 'video' ? parseVideo(item.videoUrl) : null

  return (
    <div style={{ maxWidth: 640 }}>
      <h3 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 800 }}>
        {item.createdAt ? 'Edit Lesson' : 'New Lesson'}
      </h3>

      <Fld label="Title"><input style={inp()} value={item.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Introduction to the course" autoFocus /></Fld>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Fld label="Content Type">
          <AdminSelect
            value={item.type}
            onChange={e => set('type', e.target.value)}
            options={[
              { value: 'video', label: '▶ Video' },
              { value: 'text',  label: '📄 Text / Rich Text' },
              { value: 'file',  label: '📎 File / Document' },
            ]}
            style={{ width: '100%' }}
          />
        </Fld>
        <Fld label="Module">
          <AdminSelect
            value={item.sectionId || ''}
            onChange={e => set('sectionId', e.target.value || null)}
            options={[
              { value: '', label: '— No module —' },
              ...sections.map(s => ({ value: s.id, label: s.title })),
            ]}
            style={{ width: '100%' }}
          />
        </Fld>
      </div>

      {/* Video */}
      {item.type === 'video' && (
        <>
          <Fld label="YouTube or Vimeo URL">
            <input style={inp()} value={item.videoUrl || ''} onChange={e => set('videoUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…" />
          </Fld>
          {video && (
            <div style={{ marginBottom: 14, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '16/9', background: '#000' }}>
              <iframe src={video.embed} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title="preview" />
            </div>
          )}
          {item.videoUrl && !video && (
            <div style={{ marginBottom: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fca5a5' }}>
              Unrecognized URL. Paste a YouTube (youtube.com/watch?v= or youtu.be/) or Vimeo (vimeo.com/) link.
            </div>
          )}
        </>
      )}

      {/* Text */}
      {item.type === 'text' && (
        <Fld label="Content (HTML supported)">
          <textarea
            style={inp({ resize: 'vertical', lineHeight: 1.6, fontFamily: 'monospace', fontSize: 12 })}
            rows={12} value={item.body || ''}
            onChange={e => set('body', e.target.value)}
            placeholder="<p>Type your content here. You can use HTML tags like &lt;strong&gt;, &lt;ul&gt;, &lt;h3&gt;, etc.</p>"
          />
        </Fld>
      )}

      {/* File */}
      {item.type === 'file' && (
        <>
          <Fld label="File URL (Google Drive, Dropbox, Cloudinary, etc.)">
            <input style={inp()} value={item.fileUrl || ''} onChange={e => set('fileUrl', e.target.value)} placeholder="https://drive.google.com/… or direct download link" />
          </Fld>
          <Fld label="File Name (shown to learners)">
            <input style={inp()} value={item.fileName || ''} onChange={e => set('fileName', e.target.value)} placeholder="e.g. Week 1 Worksheet.pdf" />
          </Fld>
        </>
      )}

      <div style={divider} />

      <Fld label="Short description (optional)">
        <input style={inp()} value={item.description || ''} onChange={e => set('description', e.target.value)} placeholder="Brief summary of this lesson…" />
      </Fld>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Fld label="Duration (optional)"><input style={inp()} value={item.duration || ''} onChange={e => set('duration', e.target.value)} placeholder="e.g. 12 min" /></Fld>
        <Fld label="Order (lower = first)"><input type="number" style={inp()} value={item.order || 0} min={0} onChange={e => set('order', Number(e.target.value))} /></Fld>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
        <input type="checkbox" checked={!!item.isPublished} onChange={e => set('isPublished', e.target.checked)} style={{ accentColor: ACC, width: 15, height: 15 }} />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Published (visible to enrolled students)</span>
      </label>

      <EditorActions onSave={onSave} onCancel={onCancel} saving={saving} disabled={!item.title.trim()} />
    </div>
  )
}

function EditorActions({ onSave, onCancel, saving, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={onCancel} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
      <button onClick={onSave} disabled={saving || disabled} style={{ flex: 1, padding: '10px 20px', background: disabled || saving ? 'rgba(201,168,76,0.3)' : ACC, border: 'none', borderRadius: 8, color: '#1A1A2E', fontWeight: 800, fontSize: 13, cursor: saving || disabled ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
