import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import {
  getMyEnrollments, getAllCourses, getMembershipPlans,
  getMyMembership, getMyEvents, getMyNotifications, markNotificationsRead,
} from '../utils/formStorage'
import { googleCalendarUrl, downloadICS } from '../utils/calendar'
import { BookOpen, ArrowRight, ArrowLeft, Bell, Calendar, MapPin, Video, Ticket } from 'lucide-react'

const BRAND  = '#6c3fc5'
const BRAND2 = '#9333ea'
const GOLD   = '#C9A84C'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Portal() {
  const navigate = useNavigate()
  const { user, signOut, getAccessToken } = useCustomerAuth()

  const [enrollments,       setEnrollments]       = useState([])
  const [courses,           setCourses]           = useState({})  // id → course
  const [freePortalCourses, setFreePortalCourses] = useState([])  // open / legacy-free + portal access
  const [moreCourses,       setMoreCourses]       = useState([])  // legacy paid, not enrolled
  const [planCourses,       setPlanCourses]       = useState([])  // membership-gated courses
  const [plans,             setPlans]             = useState([])
  const [membership,        setMembership]        = useState(null)
  const [events,            setEvents]            = useState([])
  const [notifications,     setNotifications]     = useState([])
  const [loading,           setLoading]           = useState(true)
  const [error,             setError]             = useState('')

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load(force = false) {
    setError('')
    const CACHE_KEY = `iwc_portal2_${user?.email}`
    const CACHE_TTL = 5 * 60 * 1000

    if (!force) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const c = JSON.parse(cached)
          if (Date.now() < c.exp) {
            setEnrollments(c.enrollments); setFreePortalCourses(c.free); setMoreCourses(c.more)
            setPlanCourses(c.plan); setCourses(c.courses); setPlans(c.plans)
            setMembership(c.membership); setEvents(c.events); setNotifications(c.notifications)
            setLoading(false)
            return
          }
        }
      } catch {}
    }

    setLoading(true)
    try {
      const token = await getAccessToken()
      const [rawEnrollments, allProgs, allPlans, myMembership, myEvents, myNotifications] = await Promise.all([
        getMyEnrollments(token),
        getAllCourses(),
        getMembershipPlans().catch(() => []),
        getMyMembership(token).catch(() => null),
        getMyEvents(token).catch(() => []),
        getMyNotifications(token).catch(() => []),
      ])

      // Build course lookup map first so we can filter events during dedup
      const map = {}
      for (const p of (allProgs || [])) map[p.id] = p
      setCourses(map)
      setPlans(allPlans || [])
      setMembership(myMembership)
      setEvents(myEvents || [])
      setNotifications(myNotifications || [])

      // Events are not shown in the course lists — they have their own section
      const isCourse = p => !p || (p.courseType || 'course') !== 'event'

      // Server already deduplicates via DISTINCT ON; dedupe client-side as safety
      const seenIds = new Set()
      const dedupedEnrollments = []
      for (const enr of (rawEnrollments || [])) {
        if (!seenIds.has(enr.courseId)) {
          seenIds.add(enr.courseId)
          if (isCourse(map[enr.courseId])) dedupedEnrollments.push(enr)
        }
      }
      setEnrollments(dedupedEnrollments)

      const enrolledIds = new Set(dedupedEnrollments.map(e => e.courseId))
      const live = (allProgs || []).filter(p => p.status !== 'draft' && isCourse(p) && !enrolledIds.has(p.id))

      const isOpen   = p => p.accessMode === 'open' || (!p.accessMode && p.type === 'free')
      const isLegacy = p => (!p.accessMode || p.accessMode === 'legacy') && p.type === 'paid'
      const isPlan   = p => p.accessMode === 'plan' && p.accessPlanId

      const freeProgs = live.filter(p => isOpen(p) && (p.hasPortalAccess === true || p.hasPortalAccess === 'true'))
      const moreProgs = live.filter(p => isLegacy(p) && (p.hasPortalAccess === true || p.hasPortalAccess === 'true'))
      const planProgs = live.filter(isPlan)

      setFreePortalCourses(freeProgs)
      setMoreCourses(moreProgs)
      setPlanCourses(planProgs)

      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          enrollments: dedupedEnrollments, free: freeProgs, more: moreProgs, plan: planProgs,
          courses: map, plans: allPlans || [], membership: myMembership,
          events: myEvents || [], notifications: myNotifications || [],
          exp: Date.now() + CACHE_TTL,
        }))
      } catch {}
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

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read).map(n => n.id)
    if (!unread.length) return
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    try {
      const token = await getAccessToken()
      await markNotificationsRead(unread, token)
      sessionStorage.removeItem(`iwc_portal2_${user?.email}`)
    } catch {}
  }

  // Membership rank helpers
  const myRank = membership?.active ? plans.findIndex(p => p.id === membership.planId) : -1
  const rankOf = (planId) => plans.findIndex(p => p.id === planId)
  const topPlan = plans.length > 0 && myRank === plans.length - 1

  const unlockedPlanCourses = planCourses.filter(p => { const r = rankOf(p.accessPlanId); return r !== -1 && myRank >= r })
  const lockedPlanCourses   = planCourses.filter(p => { const r = rankOf(p.accessPlanId); return r === -1 || myRank < r })

  const hasAnyContent = enrollments.length > 0 || freePortalCourses.length > 0 ||
    planCourses.length > 0 || events.length > 0

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NotificationBell notifications={notifications} onOpen={markAllRead} />
          <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Welcome + membership status */}
        <div style={{ marginBottom: 36, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16, justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>
              Welcome back{membership?.name ? `, ${membership.name.split(' ')[0]}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
              Your learning hub — courses, member events, and free resources.
            </p>
          </div>

          {membership?.active ? (
            <div style={{ background: '#fff', border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Ticket size={22} color={GOLD} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>
                  {membership.planName} member
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  {membership.expiresAt ? `Expires ${formatDate(membership.expiresAt)}` : 'Lifetime access'}
                </div>
              </div>
              {!topPlan && (
                <button onClick={() => navigate('/join?upgrade=1')} style={{ background: '#f5f0ff', border: 'none', borderRadius: 8, color: BRAND, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Upgrade
                </button>
              )}
            </div>
          ) : (
            <div style={{ background: 'linear-gradient(135deg, #f5f0ff, #ede9fe)', border: `1px solid ${BRAND}28`, borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Ticket size={22} color={BRAND} />
              <div style={{ fontSize: 12.5, color: '#4b5563', maxWidth: 220, lineHeight: 1.5 }}>
                {membership && !membership.active && membership.expiresAt
                  ? <>Your <strong>{membership.planName}</strong> membership has expired.</>
                  : <>Become a member to unlock premium courses & events.</>}
              </div>
              <button onClick={() => navigate(membership ? '/join?renew=1' : '/join')} style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND2})`, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {membership ? 'Renew' : 'Join Now'}
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', color: '#dc2626', fontSize: 14, marginBottom: 24 }}>
            {error} — <button onClick={() => load(true)} style={{ background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', fontSize: 14 }}>Try again</button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>Loading your portal…</div>
        )}

        {!loading && !error && !hasAnyContent && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <BookOpen size={52} color="#c4b5f8" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#374151', margin: '0 0 8px' }}>No courses yet</h2>
            <p style={{ color: '#9ca3af', fontSize: 15, maxWidth: 360, margin: '0 auto 28px' }}>
              Browse available courses and register to get started.
            </p>
            <button onClick={() => navigate('/courses')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: BRAND, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Browse Courses <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── Upcoming events ─────────────────────────────────────────────── */}
        {!loading && events.length > 0 && (
          <Section title="Upcoming Events" subtitle="Events you have access to — add them to your calendar" horizontal>
            {events.map(ev => <EventCard key={ev.id} event={ev} navigate={navigate} />)}
          </Section>
        )}

        {/* ── My enrolled courses ─────────────────────────────────────────── */}
        {!loading && enrollments.length > 0 && (
          <Section title="My Courses" subtitle="Courses you're enrolled in">
            {enrollments.map(enr => {
              const prog = courses[enr.courseId]
              return (
                <CourseCard
                  key={enr.id}
                  course={prog}
                  fallbackTitle={enr.courseTitle}
                  badge={enr.paymentRef ? 'Enrolled' : 'Free'}
                  badgeColor={enr.paymentRef ? '#16a34a' : '#0369a1'}
                  badgeBg={enr.paymentRef ? '#dcfce7' : '#e0f2fe'}
                  sub={`Enrolled ${formatDate(enr.enrolledAt)}`}
                  action={prog?.hasPortalAccess ? {
                    label: 'View Content →',
                    onClick: () => navigate(`/portal/course/${enr.courseId}`),
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

        {/* ── Included in your plan ────────────────────────────────────────── */}
        {!loading && unlockedPlanCourses.length > 0 && (
          <Section title="Included in Your Plan" subtitle={`Unlocked by your ${membership?.planName || ''} membership`} horizontal onViewAll={() => navigate('/courses')}>
            {unlockedPlanCourses.map(prog => (
              <CourseCard
                key={prog.id}
                course={prog}
                fallbackTitle={prog.title}
                badge={`✓ ${plans.find(p => p.id === prog.accessPlanId)?.name || 'Included'}`}
                badgeColor="#15803d"
                badgeBg="#dcfce7"
                sub="Included in your membership"
                action={prog.hasPortalAccess ? {
                  label: 'Start Learning →',
                  onClick: () => navigate(`/portal/course/${prog.id}`),
                  primary: true,
                } : {
                  label: 'Content coming soon',
                  disabled: true,
                }}
              />
            ))}
          </Section>
        )}

        {/* ── Free resources ──────────────────────────────────────────────── */}
        {!loading && freePortalCourses.length > 0 && (
          <Section title="Free Learning Resources" subtitle="Open to all members — dive in anytime" horizontal onViewAll={() => navigate('/courses')}>
            {freePortalCourses.map(prog => (
              <CourseCard
                key={prog.id}
                course={prog}
                fallbackTitle={prog.title}
                badge="Free"
                badgeColor="#0369a1"
                badgeBg="#e0f2fe"
                sub="Available to all members"
                action={{
                  label: 'Start Learning →',
                  onClick: () => navigate(`/portal/course/${prog.id}`),
                  primary: true,
                }}
              />
            ))}
          </Section>
        )}

        {/* ── Higher-tier courses ─────────────────────────────────────────── */}
        {!loading && lockedPlanCourses.length > 0 && (
          <Section title="Upgrade to Unlock" subtitle="Courses in higher membership tiers" horizontal onViewAll={() => navigate('/courses')}>
            {lockedPlanCourses.map(prog => {
              const reqPlan = plans.find(p => p.id === prog.accessPlanId)
              return (
                <CourseCard
                  key={prog.id}
                  course={prog}
                  fallbackTitle={prog.title}
                  badge={`🔒 ${reqPlan?.name || 'Higher plan'}`}
                  badgeColor="#92400e"
                  badgeBg="#fef3c7"
                  sub={`Requires the ${reqPlan?.name || 'higher'} plan or above`}
                  action={{
                    label: membership?.active ? 'Upgrade to Unlock →' : 'Join to Unlock →',
                    onClick: () => navigate(membership?.active ? '/join?upgrade=1' : '/join'),
                    primary: false,
                  }}
                />
              )
            })}
          </Section>
        )}

        {/* ── Legacy paid courses ─────────────────────────────────────────── */}
        {!loading && moreCourses.length > 0 && (
          <Section title="More Courses" subtitle="Enroll to unlock full access" horizontal onViewAll={() => navigate('/courses')}>
            {moreCourses.map(prog => (
              <CourseCard
                key={prog.id}
                course={prog}
                fallbackTitle={prog.title}
                badge="★ Premium"
                badgeColor="#92400e"
                badgeBg="#fef3c7"
                sub="Enroll to unlock"
                action={{
                  label: 'Enroll Now →',
                  onClick: () => navigate(`/onboard?courseId=${prog.id}`),
                  primary: false,
                }}
              />
            ))}
          </Section>
        )}
      </div>

      <div style={{ padding: '20px 24px', textAlign: 'center', borderTop: '1px solid #f3f4f6' }}>
        <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}><ArrowLeft size={14} /> Back to Courses</button>
      </div>
    </div>
  )
}

// ── Notification bell ──────────────────────────────────────────────────────────

function NotificationBell({ notifications, onOpen }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) onOpen?.()
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={toggle} title="Notifications" style={{ position: 'relative', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.8)', padding: '6px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <Bell size={16} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, borderRadius: 10, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 42, width: 330, maxWidth: '88vw', background: '#fff', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.18)', border: '1px solid #f3f4f6', overflow: 'hidden', zIndex: 50 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontWeight: 800, fontSize: 13, color: '#111827' }}>
            Notifications
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Nothing yet — event announcements will appear here.
              </div>
            ) : notifications.map(n => (
              <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb', background: n.read ? '#fff' : '#f5f0ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: BRAND, flexShrink: 0 }} />}
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>{n.title}</div>
                </div>
                <div style={{ fontSize: 11.5, color: '#6b7280', whiteSpace: 'pre-line', lineHeight: 1.55, margin: '4px 0 4px', maxHeight: 64, overflow: 'hidden' }}>{n.body}</div>
                <div style={{ fontSize: 10, color: '#c4c7cf' }}>{formatDateTime(n.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Event card ─────────────────────────────────────────────────────────────────

function EventCard({ event, navigate }) {
  const a = event.eventAccess || {}
  const mode = a.mode || 'online'
  const isOnline = mode !== 'in_person'
  const [showCode, setShowCode] = useState(false)

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6',
      display: 'flex', flexDirection: 'column', minHeight: 250, height: '100%', boxSizing: 'border-box',
    }}>
      <div style={{ height: 96, flexShrink: 0, background: 'linear-gradient(135deg, #1e0f3a, #3b1d6e)', position: 'relative', overflow: 'hidden' }}>
        {event.image && <img src={event.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />}
        <span style={{ position: 'absolute', top: 10, left: 10, background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '3px 10px' }}>EVENT</span>
        <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.92)', color: '#374151', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {isOnline ? <Video size={11} /> : <MapPin size={11} />}
          {mode === 'hybrid' ? 'Hybrid' : isOnline ? (a.platform || 'Online') : 'In person'}
        </span>
      </div>

      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#111827', lineHeight: 1.3, minHeight: '2.6em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.title}</h3>
        {event.startDate && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: BRAND, fontWeight: 700 }}>
            <Calendar size={13} /> {formatDateTime(event.startDate)}
          </div>
        )}
        {!isOnline && (a.address || event.venue) && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#6b7280' }}>
            <MapPin size={12} /> {a.address || event.venue}
          </div>
        )}

        {/* Online access details */}
        {isOnline && a.link && (
          <a href={a.link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fff', background: `linear-gradient(135deg, ${BRAND}, ${BRAND2})`, borderRadius: 8, padding: '8px 12px', textDecoration: 'none', fontWeight: 700, marginTop: 4, justifyContent: 'center' }}>
            <Video size={13} /> Join Event Link
          </a>
        )}
        {isOnline && a.passcode && (
          <button onClick={() => setShowCode(s => !s)} style={{ background: '#f9fafb', border: '1px dashed #e5e7eb', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#6b7280', cursor: 'pointer' }}>
            {showCode ? <>Passcode: <strong style={{ color: '#111827', letterSpacing: 1 }}>{a.passcode}</strong></> : '🔑 Show passcode'}
          </button>
        )}
        {a.notes && <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>{a.notes}</div>}

        <div style={{ flex: 1 }} />

        {/* Add to calendar + RSVP */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 110, textAlign: 'center', background: '#f5f0ff', color: BRAND, borderRadius: 8, padding: '9px 0', fontSize: 11.5, fontWeight: 700, textDecoration: 'none' }}>
            📅 Google Cal
          </a>
          <button onClick={() => downloadICS(event)} style={{ flex: 1, minWidth: 100, background: '#f5f0ff', color: BRAND, border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
            ⬇ .ics file
          </button>
          {event.registrationFormId && (
            <button onClick={() => navigate(`/register?id=${event.registrationFormId}`)} style={{ flexBasis: '100%', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 0', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
            ✋ RSVP / Register
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, subtitle, children, horizontal, onViewAll }) {
  const kids = [].concat(children).filter(Boolean)
  return (
    <div style={{ marginBottom: 52 }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{subtitle}</p>}
        </div>
        {onViewAll && (
          <button onClick={onViewAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: BRAND, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            View all <ArrowRight size={14} />
          </button>
        )}
      </div>
      {horizontal ? (
        <div style={{
          display: 'flex', gap: 18, overflowX: 'auto',
          paddingBottom: 8, paddingRight: 4,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#e5e7eb transparent',
        }}>
          {kids.map((child, i) => (
            <div key={i} style={{ flexShrink: 0, width: 280, scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column' }}>{child}</div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Course card ───────────────────────────────────────────────────────────────

function CourseCard({ course, fallbackTitle, badge, badgeColor, badgeBg, sub, action }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6',
      display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box',
    }}>
      {/* Thumbnail */}
      <div style={{ height: 140, flexShrink: 0, background: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
        {course?.image
          ? <img src={course.image} alt={course?.title || fallbackTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6c3fc520, #6c3fc540)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={34} color={BRAND} /></div>
        }
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: badgeBg, color: badgeColor,
          fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 9px',
        }}>{badge}</span>
      </div>

      {/* Info */}
      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#111827', lineHeight: 1.3, minHeight: '2.6em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {course?.title || fallbackTitle}
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
