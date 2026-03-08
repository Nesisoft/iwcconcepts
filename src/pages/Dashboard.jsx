import { useNavigate } from 'react-router-dom'

const tools = [
  {
    id: 'quote-studio',
    path: '/quote-studio',
    icon: '💬',
    title: 'Quote Card Studio',
    desc: 'Design branded quote cards for social media with custom templates, typography, profile photos, and platform icons.',
    tags: ['Templates', 'Photo', 'Typography', 'Export'],
    accent: '#C9A84C',
    available: true,
  },
  {
    id: 'flyer-studio',
    path: '/flyer-studio',
    icon: '📣',
    title: 'Event Flyer Studio',
    desc: 'Generate professional event flyers for day-by-day programs, speaker grids, and announcement graphics.',
    tags: ['Events', 'Speakers', 'Day Cards', 'Export'],
    accent: '#E4600A',
    available: true,
  },
  {
    id: 'coming-soon-1',
    path: null,
    icon: '🎬',
    title: 'Video Thumbnail Studio',
    desc: 'Create eye-catching YouTube and podcast thumbnails with your brand style.',
    tags: ['YouTube', 'Podcast', 'Coming Soon'],
    accent: '#3498DB',
    available: false,
  },
  {
    id: 'coming-soon-2',
    path: null,
    icon: '📊',
    title: 'Infographic Builder',
    desc: 'Build data-driven infographics and stats cards for presentations and social media.',
    tags: ['Data', 'Charts', 'Coming Soon'],
    accent: '#2ECC71',
    available: false,
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#0f0a1a', fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1a0d2e, #2d1654)',
        borderBottom: '2px solid #C9A84C',
        padding: '18px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46,
            background: 'linear-gradient(135deg, #C9A84C, #e8c060)',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900, fontSize: 20, color: '#1A1A2E',
          }}>IW</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>IWC CONCEPTS</div>
            <div style={{ fontSize: 9, color: '#C9A84C', letterSpacing: 3, textTransform: 'uppercase' }}>Creative Studio Platform</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
          Faith · Business · Impact
        </div>
      </header>

      {/* Hero */}
      <div style={{
        padding: '60px 40px 40px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(91,45,142,0.25) 0%, transparent 60%)',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(201,168,76,0.12)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 20,
          padding: '6px 18px',
          fontSize: 10,
          color: '#C9A84C',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 20,
        }}>Creative Studio</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 900,
          lineHeight: 1.15,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #fff 30%, #C9A84C)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Your Visual Content<br />Command Centre
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Design stunning quote cards, event flyers, and branded graphics — all in one place, built for IWC Concepts.
        </p>
      </div>

      {/* Tool Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24,
        padding: '20px 40px 60px',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {tools.map(tool => (
          <div
            key={tool.id}
            onClick={() => tool.available && tool.path && navigate(tool.path)}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
              border: `1px solid ${tool.available ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 16,
              padding: 28,
              cursor: tool.available ? 'pointer' : 'default',
              transition: 'all 0.25s',
              position: 'relative',
              overflow: 'hidden',
              opacity: tool.available ? 1 : 0.55,
            }}
            onMouseEnter={e => {
              if (!tool.available) return
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = tool.accent + '66'
              e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${tool.accent}33`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = ''
              e.currentTarget.style.borderColor = tool.available ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'
              e.currentTarget.style.boxShadow = ''
            }}
          >
            {/* Accent glow */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 120, height: 120,
              background: `radial-gradient(circle, ${tool.accent}22 0%, transparent 70%)`,
              borderRadius: '0 16px 0 0',
            }} />

            <div style={{ fontSize: 36, marginBottom: 16 }}>{tool.icon}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800 }}>{tool.title}</h2>
              {!tool.available && (
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: 1,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4, padding: '2px 6px', color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                }}>Soon</span>
              )}
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 20 }}>
              {tool.desc}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {tool.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                  background: `${tool.accent}18`,
                  border: `1px solid ${tool.accent}40`,
                  borderRadius: 4, padding: '3px 8px',
                  color: tool.accent,
                  textTransform: 'uppercase',
                }}>{tag}</span>
              ))}
            </div>

            {tool.available && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, fontWeight: 700, color: tool.accent,
              }}>
                Open Studio
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: 10,
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: 1,
      }}>
        IWC CONCEPTS · CREATIVE STUDIO · {new Date().getFullYear()}
      </div>
    </div>
  )
}
