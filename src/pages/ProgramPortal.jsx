import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { getPortalContent, getProgramById } from '../utils/formStorage'

const BRAND  = '#6c3fc5'
const BRAND2 = '#9333ea'

function parseVideo(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { provider: 'youtube', embed: `https://www.youtube.com/embed/${yt[1]}?rel=0` }
  const vi = url.match(/vimeo\.com\/(\d+)/)
  if (vi) return { provider: 'vimeo', embed: `https://player.vimeo.com/video/${vi[1]}` }
  return null
}

const TYPE_ICON = { video: '▶', text: '📄', file: '📎' }

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])
  return width
}

export default function ProgramPortal() {
  const navigate    = useNavigate()
  const { programId } = useParams()
  const { user, getAccessToken } = useCustomerAuth()
  const windowWidth = useWindowWidth()
  const isMobile    = windowWidth < 768

  const [program,  setProgram]  = useState(null)
  const [sections, setSections] = useState([])
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [active,   setActive]   = useState(null)
  // Desktop: sidebar visible by default. Mobile: drawer closed by default.
  const [sideOpen, setSideOpen] = useState(() => window.innerWidth >= 768)

  useEffect(() => {
    if (!user || !programId) return
    load()
  }, [user, programId])

  // Close drawer when switching from mobile → desktop
  useEffect(() => {
    if (!isMobile) setSideOpen(true)
  }, [isMobile])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [prog, token] = await Promise.all([getProgramById(programId), getAccessToken()])
      setProgram(prog)
      const { sections: s, items: it } = await getPortalContent(programId, token)
      setSections(s || [])
      setItems(it || [])
      if (it?.length > 0) setActive(it[0])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function selectLesson(item) {
    setActive(item)
    if (isMobile) setSideOpen(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ color: '#9ca3af', fontSize: 15 }}>Loading content…</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#374151', textAlign: 'center' }}>
        {error.includes('enrolled') ? "You don't have access to this program" : error}
      </div>
      <button onClick={() => navigate('/portal')} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>← Back to My Programs</button>
    </div>
  )

  const sectionedItems   = sections.map(s => ({ ...s, items: items.filter(i => i.sectionId === s.id) }))
  const unsectionedItems = items.filter(i => !i.sectionId)
  const totalItems       = items.length

  // ── Sidebar content (shared between desktop aside and mobile drawer) ────────
  const sidebarContent = (
    <>
      <div style={{ padding: '16px 16px 8px', fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase' }}>
        Course Content
      </div>

      {items.length === 0 && (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No lessons published yet.</div>
      )}

      {unsectionedItems.map(item => (
        <SidebarItem key={item.id} item={item} active={active?.id === item.id} onClick={() => selectLesson(item)} />
      ))}

      {sectionedItems.map(sec => (
        <div key={sec.id}>
          <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 800, color: '#374151', background: '#f3f4f6', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
            {sec.title}
          </div>
          {sec.items.map(item => (
            <SidebarItem key={item.id} item={item} active={active?.id === item.id} onClick={() => selectLesson(item)} />
          ))}
          {sec.items.length === 0 && (
            <div style={{ padding: '8px 16px', fontSize: 12, color: '#9ca3af' }}>No lessons yet</div>
          )}
        </div>
      ))}
    </>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(135deg, #0f0a1a, #1e0f3a)',
        padding: '0 16px', display: 'flex', alignItems: 'center', height: 56,
        flexShrink: 0, gap: 12, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/portal')} style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 7, color: 'rgba(255,255,255,0.8)', padding: '5px 12px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>← My Programs</button>

        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {program?.title || 'Program'}
        </div>

        {!isMobile && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
            {totalItems} lesson{totalItems !== 1 ? 's' : ''}
          </div>
        )}

        {/* Lessons toggle — label changes on mobile for clarity */}
        <button
          onClick={() => setSideOpen(o => !o)}
          style={{
            background: sideOpen ? 'rgba(108,63,197,0.5)' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 7, color: '#fff',
            padding: isMobile ? '6px 12px' : '6px 10px',
            fontSize: isMobile ? 12 : 13,
            fontWeight: isMobile ? 700 : 400,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          <span>{sideOpen ? '✕' : '☰'}</span>
          {isMobile && <span>{sideOpen ? 'Close' : 'Lessons'}</span>}
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>

        {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
        {!isMobile && sideOpen && (
          <aside style={{
            width: 300, borderRight: '1px solid #f3f4f6', overflowY: 'auto',
            background: '#fafafa', flexShrink: 0,
          }}>
            {sidebarContent}
          </aside>
        )}

        {/* ── Mobile drawer overlay ────────────────────────────────────────── */}
        {isMobile && sideOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex' }}>
            {/* Backdrop */}
            <div
              onClick={() => setSideOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }}
            />
            {/* Drawer panel */}
            <div style={{
              position: 'relative', zIndex: 1,
              width: '85vw', maxWidth: 320,
              background: '#fafafa', overflowY: 'auto',
              display: 'flex', flexDirection: 'column',
              boxShadow: '4px 0 32px rgba(0,0,0,0.25)',
            }}>
              {/* Drawer header */}
              <div style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb',
                background: '#fff', flexShrink: 0,
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Lessons</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{totalItems} lesson{totalItems !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setSideOpen(false)}
                    style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >✕</button>
                </div>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* ── Main content area ────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
          {!active ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: isMobile ? 'calc(100vh - 56px)' : '100%', color: '#9ca3af', gap: 16, padding: 24 }}>
              <div style={{ fontSize: 52 }}>📚</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', textAlign: 'center' }}>
                {items.length === 0 ? 'No lessons published yet' : 'Select a lesson to get started'}
              </div>
              {isMobile && items.length > 0 && (
                <button
                  onClick={() => setSideOpen(true)}
                  style={{
                    background: `linear-gradient(135deg, ${BRAND}, ${BRAND2})`,
                    color: '#fff', border: 'none', borderRadius: 50,
                    padding: '13px 32px', fontWeight: 700, fontSize: 15,
                    cursor: 'pointer', boxShadow: '0 4px 16px rgba(108,63,197,0.35)',
                  }}
                >
                  Browse Lessons →
                </button>
              )}
            </div>
          ) : (
            <ContentView
              item={active}
              isMobile={isMobile}
              onNext={() => {
                const idx = items.findIndex(i => i.id === active.id)
                if (idx < items.length - 1) setActive(items[idx + 1])
              }}
              hasNext={items.findIndex(i => i.id === active.id) < items.length - 1}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function SidebarItem({ item, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '12px 16px',
      background: active ? '#f5f0ff' : 'transparent',
      border: 'none',
      borderLeft: active ? `3px solid ${BRAND}` : '3px solid transparent',
      cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 13, marginTop: 1, flexShrink: 0, color: active ? BRAND : '#6b7280' }}>
        {TYPE_ICON[item.type] || '📄'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#111827' : '#374151', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </div>
        {item.duration && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{item.duration}</div>}
      </div>
    </button>
  )
}

function ContentView({ item, onNext, hasNext, isMobile }) {
  const video = item.type === 'video' ? parseVideo(item.videoUrl) : null

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '32px 24px 64px' }}>
      <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{TYPE_ICON[item.type]}</span>
        <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
        {item.duration && <><span>·</span><span>{item.duration}</span></>}
      </div>

      <h1 style={{ fontSize: isMobile ? 22 : 'clamp(20px, 3vw, 28px)', fontWeight: 900, color: '#111827', margin: '0 0 16px', lineHeight: 1.25 }}>
        {item.title}
      </h1>

      {item.description && (
        <p style={{ fontSize: 15, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.7 }}>{item.description}</p>
      )}

      {/* Video */}
      {item.type === 'video' && (
        video ? (
          <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', background: '#000', marginBottom: 28 }}>
            <iframe src={video.embed} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title={item.title} />
          </div>
        ) : (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', color: '#dc2626', fontSize: 14, marginBottom: 28 }}>
            Video URL is invalid or not supported. Please contact support.
          </div>
        )
      )}

      {/* Text / rich text */}
      {item.type === 'text' && item.body && (
        <div
          style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.8, color: '#374151', marginBottom: 28 }}
          dangerouslySetInnerHTML={{ __html: item.body }}
        />
      )}

      {/* File */}
      {item.type === 'file' && item.fileUrl && (
        <a
          href={item.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#f5f0ff', border: `1px solid ${BRAND}30`,
            borderRadius: 12, padding: '16px 24px', textDecoration: 'none',
            color: BRAND, fontWeight: 700, fontSize: 15, marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 24 }}>📎</span>
          {item.fileName || 'Download File'}
        </a>
      )}

      {/* Next lesson */}
      {hasNext && (
        <button onClick={onNext} style={{
          marginTop: 8, background: `linear-gradient(135deg, ${BRAND}, ${BRAND2})`,
          color: '#fff', border: 'none', borderRadius: 10,
          padding: isMobile ? '13px 24px' : '13px 28px',
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(108,63,197,0.3)',
          width: isMobile ? '100%' : 'auto',
        }}>
          Next Lesson →
        </button>
      )}
    </div>
  )
}
