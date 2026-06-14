import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEnrolledUsersProgress, getMembers } from '../utils/formStorage'
import { Receipt, ArrowLeft, Search, Download, Wallet, Ticket, Users, BookOpen } from 'lucide-react'

const ACC  = '#10B981'
const DARK = '#0e0a1e'

const TYPE_CHIP = {
  'Membership':   { c: '#b79df0', bg: 'rgba(108,63,197,0.2)' },
  'Event ticket': { c: '#fbbf24', bg: 'rgba(245,158,11,0.15)' },
  'Course':       { c: '#74b9e8', bg: 'rgba(52,152,219,0.15)' },
}
const STATUS_CHIP = {
  'Paid':        { c: '#34d399', bg: 'rgba(16,185,129,0.15)' },
  'Free (promo)':{ c: '#fbbf24', bg: 'rgba(245,158,11,0.15)' },
  'Free':        { c: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.06)' },
}

function money(n, currency = 'GHS') {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return `${currency} ${Math.round(Number(n)).toLocaleString()}`
}
function formatDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

// Build a unified transaction list from enrollments (event tickets / legacy
// course payments) and members (membership purchases + renewal/upgrade history).
function buildTransactions({ enrollments, courses, members }) {
  const courseById = {}
  for (const c of (courses || [])) courseById[c.id] = c
  const txns = []

  for (const e of (enrollments || [])) {
    const course = courseById[e.courseId]
    const isEv   = (course?.courseType || 'course') === 'event'
    const amount = Number(e.amountPaid) || 0
    const paid   = amount > 0 || !!e.paymentRef
    txns.push({
      id:        e.id || `${e.courseId}-${e.participantEmail}`,
      date:      e.enrolledAt || null,
      name:      e.participantName || '—',
      email:     e.participantEmail || '—',
      type:      isEv ? 'Event ticket' : 'Course',
      item:      e.courseTitle || course?.title || '—',
      amount,
      currency:  e.currency || 'GHS',
      reference: e.paymentRef || '',
      promo:     e.promoCode || '',
      status:    paid ? 'Paid' : (e.promoCode ? 'Free (promo)' : 'Free'),
    })
  }

  for (const m of (members || [])) {
    const amount = Number(m.amountPaid) || 0
    txns.push({
      id:        `mem-${m.email}-${m.renewedAt || m.joinedAt || ''}`,
      date:      m.renewedAt || m.joinedAt || null,
      name:      m.name || '—',
      email:     m.email || '—',
      type:      'Membership',
      item:      m.planName || 'Membership',
      amount,
      currency:  m.currency || 'GHS',
      reference: m.paymentRef || '',
      promo:     '',
      status:    (amount > 0 || m.paymentRef) ? 'Paid' : 'Free',
    })
    // Prior periods (renewals / upgrades). Older records may not carry an amount.
    for (const h of (m.history || [])) {
      const hAmount = h.amountPaid == null ? null : Number(h.amountPaid)
      txns.push({
        id:        `memh-${m.email}-${h.replacedAt || h.paymentRef || Math.random().toString(36).slice(2)}`,
        date:      h.startedAt || h.replacedAt || null,
        name:      m.name || '—',
        email:     m.email || '—',
        type:      'Membership',
        item:      `${h.planName || 'Membership'} (previous period)`,
        amount:    hAmount,
        currency:  h.currency || m.currency || 'GHS',
        reference: h.paymentRef || '',
        promo:     '',
        status:    (hAmount > 0 || h.paymentRef) ? 'Paid' : 'Free',
      })
    }
  }

  txns.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  return txns
}

function downloadCSV(rows) {
  const headers = ['Date', 'Name', 'Email', 'Type', 'Item', 'Amount', 'Currency', 'Status', 'Reference', 'Promo']
  const lines = rows.map(t => [
    t.date ? new Date(t.date).toISOString() : '',
    t.name, t.email, t.type, t.item,
    t.amount == null ? '' : t.amount,
    t.currency, t.status, t.reference, t.promo,
  ])
  const csv = [headers, ...lines]
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.download = `iwc_payments_${new Date().toISOString().slice(0, 10)}.csv`
  a.href = url; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Kpi({ icon: Icon, accent, label, value, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={accent} />
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{label}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: 'white', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function Chip({ map, value }) {
  const s = map[value] || { c: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.06)' }
  return <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.c, whiteSpace: 'nowrap' }}>{value}</span>
}

const TYPES = ['All', 'Membership', 'Event ticket', 'Course']

export default function PaymentsAdmin() {
  const navigate = useNavigate()
  const [txns,    setTxns]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [query,   setQuery]   = useState('')
  const [type,    setType]    = useState('All')
  const [paidOnly, setPaidOnly] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      const [prog, members] = await Promise.all([
        getEnrolledUsersProgress(),
        getMembers().catch(() => []),
      ])
      setTxns(buildTransactions({
        enrollments: prog?.enrollments || [],
        courses:     prog?.courses || [],
        members:     members || [],
      }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return txns.filter(t => {
      if (type !== 'All' && t.type !== type) return false
      if (paidOnly && t.status !== 'Paid') return false
      if (!q) return true
      return [t.name, t.email, t.item, t.reference, t.promo].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [txns, query, type, paidOnly])

  const summary = useMemo(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${now.getMonth()}`
    const byCurrency = {}      // total collected per currency (Paid only)
    let thisMonth = 0
    let memberships = 0, tickets = 0, courses = 0
    for (const t of visible) {
      if (t.status === 'Paid' && t.amount != null) {
        byCurrency[t.currency] = (byCurrency[t.currency] || 0) + Number(t.amount)
        if (t.date) {
          const d = new Date(t.date)
          if (`${d.getFullYear()}-${d.getMonth()}` === ym && t.currency === 'GHS') thisMonth += Number(t.amount)
        }
      }
      if (t.type === 'Membership') memberships++
      else if (t.type === 'Event ticket') tickets++
      else courses++
    }
    return { byCurrency, thisMonth, memberships, tickets, courses, count: visible.length }
  }, [visible])

  const totalLabel = Object.keys(summary.byCurrency).length === 0
    ? 'GHS 0'
    : Object.entries(summary.byCurrency).map(([cur, amt]) => money(amt, cur)).join(' · ')

  const th = { textAlign: 'left', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 12px', whiteSpace: 'nowrap' }
  const td = { fontSize: 12, color: 'rgba(255,255,255,0.85)', padding: '11px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'top' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={13} /> Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#34d399)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Receipt size={18} color="white" /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Payments</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => downloadCSV(visible)} disabled={visible.length === 0} style={{ background: visible.length ? `${ACC}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${visible.length ? ACC + '66' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, color: visible.length ? '#34d399' : 'rgba(255,255,255,0.3)', padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: visible.length ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Download size={13} /> Export CSV</button>
          <button onClick={load} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: 'white', padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {loading && <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>Loading payments…</div>}
          {error && !loading && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 18px', color: '#f87171', fontSize: 13 }}>
              {error} — <button onClick={load} style={{ background: 'none', border: 'none', color: '#f87171', textDecoration: 'underline', cursor: 'pointer' }}>try again</button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 22 }}>
                <Kpi icon={Wallet} accent="#10B981" label="Collected (filtered)" value={totalLabel} sub="Paid transactions only" />
                <Kpi icon={Receipt} accent="#3498DB" label="This month (GHS)" value={money(summary.thisMonth)} />
                <Kpi icon={Users} accent="#9B59B6" label="Memberships" value={summary.memberships.toLocaleString()} />
                <Kpi icon={Ticket} accent="#fbbf24" label="Event tickets" value={summary.tickets.toLocaleString()} />
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {TYPES.map(t => (
                    <button key={t} onClick={() => setType(t)} style={{ border: `1.5px solid ${type === t ? ACC : 'rgba(255,255,255,0.12)'}`, background: type === t ? `${ACC}1f` : 'transparent', color: type === t ? '#34d399' : 'rgba(255,255,255,0.6)', borderRadius: 20, padding: '7px 14px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>{t}</button>
                  ))}
                  <button onClick={() => setPaidOnly(v => !v)} style={{ border: `1.5px solid ${paidOnly ? ACC : 'rgba(255,255,255,0.12)'}`, background: paidOnly ? `${ACC}1f` : 'transparent', color: paidOnly ? '#34d399' : 'rgba(255,255,255,0.6)', borderRadius: 20, padding: '7px 14px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>{paidOnly ? '✓ ' : ''}Paid only</button>
                </div>
                <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
                  <Search size={15} color="rgba(255,255,255,0.35)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email, item, ref…" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '8px 14px 8px 34px', fontSize: 12, color: 'white', outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>

              {/* Table */}
              {visible.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                  {txns.length === 0 ? 'No payments yet.' : 'No payments match your filters.'}
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <th style={th}>Date</th>
                        <th style={th}>Customer</th>
                        <th style={th}>Type</th>
                        <th style={th}>Item</th>
                        <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                        <th style={th}>Status</th>
                        <th style={th}>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map(t => (
                        <tr key={t.id}>
                          <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatDate(t.date)}</td>
                          <td style={td}>
                            <div style={{ fontWeight: 700, color: 'white' }}>{t.name}</div>
                            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>{t.email}</div>
                          </td>
                          <td style={td}><Chip map={TYPE_CHIP} value={t.type} /></td>
                          <td style={{ ...td, maxWidth: 240 }}>{t.item}{t.promo ? <span style={{ fontSize: 10, color: '#fbbf24', marginLeft: 6 }}>🏷 {t.promo}</span> : null}</td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: t.amount > 0 ? '#34d399' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{money(t.amount, t.currency)}</td>
                          <td style={td}><Chip map={STATUS_CHIP} value={t.status} /></td>
                          <td style={{ ...td, fontSize: 10.5, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: 150 }}>{t.reference || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ marginTop: 14, fontSize: 10.5, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
                Showing {visible.length} of {txns.length} transaction{txns.length !== 1 ? 's' : ''}.
                Membership renewals recorded before this update may show their amount as “—”; new renewals carry it.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
