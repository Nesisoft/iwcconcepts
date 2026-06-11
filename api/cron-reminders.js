/**
 * api/cron-reminders.js — Vercel Cron endpoint (runs daily, see vercel.json).
 *
 * Nudges learners who STARTED a course (completed ≥1 lesson) but stalled —
 * no activity for `reminderDays` days — and haven't finished it.
 *
 * Safety:
 *   - Disabled unless email settings have reminderEnabled = true.
 *   - No-ops without RESEND_API_KEY / a verified sender (sendMail handles that).
 *   - Won't re-remind the same learner+course more often than reminderDays,
 *     and only after fresh activity (tracked in email_reminders).
 *   - If CRON_SECRET is set, requires Authorization: Bearer <CRON_SECRET>.
 *
 * Env:
 *   DATABASE_URL, RESEND_API_KEY, EMAIL_FROM / EMAIL_FROM_ADDRESS,
 *   PUBLIC_BASE_URL (for portal links), CRON_SECRET (optional).
 */

import pg from 'pg'
import {
  sendMail, renderTemplate, emailVars, DEFAULT_EMAIL_SETTINGS,
} from './_email.js'

const MAX_SENDS_PER_RUN = 200

async function withDb(fn) {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL is not set')
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  })
  await client.connect()
  try { return await fn(client) }
  finally { await client.end().catch(() => {}) }
}

export default async function handler(req, res) {
  // Optional shared-secret gate
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.authorization || ''
    if (auth !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = await withDb(run)
    res.status(200).json(result)
  } catch (e) {
    console.error('[cron-reminders]', e.message)
    res.status(500).json({ error: e.message })
  }
}

async function run(db) {
  // 1. Settings
  const { rows: setRows } = await db.query(
    `SELECT data FROM settings WHERE key = 'emailSettings'`
  )
  const settings = { ...DEFAULT_EMAIL_SETTINGS, ...(setRows[0]?.data || {}) }
  if (!settings.reminderEnabled) return { skipped: true, reason: 'reminders_disabled' }

  const days   = Math.max(1, Number(settings.reminderDays) || 5)
  const cutoff = new Date(Date.now() - days * 86400000)

  // 2. Reference data
  const [progR, itemR, progLessons, enrollR, remindR] = await Promise.all([
    db.query(`SELECT id, data FROM courses`),
    db.query(
      `SELECT course_id, COUNT(*)::int AS total FROM content_items
       WHERE (data->>'isPublished')::boolean = true GROUP BY course_id`
    ),
    // latest activity per (course, user)
    db.query(
      `SELECT course_id, user_email,
              COUNT(*)::int AS done, MAX(completed_at) AS last_activity
       FROM course_progress GROUP BY course_id, user_email`
    ),
    // enrollments for the learner's name
    db.query(
      `SELECT DISTINCT ON (course_id, data->>'participantEmail')
              course_id, data
       FROM enrollments
       ORDER BY course_id, data->>'participantEmail', created_at DESC`
    ),
    db.query(`SELECT user_email, course_id, last_sent FROM email_reminders`),
  ])

  const progMap   = Object.fromEntries(progR.rows.map(r => [r.id, r.data]))
  const totals    = Object.fromEntries(itemR.rows.map(r => [r.course_id, r.total]))
  const lastRemind = {}
  for (const r of remindR.rows) lastRemind[`${r.course_id}::${r.user_email}`] = new Date(r.last_sent)

  // name lookup
  const nameOf = {}
  for (const r of enrollR.rows) {
    nameOf[`${r.course_id}::${(r.data.participantEmail || '').toLowerCase()}`] = r.data.participantName
  }

  const baseUrl = process.env.PUBLIC_BASE_URL || ''
  let sent = 0, considered = 0

  for (const row of progLessons.rows) {
    if (sent >= MAX_SENDS_PER_RUN) break
    const { course_id, user_email, done, last_activity } = row
    const prog = progMap[course_id]
    const total = totals[course_id] || 0

    if (!prog || !prog.hasPortalAccess) continue
    if (total === 0 || done === 0) continue        // not published / not started
    if (done >= total) continue                    // already complete

    const lastActivity = new Date(last_activity)
    if (lastActivity > cutoff) continue            // active recently — leave alone
    considered++

    // Avoid repeat reminders: only re-send if they were active AFTER the last
    // reminder, and at least `days` since the last reminder.
    const key = `${course_id}::${user_email}`
    const prev = lastRemind[key]
    if (prev) {
      if (prev >= lastActivity) continue           // already reminded since last activity
      if (Date.now() - prev.getTime() < days * 86400000) continue
    }

    const name = nameOf[`${course_id}::${user_email.toLowerCase()}`] || user_email.split('@')[0]
    const vars = emailVars({ name, course: prog.title, baseUrl })

    const result = await sendMail({
      to: user_email,
      subject: renderTemplate(settings.reminderSubject, vars),
      text: renderTemplate(settings.reminderBody, vars),
      settings,
    })
    if (result?.skipped) {
      // Misconfigured provider — stop early, nothing will send this run.
      return { skipped: true, reason: result.reason, considered }
    }

    await db.query(
      `INSERT INTO email_reminders (user_email, course_id, last_sent)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_email, course_id) DO UPDATE SET last_sent = NOW()`,
      [user_email, course_id]
    )
    sent++
  }

  const membership = await sendMembershipExpiryReminders(db, settings, baseUrl)

  return { ok: true, sent, considered, days, membership }
}

// ── Membership expiry reminders ────────────────────────────────────────────
// One reminder per expiry cycle, sent within EXPIRY_WINDOW_DAYS of expiresAt.
// Tracked via data.lastExpiryReminderFor (= the expiresAt it was sent for), so
// a renewal (new expiresAt) re-arms the reminder automatically.
const EXPIRY_WINDOW_DAYS = 7
const MAX_EXPIRY_SENDS   = 100

async function sendMembershipExpiryReminders(db, settings, baseUrl) {
  let rows
  try {
    ({ rows } = await db.query(`SELECT data FROM members WHERE data->>'expiresAt' IS NOT NULL`))
  } catch {
    return { skipped: true, reason: 'members_table_missing' }
  }

  const now = Date.now()
  let sent = 0
  for (const r of rows) {
    if (sent >= MAX_EXPIRY_SENDS) break
    const m = r.data
    if (m.status !== 'active' || !m.expiresAt) continue
    const exp = new Date(m.expiresAt).getTime()
    if (exp < now) continue                                        // already expired
    if (exp - now > EXPIRY_WINDOW_DAYS * 86400000) continue        // not close yet
    if (m.lastExpiryReminderFor === m.expiresAt) continue          // already reminded for this cycle

    const expStr = new Date(m.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const result = await sendMail({
      to: m.email,
      subject: `Your ${m.planName || ''} membership expires on ${expStr}`,
      text:
`Hi ${m.name || 'there'},

Your ${m.planName || ''} membership with IWC Concepts expires on ${expStr}.

Renew to keep access to your courses and member events${baseUrl ? `: ${baseUrl}/#/join?renew=1` : '.'}

— IWC Concepts`,
      settings,
    })
    if (result?.skipped) return { skipped: true, reason: result.reason, sent }

    const updated = { ...m, lastExpiryReminderFor: m.expiresAt }
    await db.query('UPDATE members SET data = $2 WHERE lower(email) = lower($1)', [m.email, updated])
    sent++
  }
  return { ok: true, sent }
}
