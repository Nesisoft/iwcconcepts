import SiteNav from '../components/SiteNav'
import SiteFooter from '../components/SiteFooter'
import { useNavigate } from 'react-router-dom'
import { Target, HeartHandshake, Sparkles, BookOpen, Users, TrendingUp, ArrowRight } from 'lucide-react'

const BRAND = '#6c3fc5'
const GOLD  = '#C9A84C'

const VALUES = [
  { icon: HeartHandshake, title: 'Faith First', text: 'We build on Biblical principles, integrating faith into every aspect of business and leadership.' },
  { icon: TrendingUp,     title: 'Real Growth', text: 'Practical, results-driven teaching that helps you grow a business that works — with purpose.' },
  { icon: Users,          title: 'Community',   text: 'A supportive network of entrepreneurs and leaders walking the same journey together.' },
  { icon: Sparkles,       title: 'Excellence',  text: 'We pursue excellence in everything, reflecting the spirit of stewardship and integrity.' },
]

const STATS = [
  { value: '2,400+', label: 'Participants' },
  { value: '4.9/5',  label: 'Average Rating' },
  { value: '94%',    label: 'Completion Rate' },
]

export default function About() {
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#fff' }}>
      <SiteNav solid />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 60%, #0f0a1a 100%)',
        padding: '140px 24px 80px', textAlign: 'center', color: 'white',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
          About IWC Concepts
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 900, margin: '0 auto 18px', lineHeight: 1.15, maxWidth: 760 }}>
          Building Kingdom-Minded Entrepreneurs
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          We exist to equip believers to build businesses and lead with purpose, excellence,
          and unwavering faith.
        </p>
      </section>

      {/* Mission / Story */}
      <section style={{ maxWidth: 880, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={iconBadge}><Target size={20} color={BRAND} /></div>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 900, color: '#111827', margin: 0 }}>Our Mission</h2>
        </div>
        <p style={{ fontSize: 17, lineHeight: 1.85, color: '#374151', margin: '0 0 20px' }}>
          IWC Concepts is a faith-based platform dedicated to empowering entrepreneurs, leaders, and
          changemakers. We believe that business is a powerful vehicle for impact — and that when
          faith and enterprise meet, lives and communities are transformed.
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.85, color: '#374151', margin: 0 }}>
          Through carefully crafted courses, live events, and a thriving community, we help you grow
          with clarity and conviction. Whether you're just starting out or scaling to new heights,
          our heart is to see you flourish in every area of life and work.
        </p>
      </section>

      {/* Values */}
      <section style={{ background: '#f9fafb', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: BRAND, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>What We Stand For</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, color: '#111827', margin: 0 }}>Our Core Values</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 22 }}>
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ ...iconBadge, marginBottom: 16 }}><Icon size={22} color={BRAND} /></div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6b7280', margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: 880, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: BRAND, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 8, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #6c3fc5, #9333ea)', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.15)', marginBottom: 20 }}>
          <BookOpen size={26} color="#fff" />
        </div>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#fff', margin: '0 0 14px' }}>
          Ready to Grow With Purpose?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', maxWidth: 460, margin: '0 auto 28px', lineHeight: 1.6 }}>
          Explore our courses and take the next step in your faith and business journey.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: GOLD, color: '#1A1A2E', border: 'none', borderRadius: 10, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
        >
          Browse Courses <ArrowRight size={17} />
        </button>
      </section>

      <SiteFooter />
    </div>
  )
}

const iconBadge = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 44, height: 44, borderRadius: 12,
  background: 'rgba(108,63,197,0.1)',
}
