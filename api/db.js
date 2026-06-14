/**
 * api/db.js — Vercel serverless function
 *
 * Handles all data CRUD for IWC Concepts.
 * Database: any PostgreSQL via DATABASE_URL (Supabase, Neon, Railway, local, etc.)
 * Auth:     Supabase JWTs verified via supabase.auth.getUser() —
 *           uses SUPABASE_URL + SUPABASE_ANON_KEY (same values as the VITE_ frontend
 *           vars, just without the prefix). No separate JWT secret needed.
 *
 * Uses pg.Client (not Pool) — a fresh connection per invocation, which is correct
 * for serverless. For Supabase, use the Transaction mode pooler URL (port 6543).
 */

import pg from 'pg'
import { createClient } from '@supabase/supabase-js'
import {
  sendMail, renderTemplate, emailVars, DEFAULT_EMAIL_SETTINGS,
} from './_email.js'

const EMAIL_SETTINGS_KEY = 'emailSettings'

// Load merged email settings from the settings table (+ code defaults).
async function loadEmailSettings(db) {
  const { rows } = await db.query('SELECT data FROM settings WHERE key = $1', [EMAIL_SETTINGS_KEY])
  return { ...DEFAULT_EMAIL_SETTINGS, ...(rows[0]?.data || {}) }
}

// Best-effort send — never throws into the calling action.
async function trySend(db, { to, subject, text, settings }) {
  try {
    const s = settings || await loadEmailSettings(db)
    return await sendMail({ to, subject, text, settings: s })
  } catch (e) {
    console.warn('[email] send failed:', e.message)
    return { skipped: true, reason: 'error' }
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
// Verifies the caller's Supabase session token by asking Supabase Auth.
// Requires SUPABASE_URL and SUPABASE_ANON_KEY — the same values as
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, just without the VITE_ prefix.
async function verifyToken(token) {
  if (!token) return null
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  const { data: { user }, error } = await createClient(url, key).auth.getUser(token)
  return error ? null : user
}

const ADMIN_ACTIONS = new Set([
  'saveForm', 'deleteForm',
  'getFormSubmissions', 'deleteSubmission',
  'getAllSpeakers', 'getSpeakerById', 'saveSpeaker', 'deleteSpeaker',
  'getEventTasks', 'saveEventTasks',
  'saveCourse', 'deleteCourse',
  'getEnrollmentsByCourse',
  'saveTestimonial', 'deleteTestimonial',
  'getContentSections', 'saveContentSection', 'deleteContentSection',
  'getContentItems',    'saveContentItem',    'deleteContentItem',
  'getEnrolledUsersProgress',
  'saveSetting',
  'getAllLessonComments',
  'sendTestEmail',
  'getMembers', 'saveMember', 'deleteMember',
  'notifyEventAudience',
])

// Optional: comma-separated admin emails. When set, only these accounts can post
// with the "Instructor" badge. When unset, the client-provided flag is trusted
// (consistent with the app's existing auth posture).
function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (list.length === 0) return null // unknown / not configured
  return list.includes((email || '').toLowerCase())
}

// Actions requiring any valid Supabase session (customer or admin).
// The server uses the verified user.email to scope the response.
const CUSTOMER_ACTIONS = new Set([
  'getMyEnrollments',
  'getPortalContent',
  'getMyProgress',
  'markItemComplete',
  'getLessonComments',
  'addLessonComment',
  'deleteLessonComment',
  'getMyMembership',
  'getMyEvents',
  'getMyNotifications',
  'markNotificationsRead',
])

// ── Membership helpers ─────────────────────────────────────────────────────────
// Plans live in settings.membershipPlans = { plans: [...] }. Rank = array index
// (higher index = higher tier). A member with rank N can access courses that
// require rank ≤ N.
async function loadPlans(db) {
  const { rows } = await db.query(`SELECT data FROM settings WHERE key = 'membershipPlans'`)
  return rows[0]?.data?.plans || []
}

function planRankOf(plans, planId) {
  const i = plans.findIndex(p => p.id === planId)
  return i === -1 ? null : i
}

function isMemberActive(member) {
  if (!member || member.status !== 'active') return false
  if (member.expiresAt && new Date(member.expiresAt) < new Date()) return false
  return true
}

async function getMemberByEmail(db, email) {
  const { rows } = await db.query(
    'SELECT data FROM members WHERE lower(email) = lower($1)',
    [email || '']
  )
  return rows[0]?.data ?? null
}

// Event/notification audience: { type: 'public'|'restricted', planIds: [], emails: [] }
// Missing audience = public (backwards compatible with existing events).
function audienceMatches(audience, { email, planId } = {}) {
  const a = audience || {}
  if ((a.type || 'public') !== 'restricted') return true
  const emails = (a.emails || []).map(e => String(e).trim().toLowerCase()).filter(Boolean)
  if (email && emails.includes(email.toLowerCase())) return true
  if (planId && (a.planIds || []).includes(planId)) return true
  return false
}

// Transactional ticket / join-details email for an event registration.
// `reveal` controls whether the sensitive online join link/passcode is included
// (withheld when a paid event is registered with no proof of purchase).
function eventTicketEmailText(ev, enr, baseUrl, reveal = true) {
  const when = ev.startDate
    ? new Date(ev.startDate).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Date to be announced'
  const a = ev.eventAccess || {}
  const mode = a.mode || 'online'
  const lines = []
  if (mode !== 'online') lines.push(`Venue: ${a.address || ev.venue || 'TBA'}`)
  if (reveal && mode !== 'in_person') {
    if (a.platform) lines.push(`Platform: ${a.platform}`)
    if (a.link)     lines.push(`Join link: ${a.link}`)
    if (a.passcode) lines.push(`Passcode: ${a.passcode}`)
  }
  if (reveal && a.notes) lines.push('', a.notes)
  if (!reveal && mode !== 'in_person') lines.push('Your online joining link will appear in your portal once your ticket is confirmed.')
  const portal = baseUrl ? `\n\nFind it in your portal: ${baseUrl}/#/portal` : ''
  return `Hi ${enr.participantName || 'there'},

You're registered for ${ev.title}.

When: ${when}${lines.length ? '\n' + lines.join('\n') : ''}${enr.paymentRef ? `\n\nPayment ref: ${enr.paymentRef}` : ''}${portal}

See you there!
— IWC Concepts`
}

// Verify a Paystack transaction reference server-side (the secret key never
// touches the browser). Returns:
//   true   → the reference verifies as a successful payment
//   false  → the reference is definitively NOT a successful payment
//            (failed / abandoned / reversed / not found / invalid)
//   null   → we can't tell right now (no key, auth/permission/server error,
//            network failure, or an unexpected/pending shape)
// Callers reject on `false`, and allow on `null` so a real payer is never
// blocked by a transient outage.
async function verifyPaystackPayment(reference) {
  if (!reference) return null
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) return null
  try {
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${key}` },
    })
    // Auth / permission / server problems → can't trust a verdict → don't block.
    if (r.status === 401 || r.status === 403 || r.status >= 500) return null
    const d  = await r.json().catch(() => null)
    const st = d?.data?.status
    if (st === 'success') return true
    if (st === 'failed' || st === 'abandoned' || st === 'reversed') return false
    if (r.status === 404 || d?.status === false) return false  // reference not found / invalid
    return null                                                // pending / unexpected → don't block
  } catch (err) {
    console.warn('[verifyPaystack] verify failed:', err.message)
    return null
  }
}

// Upsert a member record keyed by email. Dedupes on paymentRef so the client
// return path and the Paystack webhook can both call this safely.
async function upsertMember(db, incoming, { baseUrl } = {}) {
  const email = String(incoming.email || '').trim()
  if (!email) throw new Error('Member email is required')

  const plans = await loadPlans(db)
  const plan  = plans.find(pl => pl.id === incoming.planId)
  if (!plan) throw new Error('Unknown membership plan')

  const existing = await getMemberByEmail(db, email)
  if (existing && incoming.paymentRef && existing.paymentRef === incoming.paymentRef) {
    return { member: existing, isNew: false, changed: false } // duplicate path — already processed
  }

  const now       = new Date()
  const joinedAt  = now.toISOString()
  const duration  = Number(plan.durationDays) || 0
  const expiresAt = duration > 0 ? new Date(now.getTime() + duration * 86400000).toISOString() : null

  const member = {
    id:         existing?.id || incoming.id || ('m' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)),
    email,
    name:       incoming.name || existing?.name || '',
    planId:     plan.id,
    planName:   plan.name,
    planRank:   planRankOf(plans, plan.id),
    status:     'active',
    paymentRef: incoming.paymentRef || null,
    amountPaid: incoming.amountPaid ?? plan.price ?? 0,
    currency:   incoming.currency || plan.currency || 'GHS',
    joinedAt:   existing?.joinedAt || joinedAt,
    renewedAt:  existing ? joinedAt : null,
    expiresAt,
    formSubmissionId: incoming.formSubmissionId || existing?.formSubmissionId || null,
    source:     incoming.source || 'client',
    history: [
      ...(existing?.history || []),
      ...(existing ? [{ planId: existing.planId, planName: existing.planName, paymentRef: existing.paymentRef, amountPaid: existing.amountPaid ?? null, currency: existing.currency || 'GHS', startedAt: existing.renewedAt || existing.joinedAt || null, expiresAt: existing.expiresAt, replacedAt: joinedAt }] : []),
    ],
  }

  await db.query(
    `INSERT INTO members (id, email, data, created_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET data = $3`,
    [member.id, email, member, member.joinedAt]
  )

  // Welcome / upgrade email — once per new payment.
  const settings = await loadEmailSettings(db)
  if (settings.welcomeEnabled) {
    const portal = baseUrl || process.env.PUBLIC_BASE_URL || ''
    await trySend(db, {
      to: email,
      subject: `Welcome to IWC Concepts — ${plan.name} member 🎉`,
      text:
`Hi ${member.name || 'there'},

Your ${plan.name} membership is now active${expiresAt ? ` until ${new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}.

You now have access to every course included in your plan${plan.perks?.length ? `, plus:\n- ${plan.perks.join('\n- ')}` : '.'}

Visit your learning portal to get started${portal ? `: ${portal}/#/portal` : '.'}

— IWC Concepts`,
      settings,
    })
  }

  return { member, isNew: !existing, changed: true }
}

// ── Database connection ────────────────────────────────────────────────────────
// New client per invocation — correct for serverless.
// SSL: off for localhost/missing URL, on for everything else (Supabase, Neon, etc.)
async function withDb(fn) {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL is not set. Copy .env.example → .env and fill in your values.')

  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  })

  try {
    await client.connect()
  } catch (connErr) {
    // Provide a descriptive error regardless of whether err.message is empty
    const detail = connErr.message || connErr.code || String(connErr) || 'unknown'
    throw new Error(
      `Database connection failed (${detail}). ` +
      `Make sure DATABASE_URL is correct and your database is reachable. ` +
      `For Supabase, use the Transaction pooler URL on port 6543.`
    )
  }

  try {
    return await fn(client)
  } finally {
    await client.end().catch(() => {})
  }
}

// ── Vercel handler ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { action, payload = {} } = req.body || {}
  if (!action) return res.status(400).json({ error: 'Missing action' })

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  let authUser = null

  if (ADMIN_ACTIONS.has(action) || CUSTOMER_ACTIONS.has(action)) {
    authUser = await verifyToken(token)
    if (!authUser) return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = await withDb(client => handleAction(client, action, payload, authUser))
    res.json(result)
  } catch (err) {
    const msg = err.message || err.code || String(err) || 'Internal server error'
    console.error(`[api/db] action=${action} —`, msg)
    res.status(500).json({ error: msg })
  }
}

// ── Action handler ────────────────────────────────────────────────────────────
async function handleAction(db, action, p, user = null) {
  switch (action) {

    // ── Forms ─────────────────────────────────────────────────────────────────
    case 'getAllForms': {
      const { rows } = await db.query(
        'SELECT data FROM forms ORDER BY created_at DESC'
      )
      return rows.map(r => r.data)
    }

    case 'getFormById': {
      const { rows } = await db.query(
        'SELECT data FROM forms WHERE id = $1',
        [p.id]
      )
      return rows[0]?.data ?? null
    }

    case 'saveForm': {
      const f = p.form
      await db.query(
        `INSERT INTO forms (id, data, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET data = $2`,
        [f.id, f, f.createdAt || new Date().toISOString()]
      )
      return f
    }

    case 'deleteForm': {
      await db.query('DELETE FROM submissions WHERE form_id = $1', [p.id])
      await db.query('DELETE FROM tasks WHERE form_id = $1', [p.id])
      await db.query('DELETE FROM forms WHERE id = $1', [p.id])
      return { ok: true }
    }

    // ── Submissions ───────────────────────────────────────────────────────────
    case 'getFormSubmissions': {
      const { rows } = await db.query(
        'SELECT data FROM submissions WHERE form_id = $1 ORDER BY submitted_at DESC',
        [p.formId]
      )
      return rows.map(r => r.data)
    }

    case 'addSubmission': {
      const s = p.sub
      await db.query(
        `INSERT INTO submissions (id, form_id, data, submitted_at)
         VALUES ($1, $2, $3, $4)`,
        [s.id, s.formId, s, s.timestamp || new Date().toISOString()]
      )
      // Transactional emails via Resend (server holds the key). Confirmation to the
      // registrant + a notification to the admin, when the form has email enabled.
      // Wrapped so an email failure can never fail the submission that was saved.
      try {
        const { rows: fr } = await db.query('SELECT data FROM forms WHERE id = $1', [s.formId])
        const form = fr[0]?.data
        const cfg  = form?.emailConfig
        if (form && cfg?.enabled) {
          const settings = await loadEmailSettings(db)
          const fields = (form.fields || []).filter(f => f.type !== 'section')
          const data   = s.data || {}
          const emailField = fields.find(f => f.type === 'email' || (f.label || '').toLowerCase().includes('email'))
          const nameField  = fields.find(f => f.type === 'full_name' || (f.label || '').toLowerCase().includes('name'))
          const toEmail = data.email || (emailField ? data[emailField.id] : '') || ''
          const toName  = data.name  || (nameField  ? data[nameField.id]  : '') || ''
          const title   = form.title || 'your registration'

          if (toEmail) {
            const msg = cfg.confirmationMessage || `Thanks for registering for ${title}. We've received your details and will be in touch.`
            await trySend(db, {
              to: toEmail,
              subject: cfg.confirmSubject || `✅ Registration received: ${title}`,
              text: `Hi ${toName || 'there'},\n\n${msg}\n\n— ${settings.fromName || 'IWC Concepts'}`,
              settings,
            })
          }
          if (cfg.adminEmail) {
            const summary = fields.map(f => {
              const v = data[f.id]
              const val = f.type === 'whatsapp' && v ? `${v.code || ''} ${v.number || ''}`.trim()
                : Array.isArray(v) ? v.join(', ')
                : (v == null ? '' : String(v))
              return `${f.label}: ${val}`
            }).join('\n')
            await trySend(db, {
              to: cfg.adminEmail,
              subject: `📥 New submission: ${title}`,
              text: `A new submission was received for "${title}".\n\n${summary}\n\nReceived: ${new Date(s.timestamp || Date.now()).toLocaleString('en-GB')}`,
              settings,
            })
          }
        }
      } catch (mailErr) {
        console.warn('[addSubmission] email skipped:', mailErr.message)
      }
      return s
    }

    case 'deleteSubmission': {
      await db.query('DELETE FROM submissions WHERE id = $1', [p.id])
      return { ok: true }
    }

    // ── Speakers ──────────────────────────────────────────────────────────────
    case 'getAllSpeakers': {
      const { rows } = await db.query(
        'SELECT data FROM speakers ORDER BY created_at DESC'
      )
      return rows.map(r => r.data)
    }

    case 'getSpeakerById': {
      const { rows } = await db.query(
        'SELECT data FROM speakers WHERE id = $1',
        [p.id]
      )
      return rows[0]?.data ?? null
    }

    case 'saveSpeaker': {
      const s = p.speaker
      await db.query(
        `INSERT INTO speakers (id, data, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET data = $2`,
        [s.id, s, s.createdAt || new Date().toISOString()]
      )
      return s
    }

    case 'deleteSpeaker': {
      await db.query('DELETE FROM speakers WHERE id = $1', [p.id])
      return { ok: true }
    }

    // ── Event Tasks ───────────────────────────────────────────────────────────
    case 'getEventTasks': {
      const { rows } = await db.query(
        'SELECT data FROM tasks WHERE form_id = $1',
        [p.formId]
      )
      return rows[0]?.data ?? null
    }

    case 'saveEventTasks': {
      await db.query(
        `INSERT INTO tasks (form_id, data)
         VALUES ($1, $2)
         ON CONFLICT (form_id) DO UPDATE SET data = $2`,
        [p.formId, p.tasks]
      )
      return p.tasks
    }

    // ── Courses ──────────────────────────────────────────────────────────────
    case 'getAllCourses': {
      const { rows } = await db.query(
        'SELECT data FROM courses ORDER BY created_at DESC'
      )
      return rows.map(r => r.data)
    }

    case 'getCourseById': {
      const { rows } = await db.query(
        'SELECT data FROM courses WHERE id = $1',
        [p.id]
      )
      return rows[0]?.data ?? null
    }

    case 'saveCourse': {
      const prog = p.course
      await db.query(
        `INSERT INTO courses (id, data, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET data = $2`,
        [prog.id, prog, prog.createdAt || new Date().toISOString()]
      )
      return prog
    }

    case 'deleteCourse': {
      await db.query('DELETE FROM courses WHERE id = $1', [p.id])
      return { ok: true }
    }

    // ── Enrollments ───────────────────────────────────────────────────────────
    case 'addEnrollment': {
      const e = p.enrollment

      // Load the item up-front so we can enforce ticket integrity AND tailor the
      // confirmation email without a second query.
      const { rows: cr } = await db.query('SELECT data FROM courses WHERE id = $1', [e.courseId])
      const course = cr[0]?.data

      // Does the supplied code match a FREE-entry promo on this event? Only a
      // 'free' code is proof of entitlement on its own — a 'percent' code merely
      // discounts the price, so a percent-coded registration still has to carry a
      // verified Paystack reference like any other paid ticket.
      const freePromo = !!(e.promoCode && (course?.promoCodes || []).some(pc =>
        String(pc.code || '').toUpperCase() === String(e.promoCode).toUpperCase() &&
        (pc.kind || 'percent') === 'free'
      ))

      // ── Ticket integrity for PAID events ──────────────────────────────────
      // addEnrollment is a public endpoint, so for a priced standalone event we
      // require proof of entitlement: a FREE-entry promo code, or a Paystack
      // reference that verifies as successful. (A percentage code is NOT enough on
      // its own — otherwise anyone could mint a free ticket with a discount code.)
      // We reject only on a definitively bad/absent reference and allow through a
      // transient verification error, so a genuine payer is never blocked by an
      // outage. Courses keep their existing behavior.
      if (course && course.courseType === 'event' && course.accessMode === 'standalone' && Number(course.price) > 0) {
        if (!freePromo) {
          const verdict = await verifyPaystackPayment(e.paymentRef)
          if (verdict === false) {
            throw new Error('We could not verify a successful payment for this ticket. If you were charged, please contact support with your reference.')
          }
          if (verdict === null && !e.paymentRef) {
            throw new Error('A valid payment or promo code is required to register for this event.')
          }
          // verdict === true → verified; verdict === null WITH a reference → allow (best-effort)
        }
      }

      // ── Access integrity for MEMBERSHIP events ────────────────────────────
      // A membership event's join link/passcode is entitlement-gated, but
      // addEnrollment is public — so without this an arbitrary email could register
      // and be emailed the private join details. Require an active member at the
      // event's required tier (or above), or an explicitly invited email. The normal
      // UI never reaches here for a membership event (onboarding sends those to
      // /join), so in practice this only rejects forged registrations.
      if (course && course.courseType === 'event' && course.accessMode === 'plan') {
        const email = String(e.participantEmail || '').trim().toLowerCase()
        const invites = (course.audience?.emails || []).map(s => String(s).trim().toLowerCase()).filter(Boolean)
        const invited = !!email && invites.includes(email)
        let memberOk = false
        if (!invited && email) {
          const plans   = await loadPlans(db)
          const reqRank = planRankOf(plans, course.accessPlanId)
          const member  = await getMemberByEmail(db, email)
          const memRank = isMemberActive(member) ? planRankOf(plans, member.planId) : null
          memberOk = reqRank !== null && memRank !== null && memRank >= reqRank
        }
        if (!invited && !memberOk) {
          throw new Error('This event is part of a membership. Join the required plan — or use your invitation — to register.')
        }
      }

      const result = await db.query(
        `INSERT INTO enrollments (id, course_id, data, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [e.id, e.courseId, e, e.enrolledAt || new Date().toISOString()]
      )
      // Email — only on a genuinely new enrollment row. Wrapped so a lookup or
      // send error can never undo / fail the enrollment that was just saved.
      if (result.rowCount > 0 && e.participantEmail) {
        try {
          const settings = await loadEmailSettings(db)
          if (course && course.courseType === 'event') {
            // Events send a transactional ticket email with the join details.
            // Sensitive online details are revealed only when the event is free or
            // there's payment/promo evidence — addEnrollment is a public endpoint,
            // so we never email a paid event's link to someone with no proof of purchase.
            const isPaid = course.accessMode === 'standalone'
            // Reveal the sensitive online link only with proof of purchase: a paid
            // reference, or a free-entry promo. (A percentage promo always carries a
            // payment reference too, so it is covered by the paymentRef check.)
            const reveal = !isPaid || !!e.paymentRef || freePromo
            await trySend(db, {
              to: e.participantEmail,
              subject: `🎟️ You're registered: ${e.courseTitle || course.title}`,
              text: eventTicketEmailText(course, e, p.baseUrl, reveal),
              settings,
            })
          } else if (settings.welcomeEnabled) {
            const vars = emailVars({ name: e.participantName, course: e.courseTitle, baseUrl: p.baseUrl })
            await trySend(db, {
              to: e.participantEmail,
              subject: renderTemplate(settings.welcomeSubject, vars),
              text: renderTemplate(settings.welcomeBody, vars),
              settings,
            })
          }
        } catch (mailErr) {
          console.warn('[addEnrollment] post-enrollment email skipped:', mailErr.message)
        }
      }
      return e
    }

    case 'getEnrollmentsByCourse': {
      const { rows } = await db.query(
        'SELECT data FROM enrollments WHERE course_id = $1 ORDER BY created_at DESC',
        [p.courseId]
      )
      return rows.map(r => r.data)
    }

    // ── Testimonials ──────────────────────────────────────────────────────────
    case 'getAllTestimonials': {
      const { rows } = await db.query(
        'SELECT data FROM testimonials ORDER BY created_at DESC'
      )
      return rows.map(r => r.data)
    }

    case 'saveTestimonial': {
      const t = p.testimonial
      await db.query(
        `INSERT INTO testimonials (id, data, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET data = $2`,
        [t.id, t, t.createdAt || new Date().toISOString()]
      )
      return t
    }

    case 'deleteTestimonial': {
      await db.query('DELETE FROM testimonials WHERE id = $1', [p.id])
      return { ok: true }
    }

    // ── Content Sections (admin) ──────────────────────────────────────────────
    case 'getContentSections': {
      const { rows } = await db.query(
        `SELECT data FROM content_sections WHERE course_id = $1
         ORDER BY (data->>'order')::int NULLS LAST, created_at ASC`,
        [p.courseId]
      )
      return rows.map(r => r.data)
    }

    case 'saveContentSection': {
      const s = p.section
      await db.query(
        `INSERT INTO content_sections (id, course_id, data, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET data = $3`,
        [s.id, s.courseId, s, s.createdAt || new Date().toISOString()]
      )
      return s
    }

    case 'deleteContentSection': {
      // Delete items in this section first
      await db.query(
        `DELETE FROM content_items WHERE course_id = $1 AND data->>'sectionId' = $2`,
        [p.courseId, p.id]
      )
      await db.query('DELETE FROM content_sections WHERE id = $1', [p.id])
      return { ok: true }
    }

    // ── Content Items (admin) ─────────────────────────────────────────────────
    case 'getContentItems': {
      const { rows } = await db.query(
        `SELECT data FROM content_items WHERE course_id = $1
         ORDER BY (data->>'order')::int NULLS LAST, created_at ASC`,
        [p.courseId]
      )
      return rows.map(r => r.data)
    }

    case 'saveContentItem': {
      const item = p.item
      await db.query(
        `INSERT INTO content_items (id, course_id, data, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET data = $3`,
        [item.id, item.courseId, item, item.createdAt || new Date().toISOString()]
      )
      return item
    }

    case 'deleteContentItem': {
      await db.query('DELETE FROM content_items WHERE id = $1', [p.id])
      return { ok: true }
    }

    // ── Customer portal actions ───────────────────────────────────────────────
    case 'getMyEnrollments': {
      // DISTINCT ON deduplicates by course — keeps only the most recent
      // enrollment per course so repeated signups don't appear twice.
      const { rows } = await db.query(
        `SELECT DISTINCT ON (course_id) data
         FROM enrollments
         WHERE data->>'participantEmail' = $1
         ORDER BY course_id, created_at DESC`,
        [user.email]
      )
      return rows.map(r => r.data)
    }

    case 'getPortalContent': {
      // Access ladder:
      //   1. "Open" courses (and legacy free+portal courses) — any portal user.
      //   2. An enrollment record — grandfathered per-course access.
      //   3. An active membership whose plan rank ≥ the course's required plan.
      const { rows: pr } = await db.query(
        'SELECT data FROM courses WHERE id = $1',
        [p.courseId]
      )
      const prog = pr[0]?.data
      // hasPortalAccess can be boolean true or string "true" depending on how old
      // records were saved, so coerce to boolean.
      const isFreePortal = prog && (
        prog.accessMode === 'open' ||
        (!prog.accessMode && prog.type === 'free' &&
          (prog.hasPortalAccess === true || prog.hasPortalAccess === 'true'))
      )

      if (!isFreePortal) {
        const { rows: er } = await db.query(
          `SELECT id FROM enrollments
           WHERE course_id = $1 AND data->>'participantEmail' = $2`,
          [p.courseId, user.email]
        )
        const enrolled = er.length > 0

        if (!enrolled) {
          // Membership-gated course?
          if (prog?.accessMode === 'plan' && prog.accessPlanId) {
            const plans  = await loadPlans(db)
            const reqRank = planRankOf(plans, prog.accessPlanId)
            const member  = await getMemberByEmail(db, user.email)
            const memRank = isMemberActive(member) ? planRankOf(plans, member.planId) : null
            const ok = reqRank !== null && memRank !== null && memRank >= reqRank
            if (!ok) {
              const reqName = plans.find(pl => pl.id === prog.accessPlanId)?.name || 'a higher'
              throw new Error(`This course requires the ${reqName} plan or higher — upgrade your membership to access it`)
            }
          } else {
            throw new Error('Not enrolled in this course')
          }
        }
      }

      const [sr, ir] = await Promise.all([
        db.query(
          `SELECT data FROM content_sections WHERE course_id = $1
           ORDER BY (data->>'order')::int NULLS LAST, created_at ASC`,
          [p.courseId]
        ),
        db.query(
          `SELECT data FROM content_items WHERE course_id = $1
           AND (data->>'isPublished')::boolean = true
           ORDER BY (data->>'order')::int NULLS LAST, created_at ASC`,
          [p.courseId]
        ),
      ])
      return {
        sections: sr.rows.map(r => r.data),
        items: ir.rows.map(r => r.data),
      }
    }

    // ── Course progress (customer) ────────────────────────────────────────────
    case 'getMyProgress': {
      const { rows } = await db.query(
        `SELECT item_id, completed_at FROM course_progress
         WHERE course_id = $1 AND user_email = $2`,
        [p.courseId, user.email]
      )
      return rows.map(r => ({ itemId: r.item_id, completedAt: r.completed_at }))
    }

    case 'markItemComplete': {
      const ins = await db.query(
        `INSERT INTO course_progress (user_email, item_id, course_id, completed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_email, item_id) DO NOTHING`,
        [user.email, p.itemId, p.courseId]
      )

      // If this insert just completed the course, send a completion email once.
      if (ins.rowCount > 0) {
        const [{ rows: totalR }, { rows: doneR }] = await Promise.all([
          db.query(
            `SELECT COUNT(*)::int AS n FROM content_items
             WHERE course_id = $1 AND (data->>'isPublished')::boolean = true`,
            [p.courseId]
          ),
          db.query(
            `SELECT COUNT(*)::int AS n FROM course_progress
             WHERE course_id = $1 AND user_email = $2`,
            [p.courseId, user.email]
          ),
        ])
        const total = totalR[0]?.n || 0
        const done  = doneR[0]?.n || 0
        if (total > 0 && done >= total) {
          const settings = await loadEmailSettings(db)
          if (settings.completionEnabled) {
            const { rows: pr } = await db.query('SELECT data FROM courses WHERE id = $1', [p.courseId])
            const prog = pr[0]?.data
            const { rows: er } = await db.query(
              `SELECT data FROM enrollments
               WHERE course_id = $1 AND data->>'participantEmail' = $2
               ORDER BY created_at DESC LIMIT 1`,
              [p.courseId, user.email]
            )
            const name = er[0]?.data?.participantName || user.email.split('@')[0]
            const certificateUrl = (prog?.awardsCertificate && p.baseUrl)
              ? `${p.baseUrl}/#/portal/certificate/${p.courseId}`
              : ''
            const vars = emailVars({ name, course: prog?.title, baseUrl: p.baseUrl, certificateUrl })
            await trySend(db, {
              to: user.email,
              subject: renderTemplate(settings.completionSubject, vars),
              text: renderTemplate(settings.completionBody, vars),
              settings,
            })
          }
        }
      }
      return { ok: true, itemId: p.itemId }
    }

    // ── Enrolled users progress (admin) ──────────────────────────────────────
    case 'getEnrolledUsersProgress': {
      const [er, pr, progR, ciR] = await Promise.all([
        db.query(
          `SELECT DISTINCT ON (course_id, data->>'participantEmail') course_id, data
           FROM enrollments
           ORDER BY course_id, data->>'participantEmail', created_at DESC`
        ),
        db.query(
          `SELECT course_id, user_email, item_id, completed_at
           FROM course_progress ORDER BY completed_at ASC`
        ),
        db.query('SELECT id, data FROM courses'),
        db.query(
          `SELECT course_id, COUNT(*) AS total FROM content_items
           WHERE (data->>'isPublished')::boolean = true GROUP BY course_id`
        ),
      ])
      return {
        enrollments:  er.rows.map(r => ({ courseId: r.course_id, ...r.data })),
        progress:     pr.rows,
        courses:     progR.rows.map(r => ({ id: r.id, ...r.data })),
        lessonCounts: Object.fromEntries(ciR.rows.map(r => [r.course_id, Number(r.total)])),
      }
    }

    // ── Lesson discussion / Q&A ───────────────────────────────────────────────
    case 'getLessonComments': {
      const { rows } = await db.query(
        `SELECT id, data, created_at FROM lesson_comments
         WHERE course_id = $1 AND item_id = $2
         ORDER BY created_at ASC`,
        [p.courseId, p.itemId]
      )
      return rows.map(r => ({ id: r.id, createdAt: r.created_at, ...r.data }))
    }

    case 'addLessonComment': {
      const adminCheck = isAdminEmail(user.email)
      const isAdmin = adminCheck === null ? !!p.asAdmin : adminCheck
      const comment = {
        authorEmail:  user.email,
        authorName:   p.authorName || user.email.split('@')[0],
        body:         String(p.body || '').slice(0, 4000),
        isAdmin,
        parentId:     p.parentId || null,
        courseTitle: p.courseTitle || null,
        lessonTitle:  p.lessonTitle || null,
      }
      if (!comment.body.trim()) throw new Error('Comment cannot be empty')
      const id  = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
      const now = new Date().toISOString()
      await db.query(
        `INSERT INTO lesson_comments (id, course_id, item_id, data, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, p.courseId, p.itemId, comment, now]
      )
      return { id, createdAt: now, ...comment }
    }

    case 'deleteLessonComment': {
      const { rows } = await db.query('SELECT data FROM lesson_comments WHERE id = $1', [p.id])
      const existing = rows[0]?.data
      if (!existing) return { ok: true }
      const adminCheck = isAdminEmail(user.email)
      const canModerate = adminCheck === true || (adminCheck === null && !!p.asAdmin)
      if (existing.authorEmail !== user.email && !canModerate) {
        throw new Error('You can only delete your own comment')
      }
      // Delete the comment and any replies to it
      await db.query(
        `DELETE FROM lesson_comments WHERE id = $1 OR data->>'parentId' = $1`,
        [p.id]
      )
      return { ok: true }
    }

    case 'getAllLessonComments': {
      const { rows } = await db.query(
        `SELECT id, course_id, item_id, data, created_at FROM lesson_comments
         ORDER BY created_at DESC`
      )
      return rows.map(r => ({ id: r.id, courseId: r.course_id, itemId: r.item_id, createdAt: r.created_at, ...r.data }))
    }

    // ── Settings (public read, admin write) ──────────────────────────────────
    case 'getSetting': {
      const { rows } = await db.query(
        'SELECT data FROM settings WHERE key = $1',
        [p.key]
      )
      return rows[0]?.data ?? null
    }

    case 'saveSetting': {
      await db.query(
        `INSERT INTO settings (key, data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = NOW()`,
        [p.key, p.value]
      )
      return { ok: true, key: p.key }
    }

    // ── Email: admin "send test" ──────────────────────────────────────────────
    case 'sendTestEmail': {
      const to = p.to || user.email
      const settings = await loadEmailSettings(db)
      const vars = emailVars({ name: 'there', course: 'Sample Course', baseUrl: p.baseUrl })
      const subject = renderTemplate(settings.welcomeSubject, vars)
      const text = renderTemplate(settings.welcomeBody, vars)
      const result = await sendMail({ to, subject, text, settings })
      if (result.skipped) {
        return { ok: false, skipped: true, reason: result.reason }
      }
      return { ok: true, to }
    }

    // ── Membership ────────────────────────────────────────────────────────────
    case 'addMember': {
      // Public — called from the /join flow after payment (or by the Paystack
      // webhook safety net). Validates the plan server-side and dedupes on
      // paymentRef, so double calls are harmless.
      const { member } = await upsertMember(db, p.member || {}, { baseUrl: p.baseUrl })
      return member
    }

    case 'getMyMembership': {
      const member = await getMemberByEmail(db, user.email)
      if (!member) return null
      return { ...member, active: isMemberActive(member) }
    }

    case 'getMembers': {
      const { rows } = await db.query('SELECT data FROM members ORDER BY created_at DESC')
      return rows.map(r => ({ ...r.data, active: isMemberActive(r.data) }))
    }

    case 'saveMember': {
      // Admin edit — e.g. extend expiry, change plan, deactivate.
      const m = p.member
      if (!m?.email) throw new Error('Member email is required')
      await db.query(
        `INSERT INTO members (id, email, data, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET data = $3`,
        [m.id, m.email, m, m.joinedAt || new Date().toISOString()]
      )
      return m
    }

    case 'deleteMember': {
      await db.query('DELETE FROM members WHERE lower(email) = lower($1)', [p.email || ''])
      return { ok: true }
    }

    // ── Events (member-visible) ───────────────────────────────────────────────
    case 'getMyEvents': {
      const [{ rows: er }, member, { rows: enr }] = await Promise.all([
        db.query(`SELECT data FROM courses WHERE data->>'courseType' = 'event' AND data->>'status' <> 'draft'`),
        getMemberByEmail(db, user.email),
        db.query(`SELECT DISTINCT course_id FROM enrollments WHERE data->>'participantEmail' = $1`, [user.email]),
      ])
      const ticketed = new Set(enr.map(r => r.course_id))
      const me = {
        email:  user.email,
        planId: isMemberActive(member) ? member.planId : null,
      }
      const now = Date.now()
      return er.rows
        .map(r => r.data)
        // Visible if the audience matches OR the user already holds a ticket/enrollment.
        .filter(ev => audienceMatches(ev.audience, me) || ticketed.has(ev.id))
        .filter(ev => {
          const end = ev.endDate || ev.startDate
          if (!end) return true                       // undated events stay visible
          return new Date(end).getTime() >= now - 86400000   // hide >24h past
        })
        .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0))
        .map(ev => {
          // Paid (standalone) events reveal their join link/passcode only to ticket
          // holders. Free and membership events behave exactly as before.
          const isPaid    = ev.accessMode === 'standalone'
          const hasTicket = ticketed.has(ev.id)
          const reveal    = !isPaid || hasTicket
          return {
            id: ev.id, title: ev.title, tagline: ev.tagline, image: ev.image,
            startDate: ev.startDate, endDate: ev.endDate, venue: ev.venue,
            status: ev.status, registrationFormId: ev.registrationFormId || null,
            accessMode: ev.accessMode || null,
            price: Number(ev.price) || 0, currency: ev.currency || 'GHS',
            needsTicket: isPaid && !hasTicket,
            hasTicket,
            eventAccess: reveal ? (ev.eventAccess || null) : null,   // join details for eligible users only
          }
        })
    }

    // ── Notifications ─────────────────────────────────────────────────────────
    case 'getMyNotifications': {
      const [{ rows: nr }, member] = await Promise.all([
        db.query('SELECT data FROM notifications ORDER BY created_at DESC LIMIT 50'),
        getMemberByEmail(db, user.email),
      ])
      const me = { email: user.email, planId: isMemberActive(member) ? member.planId : null }
      return nr.rows
        .map(r => r.data)
        .filter(n => audienceMatches(n.audience, me))
        .map(n => ({
          id: n.id, type: n.type, eventId: n.eventId || null,
          title: n.title, body: n.body, createdAt: n.createdAt,
          read: (n.readBy || []).includes(user.email.toLowerCase()),
        }))
    }

    case 'markNotificationsRead': {
      const ids = Array.isArray(p.ids) ? p.ids : []
      if (ids.length) {
        await db.query(
          `UPDATE notifications
           SET data = jsonb_set(data, '{readBy}', coalesce(data->'readBy', '[]'::jsonb) || to_jsonb($1::text))
           WHERE id = ANY($2) AND NOT (coalesce(data->'readBy', '[]'::jsonb) ? $1)`,
          [user.email.toLowerCase(), ids]
        )
      }
      return { ok: true }
    }

    case 'notifyEventAudience': {
      // Admin: create an in-portal notification + email everyone in the event's
      // audience (members of the chosen plans, invited emails, or all active
      // members for public events).
      const { rows: cr } = await db.query('SELECT data FROM courses WHERE id = $1', [p.eventId])
      const ev = cr[0]?.data
      if (!ev) throw new Error('Event not found')

      const kind  = p.kind === 'updated' ? 'updated' : 'created'
      const when  = ev.startDate
        ? new Date(ev.startDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Date to be announced'
      const access = ev.eventAccess || {}
      const mode   = access.mode || 'online'
      const whereLine = mode === 'in_person'
        ? `Venue: ${access.address || ev.venue || 'TBA'}`
        : `Online${access.platform ? ` via ${access.platform}` : ''}${access.link ? `\nLink: ${access.link}` : ''}${access.passcode ? `\nPasscode: ${access.passcode}` : ''}`

      const title = kind === 'updated' ? `Event updated: ${ev.title}` : `New event: ${ev.title}`
      const body  = `${when}\n${whereLine}${access.notes ? `\n${access.notes}` : ''}`

      // In-portal notification
      const nid = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
      const notification = {
        id: nid, type: 'event', kind, eventId: ev.id,
        title, body,
        audience: ev.audience || { type: 'public' },
        createdAt: new Date().toISOString(),
        readBy: [],
      }
      await db.query(
        'INSERT INTO notifications (id, data, created_at) VALUES ($1, $2, $3)',
        [nid, notification, notification.createdAt]
      )

      // Email recipients
      const { rows: mr } = await db.query('SELECT data FROM members')
      const activeMembers = mr.map(r => r.data).filter(isMemberActive)
      const a = ev.audience || {}
      let recipients
      if ((a.type || 'public') === 'restricted') {
        const planSet = new Set(a.planIds || [])
        recipients = new Set([
          ...activeMembers.filter(m => planSet.has(m.planId)).map(m => m.email.toLowerCase()),
          ...(a.emails || []).map(e => String(e).trim().toLowerCase()).filter(Boolean),
        ])
      } else {
        recipients = new Set(activeMembers.map(m => m.email.toLowerCase()))
      }

      const settings = await loadEmailSettings(db)
      const portal   = p.baseUrl || process.env.PUBLIC_BASE_URL || ''
      const list     = [...recipients].slice(0, 300)   // serverless safety cap
      let sent = 0
      for (const to of list) {
        const r = await trySend(db, {
          to,
          subject: `📅 ${title}`,
          text:
`Hi there,

${kind === 'updated' ? 'An event you have access to was updated.' : "You're invited to a new event."}

${ev.title}
${when}
${whereLine}
${access.notes ? `\n${access.notes}\n` : ''}
${portal ? `See it in your portal (and add it to your calendar): ${portal}/#/portal` : ''}

— IWC Concepts`,
          settings,
        })
        if (r && !r.skipped) sent++
      }

      // Stamp the event so the admin UI can show when it was last announced.
      const stamped = { ...ev, lastNotifiedAt: new Date().toISOString() }
      await db.query('UPDATE courses SET data = $2 WHERE id = $1', [ev.id, stamped])

      return { ok: true, recipients: list.length, sent, notificationId: nid }
    }

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}
