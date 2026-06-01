import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllCourses } from '../utils/formStorage'
import SiteNav from '../components/SiteNav'
import SiteFooter from '../components/SiteFooter'
import { Calendar, MapPin, Star, BookOpen, ArrowRight, Search, Clock } from 'lucide-react'

const BRAND = '#6c3fc5'
const GOLD  = '#C9A84C'

const STATUS_ORDER = { open: 0, upcoming: 1, closed: 2, completed: 3 }

function statusColor(s) {
  const map = { open: '#059669', upcoming: BRAND, closed: '#6b7280', completed: '#374151' }
  return map[s] || '#6b7280'
}
function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

const FILTERS = [
  { key: 'all',  label: 'All Courses' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Premium' },
]

export default function Courses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [query,    setQuery]    = useState('')

  useEffect(() => {
    getAllCourses()
      .then(ps => setCourses(ps || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses
      .filter(p => p.status !== 'draft')
      .filter(p => filter === 'all' ? true : p.type === filter)
      .filter(p => {
        if (!q) return true
        return [p.title, p.tagline, p.description, ...(p.tags || [])]
          .filter(Boolean).join(' ').toLowerCase().includes(q)
      })
      .sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))
  }, [courses, filter, query])

  const counts = useMemo(() => {
    const live = courses.filter(p => p.status !== 'draft')
    return {
      all:  live.length,
      free: live.filter(p => p.type === 'free').length,
      paid: live.filter(p => p.type === 'paid').length,
    }
  }, [courses])

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <SiteNav solid />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 60%, #0f0a1a 100%)',
        padding: '130px 24px 60px', textAlign: 'center', color: 'white',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
          Browse Courses
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 900, margin: '0 auto 16px', lineHeight: 1.15, maxWidth: 700 }}>
          Explore Every Course
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
          Free and premium faith-based courses to grow your business, leadership, and impact.
        </p>
      </section>

      {/* Controls */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 0', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  border: filter === f.key ? `2px solid ${BRAND}` : '2px solid #e5e7eb',
                  background: filter === f.key ? '#f5f0ff' : '#fff',
                  color: filter === f.key ? BRAND : '#6b7280',
                  borderRadius: 24, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {f.label}
                <span style={{ fontSize: 11, opacity: 0.7, background: filter === f.key ? `${BRAND}22` : '#f3f4f6', borderRadius: 12, padding: '1px 8px' }}>{counts[f.key]}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search courses…"
              style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #e5e7eb', borderRadius: 24, padding: '10px 16px 10px 40px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px', width: '100%', boxSizing: 'border-box', flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0', fontSize: 15 }}>Loading courses…</div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0' }}>
            <BookOpen size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16 }}>{query || filter !== 'all' ? 'No courses match your filters.' : 'Courses coming soon — check back shortly.'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 24 }}>
            {visible.map(p => <CourseCard key={p.id} course={p} navigate={navigate} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  )
}

function CourseCard({ course, navigate }) {
  const isPaid = course.type === 'paid'
  const canRegister = course.status === 'open'

  function handleCTA() {
    if (canRegister && course.registrationFormId) navigate(`/onboard?courseId=${course.id}`)
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6',
      display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.13)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div style={{ height: 170, background: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
        {course.image
          ? <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6c3fc520, #6c3fc540)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={40} color={BRAND} /></div>
        }
        <span style={{ position: 'absolute', top: 12, left: 12, background: statusColor(course.status), color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px', textTransform: 'capitalize' }}>{course.status}</span>
        {isPaid && (
          <span style={{ position: 'absolute', top: 12, right: 12, background: `linear-gradient(135deg, ${GOLD}, #e8c060)`, borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }} title="Premium course">
            <Star size={15} color="#1A1A2E" fill="#1A1A2E" />
          </span>
        )}
      </div>

      <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>{course.title}</h3>
        {course.tagline && <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{course.tagline}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          {course.startDate && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> {formatDate(course.startDate)}</span>}
          {course.duration && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> {course.duration}</span>}
          {course.venue && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><MapPin size={13} /> {course.venue}</span>}
        </div>
        {course.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {course.tags.slice(0, 3).map(t => (
              <span key={t} style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 11, borderRadius: 20, padding: '2px 8px' }}>{t}</span>
            ))}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCTA}
          disabled={!canRegister}
          style={{
            marginTop: 12, width: '100%', border: 'none', borderRadius: 9, padding: '11px 0',
            fontWeight: 700, fontSize: 13, cursor: canRegister ? 'pointer' : 'not-allowed',
            background: canRegister ? (isPaid ? BRAND : '#059669') : '#e5e7eb',
            color: canRegister ? '#fff' : '#9ca3af',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          {canRegister
            ? <>{isPaid ? 'Register' : 'Join Free'} <ArrowRight size={15} /></>
            : (course.status === 'upcoming' ? 'Coming Soon' : course.status === 'closed' ? 'Registration Closed' : 'Completed')
          }
        </button>
      </div>
    </div>
  )
}
