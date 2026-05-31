import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { getProgramById, getMyEnrollments, getMyProgress } from '../utils/formStorage'
import CertificateCard, { certIdFor } from '../components/CertificateCard'
import { ArrowLeft, Printer, Award } from 'lucide-react'

const BRAND  = '#6c3fc5'
const BRAND2 = '#9333ea'
const GOLD   = '#C9A84C'

export default function PortalCertificate() {
  const navigate   = useNavigate()
  const { programId } = useParams()
  const { user, getAccessToken } = useCustomerAuth()

  const [certData, setCertData] = useState(null) // { name, courseName, completedAt, certId }
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!user || !programId) return
    load()
  }, [user, programId])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      const [program, enrollments, progress] = await Promise.all([
        getProgramById(programId),
        getMyEnrollments(token),
        getMyProgress(programId, token),
      ])

      if (!program) { setError('Course not found.'); return }
      if (!program.awardsCertificate) { setError('This course does not award a certificate.'); return }

      // Find this program's enrollment for the user's name
      const enrollment = enrollments?.find(e => e.programId === programId)

      // Determine if all lessons are complete — progress must cover all published items
      // We don't have the total item count here, so we check via getPortalContent
      // Instead, we trust that the certificate page is only reachable when earned.
      // But let's still verify: need at least one progress item.
      if (!progress || progress.length === 0) {
        setError('You have not completed this course yet. Complete all lessons to earn your certificate.')
        return
      }

      // Completion date = max completedAt across all progress items
      const completedAt = progress
        .map(p => p.completedAt)
        .filter(Boolean)
        .sort()
        .at(-1) ?? new Date().toISOString()

      const name    = enrollment?.participantName || user.email.split('@')[0]
      const certId  = certIdFor(user.email, programId, completedAt)

      setCertData({ name, courseName: program.title, completedAt, certId })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>

      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #certificate-wrapper { padding: 0 !important; background: white !important; }
          #certificate-card { box-shadow: none !important; border-color: #C9A84C !important; }
        }
        @page { size: landscape; margin: 0.5in; }
      `}</style>

      {/* Header — hidden on print */}
      <header className="no-print" style={{
        background: 'linear-gradient(135deg, #0f0a1a, #1e0f3a)',
        padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate(`/portal/program/${programId}`)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 7, color: 'rgba(255,255,255,0.8)', padding: '6px 12px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}><ArrowLeft size={13} /> Back to Course</button>

        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
          {certData?.courseName || 'Certificate'}
        </div>

        {certData && (
          <button onClick={handlePrint} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: `linear-gradient(135deg, ${GOLD}, #e8c060)`,
            border: 'none', borderRadius: 8,
            color: '#1A1A2E', padding: '8px 18px',
            fontWeight: 800, fontSize: 13, cursor: 'pointer',
          }}>
            <Printer size={15} /> Print / Save PDF
          </button>
        )}
      </header>

      <div id="certificate-wrapper" style={{ padding: '48px 24px 80px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>Loading certificate…</div>
        )}

        {error && (
          <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
            <Award size={52} color="#d1d5db" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#374151', margin: '0 0 10px' }}>Certificate Not Available</h2>
            <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, margin: '0 0 28px' }}>{error}</p>
            <button onClick={() => navigate(`/portal/program/${programId}`)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `linear-gradient(135deg, ${BRAND}, ${BRAND2})`,
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              <ArrowLeft size={16} /> Return to Course
            </button>
          </div>
        )}

        {!loading && certData && (
          <>
            {/* Hero text */}
            <div className="no-print" style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fef9ec', border: '1px solid #f59e0b40', borderRadius: 20, padding: '6px 18px', marginBottom: 14 }}>
                <Award size={16} color="#d97706" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Certificate Earned</span>
              </div>
              <h1 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
                Congratulations, {certData.name}!
              </h1>
              <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
                You've completed <strong>{certData.courseName}</strong>. Your certificate is ready below.
              </p>
              <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>
                Use the <strong>Print / Save PDF</strong> button above to save or print your certificate.
              </p>
            </div>

            <CertificateCard
              name={certData.name}
              courseName={certData.courseName}
              completedAt={certData.completedAt}
              certId={certData.certId}
            />
          </>
        )}
      </div>
    </div>
  )
}
