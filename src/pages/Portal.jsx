import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { getMyEnrollments, getProgramById } from '../utils/formStorage'

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

  const [enrollments, setEnrollments] = useState([])
  const [programs,    setPrograms]    = useState({})  // programId → program object
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      const enrs  = await getMyEnrollments(token)
      setEnrollments(enrs || [])

      // Fetch each unique program in parallel
      const ids = [...new Set((enrs || []).map(e => e.programId))]
      const progs = await Promise.all(ids.map(id => getProgramById(id).catch(() => null)))
      const map = {}
      progs.forEach(p => { if (p) map[p.id] = p })
      setPrograms(map)
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

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0f0a1a, #1e0f3a)',
        padding: '0 24px', display: 'flex', alignItems: 'center', height: 60,
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
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{user?.email}</span>
          <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
            Here are the programs you're enrolled in.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Loading your programs…</div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', color: '#dc2626', fontSize: 14, marginBottom: 24 }}>
            {error} — <button onClick={load} style={{ background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', fontSize: 14 }}>Try again</button>
          </div>
        )}

        {!loading && !error && enrollments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#374151', margin: '0 0 8px' }}>No programs yet</h2>
            <p style={{ color: '#9ca3af', fontSize: 15, maxWidth: 360, margin: '0 auto 28px' }}>
              You're not enrolled in any programs. Browse available programs and register to get started.
            </p>
            <button onClick={() => navigate('/')} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Browse Programs →
            </button>
          </div>
        )}

        {!loading && enrollments.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {enrollments.map(enr => {
              const prog = programs[enr.programId]
              return (
                <EnrollmentCard
                  key={enr.id}
                  enrollment={enr}
                  program={prog}
                  onView={() => navigate(`/portal/program/${enr.programId}`)}
                />
              )
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '20px 24px', textAlign: 'center', borderTop: '1px solid #f3f4f6', marginTop: 40 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>← Back to Programs</button>
      </div>
    </div>
  )
}

function EnrollmentCard({ enrollment, program, onView }) {
  const hasPortal = program?.hasPortalAccess

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Image */}
      <div style={{ height: 140, background: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
        {program?.image
          ? <img src={program.image} alt={program.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6c3fc520, #6c3fc540)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📚</div>
        }
        {enrollment.paymentRef && (
          <span style={{ position: 'absolute', top: 10, right: 10, background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 8px' }}>Paid</span>
        )}
      </div>

      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
          {program?.title || enrollment.programTitle}
        </h3>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          Enrolled {formatDate(enrollment.enrolledAt)}
        </div>
        <div style={{ flex: 1 }} />
        {hasPortal ? (
          <button onClick={onView} style={{ marginTop: 12, width: '100%', border: 'none', borderRadius: 9, padding: '11px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: `linear-gradient(135deg, #6c3fc5, #9333ea)`, color: '#fff' }}>
            View Content →
          </button>
        ) : (
          <div style={{ marginTop: 12, width: '100%', borderRadius: 9, padding: '11px 0', fontWeight: 600, fontSize: 12, textAlign: 'center', background: '#f3f4f6', color: '#9ca3af' }}>
            Content coming soon
          </div>
        )}
      </div>
    </div>
  )
}
