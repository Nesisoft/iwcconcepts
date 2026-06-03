import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import {
  getPortalContent, getCourseById, getMyProgress, markItemComplete,
  getLessonComments, addLessonComment, deleteLessonComment,
} from '../utils/formStorage'
import {
  Play, FileText, Paperclip, BookOpen, Lock, AlertTriangle,
  ArrowLeft, ArrowRight, Menu, X, CheckCircle, Clock, Award, Zap, Printer,
  MessageCircle, Send, Trash2, CornerDownRight,
} from 'lucide-react'

const BRAND  = '#6c3fc5'
const BRAND2 = '#9333ea'
const GREEN  = '#16a34a'

function parseVideo(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { embed: `https://www.youtube.com/embed/${yt[1]}?rel=0` }
  const vi = url.match(/vimeo\.com\/(\d+)/)
  if (vi) return { embed: `https://player.vimeo.com/video/${vi[1]}` }
  return null
}

const TYPE_ICON = { video: Play, text: FileText, file: Paperclip }
function TypeIcon({ type, size = 14, color }) {
  const Icon = TYPE_ICON[type] || FileText
  return <Icon size={size} color={color} />
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const h = () => setWidth(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return width
}

export default function CoursePortal() {
  const navigate    = useNavigate()
  const { courseId } = useParams()
  const { user, getAccessToken } = useCustomerAuth()
  const windowWidth = useWindowWidth()
  const isMobile    = windowWidth < 768

  const [course,      setCourse]      = useState(null)
  const [sections,     setSections]     = useState([])
  const [items,        setItems]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [active,       setActive]       = useState(null)
  const [view,         setView]         = useState('overview')
  const [sideOpen,     setSideOpen]     = useState(() => window.innerWidth >= 768)
  const [completedIds, setCompletedIds] = useState(new Set())
  const [marking,      setMarking]      = useState(false)
  const [xpToast,      setXpToast]      = useState(false)

  useEffect(() => {
    if (!user || !courseId) return
    load()
  }, [user, courseId])

  useEffect(() => {
    if (!isMobile) setSideOpen(true)
  }, [isMobile])

  async function load() {
    setError('')
    const CACHE_KEY  = `iwc_content_${courseId}`
    const CACHE_TTL  = 10 * 60 * 1000

    // Try cached content first (avoids blank screen on revisit)
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { course: cp, sections: cs, items: ci, exp } = JSON.parse(cached)
        if (Date.now() < exp) {
          setCourse(cp); setSections(cs); setItems(ci)
          setLoading(false)
          // Still refresh progress live
          const token = await getAccessToken()
          const prog = await getMyProgress(courseId, token).catch(() => [])
          setCompletedIds(new Set(prog.map(p => p.itemId)))
          return
        }
      }
    } catch {}

    setLoading(true)
    try {
      const [prog, token] = await Promise.all([getCourseById(courseId), getAccessToken()])
      setCourse(prog)
      const [content, progressList] = await Promise.all([
        getPortalContent(courseId, token),
        getMyProgress(courseId, token).catch(() => []),
      ])
      const { sections: s, items: it } = content
      setSections(s || [])
      setItems(it || [])
      setCompletedIds(new Set(progressList.map(p => p.itemId)))
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          course: prog, sections: s || [], items: it || [],
          exp: Date.now() + CACHE_TTL,
        }))
      } catch {}
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

  function handleStart(item) {
    setView('lesson')
    if (item) setActive(item)
    else if (items.length > 0) setActive(items[0])
    if (isMobile) setSideOpen(false)
  }

  async function handleMarkComplete(item) {
    if (!item || completedIds.has(item.id) || marking) return
    setMarking(true)
    try {
      const token = await getAccessToken()
      await markItemComplete(courseId, item.id, token)
      setCompletedIds(prev => new Set([...prev, item.id]))
      setXpToast(true)
      setTimeout(() => setXpToast(false), 2500)
    } catch (e) {
      console.warn('Mark complete failed:', e)
    } finally {
      setMarking(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalItems       = items.length
  const isComplete       = totalItems > 0 && completedIds.size >= totalItems
  const earnedCert       = course?.awardsCertificate && isComplete
  const firstIncomplete  = items.find(i => !completedIds.has(i.id))
  const sectionedItems   = sections.map(s => ({ ...s, items: items.filter(i => i.sectionId === s.id) }))
  const unsectionedItems = items.filter(i => !i.sectionId)

  // ── Loading / error screens ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ color: '#9ca3af', fontSize: 15 }}>Loading content…</div>
    </div>
  )

  if (error) {
    const isAccessError = error.toLowerCase().includes('enrolled') || error.toLowerCase().includes('access')
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: 16, padding: 24 }}>
        {isAccessError ? <Lock size={46} color="#9ca3af" /> : <AlertTriangle size={46} color="#f59e0b" />}
        <div style={{ fontSize: 18, fontWeight: 700, color: '#374151', textAlign: 'center' }}>
          {isAccessError ? "You don't have access to this course" : 'Could not load content'}
        </div>
        {!isAccessError && <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', maxWidth: 400 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={load} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Try Again</button>
          <button onClick={() => navigate('/portal')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: BRAND, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}><ArrowLeft size={15} /> My Courses</button>
        </div>
      </div>
    )
  }

  // ── Sidebar items (shared between desktop and mobile drawer) ───────────────
  const sidebarContent = (
    <>
      <div style={{ padding: '16px 16px 8px', fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase' }}>
        Course Content
      </div>
      {items.length === 0 && (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No lessons published yet.</div>
      )}
      {unsectionedItems.map(item => (
        <SidebarItem key={item.id} item={item} active={active?.id === item.id} done={completedIds.has(item.id)} onClick={() => selectLesson(item)} />
      ))}
      {sectionedItems.map(sec => (
        <div key={sec.id}>
          <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 800, color: '#374151', background: '#f3f4f6', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
            {sec.title}
          </div>
          {sec.items.map(item => (
            <SidebarItem key={item.id} item={item} active={active?.id === item.id} done={completedIds.has(item.id)} onClick={() => selectLesson(item)} />
          ))}
          {sec.items.length === 0 && <div style={{ padding: '8px 16px', fontSize: 12, color: '#9ca3af' }}>No lessons yet</div>}
        </div>
      ))}
    </>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── XP toast ───────────────────────────────────────────────────────── */}
      {xpToast && (
        <div style={{
          position: 'fixed', top: 70, right: 20, zIndex: 999,
          background: '#dcfce7', border: '1.5px solid #86efac',
          borderRadius: 12, padding: '10px 18px',
          fontSize: 14, fontWeight: 800, color: GREEN,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(22,163,74,0.2)',
          animation: 'fadeInDown 0.25s ease',
        }}>
          <Zap size={16} /> +1 XP earned!
        </div>
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(135deg, #0f0a1a, #1e0f3a)',
        padding: '0 16px', display: 'flex', alignItems: 'center', height: 56,
        flexShrink: 0, gap: 10, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/portal')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 7, color: 'rgba(255,255,255,0.8)', padding: '5px 10px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        }}><ArrowLeft size={13} /> My Courses</button>

        {view === 'lesson' && (
          <button onClick={() => setView('overview')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(108,63,197,0.3)', border: '1px solid rgba(108,63,197,0.5)',
            borderRadius: 7, color: 'rgba(255,255,255,0.85)', padding: '5px 10px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}><BookOpen size={13} /> Overview</button>
        )}

        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {course?.title || 'Course'}
        </div>

        {/* XP badge */}
        {completedIds.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(108,63,197,0.25)', border: '1px solid rgba(108,63,197,0.4)', borderRadius: 20, padding: '3px 10px', flexShrink: 0 }}>
            <Zap size={12} color="#c4b5f8" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#c4b5f8' }}>{completedIds.size} XP</span>
          </div>
        )}

        {view === 'lesson' && (
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
            {sideOpen ? <X size={15} /> : <Menu size={15} />}
            {isMobile && <span>{sideOpen ? 'Close' : 'Lessons'}</span>}
          </button>
        )}
      </header>

      {/* ── Content area ─────────────────────────────────────────────────────── */}
      {view === 'overview' ? (

        /* ── Overview screen ─────────────────────────────────────────────── */
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
          <CourseOverview
            course={course}
            items={items}
            completedIds={completedIds}
            earnedCert={earnedCert}
            firstIncomplete={firstIncomplete}
            isMobile={isMobile}
            onStart={handleStart}
            onViewCertificate={() => navigate(`/portal/certificate/${courseId}`)}
          />
        </div>

      ) : (

        /* ── Lesson view ─────────────────────────────────────────────────── */
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>

          {/* Desktop sidebar */}
          {!isMobile && sideOpen && (
            <aside style={{ width: 300, borderRight: '1px solid #f3f4f6', overflowY: 'auto', background: '#fafafa', flexShrink: 0 }}>
              {sidebarContent}
            </aside>
          )}

          {/* Mobile drawer */}
          {isMobile && sideOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex' }}>
              <div onClick={() => setSideOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
              <div style={{
                position: 'relative', zIndex: 1, width: '85vw', maxWidth: 320,
                background: '#fafafa', overflowY: 'auto', display: 'flex', flexDirection: 'column',
                boxShadow: '4px 0 32px rgba(0,0,0,0.25)',
              }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Lessons</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{totalItems} lesson{totalItems !== 1 ? 's' : ''}</span>
                    <button onClick={() => setSideOpen(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
                  </div>
                </div>
                {sidebarContent}
              </div>
            </div>
          )}

          {/* Main lesson content */}
          <main style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
            {/* Certificate banner */}
            {earnedCert && (
              <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fffbeb)', borderBottom: '2px solid #f59e0b', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Award size={20} color="#d97706" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#92400e', flex: 1 }}>Certificate Earned — you've completed this course!</span>
                <button
                  onClick={() => navigate(`/portal/certificate/${courseId}`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#d97706', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <Printer size={13} /> View Certificate
                </button>
              </div>
            )}

            {!active ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: isMobile ? 'calc(100vh - 56px)' : '100%', color: '#9ca3af', gap: 16, padding: 24 }}>
                <BookOpen size={52} color="#c4b5f8" />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', textAlign: 'center' }}>
                  {items.length === 0 ? 'No lessons published yet' : 'Select a lesson from the sidebar'}
                </div>
                {isMobile && items.length > 0 && (
                  <button onClick={() => setSideOpen(true)} style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND2})`, color: '#fff', border: 'none', borderRadius: 50, padding: '13px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 16px rgba(108,63,197,0.35)' }}>
                    Browse Lessons <ArrowRight size={16} style={{ verticalAlign: 'middle' }} />
                  </button>
                )}
              </div>
            ) : (
              <ContentView
                item={active}
                isMobile={isMobile}
                done={completedIds.has(active.id)}
                marking={marking}
                onMarkComplete={() => handleMarkComplete(active)}
                onNext={() => {
                  const idx = items.findIndex(i => i.id === active.id)
                  if (idx < items.length - 1) setActive(items[idx + 1])
                }}
                hasNext={items.findIndex(i => i.id === active.id) < items.length - 1}
                courseId={courseId}
                courseTitle={course?.title}
                user={user}
                getAccessToken={getAccessToken}
              />
            )}
          </main>
        </div>
      )}
    </div>
  )
}

// ── Course overview screen ─────────────────────────────────────────────────────

function CourseOverview({ course, items, completedIds, earnedCert, firstIncomplete, isMobile, onStart, onViewCertificate }) {
  const total    = items.length
  const done     = completedIds.size
  const pct      = total > 0 ? Math.round(done / total * 100) : 0
  const complete = total > 0 && done >= total

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '28px 20px 80px' : '40px 32px 80px' }}>

      {/* Course image */}
      {course?.image && (
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 28, height: isMobile ? 180 : 240 }}>
          <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Tags */}
      {course?.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {course.tags.map(tag => (
            <span key={tag} style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: '#f5f0ff', color: BRAND }}>{tag}</span>
          ))}
        </div>
      )}

      <h1 style={{ fontSize: isMobile ? 26 : 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#111827', margin: '0 0 10px', lineHeight: 1.2 }}>
        {course?.title}
      </h1>

      {course?.tagline && (
        <p style={{ fontSize: 17, color: BRAND, fontWeight: 600, margin: '0 0 16px', lineHeight: 1.5 }}>{course.tagline}</p>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 24, color: '#6b7280', fontSize: 14 }}>
        {course?.duration && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={15} /> {course.duration}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={15} /> {total} lesson{total !== 1 ? 's' : ''}
        </span>
        {done > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: BRAND, fontWeight: 700 }}>
            <Zap size={15} /> {done} XP earned
          </span>
        )}
        {course?.awardsCertificate && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: earnedCert ? '#d97706' : '#9ca3af' }}>
            <Award size={15} /> {earnedCert ? 'Certificate earned' : 'Certificate on completion'}
          </span>
        )}
      </div>

      {course?.description && (
        <div
          className="rte-content"
          style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, marginBottom: 28 }}
          dangerouslySetInnerHTML={{ __html: course.description }}
        />
      )}

      {/* Progress bar */}
      {done > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>
            <span>Progress</span>
            <span>{done}/{total} lessons · {pct}%</span>
          </div>
          <div style={{ height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${BRAND}, ${BRAND2})`, borderRadius: 5, transition: 'width 0.5s' }} />
          </div>
        </div>
      )}

      {/* Certificate banner */}
      {earnedCert && (
        <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fffbeb)', border: '2px solid #f59e0b', borderRadius: 14, padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <Award size={30} color="#d97706" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#92400e', fontSize: 15, marginBottom: 2 }}>Certificate Earned!</div>
            <div style={{ fontSize: 13, color: '#b45309' }}>You've completed every lesson in this course.</div>
          </div>
          <button
            onClick={onViewCertificate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: '#d97706', color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 18px',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <Printer size={14} /> View & Print Certificate
          </button>
        </div>
      )}

      {/* Start / Continue / Review button */}
      {total > 0 ? (
        <button
          onClick={() => onStart(complete ? items[0] : firstIncomplete)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: complete ? '#f5f0ff' : `linear-gradient(135deg, ${BRAND}, ${BRAND2})`,
            color: complete ? BRAND : '#fff',
            border: complete ? `2px solid ${BRAND}40` : 'none',
            borderRadius: 14, padding: '15px 36px',
            fontWeight: 800, fontSize: 17, cursor: 'pointer',
            boxShadow: complete ? 'none' : '0 4px 24px rgba(108,63,197,0.35)',
          }}
        >
          {complete ? (
            <><CheckCircle size={20} /> Review Course</>
          ) : done > 0 ? (
            <><Play size={20} fill="currentColor" /> Continue Course</>
          ) : (
            <><Play size={20} fill="currentColor" /> Start Course</>
          )}
        </button>
      ) : (
        <div style={{ color: '#9ca3af', fontSize: 14 }}>No lessons published yet.</div>
      )}
    </div>
  )
}

// ── Sidebar lesson item ────────────────────────────────────────────────────────

function SidebarItem({ item, active, done, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '12px 16px',
      background: active ? '#f5f0ff' : 'transparent',
      border: 'none',
      borderLeft: active ? `3px solid ${BRAND}` : '3px solid transparent',
      cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <span style={{ marginTop: 2, flexShrink: 0, display: 'inline-flex' }}>
        {done
          ? <CheckCircle size={14} color="#16a34a" />
          : <TypeIcon type={item.type} size={14} color={active ? BRAND : '#9ca3af'} />
        }
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#111827' : done ? '#374151' : '#374151', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </div>
        {item.duration && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{item.duration}</div>}
      </div>
      {done && !active && <CheckCircle size={13} color="#86efac" style={{ flexShrink: 0, marginTop: 2 }} />}
    </button>
  )
}

// ── Lesson content view ────────────────────────────────────────────────────────

function ContentView({ item, onNext, hasNext, isMobile, done, marking, onMarkComplete, courseId, courseTitle, user, getAccessToken }) {
  const video = item.type === 'video' ? parseVideo(item.videoUrl) : null

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '32px 24px 64px' }}>
      <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <TypeIcon type={item.type} size={13} color="#9ca3af" />
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
            Video URL is invalid or not supported.
          </div>
        )
      )}

      {/* Text */}
      {item.type === 'text' && item.body && (
        <div className="rte-content" style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.8, color: '#374151', marginBottom: 28 }} dangerouslySetInnerHTML={{ __html: item.body }} />
      )}

      {/* File */}
      {item.type === 'file' && item.fileUrl && (
        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#f5f0ff', border: `1px solid ${BRAND}30`, borderRadius: 12, padding: '16px 24px', textDecoration: 'none', color: BRAND, fontWeight: 700, fontSize: 15, marginBottom: 28 }}>
          <Paperclip size={20} /> {item.fileName || 'Download File'}
        </a>
      )}

      {/* Mark as done */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f3f4f6', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        {done ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: GREEN, fontWeight: 700, fontSize: 14 }}>
            <CheckCircle size={20} /> Lesson completed · +1 XP
          </div>
        ) : (
          <button
            onClick={onMarkComplete}
            disabled={marking}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#f0fdf4', border: '2px solid #86efac',
              borderRadius: 10, padding: '12px 24px',
              fontWeight: 700, fontSize: 14, color: GREEN,
              cursor: marking ? 'not-allowed' : 'pointer',
              opacity: marking ? 0.6 : 1,
            }}
          >
            <CheckCircle size={18} /> {marking ? 'Saving…' : 'Mark as Done (+1 XP)'}
          </button>
        )}

        {hasNext && (
          <button onClick={onNext} style={{
            background: `linear-gradient(135deg, ${BRAND}, ${BRAND2})`,
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '12px 24px',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(108,63,197,0.3)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            Next Lesson <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Discussion / Q&A */}
      <LessonDiscussion
        courseId={courseId}
        courseTitle={courseTitle}
        item={item}
        user={user}
        getAccessToken={getAccessToken}
        isMobile={isMobile}
      />
    </div>
  )
}

// ── Lesson discussion / Q&A ────────────────────────────────────────────────────

function LessonDiscussion({ courseId, courseTitle, item, user, getAccessToken, isMobile }) {
  const [comments, setComments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [body,     setBody]     = useState('')
  const [replyTo,  setReplyTo]  = useState(null)   // parent comment id
  const [replyBody, setReplyBody] = useState('')
  const [posting,  setPosting]  = useState(false)

  // Reload comments whenever the lesson changes
  useEffect(() => {
    let cancelled = false
    setLoading(true); setComments([]); setReplyTo(null); setBody('')
    ;(async () => {
      try {
        const token = await getAccessToken()
        const list  = await getLessonComments(courseId, item.id, token)
        if (!cancelled) setComments(list || [])
      } catch { if (!cancelled) setComments([]) }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [courseId, item.id]) // eslint-disable-line

  async function post(text, parentId) {
    const trimmed = (text || '').trim()
    if (!trimmed || posting) return
    setPosting(true)
    try {
      const token = await getAccessToken()
      const created = await addLessonComment({
        courseId, itemId: item.id,
        body: trimmed, parentId: parentId || null,
        authorName: user?.email ? user.email.split('@')[0] : 'Learner',
        courseTitle, lessonTitle: item.title,
        asAdmin: false,
      }, token)
      setComments(c => [...c, created])
      if (parentId) { setReplyTo(null); setReplyBody('') } else setBody('')
    } catch (e) {
      alert('Could not post: ' + e.message)
    } finally {
      setPosting(false)
    }
  }

  async function remove(id) {
    if (!confirm('Delete this comment?')) return
    try {
      const token = await getAccessToken()
      await deleteLessonComment(id, token)
      setComments(c => c.filter(x => x.id !== id && x.parentId !== id))
    } catch (e) {
      alert('Could not delete: ' + e.message)
    }
  }

  const topLevel = comments.filter(c => !c.parentId)
  const repliesOf = (id) => comments.filter(c => c.parentId === id)
  const myEmail = user?.email

  return (
    <div style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid #f3f4f6' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <MessageCircle size={18} color={BRAND} />
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0 }}>
          Discussion {comments.length > 0 && <span style={{ color: '#9ca3af', fontWeight: 600 }}>({comments.length})</span>}
        </h2>
      </div>

      {/* New comment box */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <Avatar name={myEmail} />
        <div style={{ flex: 1 }}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Ask a question or share a thought…"
            rows={2}
            style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.5, background: '#fff', color: '#111827' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={() => post(body)}
              disabled={!body.trim() || posting}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: body.trim() ? `linear-gradient(135deg, ${BRAND}, ${BRAND2})` : '#e5e7eb',
                color: body.trim() ? '#fff' : '#9ca3af',
                border: 'none', borderRadius: 9, padding: '9px 18px',
                fontWeight: 700, fontSize: 13, cursor: body.trim() && !posting ? 'pointer' : 'not-allowed',
              }}
            >
              <Send size={14} /> {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#9ca3af', fontSize: 13, padding: '8px 0' }}>Loading discussion…</div>
      ) : topLevel.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 14, padding: '12px 0' }}>No comments yet — be the first to start the conversation.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {topLevel.map(c => (
            <div key={c.id}>
              <CommentRow comment={c} myEmail={myEmail} onDelete={() => remove(c.id)} onReply={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyBody('') }} />

              {/* Replies */}
              {repliesOf(c.id).length > 0 && (
                <div style={{ marginLeft: isMobile ? 20 : 46, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14, borderLeft: '2px solid #f3f4f6', paddingLeft: 14 }}>
                  {repliesOf(c.id).map(r => (
                    <CommentRow key={r.id} comment={r} myEmail={myEmail} onDelete={() => remove(r.id)} />
                  ))}
                </div>
              )}

              {/* Reply box */}
              {replyTo === c.id && (
                <div style={{ marginLeft: isMobile ? 20 : 46, marginTop: 12, display: 'flex', gap: 8 }}>
                  <input
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') post(replyBody, c.id) }}
                    placeholder="Write a reply…"
                    autoFocus
                    style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                  />
                  <button onClick={() => post(replyBody, c.id)} disabled={!replyBody.trim() || posting} style={{ background: replyBody.trim() ? BRAND : '#e5e7eb', color: replyBody.trim() ? '#fff' : '#9ca3af', border: 'none', borderRadius: 9, padding: '0 14px', fontWeight: 700, fontSize: 13, cursor: replyBody.trim() ? 'pointer' : 'not-allowed' }}>
                    <Send size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CommentRow({ comment, myEmail, onDelete, onReply }) {
  const mine = comment.authorEmail === myEmail
  const when = comment.createdAt ? timeAgo(comment.createdAt) : ''
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <Avatar name={comment.authorName} admin={comment.isAdmin} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{comment.authorName}</span>
          {comment.isAdmin && (
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', background: '#f5f0ff', color: BRAND, borderRadius: 20, padding: '2px 8px' }}>Instructor</span>
          )}
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{when}</span>
        </div>
        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{comment.body}</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 5 }}>
          {onReply && (
            <button onClick={onReply} style={linkBtn}><CornerDownRight size={12} /> Reply</button>
          )}
          {mine && (
            <button onClick={onDelete} style={{ ...linkBtn, color: '#ef4444' }}><Trash2 size={12} /> Delete</button>
          )}
        </div>
      </div>
    </div>
  )
}

function Avatar({ name, admin }) {
  const ch = (name || '?')[0]?.toUpperCase() || '?'
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: admin ? `linear-gradient(135deg, ${BRAND}, ${BRAND2})` : '#e5e7eb',
      color: admin ? '#fff' : '#6b7280',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 800,
    }}>{ch}</div>
  )
}

const linkBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#6b7280', fontSize: 12, fontWeight: 700, padding: 0,
}

function timeAgo(iso) {
  const d = new Date(iso)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}
