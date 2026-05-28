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
  'saveProgram', 'deleteProgram',
  'getEnrollmentsByProgram',
  'saveTestimonial', 'deleteTestimonial',
  'getContentSections', 'saveContentSection', 'deleteContentSection',
  'getContentItems',    'saveContentItem',    'deleteContentItem',
])

// Actions requiring any valid Supabase session (customer or admin).
// The server uses the verified user.email to scope the response.
const CUSTOMER_ACTIONS = new Set([
  'getMyEnrollments',
  'getPortalContent',
])

// ── Database connection ────────────────────────────────────────────────────────
// New client per invocation — correct for serverless.
// SSL: off for localhost/missing URL, on for everything else (Supabase, Neon, etc.)
async function withDb(fn) {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL is not set. Copy .env.example → .env and fill in your values.')

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  })
  await client.connect()
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
    console.error(`[api/db] action=${action}`, err.message)
    res.status(500).json({ error: err.message })
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

    // ── Programs ──────────────────────────────────────────────────────────────
    case 'getAllPrograms': {
      const { rows } = await db.query(
        'SELECT data FROM programs ORDER BY created_at DESC'
      )
      return rows.map(r => r.data)
    }

    case 'getProgramById': {
      const { rows } = await db.query(
        'SELECT data FROM programs WHERE id = $1',
        [p.id]
      )
      return rows[0]?.data ?? null
    }

    case 'saveProgram': {
      const prog = p.program
      await db.query(
        `INSERT INTO programs (id, data, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET data = $2`,
        [prog.id, prog, prog.createdAt || new Date().toISOString()]
      )
      return prog
    }

    case 'deleteProgram': {
      await db.query('DELETE FROM programs WHERE id = $1', [p.id])
      return { ok: true }
    }

    // ── Enrollments ───────────────────────────────────────────────────────────
    case 'addEnrollment': {
      const e = p.enrollment
      await db.query(
        `INSERT INTO enrollments (id, program_id, data, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [e.id, e.programId, e, e.enrolledAt || new Date().toISOString()]
      )
      return e
    }

    case 'getEnrollmentsByProgram': {
      const { rows } = await db.query(
        'SELECT data FROM enrollments WHERE program_id = $1 ORDER BY created_at DESC',
        [p.programId]
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
        `SELECT data FROM content_sections WHERE program_id = $1
         ORDER BY (data->>'order')::int NULLS LAST, created_at ASC`,
        [p.programId]
      )
      return rows.map(r => r.data)
    }

    case 'saveContentSection': {
      const s = p.section
      await db.query(
        `INSERT INTO content_sections (id, program_id, data, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET data = $3`,
        [s.id, s.programId, s, s.createdAt || new Date().toISOString()]
      )
      return s
    }

    case 'deleteContentSection': {
      // Delete items in this section first
      await db.query(
        `DELETE FROM content_items WHERE program_id = $1 AND data->>'sectionId' = $2`,
        [p.programId, p.id]
      )
      await db.query('DELETE FROM content_sections WHERE id = $1', [p.id])
      return { ok: true }
    }

    // ── Content Items (admin) ─────────────────────────────────────────────────
    case 'getContentItems': {
      const { rows } = await db.query(
        `SELECT data FROM content_items WHERE program_id = $1
         ORDER BY (data->>'order')::int NULLS LAST, created_at ASC`,
        [p.programId]
      )
      return rows.map(r => r.data)
    }

    case 'saveContentItem': {
      const item = p.item
      await db.query(
        `INSERT INTO content_items (id, program_id, data, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET data = $3`,
        [item.id, item.programId, item, item.createdAt || new Date().toISOString()]
      )
      return item
    }

    case 'deleteContentItem': {
      await db.query('DELETE FROM content_items WHERE id = $1', [p.id])
      return { ok: true }
    }

    // ── Customer portal actions ───────────────────────────────────────────────
    case 'getMyEnrollments': {
      const { rows } = await db.query(
        `SELECT data FROM enrollments WHERE data->>'participantEmail' = $1
         ORDER BY created_at DESC`,
        [user.email]
      )
      return rows.map(r => r.data)
    }

    case 'getPortalContent': {
      // Verify the caller is enrolled in this program
      const { rows: er } = await db.query(
        `SELECT id FROM enrollments
         WHERE program_id = $1 AND data->>'participantEmail' = $2`,
        [p.programId, user.email]
      )
      if (er.length === 0) throw new Error('Not enrolled in this program')

      const [sr, ir] = await Promise.all([
        db.query(
          `SELECT data FROM content_sections WHERE program_id = $1
           ORDER BY (data->>'order')::int NULLS LAST, created_at ASC`,
          [p.programId]
        ),
        db.query(
          `SELECT data FROM content_items WHERE program_id = $1
           AND (data->>'isPublished')::boolean = true
           ORDER BY (data->>'order')::int NULLS LAST, created_at ASC`,
          [p.programId]
        ),
      ])
      return {
        sections: sr.rows.map(r => r.data),
        items: ir.rows.map(r => r.data),
      }
    }

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}
