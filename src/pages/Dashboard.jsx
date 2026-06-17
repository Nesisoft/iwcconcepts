import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isConfigured } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  MessageSquare, Megaphone, ClipboardList, BarChart3, Database,
  GraduationCap, Star, Globe, Users, Award, LineChart, MessagesSquare, Mail,
  Ticket, Lock, Calendar, Inbox, ShieldCheck, Image,
} from 'lucide-react'

const tools = [
  {
    id: 'quote-studio',
    path: '/quote-studio',
    Icon: MessageSquare,
    title: 'Quote Card Studio',
    desc: 'Design branded quote cards for social media with custom templates, typography, profile photos, and platform icons.',
    tags: ['Templates', 'Photo', 'Typography', 'Export'],
    accent: '#C9A84C',
    available: true,
  },
  {
    id: 'flyer-studio',
    path: '/flyer-studio',
    Icon: Megaphone,
    title: 'Event Flyer Studio',
    desc: 'Generate professional event flyers for day-by-day courses, speaker grids, and announcement graphics.',
    tags: ['Events', 'Speakers', 'Day Cards', 'Export'],
    accent: '#E4600A',
    available: true,
  },
  {
    id: 'form-builder',
    path: '/form-builder',
    Icon: ClipboardList,
    title: 'Form Builder',
    desc: 'Build branded registration and feedback forms with countdown timers, speaker previews, email confirmations, and shareable links.',
    tags: ['Registration', 'Feedback', 'Email', 'Shareable'],
    accent: '#2ECC71',
    available: true,
  },
  {
    id: 'event-dashboard',
    path: '/event-dashboard',
    Icon: BarChart3,
    title: 'Event Dashboard',
    desc: 'Manage event submissions in real-time, track registrations, manage speaker lineups, checklists, and generate email reminders.',
    tags: ['Analytics', 'Speakers', 'Checklist', 'Reminders'],
    accent: '#9B59B6',
    available: true,
  },
  {
    id: 'db-setup',
    path: '/db-setup',
    Icon: Database,
    title: 'Database Setup',
    desc: 'Connect Supabase for cloud persistence. Access your forms, submissions, and speaker data from any device or browser.',
    tags: ['Cloud', 'Supabase', 'Sync', 'Setup'],
    accent: '#3498DB',
    available: true,
  },
  {
    id: 'courses-admin',
    path: '/courses-admin',
    Icon: GraduationCap,
    title: 'Courses Manager',
    desc: 'Create and manage courses. Control the hero carousel, set pricing, link registration forms, and publish to the public landing page.',
    tags: ['Courses', 'Carousel', 'Paystack', 'Publish'],
    accent: '#6c3fc5',
    available: true,
  },
  {
    id: 'plans-admin',
    path: '/plans-admin',
    Icon: Ticket,
    title: 'Membership Plans',
    desc: 'Define membership tiers up to Premium — perks, pricing, validity — link the join form, and manage members and expiries.',
    tags: ['Plans', 'Tiers', 'Members', 'Join Form'],
    accent: '#C9A84C',
    available: true,
  },
  {
    id: 'events-admin',
    path: '/events-admin',
    Icon: Calendar,
    title: 'Events Manager',
    desc: 'Create and run events separately from courses — dates, venue/online join details, free / paid-ticket / membership access, promo codes, RSVP forms, and audience announcements.',
    tags: ['Events', 'Tickets', 'Promo Codes', 'Announce'],
    accent: '#f59e0b',
    available: true,
  },
  {
    id: 'access-audit',
    path: '/access-audit',
    Icon: Lock,
    title: 'Access Audit',
    desc: 'See every course and event with the one access path it uses — Open, Membership, or One-time — and catch anything double-gated, mispriced, or ambiguous.',
    tags: ['Access', 'Membership', 'Conflicts', 'Review'],
    accent: '#6c3fc5',
    available: true,
  },
  {
    id: 'testimonials-admin',
    path: '/testimonials-admin',
    Icon: Star,
    title: 'Testimonials Manager',
    desc: 'Collect and curate testimonials from participants. Control visibility, link to courses, and showcase them on the landing page.',
    tags: ['Testimonials', 'Reviews', 'Social Proof'],
    accent: '#9333ea',
    available: true,
  },
  {
    id: 'user-progress',
    path: '/user-progress',
    Icon: Users,
    title: 'User Progress',
    desc: 'See every enrolled learner, their lesson completion, XP earned, and certificates awarded across all courses.',
    tags: ['Learners', 'Progress', 'XP', 'Certificates'],
    accent: '#0891b2',
    available: true,
  },
  {
    id: 'certificate-admin',
    path: '/certificate-admin',
    Icon: Award,
    title: 'Certificate Designer',
    desc: 'Customize the completion certificate — wording, signature, colours, and ID prefix — with a live preview and test print.',
    tags: ['Certificate', 'Branding', 'Preview', 'Print'],
    accent: '#d97706',
    available: true,
  },
  {
    id: 'analytics',
    path: '/analytics',
    Icon: LineChart,
    title: 'Analytics',
    desc: 'Track revenue and per-month trends, completion rates, certificates, per-course performance, and a full Payments ledger (memberships, tickets, renewals) with date range, filters and CSV export.',
    tags: ['Revenue', 'Payments', 'Completion', 'Trends'],
    accent: '#9B59B6',
    available: true,
  },
  {
    id: 'discussions',
    path: '/discussions',
    Icon: MessagesSquare,
    title: 'Discussions & Q&A',
    desc: 'Read and answer learner questions from every lesson. Replies post as Instructor; moderate or delete any comment.',
    tags: ['Q&A', 'Replies', 'Moderation', 'Community'],
    accent: '#9333ea',
    available: true,
  },
  {
    id: 'email-admin',
    path: '/email-admin',
    Icon: Mail,
    title: 'Email Center',
    desc: 'Configure the sender, edit welcome / completion / reminder email templates, toggle each on or off, and send a test.',
    tags: ['Welcome', 'Completion', 'Reminders', 'Templates'],
    accent: '#2ECC71',
    available: true,
  },
  {
    id: 'contact-admin',
    path: '/contact-admin',
    Icon: Inbox,
    title: 'Contact Messages',
    desc: 'Read messages sent through the public Contact form. The team is emailed on each new submission; reply or delete from here.',
    tags: ['Contact form', 'Inbox', 'Replies'],
    accent: '#2ECC71',
    available: true,
  },
  {
    id: 'branding',
    path: '/branding',
    Icon: Image,
    title: 'Branding',
    desc: 'Upload your logo — it appears across the site header and footer automatically. Change it anytime; falls back to the default wordmark when empty.',
    tags: ['Logo', 'Identity', 'Upload'],
    accent: '#C9A84C',
    available: true,
  },
  {
    id: 'admins',
    path: '/admins',
    Icon: ShieldCheck,
    title: 'Admins',
    desc: 'Invite new administrators by name and email. They receive a secure link to verify their email and set a password, then can sign in.',
    tags: ['Invite', 'Access', 'Team'],
    accent: '#8B5CF6',
    available: true,
  },
  {
    id: 'landing',
    path: '/',
    Icon: Globe,
    title: 'Public Landing Page',
    desc: 'View the public-facing page your customers see — hero carousel, courses grid, and testimonials.',
    tags: ['Public', 'Landing Page', 'Preview'],
    accent: '#059669',
    available: true,
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const [cloud, setCloud] = useState(false)
  useEffect(() => { setCloud(isConfigured()) }, [])

  async function handleLogout() {
    if (!window.confirm('Sign out of IWC Concepts?')) return
    await signOut()
    navigate('/login', { replace: true })
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/db-setup')}
            title={cloud ? 'Supabase connected — click to manage' : 'Set up cloud database'}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: cloud ? 'rgba(46,204,113,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${cloud ? 'rgba(46,204,113,0.35)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 18, padding: '5px 13px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: cloud ? '#2ECC71' : 'rgba(255,255,255,0.45)', fontFamily: "'Montserrat',sans-serif" }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cloud ? '#2ECC71' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            {cloud ? 'Cloud DB' : 'Local DB'}
          </button>
          {/* User / logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>
            {user?.email && user.email !== 'admin' && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            )}
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '5px 13px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', fontFamily: "'Montserrat',sans-serif" }}
            >
              Sign Out
            </button>
          </div>
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
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
          Design stunning graphics, manage event registrations, and run your Catch Up events end-to-end — all in one place, built for IWC Concepts.
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

            <div style={{ marginBottom: 16 }}><tool.Icon size={34} color={tool.accent} strokeWidth={1.5} /></div>

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
