/**
 * api/paystack-init.js — initialise a Paystack transaction server-side
 *
 * Called by the frontend before redirecting the user to Paystack's hosted
 * checkout page. Using the server (not the browser) to initialise means the
 * secret key is never exposed to the client.
 *
 * Phase 4C — the charge amount is computed/validated SERVER-SIDE from the
 * authoritative price (course/event price × discount + validated promo code, or
 * the membership plan price), so a tampered client `amount` can't change what is
 * actually charged. If the item can't be looked up (e.g. DATABASE_URL not set or
 * the DB is unreachable) it falls back to the client amount so checkout still
 * works — availability over strict validation, and the common case is covered.
 *
 * Required env: PAYSTACK_SECRET_KEY (sk_live_… or sk_test_…)
 * Optional env for validation: DATABASE_URL (same value api/db.js uses)
 */

import pg from 'pg'

// — tiny promo helpers (mirror src/utils/access.js; kept inline so this
//   serverless function carries no cross-bundle imports) —
function findPromoCode(item, input) {
  const want = String(input || '').trim().toUpperCase()
  if (!want) return null
  return (item?.promoCodes || []).find(p => String(p.code || '').trim().toUpperCase() === want) || null
}
function priceAfterPromo(price, promo) {
  const base = Number(price) || 0
  if (!promo) return base
  if (promo.kind === 'free') return 0
  const pct = Math.max(0, Math.min(100, Number(promo.value) || 0))
  return Math.round(base * (1 - pct / 100))
}

async function queryRows(sql, params) {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) return null
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  })
  await client.connect()
  try {
    const { rows } = await client.query(sql, params)
    return rows
  } finally {
    await client.end().catch(() => {})
  }
}

// Authoritative amount from server data, or null if it can't be determined
// (caller then falls back to the client-provided amount).
async function authoritativeAmount({ metadata, promoCode }) {
  try {
    const meta = metadata || {}
    // Membership purchase → plan price
    if (meta.type === 'membership' || meta.planId) {
      const rows  = await queryRows(`SELECT data FROM settings WHERE key = 'membershipPlans'`, [])
      if (!rows) return null
      const plans = rows[0]?.data?.plans || []
      const plan  = plans.find(p => p.id === meta.planId)
      return plan ? (Number(plan.price) || 0) : null
    }
    // Course / event → price × discount, then a validated promo code
    if (meta.courseId) {
      const rows   = await queryRows('SELECT data FROM courses WHERE id = $1', [meta.courseId])
      if (!rows) return null
      const course = rows[0]?.data
      if (!course) return null
      const base  = Math.round((Number(course.price) || 0) * (1 - (Number(course.discount) || 0) / 100))
      const promo = findPromoCode(course, promoCode || meta.promoCode)
      return priceAfterPromo(base, promo)
    }
    return null
  } catch (e) {
    console.warn('[paystack-init] server amount validation skipped:', e.message)
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, amount, currency = 'GHS', channels, callback_url, metadata, promoCode } = req.body || {}

  if (!email) return res.status(400).json({ error: 'email is required' })

  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    return res.status(500).json({
      error: 'Paystack is not configured on the server. Add PAYSTACK_SECRET_KEY to your environment variables.',
    })
  }

  // Recompute the amount from server data; fall back to the client amount only
  // when the item can't be looked up.
  const serverAmount = await authoritativeAmount({ metadata, promoCode })
  const chargeAmount = serverAmount != null ? serverAmount : Number(amount)

  if (!chargeAmount || chargeAmount <= 0) {
    return res.status(400).json({ error: 'No payment is required for this item.' })
  }
  if (serverAmount != null && Number(amount) && Math.round(Number(amount)) !== Math.round(serverAmount)) {
    console.warn(`[paystack-init] client amount ${amount} != server amount ${serverAmount}; charging the server amount.`)
  }

  try {
    const body = { email, amount: Math.round(chargeAmount * 100), currency, callback_url, metadata }
    if (channels?.length) body.channels = channels

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await paystackRes.json()

    if (!data.status || !data.data?.authorization_url) {
      return res.status(400).json({ error: data.message || 'Paystack initialisation failed' })
    }

    res.json({
      authorization_url: data.data.authorization_url,
      reference:         data.data.reference,
      access_code:       data.data.access_code,
    })
  } catch (err) {
    console.error('[paystack-init]', err.message)
    res.status(500).json({ error: err.message || 'Payment initialisation error' })
  }
}
