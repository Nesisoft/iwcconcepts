import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEnrolledUsersProgress } from '../utils/formStorage'
import {
  BarChart3, Users, DollarSign, GraduationCap, TrendingUp,
  Award, BookOpen, CheckCircle,
} from 'lucide-react'

const ACC  = '#9B59B6'
const DARK = '#0e0a1e'

function cedis(n) {
  return 'GHS ' + Math.round(n || 0).toLocaleString()
}
function monthLabel(ym) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-GH', { month: 'short', year: '2-digit' })
}

export default function AnalyticsAdmin() {
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      setData(await getEnrolledUsersProgress())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => computeStats(data), [data])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#c084e0)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Analytics</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'rgba(255,255,255,0.7)', padding: '6px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Refresh</button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {loading && <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>Crunching the numbers…</div>}
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '16px 20px', color: '#f87171', fontSize: 13 }}>{error}</div>}

        {!loading && !error && stats && (
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
              <Kpi icon={DollarSign}   accent="#10B981" label="Total Revenue"      value={cedis(stats.revenue)} />
              <Kpi icon={Users}        accent="#3498DB" label="Total Enrollments"  value={stats.enrollments.toLocaleString()} />
              <Kpi icon={GraduationCap} accent="#C9A84C" label="Unique Learners"    value={stats.learners.toLocaleString()} />
              <Kpi icon={Award}        accent="#d97706" label="Certificates"       value={stats.certificates.toLocaleString()} />
              <Kpi icon={CheckCircle}  accent="#16a34a" label="Avg. Completion"     value={stats.avgCompletion + '%'} />
            </div>

            {/* Enrollments over time */}
            <Panel title="Enrollments Over Time" icon={TrendingUp}>
              {stats.byMonth.length === 0 ? (
                <Empty text="No enrollment data yet." />
              ) : (
                <BarChart
                  data={stats.byMonth}
                  labelKey="month"
                  valueKey="enrollments"
                  format={monthLabel}
                  color={ACC}
                  subLabel={(d) => cedis(d.revenue)}
                />
              )}
            </Panel>

            {/* Per-course breakdown */}
            <Panel title="Course Performance" icon={BookOpen}>
              {stats.byCourse.length === 0 ? (
                <Empty text="No courses with enrollments yet." />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 640 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' }}>
                        <th style={th}>Course</th>
                        <th style={th}>Type</th>
                        <th style={th}>Enrollments</th>
                        <th style={th}>Revenue</th>
                        <th style={th}>Completion</th>
                        <th style={th}>Certificates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byCourse.map(c => (
                        <tr key={c.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <td style={{ ...td, fontWeight: 700, color: 'white' }}>{c.title}</td>
                          <td style={td}>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: c.type === 'paid' ? 'rgba(245,184,0,0.15)' : 'rgba(16,185,129,0.15)', color: c.type === 'paid' ? '#F5B800' : '#34d399', textTransform: 'uppercase' }}>{c.type}</span>
                          </td>
                          <td style={td}>{c.enrollments}</td>
                          <td style={td}>{c.type === 'paid' ? cedis(c.revenue) : '—'}</td>
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 60, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${c.completionRate}%`, height: '100%', background: c.completionRate >= 100 ? '#10B981' : ACC }} />
                              </div>
                              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{c.completionRate}%</span>
                            </div>
                          </td>
                          <td style={td}>{c.awardsCertificate ? c.certificates : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            {/* Recent enrollments */}
            <Panel title="Recent Enrollments" icon={Users}>
              {stats.recent.length === 0 ? (
                <Empty text="No enrollments yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {stats.recent.map((e, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderTop: i ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, textTransform: 'uppercase' }}>
                        {(e.name || e.email || '?')[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name || e.email}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.courseTitle}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: e.amount > 0 ? '#34d399' : 'rgba(255,255,255,0.4)' }}>{e.amount > 0 ? cedis(e.amount) : 'Free'}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{e.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Presentational helpers ──────────────────────────────────────────────────────

function Kpi({ icon: Icon, accent, label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={accent} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Icon size={16} color={ACC} />
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Empty({ text }) {
  return <div style={{ textAlign: 'center', padding: '28px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{text}</div>
}

function BarChart({ data, labelKey, valueKey, format, color, subLabel }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 200, paddingTop: 10 }}>
      {data.map((d, i) => {
        const h = Math.max((d[valueKey] / max) * 150, 4)
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{d[valueKey]}</div>
            <div title={subLabel ? subLabel(d) : ''} style={{ width: '100%', maxWidth: 48, height: h, background: `linear-gradient(180deg, ${color}, ${color}88)`, borderRadius: '5px 5px 0 0', transition: 'height 0.4s' }} />
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{format ? format(d[labelKey]) : d[labelKey]}</div>
          </div>
        )
      })}
    </div>
  )
}

const th = { padding: '6px 10px', fontWeight: 800 }
const td = { padding: '11px 10px', color: 'rgba(255,255,255,0.7)' }

// ── Stats computation (client-side from getEnrolledUsersProgress) ───────────────

function computeStats(data) {
  if (!data) return null
  const { enrollments = [], progress = [], programs = [], lessonCounts = {} } = data

  const progMap = Object.fromEntries(programs.map(p => [p.id, p]))

  // progress: programId → email → Set(itemId)
  const progLookup = {}
  for (const r of progress) {
    progLookup[r.program_id] ??= {}
    progLookup[r.program_id][r.user_email] ??= new Set()
    progLookup[r.program_id][r.user_email].add(r.item_id)
  }

  let revenue = 0
  const learnerSet = new Set()
  const byCourseMap = {}
  const byMonthMap  = {}
  const recentRaw   = []

  for (const e of enrollments) {
    const prog = progMap[e.programId]
    const amount = Number(e.amountPaid) || 0
    revenue += amount
    if (e.participantEmail) learnerSet.add(e.participantEmail.toLowerCase())

    // by course
    const c = byCourseMap[e.programId] ??= {
      id: e.programId,
      title: prog?.title || e.programTitle || 'Unknown course',
      type: prog?.type || 'free',
      awardsCertificate: prog?.awardsCertificate || false,
      enrollments: 0, revenue: 0, completed: 0,
    }
    c.enrollments += 1
    c.revenue += amount

    // completion for this learner in this course
    const total = lessonCounts[e.programId] || 0
    const done  = progLookup[e.programId]?.[e.participantEmail]?.size || 0
    if (total > 0 && done >= total) c.completed += 1

    // by month
    const iso = e.enrolledAt || e.createdAt
    if (iso) {
      const ym = iso.slice(0, 7)
      const m = byMonthMap[ym] ??= { month: ym, enrollments: 0, revenue: 0 }
      m.enrollments += 1
      m.revenue += amount
    }

    recentRaw.push({
      name: e.participantName,
      email: e.participantEmail,
      courseTitle: prog?.title || e.programTitle || 'Course',
      amount,
      iso,
    })
  }

  const byCourse = Object.values(byCourseMap).map(c => ({
    ...c,
    completionRate: c.enrollments > 0 ? Math.round(c.completed / c.enrollments * 100) : 0,
    certificates: c.awardsCertificate ? c.completed : 0,
  })).sort((a, b) => b.enrollments - a.enrollments)

  const byMonth = Object.values(byMonthMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-12)

  const recent = recentRaw
    .sort((a, b) => String(b.iso).localeCompare(String(a.iso)))
    .slice(0, 8)
    .map(e => ({ ...e, date: e.iso ? new Date(e.iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' }) : '' }))

  const certificates  = byCourse.reduce((s, c) => s + c.certificates, 0)
  const completionVals = byCourse.filter(c => c.enrollments > 0).map(c => c.completionRate)
  const avgCompletion = completionVals.length ? Math.round(completionVals.reduce((a, b) => a + b, 0) / completionVals.length) : 0

  return {
    revenue,
    enrollments: enrollments.length,
    learners: learnerSet.size,
    certificates,
    avgCompletion,
    byMonth,
    byCourse,
    recent,
  }
}
