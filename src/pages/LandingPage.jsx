import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllCourses, getAllTestimonials } from '../utils/formStorage'
import { accessModeOf } from '../utils/access'
import SiteNav from '../components/SiteNav'
import SiteFooter from '../components/SiteFooter'
import { Calendar, MapPin, Ticket, BookOpen, CircleDot, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

const BRAND = '#6c3fc5'
const GOLD  = '#C9A84C'

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(s) {
  const map = { open: '#059669', upcoming: BRAND, closed: '#6b7280', completed: '#374151', draft: '#9ca3af' }
  return map[s] || '#6b7280'
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Hero Carousel ─────────────────────────────────────────────────────────────

function HeroCarousel({ courses }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)
  const navigate = useNavigate()

  const featured = courses
    .filter(p => p.featured && p.image)
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))

  const goTo = useCallback((i) => {
    setIdx(i)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => goTo((i + 1) % Math.max(featured.length, 1)), 5000)
  }, [featured.length])

  useEffect(() => {
    if (featured.length === 0) return
    timerRef.current = setTimeout(() => goTo((idx + 1) % featured.length), 5000)
    return () => clearTimeout(timerRef.current)
  }, [featured.length]) // eslint-disable-line

  if (featured.length === 0) {
    return (
      <div style={{
        height: '100vh', minHeight: 560,
        background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 50%, #0f0a1a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: 'white', padding: '0 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>IWC Concepts</div>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15 }}>
            Faith · Business · Impact
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 480, margin: '0 auto 32px' }}>
            Empowering entrepreneurs and leaders to grow with purpose.
          </p>
          <button
            onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: GOLD, color: '#1A1A2E', border: 'none', borderRadius: 10, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
          >View Courses <BookOpen size={17} /></button>
        </div>
      </div>
    )
  }

  const slide = featured[idx] || featured[0]

  return (
    <div style={{ position: 'relative', height: '100vh', minHeight: 560, overflow: 'hidden' }}>
      {/* Slides */}
      {featured.map((p, i) => (
        <div
          key={p.id}
          style={{
            position: 'absolute', inset: 0,
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 0.8s ease',
            pointerEvents: i === idx ? 'auto' : 'none',
          }}
        >
          <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(10,5,20,0.85) 0%, rgba(10,5,20,0.4) 60%, transparent 100%)',
          }} />
        </div>
      ))}

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        padding: '0 clamp(24px, 8vw, 100px)',
      }}>
        <div style={{ maxWidth: 560, color: 'white' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
            {slide.status === 'open'
              ? <><CircleDot size={13} /> Open for Registration</>
              : slide.status === 'upcoming'
                ? <><Clock size={13} /> Coming Soon</>
                : slide.status}
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 52px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.15, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            {slide.title}
          </h1>
          {slide.tagline && (
            <p style={{ fontSize: 'clamp(14px, 1.8vw, 19px)', margin: '0 0 8px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
              {slide.tagline}
            </p>
          )}
          {slide.startDate && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 28px' }}>
              <Calendar size={14} /> {formatDate(slide.startDate)}
              {slide.venue && <><span>·</span><MapPin size={14} /> {slide.venue}</>}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const isEv = (slide.courseType || 'course') === 'event'
                // Courses are membership-only → /join. Member events too. Free/paid events register.
                if (!isEv || accessModeOf(slide) === 'plan') { navigate('/join'); return }
                navigate(`/onboard?courseId=${slide.id}`)
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: GOLD, color: '#1A1A2E', border: 'none', borderRadius: 10, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
            >{(slide.courseType || 'course') !== 'event'
                ? 'Join to Access'
                : accessModeOf(slide) === 'plan' ? 'Join to Access'
                : accessModeOf(slide) === 'standalone' ? 'Get Ticket' : 'Register'} <ArrowRight size={17} /></button>
          </div>
        </div>
      </div>

      {/* Arrows */}
      {featured.length > 1 && (
        <>
          <button
            onClick={() => goTo((idx - 1 + featured.length) % featured.length)}
            style={arrowBtn('left')}
            aria-label="Previous"
          ><ChevronLeft size={26} /></button>
          <button
            onClick={() => goTo((idx + 1) % featured.length)}
            style={arrowBtn('right')}
            aria-label="Next"
          ><ChevronRight size={26} /></button>
          {/* Dots */}
          <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === idx ? GOLD : 'rgba(255,255,255,0.4)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function arrowBtn(side) {
  return {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    [side]: 20,
    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%',
    width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', cursor: 'pointer', lineHeight: 1,
  }
}

// ── Membership band (above the courses — "join to unlock everything") ──────────

function MembershipBand() {
  const navigate = useNavigate()
  return (
    <section style={{ background: 'linear-gradient(135deg, #1e0f3a 0%, #0f0a1a 100%)', padding: '66px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14 }}>
          Membership
        </div>
        <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15 }}>
          One membership. Every course unlocked.
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', maxWidth: 620, margin: '0 auto 28px', lineHeight: 1.7 }}>
          Courses aren’t sold one by one — you join a membership package and unlock everything in your tier (and every tier below) for as long as your plan is active. Renew or upgrade anytime.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/join')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg, ${GOLD}, #e8c060)`, color: '#1A1A2E', border: 'none', borderRadius: 30, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 24px rgba(201,168,76,0.35)' }}>
            <Ticket size={18} /> Become a Member
          </button>
          <button onClick={() => navigate('/courses')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 30, padding: '14px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            See what’s included
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course }) {
  const navigate = useNavigate()
  // Courses are membership-only → one CTA everywhere: "Join to Access" → /join.
  const canRegister = course.status === 'open'

  function handleCTA() {
    if (canRegister) navigate('/join')
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #f3f4f6',
      display: 'flex', flexDirection: 'column',
      height: '100%', boxSizing: 'border-box',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.13)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      {/* Image */}
      <div style={{ height: 180, flexShrink: 0, background: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
        {course.image
          ? <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6c3fc520, #6c3fc540)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={40} color={BRAND} /></div>
        }
        <span style={{
          position: 'absolute', top: 12, left: 12,
          background: statusColor(course.status), color: '#fff',
          fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
          textTransform: 'capitalize',
        }}>{course.status}</span>
        <span style={{
          position: 'absolute', bottom: 10, left: 12,
          background: course.courseType === 'event' ? '#f59e0b' : '#6c3fc5',
          color: '#fff', fontSize: 10, fontWeight: 700,
          borderRadius: 20, padding: '3px 10px',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{course.courseType === 'event' ? 'Event' : 'Course'}</span>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.3, minHeight: '2.6em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</h3>
        {course.tagline && (
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.tagline}</p>
        )}
        {course.description && (
          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {course.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          {course.startDate && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> {formatDate(course.startDate)}</span>}
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
            background: canRegister ? BRAND : '#e5e7eb',
            color: canRegister ? '#fff' : '#9ca3af',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          {canRegister
            ? <>Join to Access <ArrowRight size={15} /></>
            : (course.status === 'upcoming' ? 'Coming Soon' : course.status === 'closed' ? 'Registration Closed' : 'Completed')
          }
        </button>
      </div>
    </div>
  )
}

// ── Upcoming Events Section ───────────────────────────────────────────────────

function EventCard({ course }) {
  const navigate = useNavigate()
  const isPaid = accessModeOf(course) === 'standalone'
  const canRegister = course.status === 'open' && (course.registrationFormId || isPaid)

  return (
    <div style={{
      flex: '0 0 300px',
      height: '100%', boxSizing: 'border-box',
      background: 'linear-gradient(160deg, #1e1040 0%, #2a1558 100%)',
      borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: '0 6px 28px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.35)' }}
    >
      <div style={{ height: 150, flexShrink: 0, background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
        {course.image
          ? <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={36} color="rgba(245,158,11,0.5)" />
            </div>
        }
        <span style={{
          position: 'absolute', top: 10, left: 12,
          background: course.status === 'open' ? '#f59e0b' : 'rgba(255,255,255,0.15)',
          color: course.status === 'open' ? '#111827' : 'rgba(255,255,255,0.6)',
          fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px', textTransform: 'capitalize',
        }}>{course.status}</span>
      </div>
      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Event</div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.3, minHeight: '2.6em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</h3>
        {course.tagline && <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.tagline}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
          {course.startDate && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              <Calendar size={12} color="#f59e0b" /> {formatDate(course.startDate)}
            </span>
          )}
          {course.venue && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              <MapPin size={12} color="#f59e0b" /> {course.venue}
            </span>
          )}
        </div>
        <button
          onClick={() => canRegister && navigate(`/onboard?courseId=${course.id}`)}
          disabled={!canRegister}
          style={{
            marginTop: 'auto', paddingTop: 10,
            padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none',
            background: canRegister ? '#f59e0b' : 'rgba(255,255,255,0.08)',
            color: canRegister ? '#111827' : 'rgba(255,255,255,0.35)',
            cursor: canRegister ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.15s',
          }}
        >
          {canRegister ? (isPaid ? 'Get Ticket →' : 'Register Now →') : course.status === 'upcoming' ? 'Coming Soon' : 'Registration Closed'}
        </button>
      </div>
    </div>
  )
}

function UpcomingEventsSection({ events }) {
  const visible = events
    .filter(e => e.status !== 'draft')
    .sort((a, b) => {
      if (!a.startDate) return 1
      if (!b.startDate) return -1
      return new Date(a.startDate) - new Date(b.startDate)
    })

  if (visible.length === 0) return null

  return (
    <section style={{ background: '#0f0a1a', padding: '64px 0 72px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
            What's On
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 900, color: '#fff', margin: 0 }}>
            Upcoming Events
          </h2>
        </div>
        <div style={{
          display: 'flex', gap: 20,
          overflowX: 'auto', paddingBottom: 12,
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          {visible.map(e => <EventCard key={e.id} course={e} />)}
        </div>
      </div>
    </section>
  )
}



const COURSES_LIMIT = 8

function CoursesSection({ courses }) {
  const navigate = useNavigate()
  const STATUS_ORDER = { open: 0, upcoming: 1, closed: 2, completed: 3 }
  const visible = courses
    .filter(p => p.status !== 'draft')
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))

  const shown   = visible.slice(0, COURSES_LIMIT)
  const hasMore = visible.length > COURSES_LIMIT

  return (
    <section id="courses" style={{ background: '#f9fafb', padding: '80px 0 80px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: BRAND, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Our Courses</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, color: '#111827', margin: 0 }}>Grow With Purpose</h2>
          </div>
          <button onClick={() => navigate('/courses')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: BRAND, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            View All Courses <ArrowRight size={14} />
          </button>
        </div>

        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0', fontSize: 16 }}>
            Courses coming soon — check back shortly.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            {shown.map(p => (
              <div key={p.id} style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column' }}>
                <CourseCard course={p} />
              </div>
            ))}
            {hasMore && (
              <div style={{ flex: '0 0 150px', display: 'flex', alignItems: 'stretch' }}>
                <button onClick={() => navigate('/courses')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'none', border: `2px dashed ${BRAND}50`, borderRadius: 16, padding: '24px 16px', cursor: 'pointer', color: BRAND, fontWeight: 700, fontSize: 13, width: '100%' }}>
                  <ArrowRight size={22} />
                  {visible.length - COURSES_LIMIT} more
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Testimonials Strip ────────────────────────────────────────────────────────

function TestimonialsSection({ testimonials }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)
  const visible = testimonials.filter(t => t.visible)

  const goTo = useCallback((i) => {
    setIdx(i)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => goTo((i + 1) % Math.max(visible.length, 1)), 4500)
  }, [visible.length])

  useEffect(() => {
    if (visible.length === 0) return
    timerRef.current = setTimeout(() => goTo(1 % visible.length), 4500)
    return () => clearTimeout(timerRef.current)
  }, [visible.length]) // eslint-disable-line

  if (visible.length === 0) return null

  const t = visible[idx]

  return (
    <section style={{ background: '#fff', padding: '80px 24px', borderTop: '1px solid #f3f4f6' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Testimonials</div>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 900, color: '#111827', margin: 0 }}>
            Lives Transformed
          </h2>
        </div>

        {/* Carousel */}
        <div style={{ position: 'relative', minHeight: 220 }}>
          {visible.map((item, i) => (
            <div
              key={item.id}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                top: 0, left: 0, right: 0,
                opacity: i === idx ? 1 : 0,
                transition: 'opacity 0.6s ease',
                pointerEvents: i === idx ? 'auto' : 'none',
              }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #f5f0ff, #ede9fe)',
                borderRadius: 20, padding: '36px 40px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, color: BRAND, lineHeight: 1, marginBottom: 16, opacity: 0.3 }}>"</div>
                <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7, color: '#374151', margin: '0 0 24px', fontStyle: 'italic' }}>
                  {item.quote}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  {item.authorPhoto
                    ? <img src={item.authorPhoto} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: 48, height: 48, borderRadius: '50%', background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18 }}>{(item.authorName || '?')[0]}</div>
                  }
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{item.authorName}</div>
                    {item.authorTitle && <div style={{ fontSize: 12, color: '#6b7280' }}>{item.authorTitle}</div>}
                    <div>{'★'.repeat(item.rating || 5)}<span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - (item.rating || 5))}</span></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        {visible.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24 }}>
            {visible.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === idx ? BRAND : '#d1d5db',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [courses, setCourses] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllCourses(), getAllTestimonials()])
      .then(([ps, ts]) => { setCourses(ps); setTestimonials(ts) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
      <SiteNav />

      {loading ? (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0a1a' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Loading…</div>
        </div>
      ) : (
        <>
          <HeroCarousel courses={courses} />
          <UpcomingEventsSection events={courses.filter(c => c.courseType === 'event' && (c.audience?.type || 'public') !== 'restricted')} />
          <MembershipBand />
          <CoursesSection courses={courses.filter(c => (c.courseType || 'course') !== 'event')} />
          <TestimonialsSection testimonials={testimonials} />
          <SiteFooter />
        </>
      )}
    </div>
  )
}
