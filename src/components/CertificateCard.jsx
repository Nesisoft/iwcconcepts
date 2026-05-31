/**
 * CertificateCard — shared between user portal and admin preview.
 * Props: name, courseName, completedAt (ISO string), certId
 */

const GOLD  = '#C9A84C'
const DARK  = '#1A1A2E'
const BRAND = '#6c3fc5'

export function certIdFor(email, programId, completedAt) {
  const year = completedAt ? new Date(completedAt).getFullYear() : new Date().getFullYear()
  let h = 5381
  const s = (email || '') + (programId || '')
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i)
  return `IWC-${year}-${Math.abs(h).toString(36).slice(0, 6).toUpperCase()}`
}

export default function CertificateCard({ name, courseName, completedAt, certId }) {
  const date = completedAt
    ? new Date(completedAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div id="certificate-card" style={{
      width: 800, maxWidth: '100%', margin: '0 auto',
      background: '#fffdf5',
      border: `3px solid ${GOLD}`,
      borderRadius: 6,
      padding: '52px 64px',
      position: 'relative',
      boxShadow: '0 8px 48px rgba(0,0,0,0.12)',
      fontFamily: "'Playfair Display', Georgia, serif",
      boxSizing: 'border-box',
    }}>

      {/* Corner ornaments */}
      <Corner pos={{ top: 10, left: 10 }} />
      <Corner pos={{ top: 10, right: 10 }} rotate />
      <Corner pos={{ bottom: 10, left: 10 }} flipY />
      <Corner pos={{ bottom: 10, right: 10 }} rotate flipY />

      {/* Inner border */}
      <div style={{
        position: 'absolute', inset: 14,
        border: `1px solid ${GOLD}55`,
        borderRadius: 3, pointerEvents: 'none',
      }} />

      {/* Header — logo + brand */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52,
            background: `linear-gradient(135deg, ${GOLD}, #e8c060)`,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 20, color: DARK,
          }}>IW</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: 3, textTransform: 'uppercase', color: DARK, fontFamily: "'Playfair Display', serif" }}>
              IWC Concepts
            </div>
            <div style={{ fontSize: 9, color: GOLD, letterSpacing: 4, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}>
              Faith · Business · Impact
            </div>
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, margin: '0 auto 24px', maxWidth: 400 }} />

        <div style={{ fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 800, letterSpacing: 6, color: GOLD, textTransform: 'uppercase', marginBottom: 8 }}>
          Certificate of Completion
        </div>
        <div style={{ width: 60, height: 2, background: GOLD, margin: '0 auto' }} />
      </div>

      {/* Body */}
      <div style={{ textAlign: 'center', margin: '32px 0 40px' }}>
        <p style={{ fontSize: 13, color: '#777', margin: '0 0 20px', fontStyle: 'italic', fontFamily: 'Inter, sans-serif', letterSpacing: 1 }}>
          This is to certify that
        </p>

        <div style={{
          fontSize: 46, fontWeight: 900, color: DARK,
          lineHeight: 1.15, marginBottom: 6,
          fontFamily: "'Playfair Display', serif",
        }}>
          {name || 'Learner'}
        </div>
        <div style={{ width: 240, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, margin: '4px auto 24px' }} />

        <p style={{ fontSize: 13, color: '#777', margin: '0 0 16px', fontStyle: 'italic', fontFamily: 'Inter, sans-serif', letterSpacing: 1 }}>
          has successfully completed the course
        </p>

        <div style={{
          fontSize: 26, fontWeight: 800, color: BRAND,
          lineHeight: 1.35, maxWidth: 560, margin: '0 auto',
          fontFamily: "'Playfair Display', serif",
        }}>
          "{courseName}"
        </div>
      </div>

      {/* Gold divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}88, transparent)`, margin: '0 auto 28px', maxWidth: 500 }} />

      {/* Footer row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>

        {/* Date */}
        <div style={{ textAlign: 'center', minWidth: 160 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{date}</div>
          <div style={{ width: '100%', height: 1, background: GOLD, marginBottom: 4 }} />
          <div style={{ fontSize: 9, color: '#aaa', fontFamily: 'Inter, sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>Date of Completion</div>
        </div>

        {/* Certificate ID */}
        <div style={{ textAlign: 'center', fontSize: 9, fontFamily: 'Inter, sans-serif', color: '#bbb', padding: '0 16px' }}>
          <div style={{ fontSize: 16, marginBottom: 2 }}>✦</div>
          <div>Certificate No.</div>
          <div style={{ fontWeight: 800, color: '#888', letterSpacing: 2, marginTop: 2, fontSize: 10 }}>{certId}</div>
        </div>

        {/* Authorized by */}
        <div style={{ textAlign: 'center', minWidth: 160 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK, fontFamily: 'Inter, sans-serif', marginBottom: 4, fontStyle: 'italic' }}>IWC Concepts</div>
          <div style={{ width: '100%', height: 1, background: GOLD, marginBottom: 4 }} />
          <div style={{ fontSize: 9, color: '#aaa', fontFamily: 'Inter, sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>Authorized by</div>
        </div>
      </div>
    </div>
  )
}

function Corner({ pos, rotate, flipY }) {
  const size = 24
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      style={{
        position: 'absolute', ...pos,
        transform: `${rotate ? 'rotate(90deg)' : ''} ${flipY ? 'scaleY(-1)' : ''}`,
      }}
    >
      <path d="M2 2 L2 12 M2 2 L12 2" stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}
