/**
 * api/paystack-webhook.js — Paystack webhook handler (charge.success)
 *
 * A server-side safety net for enrollment. The normal flow enrolls the learner
 * client-side after Paystack redirects back to the browser
 * (see src/pages/CourseOnboarding.jsx). If the user closes the tab or loses
 * connection before that redirect lands, they'd be charged but never enrolled.
 * This webhook fires server-to-server and completes the enrollment regardless.
 *
 * Deduplication: both this handler and the client use `ref_<reference>` as the
 * enrollment id. The enrollments table has `id text primary key` and we INSERT
 * with `ON CONFLICT (id) DO NOTHING`, so whichever path runs first wins and the
 * welcome email is sent exactly once.
 *
 * Security: verifies the `x-paystack-signature` header (HMAC-SHA512 of the raw
 * request body, keyed with PAYSTACK_SECRET_KEY) before trusting the payload.
 *
 * Required env: DATABASE_URL, PAYSTACK_SECRET_KEY
 * Optional env: PUBLIC_BASE_URL (for portal links in the welcome email)
 *
 * Register in Paystack Dashboard → Settings → API Keys & Webhooks:
 *   URL: https://<your-vercel-domain>/api/paystack-webhook
 */

import crypto from 'node:crypto'
import pg from 'pg'
import {
  sendMail, renderTemplate, emailVars, DEFAULT_EMAIL_SETTINGS,
} from './_email.js'

// Disable Vercel's body parser so we can read raw bytes for signature verification.
export const config = { api: { bodyParser: false } }

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function withDb(fn) {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set')
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1')
  const client = new pg.Client({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  })
  await client.connect()
  try   { return await fn(client) }
  finally { await client.end().catch(() => {}) }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    console.error('[paystack-webhook] PAYSTACK_SECRET_KEY not set')
    return res.status(500).json({ error: 'Webhook not configured' })
  }

  const rawBody   = await readRawBody(req)
  const signature = req.headers['x-paystack-signature'] || ''
  const expected  = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  if (signature !== expected) {
    console.warn('[paystack-webhook] signature mismatch — rejected')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let event
  try { event = JSON.parse(rawBody.toString('utf8')) }
  catch { return res.status(400).json({ error: 'Invalid JSON' }) }

  // Only enroll on a successful charge; acknowledge everything else.
  if (event?.event !== 'charge.success') return res.status(200).json({ received: true })

  try {
    await withDb(db => enrollFromCharge(db, event.data || {}))
  } catch (e) {
    // Return 200 so Paystack doesn't keep retrying; we log for investigation.
    console.error('[paystack-webhook]', e.message)
    return res.status(200).json({ received: true, error: e.message })
  }

  return res.status(200).json({ received: true })
}

async function enrollFromCharge(db, data) {
  const { reference, amount, currency = 'GHS', customer = {}, metadata = {} } = data
  const { courseId, courseTitle = '', participantName = '' } = metadata || {}
  const participantEmail = customer?.email

  if (!reference || !courseId || !participantEmail) return

  // Same id the client uses → ON CONFLICT dedupes the two paths.
  const id = `ref_${reference}`
  const enrollment = {
    id,
    courseId,
    courseTitle,
    participantName,
    participantEmail,
    paymentRef: reference,
    amountPaid: Math.round((Number(amount) || 0) / 100), // Paystack amount is in the minor unit
    currency,
    enrolledAt: new Date().toISOString(),
    source: 'webhook',
  }

  const result = await db.query(
    `INSERT INTO enrollments (id, course_id, data, created_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [id, courseId, enrollment, enrollment.enrolledAt]
  )

  // Welcome email only when this row is genuinely new (client hasn't already enrolled).
  if (result.rowCount > 0) {
    const { rows } = await db.query("SELECT data FROM settings WHERE key = 'emailSettings'")
    const settings = { ...DEFAULT_EMAIL_SETTINGS, ...(rows[0]?.data || {}) }
    if (settings.welcomeEnabled) {
      const vars = emailVars({
        name: participantName, course: courseTitle,
        baseUrl: process.env.PUBLIC_BASE_URL,
      })
      try {
        await sendMail({
          to: participantEmail,
          subject: renderTemplate(settings.welcomeSubject, vars),
          text: renderTemplate(settings.welcomeBody, vars),
          settings,
        })
      } catch (e) {
        console.warn('[paystack-webhook] welcome email failed:', e.message)
      }
    }
  }
}
