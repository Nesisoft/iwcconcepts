/**
 * dev-server.js — local API server for development
 *
 * Wraps the Vercel serverless functions (api/*.js) as Express routes so you
 * can run `npm run dev` without the Vercel CLI.
 *
 * In production, Vercel runs api/*.js directly — this file is never used there.
 */

import 'dotenv/config'
import express from 'express'
import dbHandler           from './api/db.js'
import signHandler         from './api/cloudinary-sign.js'
import shortenHandler      from './api/shorten.js'
import paystackInitHandler from './api/paystack-init.js'

const app = express()
app.use(express.json({ limit: '10mb' }))

// Vercel handler signature (req, res) is compatible with Express
const wrap = fn => (req, res) => fn(req, res)

app.all('/api/db',               wrap(dbHandler))
app.all('/api/cloudinary-sign',  wrap(signHandler))
app.all('/api/shorten',          wrap(shortenHandler))
app.all('/api/paystack-init',    wrap(paystackInitHandler))

const PORT = 3001
app.listen(PORT, () => {
  const db  = process.env.DATABASE_URL
  const sb  = process.env.SUPABASE_URL
  const pst = process.env.PAYSTACK_SECRET_KEY
  console.log(`Dev API  →  http://localhost:${PORT}`)
  console.log(`  DATABASE_URL        : ${db  ? '✓' : '✗ NOT SET'}`)
  console.log(`  SUPABASE_URL        : ${sb  ? '✓' : '✗ NOT SET'}`)
  console.log(`  PAYSTACK_SECRET_KEY : ${pst ? '✓' : '✗ NOT SET'}`)
  if (!db || !sb) {
    console.log(`\n  ⚠  Missing env vars. Copy .env.example → .env and fill in your values:\n`)
    console.log(`     cp .env.example .env\n`)
  }
})
