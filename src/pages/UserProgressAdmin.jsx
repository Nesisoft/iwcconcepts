import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEnrolledUsersProgress } from '../utils/formStorage'
import { Users, Award, Zap, BookOpen, ChevronDown, ChevronRight, X, Printer } from 'lucide-react'
import CertificateCard, { certIdFor } from '../components/CertificateCard'

const ACC  = '#0891b2'
const DARK = '#0e0a1e'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function UserProgressAdmin() {
  const navigate = useNavigate()
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [expanded,  setExpanded]  = useState({}) // programId → bool
  const [certModal, setCertModal] = useState(null) // { name, courseName, completedAt, certId }

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await getEnrolledUsersProgress()
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function toggle(id) { setExpanded(p => ({ ...p, [id]: !p[id] })) }

  // ── Build grouped view ─────────────────────────────────────────────────────
  const grouped = buildGrouped(data)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#06b6d4)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>User Progress</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'rgba(255,255,255,0.7)', padding: '6px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          Refresh
        </button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>Loading learner data…</div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '16px 20px', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {!loading && !error && grouped.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <Users size={48} color="rgba(255,255,255,0.15)" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 14 }}>No enrollments yet.</div>
          </div>
        )}

        {!loading && grouped.map(course => {
          const open = expanded[course.id]
          const certCount = course.users.filter(u => u.certificate).length
          return (
            <div key={course.id} style={{ marginBottom: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, overflow: 'hidden' }}>

              {/* Course header row */}
              <div
                onClick={() => toggle(course.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
              >
                {open ? <ChevronDown size={16} color="rgba(255,255,255,0.4)" /> : <ChevronRight size={16} color="rgba(255,255,255,0.4)" />}
                <BookOpen size={16} color={ACC} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>{course.title}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                  <span><strong style={{ color: 'white' }}>{course.users.length}</strong> learner{course.users.length !== 1 ? 's' : ''}</span>
                  {certCount > 0 && <span style={{ color: '#fbbf24' }}><strong>{certCount}</strong> certificate{certCount !== 1 ? 's' : ''}</span>}
                  <span>{course.totalLessons} lesson{course.totalLessons !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* User rows */}
              {open && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  {/* Table head */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 90px 110px', gap: 8, padding: '8px 18px', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>Learner</span><span>Progress</span><span>XP</span><span>Certificate</span><span>Enrolled</span>
                  </div>

                  {course.users.length === 0 && (
                    <div style={{ padding: '14px 18px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No learners enrolled.</div>
                  )}

                  {course.users.map(u => (
                    <div key={u.email} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 90px 110px', gap: 8, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', fontSize: 12 }}>

                      {/* Email */}
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.75)' }} title={u.email}>
                        {u.name && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 1 }}>{u.name}</div>}
                        {u.email}
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{u.completed}/{course.totalLessons}</div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${u.pct}%`, height: '100%', background: u.complete ? '#10B981' : ACC, borderRadius: 3 }} />
                        </div>
                      </div>

                      {/* XP */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#c4b5f8', fontWeight: 700 }}>
                        <Zap size={12} /> {u.completed}
                      </div>

                      {/* Certificate */}
                      <div>
                        {u.certificate ? (
                          <button
                            onClick={() => setCertModal({
                              name: u.name || u.email.split('@')[0],
                              courseName: course.title,
                              completedAt: u.lastCompletedAt,
                              certId: certIdFor(u.email, course.id, u.lastCompletedAt),
                            })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontWeight: 700, fontSize: 11, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
                          >
                            <Award size={12} /> View
                          </button>
                        ) : course.awardsCertificate ? (
                          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>In progress</span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>—</span>
                        )}
                      </div>

                      {/* Enrolled date */}
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{formatDate(u.enrolledAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Certificate preview modal ──────────────────────────────────────── */}
      {certModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setCertModal(null) }}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 860, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Certificate Preview</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setCertModal(null)}
                  style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ padding: '24px 20px 32px', overflowX: 'auto' }}>
              <CertificateCard
                name={certModal.name}
                courseName={certModal.courseName}
                completedAt={certModal.completedAt}
                certId={certModal.certId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Data helpers ───────────────────────────────────────────────────────────────

function buildGrouped(data) {
  if (!data) return []
  const { enrollments = [], progress = [], programs = [], lessonCounts = {} } = data

  // Map programs by id
  const progMap = Object.fromEntries(programs.map(p => [p.id, p]))

  // Build progress lookup: programId → email → { itemIds: Set, lastCompletedAt }
  const progLookup = {}
  for (const row of progress) {
    const { program_id, user_email, item_id, completed_at } = row
    if (!progLookup[program_id]) progLookup[program_id] = {}
    if (!progLookup[program_id][user_email]) progLookup[program_id][user_email] = { itemIds: new Set(), lastCompletedAt: null }
    progLookup[program_id][user_email].itemIds.add(item_id)
    if (!progLookup[program_id][user_email].lastCompletedAt || (completed_at && completed_at > progLookup[program_id][user_email].lastCompletedAt)) {
      progLookup[program_id][user_email].lastCompletedAt = completed_at
    }
  }

  // Group enrollments by program
  const byCourse = {}
  for (const enr of enrollments) {
    const { programId, participantEmail, participantName, enrolledAt } = enr
    if (!byCourse[programId]) byCourse[programId] = []
    byCourse[programId].push({ email: participantEmail, name: participantName, enrolledAt })
  }

  return Object.entries(byCourse).map(([programId, users]) => {
    const prog        = progMap[programId]
    const totalLessons = lessonCounts[programId] || 0
    const certEnabled  = prog?.awardsCertificate || false

    const enriched = users.map(u => {
      const userProg  = progLookup[programId]?.[u.email]
      const completed = userProg?.itemIds?.size || 0
      const pct       = totalLessons > 0 ? Math.round(completed / totalLessons * 100) : 0
      const complete  = totalLessons > 0 && completed >= totalLessons
      return {
        ...u,
        completed, pct, complete,
        lastCompletedAt: userProg?.lastCompletedAt || null,
        certificate: certEnabled && complete,
      }
    })

    // Sort: completed users first, then by progress desc
    enriched.sort((a, b) => b.completed - a.completed)

    return {
      id:           programId,
      title:        prog?.title || programId,
      totalLessons,
      awardsCertificate: certEnabled,
      users: enriched,
    }
  }).sort((a, b) => b.users.length - a.users.length)
}
