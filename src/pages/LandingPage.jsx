import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllPrograms, getAllTestimonials } from '../utils/formStorage'
import { useAuth } from '../contexts/AuthContext'

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

function priceLabel(p) {
  if (p.type === 'free' || !p.price) return 'FREE'
  return `GHS ${Number(p.price).toLocaleString()}`
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav({ isAuthed }) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(15,10,26,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
      transition: 'all 0.3s',
      padding: '0 24px',
      display: 'flex', alignItems: 'center', height: 64,
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: `linear-gradient(135deg, ${GOLD}, #e8c060)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 14, color: '#1A1A2E',
          fontFamily: "'Playfair Display', serif",
        }}>IW</div>
        <span style={{ color: 'white', fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>IWC CONCEPTS</span>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {isAuthed
          ? <button onClick={() => navigate('/admin')} style={navBtn(true)}>Admin Dashboard →</button>
          : <button onClick={() => navigate('/login')} style={navBtn(false)}>Sign In</button>
        }
      </div>
    </nav>
  )
}

function navBtn(primary) {
  return {
    background: primary ? GOLD : 'rgba(255,255,255,0.1)',
    color: primary ? '#1A1A2E' : 'white',
    border: primary ? 'none' : '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  }
}

// ── Hero Carousel ─────────────────────────────────────────────────────────────

function HeroCarousel({ programs }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)
  const navigate = useNavigate()

  const featured = programs
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
        height: '92vh', minHeight: 500,
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
            onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: GOLD, color: '#1A1A2E', border: 'none', borderRadius: 10, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
          >View Programs ↓</button>
        </div>
      </div>
    )
  }

  const slide = featured[idx] || featured[0]

  return (
    <div style={{ position: 'relative', height: '92vh', minHeight: 500, overflow: 'hidden' }}>
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
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
            {slide.status === 'open' ? '🟢 Open for Registration' : slide.status === 'upcoming' ? '🔜 Coming Soon' : slide.status}
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
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 28px' }}>
              📅 {formatDate(slide.startDate)}{slide.venue ? ` · 📍 ${slide.venue}` : ''}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (slide.registrationFormId) navigate(`/onboard?programId=${slide.id}`)
              }}
              style={{ background: GOLD, color: '#1A1A2E', border: 'none', borderRadius: 10, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
            >{slide.type === 'paid' ? `Register · ${priceLabel(slide)}` : 'Join Free →'}</button>
          </div>
        </div>
      </div>

      {/* Arrows */}
      {featured.length > 1 && (
        <>
          <button
            onClick={() => goTo((idx - 1 + featured.length) % featured.length)}
            style={arrowBtn('left')}
          >‹</button>
          <button
            onClick={() => goTo((idx + 1) % featured.length)}
            style={arrowBtn('right')}
          >›</button>
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
    color: 'white', fontSize: 28, cursor: 'pointer', lineHeight: 1,
  }
}

// ── Program Card ──────────────────────────────────────────────────────────────

function ProgramCard({ program }) {
  const navigate = useNavigate()
  const isPaid = program.type === 'paid'
  const canRegister = ['open'].includes(program.status)

  function handleCTA() {
    if (!canRegister) return
    if (program.registrationFormId) navigate(`/onboard?programId=${program.id}`)
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #f3f4f6',
      display: 'flex', flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.13)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      {/* Image */}
      <div style={{ height: 180, background: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
        {program.image
          ? <img src={program.image} alt={program.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6c3fc520, #6c3fc540)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📚</div>
        }
        <span style={{
          position: 'absolute', top: 12, left: 12,
          background: statusColor(program.status), color: '#fff',
          fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
          textTransform: 'capitalize',
        }}>{program.status}</span>
        <span style={{
          position: 'absolute', top: 12, right: 12,
          background: isPaid ? '#1a0d2e' : '#f0fdf4',
          color: isPaid ? GOLD : '#065f46',
          fontSize: 12, fontWeight: 800, borderRadius: 20, padding: '3px 10px',
        }}>{priceLabel(program)}</span>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>{program.title}</h3>
        {program.tagline && (
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{program.tagline}</p>
        )}
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          {program.startDate && <span>📅 {formatDate(program.startDate)}</span>}
          {program.venue && <span style={{ marginLeft: 10 }}>📍 {program.venue}</span>}
        </div>
        {program.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {program.tags.slice(0, 3).map(t => (
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
          }}
        >
          {canRegister
            ? (isPaid ? `Register — ${priceLabel(program)}` : 'Join Free →')
            : (program.status === 'upcoming' ? 'Coming Soon' : program.status === 'closed' ? 'Registration Closed' : 'Completed')
          }
        </button>
      </div>
    </div>
  )
}

// ── Programs Grid ─────────────────────────────────────────────────────────────

function ProgramsSection({ programs }) {
  const STATUS_ORDER = { open: 0, upcoming: 1, closed: 2, completed: 3 }
  const visible = programs
    .filter(p => p.status !== 'draft')
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))

  return (
    <section id="programs" style={{ background: '#f9fafb', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Our Programs</div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, color: '#111827', margin: 0 }}>
            Grow With Purpose
          </h2>
          <p style={{ color: '#6b7280', marginTop: 12, fontSize: 16, maxWidth: 480, margin: '12px auto 0' }}>
            Faith-based entrepreneurship and leadership programs designed to transform your life and business.
          </p>
        </div>

        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0', fontSize: 16 }}>
            Programs coming soon — check back shortly.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {visible.map(p => <ProgramCard key={p.id} program={p} />)}
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

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: '#0f0a1a', color: 'rgba(255,255,255,0.6)', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `linear-gradient(135deg, ${GOLD}, #e8c060)`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 14, color: '#1A1A2E',
        fontFamily: "'Playfair Display', serif",
        marginBottom: 12,
      }}>IW</div>
      <div style={{ fontWeight: 700, color: 'white', fontSize: 14, marginBottom: 4 }}>IWC Concepts</div>
      <div style={{ fontSize: 12, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>Faith · Business · Impact</div>
      <div style={{ fontSize: 12 }}>© {new Date().getFullYear()} IWC Concepts. All rights reserved.</div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user } = useAuth()
  const [programs, setPrograms] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllPrograms(), getAllTestimonials()])
      .then(([ps, ts]) => { setPrograms(ps); setTestimonials(ts) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
      <Nav isAuthed={!!user} />

      {loading ? (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0a1a' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Loading…</div>
        </div>
      ) : (
        <>
          <HeroCarousel programs={programs} />
          <ProgramsSection programs={programs} />
          <TestimonialsSection testimonials={testimonials} />
          <Footer />
        </>
      )}
    </div>
  )
}
