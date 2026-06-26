import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AdminSelect from '../components/AdminSelect'
import RichTextEditor from '../components/RichTextEditor'
import {
  getCourseById,
  getContentSections, saveContentSection, deleteContentSection,
  getContentItems,    saveContentItem,    deleteContentItem,
  lessonBlocks,
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

const BLANK_BLOCK = (type = 'text') => ({
  id: uid(), type,
  videoUrl: '', body: '', fileUrl: '', fileName: '',
})

const BLANK_ITEM = (courseId, sectionId = null) => ({
  id: uid(), courseId, sectionId,
  title: '',
  blocks: [],
  description: '', duration: '', order: 0,
  isPublished: false,
})

const BLOCK_META = {
  video: { icon: '▶',  label: 'Video' },
  text:  { icon: '📄', label: 'Text / Rich Text' },
  file:  { icon: '📎', label: 'File / Document' },
}

// Icon for a lesson row — a single dominant type, or a stack when it mixes types.
function lessonIcon(item) {
  const blocks = lessonBlocks(item)
  const types  = [...new Set(blocks.map(b => b.type))]
  if (types.length === 0) return '📄'
  if (types.length > 1)   return '🧩'
  return BLOCK_META[types[0]]?.icon || '📄'
}

const BLANK_SECTION = (courseId) => ({
  id: uid(), courseId,
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
  const courseId    = params.get('courseId')

  const [course,  setCourse]  = useState(null)
  const [sections, setSections] = useState([])
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)

  const [editItem,    setEditItem]    = useState(null)   // content item being edited
  const [editSection, setEditSection] = useState(null)   // section being edited
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(null)

  useEffect(() => {
    if (!courseId) { setLoading(false); return }
    Promise.all([
      getCourseById(courseId),
      getContentSections(courseId),
      getContentItems(courseId),
    ]).then(([p, s, it]) => {
      setCourse(p)
      setSections(s || [])
      setItems(it || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [courseId])

  // Open a lesson in the editor, normalizing legacy single-type lessons into the
  // multi-block shape so the editor always works with `blocks`.
  function openLesson(item) {
    setEditItem({ ...item, blocks: lessonBlocks(item) })
  }

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
      await deleteContentSection(courseId, id)
      setSections(prev => prev.filter(s => s.id !== id))
      setItems(prev => prev.filter(i => i.sectionId !== id))
    } catch (e) { alert('Delete failed: ' + e.message) }
    finally { setDeleting(null) }
  }

  // ── Ordering ───────────────────────────────────────────────────────────────
  // Sort by the explicit `order`, falling back to creation time. New lessons /
  // modules append at the END (next order) instead of defaulting to 0 — which is
  // what made later items jump above "lesson 1". Up/down buttons re-normalize the
  // affected group's order to 0..n-1 so existing jumbled content can be fixed too.
  const byOrder = (a, b) => ((Number(a.order) || 0) - (Number(b.order) || 0)) || String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
  const nextSectionOrder = () => (sections.length ? Math.max(...sections.map(s => Number(s.order) || 0)) + 1 : 0)
  const nextItemOrder = (sectionId) => {
    const g = items.filter(i => (i.sectionId || null) === (sectionId || null))
    return g.length ? Math.max(...g.map(i => Number(i.order) || 0)) + 1 : 0
  }

  async function moveSection(sec, dir) {
    const scope = sections.slice().sort(byOrder)
    const idx = scope.findIndex(s => s.id === sec.id)
    if (idx < 0 || idx + dir < 0 || idx + dir >= scope.length) return
    ;[scope[idx], scope[idx + dir]] = [scope[idx + dir], scope[idx]]
    const updated = scope.map((s, i) => ({ ...s, order: i }))
    setSections(prev => prev.map(s => updated.find(u => u.id === s.id) || s))
    try { await Promise.all(updated.map(saveContentSection)) } catch (e) { alert('Reorder failed: ' + e.message) }
  }

  async function moveItem(item, dir) {
    const scope = items.filter(i => (i.sectionId || null) === (item.sectionId || null)).sort(byOrder)
    const idx = scope.findIndex(i => i.id === item.id)
    if (idx < 0 || idx + dir < 0 || idx + dir >= scope.length) return
    ;[scope[idx], scope[idx + dir]] = [scope[idx + dir], scope[idx]]
    const updated = scope.map((it, i) => ({ ...it, order: i }))
    setItems(prev => prev.map(i => updated.find(u => u.id === i.id) || i))
    try { await Promise.all(updated.map(saveContentItem)) } catch (e) { alert('Reorder failed: ' + e.message) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
      Loading…
    </div>
  )

  if (!courseId || !course) return (
    <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: 'white', fontSize: 18 }}>Course not found</div>
      <button onClick={() => navigate('/courses-admin')} style={{ background: ACC, border: 'none', borderRadius: 8, color: '#1A1A2E', padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>← Back</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: DARK, fontFamily: 'Inter, sans-serif', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/courses-admin')} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.7)', padding: '6px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>← Courses</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Content Manager</div>
          <div style={{ fontSize: 11, color: ACC, marginTop: 1 }}>{course.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEditSection({ ...BLANK_SECTION(courseId), order: nextSectionOrder() })} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            + Module
          </button>
          <button onClick={() => { const sid = sections[0]?.id || null; setEditItem({ ...BLANK_ITEM(courseId, sid), order: nextItemOrder(sid) }) }} style={{ background: ACC, border: 'none', borderRadius: 8, color: '#1A1A2E', padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
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
          {(() => {
            const top = items.filter(i => !i.sectionId).sort(byOrder)
            return top.map((item, i) => (
              <ItemRow key={item.id} item={item} onEdit={openLesson} onDelete={handleDeleteItem} deleting={deleting}
                onMove={dir => moveItem(item, dir)} isFirst={i === 0} isLast={i === top.length - 1} />
            ))
          })()}

          {/* Sections with their items */}
          {(() => {
            const secs = sections.slice().sort(byOrder)
            return secs.map((sec, si) => {
              const lessons = items.filter(i => i.sectionId === sec.id).sort(byOrder)
              return (
            <div key={sec.id} style={{ marginBottom: 16 }}>
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 14 }}>📂</div>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: ACC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.title || 'Untitled Module'}</div>
                  <button onClick={() => moveSection(sec, -1)} disabled={si === 0} title="Move up" style={arrowBtn(si === 0)}>▲</button>
                  <button onClick={() => moveSection(sec, 1)} disabled={si === secs.length - 1} title="Move down" style={arrowBtn(si === secs.length - 1)}>▼</button>
                  <button onClick={() => setEditSection({ ...sec })} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12, padding: '2px 6px' }}>✏</button>
                  <button onClick={() => handleDeleteSection(sec.id)} disabled={deleting === sec.id} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, padding: '2px 6px' }}>✕</button>
                </div>
                {sec.description && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sec.description}</div>}
              </div>
              {lessons.map((item, i) => (
                <ItemRow key={item.id} item={item} onEdit={openLesson} onDelete={handleDeleteItem} deleting={deleting} indent
                  onMove={dir => moveItem(item, dir)} isFirst={i === 0} isLast={i === lessons.length - 1} />
              ))}
              <button onClick={() => setEditItem({ ...BLANK_ITEM(courseId, sec.id), order: nextItemOrder(sec.id) })} style={{ width: '100%', background: 'none', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.35)', fontSize: 11, padding: '6px', cursor: 'pointer', marginTop: 4 }}>
                + Add lesson to this module
              </button>
            </div>
              )
            })
          })()}
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

const arrowBtn = (disabled) => ({ background: 'none', border: 'none', color: disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', cursor: disabled ? 'default' : 'pointer', fontSize: 9, padding: '1px 4px', lineHeight: 1, flexShrink: 0 })

function ItemRow({ item, onEdit, onDelete, deleting, indent = false, onMove, isFirst, isLast }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', marginBottom: 4, marginLeft: indent ? 12 : 0, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {onMove && (
        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <button onClick={() => onMove(-1)} disabled={isFirst} title="Move up" style={arrowBtn(isFirst)}>▲</button>
          <button onClick={() => onMove(1)} disabled={isLast} title="Move down" style={arrowBtn(isLast)}>▼</button>
        </div>
      )}
      <span style={{ fontSize: 12, opacity: 0.6 }}>{lessonIcon(item)}</span>
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
      <Fld label="Description (optional)">
        <RichTextEditor dark value={section.description || ''} onChange={v => set('description', v)} placeholder="Brief overview of what this module covers…" minRows={3} />
      </Fld>
      <Fld label="Order (lower = first)"><input type="number" style={inp()} value={section.order || 0} min={0} onChange={e => set('order', Number(e.target.value))} /></Fld>
      <EditorActions onSave={onSave} onCancel={onCancel} saving={saving} disabled={!section.title.trim()} />
    </div>
  )
}

function ItemEditor({ item, sections, onChange, onSave, onCancel, saving }) {
  function set(k, v) { onChange(i => ({ ...i, [k]: v })) }

  const blocks = Array.isArray(item.blocks) ? item.blocks : []

  function addBlock(type) {
    onChange(i => ({ ...i, blocks: [...(i.blocks || []), BLANK_BLOCK(type)] }))
  }
  function updateBlock(id, k, v) {
    onChange(i => ({ ...i, blocks: (i.blocks || []).map(b => b.id === id ? { ...b, [k]: v } : b) }))
  }
  function removeBlock(id) {
    onChange(i => ({ ...i, blocks: (i.blocks || []).filter(b => b.id !== id) }))
  }
  function moveBlock(id, dir) {
    onChange(i => {
      const arr = [...(i.blocks || [])]
      const idx = arr.findIndex(b => b.id === id)
      const swap = idx + dir
      if (idx < 0 || swap < 0 || swap >= arr.length) return i
      ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
      return { ...i, blocks: arr }
    })
  }

  return (
    <div style={{ maxWidth: 660 }}>
      <h3 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 800 }}>
        {item.createdAt ? 'Edit Lesson' : 'New Lesson'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
        <Fld label="Title"><input style={inp()} value={item.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Introduction to the course" autoFocus /></Fld>
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

      <div style={divider} />

      {/* Content blocks — a lesson can mix any number of video / text / file blocks */}
      <div style={{ ...label, marginBottom: 10 }}>CONTENT BLOCKS</div>

      {blocks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 16px', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10, color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>
          No content yet. Add a block below — combine a video, rich text, and downloadable files in one lesson.
        </div>
      )}

      {blocks.map((block, idx) => (
        <BlockEditor
          key={block.id}
          block={block}
          index={idx}
          total={blocks.length}
          onUpdate={(k, v) => updateBlock(block.id, k, v)}
          onRemove={() => removeBlock(block.id)}
          onMove={dir => moveBlock(block.id, dir)}
        />
      ))}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4, marginBottom: 6 }}>
        {Object.entries(BLOCK_META).map(([type, meta]) => (
          <button key={type} onClick={() => addBlock(type)} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.2)',
            borderRadius: 8, color: 'rgba(255,255,255,0.75)', padding: '8px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            + {meta.icon} {meta.label}
          </button>
        ))}
      </div>

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

function BlockEditor({ block, index, total, onUpdate, onRemove, onMove }) {
  const meta  = BLOCK_META[block.type] || BLOCK_META.text
  const video = block.type === 'video' ? parseVideo(block.videoUrl) : null

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, marginBottom: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
      {/* Block header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontSize: 13 }}>{meta.icon}</span>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, color: 'rgba(255,255,255,0.6)' }}>
          {meta.label.toUpperCase()} · BLOCK {index + 1}
        </span>
        <button onClick={() => onMove(-1)} disabled={index === 0} title="Move up" style={blockIconBtn(index === 0)}>↑</button>
        <button onClick={() => onMove(1)} disabled={index === total - 1} title="Move down" style={blockIconBtn(index === total - 1)}>↓</button>
        <button onClick={onRemove} title="Remove block" style={{ ...blockIconBtn(false), color: '#f87171' }}>✕</button>
      </div>

      {/* Block body */}
      <div style={{ padding: '12px 14px' }}>
        {block.type === 'video' && (
          <>
            <input style={inp({ marginBottom: 10 })} value={block.videoUrl || ''} onChange={e => onUpdate('videoUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…" />
            {video && (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '16/9', background: '#000' }}>
                <iframe src={video.embed} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title="preview" />
              </div>
            )}
            {block.videoUrl && !video && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fca5a5' }}>
                Unrecognized URL. Paste a YouTube (youtube.com/watch?v= or youtu.be/) or Vimeo (vimeo.com/) link.
              </div>
            )}
          </>
        )}

        {block.type === 'text' && (
          <RichTextEditor dark value={block.body || ''} onChange={v => onUpdate('body', v)} placeholder="Write your lesson content here…" minRows={8} />
        )}

        {block.type === 'file' && (
          <>
            <input style={inp({ marginBottom: 10 })} value={block.fileUrl || ''} onChange={e => onUpdate('fileUrl', e.target.value)} placeholder="File URL — Google Drive, Dropbox, Cloudinary, or a direct download link" />
            <input style={inp()} value={block.fileName || ''} onChange={e => onUpdate('fileName', e.target.value)} placeholder="File name shown to learners, e.g. Week 1 Worksheet.pdf" />
          </>
        )}
      </div>
    </div>
  )
}

const blockIconBtn = (disabled) => ({
  background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
  fontSize: 13, padding: '2px 6px', lineHeight: 1,
})

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
