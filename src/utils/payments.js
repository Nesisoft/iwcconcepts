/**
 * payments.js — build a unified payment-transaction list from the admin data
 * the API already returns (enrollments + members). Used by the Analytics screen's
 * Payments tab. No new backend endpoint required.
 *
 * A transaction: { id, date, name, email, type, item, amount|null, currency,
 *                  reference, promo, status }
 *   type   : 'Membership' | 'Event ticket' | 'Course'
 *   status : 'Paid' | 'Free (promo)' | 'Free'
 *   amount : null when a historical membership period stored no amount
 */

export function buildTransactions({ enrollments = [], courses = [], members = [] }) {
  const courseById = {}
  for (const c of courses) courseById[c.id] = c
  const txns = []

  for (const e of enrollments) {
    const course = courseById[e.courseId]
    const isEv   = (course?.courseType || 'course') === 'event'
    const amount = Number(e.amountPaid) || 0
    const paid   = amount > 0 || !!e.paymentRef
    txns.push({
      id:        e.id || `${e.courseId}-${e.participantEmail}`,
      date:      e.enrolledAt || e.createdAt || null,
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

  for (const m of members) {
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

export function money(n, currency = 'GHS') {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return `${currency} ${Math.round(Number(n)).toLocaleString()}`
}

export function formatTxnDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

// Sum paid transactions per currency → { GHS: 1234, ... }
export function totalsByCurrency(txns) {
  const out = {}
  for (const t of txns) {
    if (t.status === 'Paid' && t.amount != null) out[t.currency] = (out[t.currency] || 0) + Number(t.amount)
  }
  return out
}

// Paid revenue grouped by YYYY-MM (GHS), oldest→newest, last `limit` months.
export function revenueByMonth(txns, limit = 12) {
  const map = {}
  for (const t of txns) {
    if (t.status !== 'Paid' || t.amount == null || !t.date) continue
    const ym = String(t.date).slice(0, 7)
    map[ym] = (map[ym] || 0) + Number(t.amount)
  }
  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-limit)
    .map(([month, revenue]) => ({ month, revenue }))
}

export function downloadPaymentsCSV(rows) {
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
