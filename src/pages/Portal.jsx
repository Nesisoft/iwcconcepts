import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { getMyEnrollments, getAllPrograms } from '../utils/formStorage'

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
  const [programs,           setPrograms]            = useState({})  // id → program
  const [freePortalPrograms, setFreePortalPrograms]  = useState([])  // free + hasPortalAccess
  const [morePrograms,       setMorePrograms]        = useState([])  // paid + hasPortalAccess, not enrolled
  const [loading,            setLoading]             = useState(true)
  const [error,              setError]               = useState('')

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      const [rawEnrollments, allProgs] = await Promise.all([
        getMyEnrollments(token),
        getAllPrograms(),
      ])

      // Server already deduplicates via DISTINCT ON; dedupe client-side as safety
      const seenIds = new Set()
      const dedupedEnrollments = []
      for (const enr of (rawEnrollments || [])) {
        if (!seenIds.has(enr.programId)) {
          seenIds.add(enr.programId)
          dedupedEnrollments.push(enr)
        }
      }
      setEnrollments(dedupedEnrollments)

      // Build program lookup map
      const map = {}
      for (const p of (allProgs || [])) map[p.id] = p
      setPrograms(map)

      const enrolledIds = new Set(dedupedEnrollments.map(e => e.programId))

      // Free programs with portal access — open to all portal users
      setFreePortalPrograms(
        (allProgs || []).filter(p => p.type === 'free' && p.hasPortalAccess && !enrolledIds.has(p.id))
      )

      // Paid programs with portal access the user hasn't enrolled in yet
      setMorePrograms(
        (allProgs || []).filter(p => p.type === 'paid' && p.hasPortalAccess && !enrolledIds.has(p.id))
      )
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

  const hasAnyContent = enrollments.length > 0 || freePortalPrograms.length > 0

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
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>Loading your programs…</div>
        )}

        {!loading && !error && !hasAnyContent && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#374151', margin: '0 0 8px' }}>No programs yet</h2>
            <p style={{ color: '#9ca3af', fontSize: 15, maxWidth: 360, margin: '0 auto 28px' }}>
              Browse available programs and register to get started.
            </p>
            <button onClick={() => navigate('/')} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Browse Programs →
            </button>
          </div>
        )}

        {/* ── Section 1: My enrolled programs ─────────────────────────────── */}
        {!loading && enrollments.length > 0 && (
          <Section title="My Programs" subtitle="Programs you're enrolled in">
            {enrollments.map(enr => {
              const prog = programs[enr.programId]
              return (
                <ProgramCard
                  key={enr.id}
                  program={prog}
                  fallbackTitle={enr.programTitle}
                  badge={enr.paymentRef ? 'Enrolled' : 'Free'}
                  badgeColor={enr.paymentRef ? '#16a34a' : '#0369a1'}
                  badgeBg={enr.paymentRef ? '#dcfce7' : '#e0f2fe'}
                  sub={`Enrolled ${formatDate(enr.enrolledAt)}`}
                  action={prog?.hasPortalAccess ? {
                    label: 'View Content →',
                    onClick: () => navigate(`/portal/program/${enr.programId}`),
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
        {!loading && freePortalPrograms.length > 0 && (
          <Section title="Free Learning Resources" subtitle="Open to all members — dive in anytime">
            {freePortalPrograms.map(prog => (
              <ProgramCard
                key={prog.id}
                program={prog}
                fallbackTitle={prog.title}
                badge="Free"
                badgeColor="#0369a1"
                badgeBg="#e0f2fe"
                sub="Available to all members"
                action={{
                  label: 'Start Learning →',
                  onClick: () => navigate(`/portal/program/${prog.id}`),
                  primary: true,
                }}
              />
            ))}
          </Section>
        )}

        {/* ── Section 3: More paid programs with portal access ─────────────── */}
        {!loading && morePrograms.length > 0 && (
          <Section title="More Programs" subtitle="Enroll to unlock full access">
            {morePrograms.map(prog => (
              <ProgramCard
                key={prog.id}
                program={prog}
                fallbackTitle={prog.title}
                badge="Enroll to access"
                badgeColor="#92400e"
                badgeBg="#fef3c7"
                sub={prog.price ? `GHS ${Number(prog.price).toLocaleString()}` : ''}
                action={{
                  label: 'Enroll Now →',
                  onClick: () => navigate(`/onboard?programId=${prog.id}`),
                  primary: false,
                }}
              />
            ))}
          </Section>
        )}
      </div>

      <div style={{ padding: '20px 24px', textAlign: 'center', borderTop: '1px solid #f3f4f6' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>← Back to Programs</button>
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, subtitle, children }) {
  return (
    <div style={{ marginBottom: 52 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
        {children}
      </div>
    </div>
  )
}

// ── Program card ───────────────────────────────────────────────────────────────

function ProgramCard({ program, fallbackTitle, badge, badgeColor, badgeBg, sub, action }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Thumbnail */}
      <div style={{ height: 140, background: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
        {program?.image
          ? <img src={program.image} alt={program?.title || fallbackTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6c3fc520, #6c3fc540)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📚</div>
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
          {program?.title || fallbackTitle}
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
