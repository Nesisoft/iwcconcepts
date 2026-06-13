import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllCourses, getMembershipPlans } from '../utils/formStorage'
import {
  auditItem, worstSeverity, accessModeOf, isEvent, hasPortal,
} from '../utils/access'
import { ArrowLeft, AlertTriangle, CheckCircle, Lock } from 'lucide-react'

const DARK  = '#0e0a1e'
const BRAND = '#6c3fc5'
const GOLD  = '#C9A84C'

const SEV = {
  error: { c: '#f87171', bg: 'rgba(239,68,68,0.12)',  label: 'Error' },
  warn:  { c: '#fbbf24', bg: 'rgba(245,158,11,0.12)', label: 'Warning' },
  info:  { c: '#60a5fa', bg: 'rgba(59,130,246,0.12)', label: 'Tidy up' },
  ok:    { c: '#34d399', bg: 'rgba(16,185,129,0.12)', label: 'Clean' },
}

const MODE_CHIP = {
  open:       { c: '#34d399', bg: 'rgba(16,185,129,0.15)', t: '🌐 Open' },
  plan:       { c: '#b79df0', bg: 'rgba(108,63,197,0.2)',  t: '🎫 Membership' },
  standalone: { c: GOLD,      bg: 'rgba(201,168,76,0.15)', t: '💳 One-time' },
  event:      { c: '#a78bfa', bg: 'rgba(139,92,246,0.18)', t: '🎪 Event' },
}

function Dot({ severity }) {
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEV[severity].c, flexShrink: 0, display: 'inline-block' }} />
}

function Chip({ c, bg, children, title }) {
  return (
    <span title={title} style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: bg, color: c, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function StatCard({ label, value, sev, active, onClick }) {
  const s = SEV[sev]
  return (
    <button
      onClick={onClick}
      style={{
        flex: '1 1 130px', textAlign: 'left', cursor: 'pointer',
        background: active ? s.bg : 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${active ? s.c : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12, padding: '14px 16px', color: 'white',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 900, color: s.c, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6, fontWeight: 600 }}>{label}</div>
    </button>
  )
}

export default function AccessAudit() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [plans,   setPlans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('all') // all | error | warn | info | ok

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      const [cs, pls] = await Promise.all([getAllCourses(), getMembershipPlans().catch(() => [])])
      setCourses(cs || [])
      setPlans(pls || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Audit every item once
  const rows = useMemo(() => {
    return (courses || [])
      .filter(c => c.status !== 'draft' || true) // include drafts too, flagged below
      .map(c => {
        const audit = auditItem(c, plans)
        return { course: c, audit, sev: worstSeverity(audit.issues) }
      })
      .sort((a, b) => {
        const order = { error: 0, warn: 1, info: 2, ok: 3 }
        return (order[a.sev] - order[b.sev]) || String(a.course.title).localeCompare(String(b.course.title))
      })
  }, [courses, plans])

  const counts = useMemo(() => {
    const c = { error: 0, warn: 0, info: 0, ok: 0 }
    rows.forEach(r => { c[r.sev]++ })
    return c
  }, [rows])

  const visible = filter === 'all' ? rows : rows.filter(r => r.sev === filter)

  return (
    <div style={{ minHeight: '100vh', background: DARK, fontFamily: "'Montserrat', sans-serif", color: 'white' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${BRAND}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={13} /> Dashboard
          </button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${BRAND},#9333ea)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={17} /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Access Audit</div>
              <div style={{ fontSize: 8, color: BRAND, letterSpacing: 2 }}>ONE ITEM · ONE PATH</div>
            </div>
          </div>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: 'white', padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px 80px' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 22px', maxWidth: 720 }}>
          Every course and event shown with the <strong style={{ color: 'white' }}>one</strong> access path it actually uses, plus anything that's ambiguous or double-gated.
          Nothing here is changed automatically — fix flagged items in the Courses Manager. Existing members and past enrollments keep their access.
        </p>

        {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>Auditing courses…</div>}
        {error && !loading && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 18px', color: '#f87171', fontSize: 13 }}>
            {error} — <button onClick={load} style={{ background: 'none', border: 'none', color: '#f87171', textDecoration: 'underline', cursor: 'pointer' }}>try again</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <StatCard label="Broken — locked out / mischarged" value={counts.error} sev="error" active={filter === 'error'} onClick={() => setFilter(filter === 'error' ? 'all' : 'error')} />
              <StatCard label="Ambiguous / confusing" value={counts.warn} sev="warn" active={filter === 'warn'} onClick={() => setFilter(filter === 'warn' ? 'all' : 'warn')} />
              <StatCard label="Implicit — set explicitly" value={counts.info} sev="info" active={filter === 'info'} onClick={() => setFilter(filter === 'info' ? 'all' : 'info')} />
              <StatCard label="Clean" value={counts.ok} sev="ok" active={filter === 'ok'} onClick={() => setFilter(filter === 'ok' ? 'all' : 'ok')} />
            </div>

            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} style={{ background: 'none', border: 'none', color: BRAND, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}>← Show all {rows.length} items</button>
            )}

            {/* Rows */}
            {visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: 'rgba(255,255,255,0.4)' }}>
                <CheckCircle size={40} color="#34d399" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 700 }}>Nothing in this category.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visible.map(({ course, audit, sev }) => {
                  const chip = MODE_CHIP[isEvent(course) ? 'event' : accessModeOf(course)]
                  return (
                    <div key={course.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${sev === 'error' ? 'rgba(239,68,68,0.35)' : sev === 'warn' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <Dot severity={sev} />
                        <div style={{ flex: 1, minWidth: 160, fontSize: 13.5, fontWeight: 800, color: 'white' }}>{course.title || 'Untitled'}</div>
                        <Chip c={chip.c} bg={chip.bg}>{chip.t}</Chip>
                        <Chip c="rgba(255,255,255,0.7)" bg="rgba(255,255,255,0.06)">{course.status}</Chip>
                        {!isEvent(course) && hasPortal(course) && <Chip c="#74b9e8" bg="rgba(52,152,219,0.15)" title="Has a learning portal (lessons)">📚 Portal</Chip>}
                      </div>

                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', margin: '8px 0 0 18px' }}>
                        Who gets in: <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{audit.label}</strong>
                      </div>

                      {audit.issues.length > 0 && (
                        <div style={{ margin: '10px 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {audit.issues.map((iss, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11.5, lineHeight: 1.5 }}>
                              <span style={{ marginTop: 1 }}>{iss.severity === 'error' ? <AlertTriangle size={13} color={SEV.error.c} /> : <Dot severity={iss.severity} />}</span>
                              <span style={{ color: SEV[iss.severity].c }}>{iss.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ margin: '12px 0 0 18px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/courses-admin')} style={{ background: 'rgba(108,63,197,0.2)', border: '1px solid rgba(108,63,197,0.4)', borderRadius: 7, color: '#c4b5f8', fontSize: 10.5, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>
                          Open in Courses Manager →
                        </button>
                        {!isEvent(course) && hasPortal(course) && (
                          <button onClick={() => navigate(`/content-admin?courseId=${course.id}`)} style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 7, color: GOLD, fontSize: 10.5, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>
                            Manage content →
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Legend */}
            <div style={{ marginTop: 30, padding: '16px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 11.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9 }}>
              <div style={{ fontWeight: 800, color: 'white', marginBottom: 6, fontSize: 12 }}>The three access paths</div>
              <div><Chip c={MODE_CHIP.open.c} bg={MODE_CHIP.open.bg}>🌐 Open</Chip> &nbsp;Free for everyone — a taster or lead magnet.</div>
              <div><Chip c={MODE_CHIP.plan.c} bg={MODE_CHIP.plan.bg}>🎫 Membership</Chip> &nbsp;Included with a plan and every tier above it.</div>
              <div><Chip c={MODE_CHIP.standalone.c} bg={MODE_CHIP.standalone.bg}>💳 One-time</Chip> &nbsp;A paid one-off that is not part of membership.</div>
              <div><Chip c={MODE_CHIP.event.c} bg={MODE_CHIP.event.bg}>🎪 Event</Chip> &nbsp;Gated by audience (public, or chosen plans / invitees).</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
