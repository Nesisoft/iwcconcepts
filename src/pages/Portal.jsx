import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { getMyEnrollments, getAllCourses } from '../utils/formStorage'
import { BookOpen, ArrowRight, ArrowLeft } from 'lucide-react'

const BRAND  = '#6c3fc5'
const BRAND2 = '#9333ea'
const GOLD   = '#C9A84C'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Portal() {
  const navigate = useNavigate()
  const { user, signOut, getAccessToken } = useCustomerAuth()

  const [enrollments,        setEnrollments]        = useState([])
  const [courses,           setCourses]            = useState({})  // id → course
  const [freePortalCourses, setFreePortalCourses]  = useState([])  // free + hasPortalAccess
  const [moreCourses,       setMoreCourses]        = useState([])  // paid + hasPortalAccess, not enrolled
  const [loading,            setLoading]             = useState(true)
  const [error,              setError]               = useState('')

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load(force = false) {
    setError('')
    const CACHE_KEY = `iwc_portal_${user?.email}`
    const CACHE_TTL = 5 * 60 * 1000

    if (!force) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { enrollments: ce, free: cf, more: cm, courses: cp, exp } = JSON.parse(cached)
          if (Date.now() < exp) {
            setEnrollments(ce); setFreePortalCourses(cf); setMoreCourses(cm); setCourses(cp)
            setLoading(false)
            return
          }
        }
      } catch {}
    }

    setLoading(true)
    try {
      const token = await getAccessToken()
      const [rawEnrollments, allProgs] = await Promise.all([
        getMyEnrollments(token),
        getAllCourses(),
      ])

      // Server already deduplicates via DISTINCT ON; dedupe client-side as safety
      const seenIds = new Set()
      const dedupedEnrollments = []
      for (const enr of (rawEnrollments || [])) {
        if (!seenIds.has(enr.courseId)) {
          seenIds.add(enr.courseId)
          dedupedEnrollments.push(enr)
        }
      }
      setEnrollments(dedupedEnrollments)

      // Build course lookup map
      const map = {}
      for (const p of (allProgs || [])) map[p.id] = p
      setCourses(map)

      const enrolledIds = new Set(dedupedEnrollments.map(e => e.courseId))

      const freeProgs = (allProgs || []).filter(p => p.type === 'free' && p.hasPortalAccess && !enrolledIds.has(p.id))
      const moreProgs = (allProgs || []).filter(p => p.type === 'paid' && p.hasPortalAccess && !enrolledIds.has(p.id))

      setMoreCourses(moreProgs)
      setFreePortalCourses(freeProgs)

      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          enrollments: dedupedEnrollments, free: freeProgs, more: moreProgs, courses: map,
          exp: Date.now() + CACHE_TTL,
        }))
      } catch {}
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/portal/login')
  }

  const hasAnyContent = enrollments.length > 0 || freePortalCourses.length > 0

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(135deg, #0f0a1a, #1e0f3a)',
        padding: '0 24px', display: 'flex', alignItems: 'center', height: 60,
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${GOLD}, #e8c060)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 12, color: '#1A1A2E',
          }}>IW</div>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>My Learning Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'none' }}>{user?.email}</span>
          <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
            Your learning hub — everything you're enrolled in, plus free resources.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', color: '#dc2626', fontSize: 14, marginBottom: 24 }}>
            {error} — <button onClick={load} style={{ background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', fontSize: 14 }}>Try again</button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>Loading your courses…</div>
        )}

        {!loading && !error && !hasAnyContent && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <BookOpen size={52} color="#c4b5f8" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#374151', margin: '0 0 8px' }}>No courses yet</h2>
            <p style={{ color: '#9ca3af', fontSize: 15, maxWidth: 360, margin: '0 auto 28px' }}>
              Browse available courses and register to get started.
            </p>
            <button onClick={() => navigate('/courses')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: BRAND, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Browse Courses <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── Section 1: My enrolled courses ──────────────────────────────── */}
        {!loading && enrollments.length > 0 && (
          <Section title="My Courses" subtitle="Courses you're enrolled in">
            {enrollments.map(enr => {
              const prog = courses[enr.courseId]
              return (
                <CourseCard
                  key={enr.id}
                  course={prog}
                  fallbackTitle={enr.courseTitle}
                  badge={enr.paymentRef ? 'Enrolled' : 'Free'}
                  badgeColor={enr.paymentRef ? '#16a34a' : '#0369a1'}
                  badgeBg={enr.paymentRef ? '#dcfce7' : '#e0f2fe'}
                  sub={`Enrolled ${formatDate(enr.enrolledAt)}`}
                  action={prog?.hasPortalAccess ? {
                    label: 'View Content →',
                    onClick: () => navigate(`/portal/course/${enr.courseId}`),
                    primary: true,
                  } : {
                    label: 'Content coming soon',
                    disabled: true,
                  }}
                />
              )
            })}
          </Section>
        )}

        {/* ── Section 2: Free resources (all portal users) ─────────────────── */}
        {!loading && freePortalCourses.length > 0 && (
          <Section title="Free Learning Resources" subtitle="Open to all members — dive in anytime" horizontal onViewAll={() => navigate('/courses')}>
            {freePortalCourses.map(prog => (
              <CourseCard
                key={prog.id}
                course={prog}
                fallbackTitle={prog.title}
                badge="Free"
                badgeColor="#0369a1"
                badgeBg="#e0f2fe"
                sub="Available to all members"
                action={{
                  label: 'Start Learning →',
                  onClick: () => navigate(`/portal/course/${prog.id}`),
                  primary: true,
                }}
              />
            ))}
          </Section>
        )}

        {/* ── Section 3: More paid courses with portal access ─────────────── */}
        {!loading && moreCourses.length > 0 && (
          <Section title="More Courses" subtitle="Enroll to unlock full access" horizontal onViewAll={() => navigate('/courses')}>
            {moreCourses.map(prog => (
              <CourseCard
                key={prog.id}
                course={prog}
                fallbackTitle={prog.title}
                badge="★ Premium"
                badgeColor="#92400e"
                badgeBg="#fef3c7"
                sub="Enroll to unlock"
                action={{
                  label: 'Enroll Now →',
                  onClick: () => navigate(`/onboard?courseId=${prog.id}`),
                  primary: false,
                }}
              />
            ))}
          </Section>
        )}
      </div>

      <div style={{ padding: '20px 24px', textAlign: 'center', borderTop: '1px solid #f3f4f6' }}>
        <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}><ArrowLeft size={14} /> Back to Courses</button>
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, subtitle, children, horizontal, onViewAll }) {
  const kids = [].concat(children).filter(Boolean)
  return (
    <div style={{ marginBottom: 52 }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{subtitle}</p>}
        </div>
        {onViewAll && (
          <button onClick={onViewAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: BRAND, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            View all <ArrowRight size={14} />
          </button>
        )}
      </div>
      {horizontal ? (
        <div style={{
          display: 'flex', gap: 18, overflowX: 'auto',
          paddingBottom: 8, paddingRight: 4,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#e5e7eb transparent',
        }}>
          {kids.map((child, i) => (
            <div key={i} style={{ flexShrink: 0, width: 280, scrollSnapAlign: 'start' }}>{child}</div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Course card ───────────────────────────────────────────────────────────────

function CourseCard({ course, fallbackTitle, badge, badgeColor, badgeBg, sub, action }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Thumbnail */}
      <div style={{ height: 140, background: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
        {course?.image
          ? <img src={course.image} alt={course?.title || fallbackTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6c3fc520, #6c3fc540)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={34} color={BRAND} /></div>
        }
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: badgeBg, color: badgeColor,
          fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 9px',
        }}>{badge}</span>
      </div>

      {/* Info */}
      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
          {course?.title || fallbackTitle}
        </h3>
        {sub && <div style={{ fontSize: 12, color: '#9ca3af' }}>{sub}</div>}
        <div style={{ flex: 1 }} />

        {action?.disabled ? (
          <div style={{ marginTop: 12, width: '100%', borderRadius: 9, padding: '11px 0', fontWeight: 600, fontSize: 12, textAlign: 'center', background: '#f3f4f6', color: '#9ca3af' }}>
            {action.label}
          </div>
        ) : (
          <button
            onClick={action?.onClick}
            style={{
              marginTop: 12, width: '100%', border: 'none', borderRadius: 9,
              padding: '11px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: action?.primary
                ? `linear-gradient(135deg, ${BRAND}, ${BRAND2})`
                : '#f5f0ff',
              color: action?.primary ? '#fff' : BRAND,
            }}
          >
            {action?.label}
          </button>
        )}
      </div>
    </div>
  )
}
