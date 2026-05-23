/**
 * IWC Concepts — Standalone Express API server
 *
 * Portable: runs on Render, Railway, Fly.io, VPS, or locally.
 * Change DATABASE_URL to point at any PostgreSQL — no code changes needed.
 * Auth: verifies Supabase JWTs locally using SUPABASE_JWT_SECRET (no network call).
 *
 * Deploy to Render:
 *   Root directory : server
 *   Build command  : npm install
 *   Start command  : node index.js
 */

import express   from 'express'
import cors      from 'cors'
import pg        from 'pg'
import jwt       from 'jsonwebtoken'
import crypto    from 'node:crypto'
import path      from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : '*'

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '10mb' }))

// ── Database pool ─────────────────────────────────────────────────────────────
// Swap DATABASE_URL to point at any PostgreSQL — local, Supabase, Neon, etc.
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL })

db.on('error', (err) => console.error('[DB pool error]', err))

// ── Auth ──────────────────────────────────────────────────────────────────────
// Verifies the Supabase JWT locally using the project's JWT secret.
// To switch auth providers: replace this function with your provider's token check.
function verifyToken(token) {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!token || !secret) return null
  try {
    return jwt.verify(token, secret)   // returns decoded payload on success
  } catch {
    return null
  }
}

// ── Admin actions (require a valid JWT) ───────────────────────────────────────
const ADMIN_ACTIONS = new Set([
  'saveForm', 'deleteForm',
  'getFormSubmissions', 'deleteSubmission',
  'getAllSpeakers', 'getSpeakerById', 'saveSpeaker', 'deleteSpeaker',
  'getEventTasks', 'saveEventTasks',
  'saveProgram', 'deleteProgram',
  'getEnrollmentsByProgram',
  'saveTestimonial', 'deleteTestimonial',
])

// ── POST /api/db ──────────────────────────────────────────────────────────────
app.post('/api/db', async (req, res) => {
  const { action, payload = {} } = req.body || {}
  if (!action) return res.status(400).json({ error: 'Missing action' })

  if (ADMIN_ACTIONS.has(action)) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!verifyToken(token)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  try {
    const result = await handleAction(action, payload)
    res.json(result)
  } catch (err) {
    console.error(`[/api/db] action=${action}`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Action handler ────────────────────────────────────────────────────────────
async function handleAction(action, p) {
  switch (action) {

    // ── Forms ────────────────────────────────────────────────────────────────
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
      // Cascade: delete related submissions and tasks first
      await db.query('DELETE FROM submissions WHERE form_id = $1', [p.id])
      await db.query('DELETE FROM tasks WHERE form_id = $1', [p.id])
      await db.query('DELETE FROM forms WHERE id = $1', [p.id])
      return { ok: true }
    }

    // ── Submissions ──────────────────────────────────────────────────────────
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

    // ── Speakers ─────────────────────────────────────────────────────────────
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

    // ── Event Tasks ──────────────────────────────────────────────────────────
    case 'getEventTasks': {
      const { rows } = await db.query(
        'SELECT data FROM tasks WHERE form_id = $1',
        [p.formId]
      )
      return rows[0]?.data ?? null  // null means "first time, client creates defaults"
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

    // ── Programs ─────────────────────────────────────────────────────────────
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

    // ── Enrollments ──────────────────────────────────────────────────────────
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

    // ── Testimonials ─────────────────────────────────────────────────────────
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

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

// ── POST /api/cloudinary-sign ─────────────────────────────────────────────────
// Moved here from api/cloudinary-sign.js (was a Vercel serverless function).
app.post('/api/cloudinary-sign', (req, res) => {
  const { CLOUDINARY_API_SECRET: secret, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_CLOUD_NAME: cloudName } = process.env
  if (!secret || !apiKey || !cloudName) {
    return res.status(500).json({ error: 'Cloudinary env vars not set on server' })
  }
  const { folder = 'iwcconcepts', timestamp = Math.floor(Date.now() / 1000) } = req.body || {}
  const paramStr  = `folder=${folder}&timestamp=${timestamp}${secret}`
  const signature = crypto.createHash('sha256').update(paramStr).digest('hex')
  res.json({ signature, apiKey, cloudName, timestamp, folder })
})

// ── GET /api/shorten ──────────────────────────────────────────────────────────
// Moved here from api/shorten.js (was a Vercel serverless function).
app.get('/api/shorten', async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'url required' })
  try {
    const r = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
    if (!r.ok) throw new Error(`TinyURL returned ${r.status}`)
    const shorturl = await r.text()
    res.json({ shorturl: shorturl.trim() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ ok: true, db: 'connected' })
  } catch (err) {
    res.status(503).json({ ok: false, db: err.message })
  }
})

// ── Serve Vite build (single-service mode) ────────────────────────────────────
// Express serves both the API and the built React app from one process.
// In dev, Vite runs separately on port 5173 and proxies /api to this server.
const DIST = path.join(__dirname, '..', 'dist')
app.use(express.static(DIST))
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'))
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`✓  IWC Concepts API  →  http://localhost:${PORT}`)
  console.log(`   DATABASE_URL : ${process.env.DATABASE_URL ? '✓ set' : '✗ NOT SET — set DATABASE_URL'}`)
  console.log(`   JWT secret   : ${process.env.SUPABASE_JWT_SECRET ? '✓ set' : '✗ NOT SET — admin auth will fail'}`)
  console.log(`   Cloudinary   : ${process.env.CLOUDINARY_API_SECRET ? '✓ set' : '— not set (image upload will use canvas fallback)'}`)
})
