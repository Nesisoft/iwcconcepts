import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase, isConfigured, reinitSupabase } from '../utils/supabase'

const ACC  = '#C9A84C'
const DARK = '#0f0a1a'

const inp = (extra = {}) => ({
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8, color: 'white', fontFamily: "'Montserrat',sans-serif",
  fontSize: 13, padding: '10px 13px',
  ...extra,
})

// ── SQL schema ─────────────────────────────────────────────────────────────────
// Works on ANY PostgreSQL: Supabase, Neon, Railway, local, your own VPS.
// Run this once in your database's SQL editor (psql, pgAdmin, Supabase SQL Editor, etc.)
const SQL = `-- ── Run ONCE in your PostgreSQL database ───────────────────────────────────
-- Works with any PostgreSQL: Supabase, Neon, Railway, local, or your own VPS.
-- No Supabase-specific syntax — plain SQL.

create table if not exists forms (
  id         text        primary key,
  data       jsonb       not null,
  created_at timestamptz not null default now()
);

create table if not exists submissions (
  id           text        primary key,
  form_id      text        not null,
  data         jsonb       not null,
  submitted_at timestamptz not null default now()
);
create index if not exists submissions_form_id_idx on submissions(form_id);

create table if not exists speakers (
  id         text        primary key,
  data       jsonb       not null,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  form_id text  primary key,
  data    jsonb not null
);

create table if not exists programs (
  id         text        primary key,
  data       jsonb       not null,
  created_at timestamptz not null default now()
);

create table if not exists enrollments (
  id         text        primary key,
  program_id text        not null,
  data       jsonb       not null,
  created_at timestamptz not null default now()
);
create index if not exists enrollments_program_id_idx on enrollments(program_id);

create table if not exists testimonials (
  id         text        primary key,
  data       jsonb       not null,
  created_at timestamptz not null default now()
);

create table if not exists content_sections (
  id         text        primary key,
  program_id text        not null,
  data       jsonb       not null,
  created_at timestamptz not null default now()
);
create index if not exists content_sections_program_id_idx on content_sections(program_id);

create table if not exists content_items (
  id         text        primary key,
  program_id text        not null,
  data       jsonb       not null,
  created_at timestamptz not null default now()
);
create index if not exists content_items_program_id_idx on content_items(program_id);

create table if not exists course_progress (
  user_email   text        not null,
  item_id      text        not null,
  program_id   text        not null,
  completed_at timestamptz not null default now(),
  primary key (user_email, item_id)
);
create index if not exists course_progress_program_user_idx on course_progress(program_id, user_email);`

// ── Vercel env vars ────────────────────────────────────────────────────────────
const SERVER_ENV = `# ── Vercel Dashboard → Project → Settings → Environment Variables ──────────

# Database — use Supabase Transaction mode pooler URL (port 6543), not direct (5432)
# Find it: Supabase Dashboard → Project Settings → Database → Connection pooling → Transaction mode
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Supabase Auth — server side (no VITE_ prefix)
# Same values as below — the server needs them to verify that API callers are logged-in admins
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Auth — frontend (VITE_ prefix exposes them to the browser)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudinary — for image uploads (optional; falls back to canvas resize if not set)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret`

export default function DatabaseSetup() {
  const navigate = useNavigate()
  const [url, setUrl]         = useState(() => localStorage.getItem('iwc_sb_url') || '')
  const [key, setKey]         = useState(() => localStorage.getItem('iwc_sb_key') || '')
  const [status, setStatus]   = useState(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [sqlCopied, setSqlCopied]     = useState(false)
  const [envCopied, setEnvCopied]     = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [connected, setConnected] = useState(isConfigured())

  async function saveKeys() {
    const trimUrl = url.trim().replace(/\/$/, '')
    const trimKey = key.trim()
    localStorage.setItem('iwc_sb_url', trimUrl)
    localStorage.setItem('iwc_sb_key', trimKey)
    reinitSupabase()
    setConnected(isConfigured())
  }

  async function testConnection() {
    await saveKeys()
    const sb = getSupabase()
    if (!sb) { setStatus('error'); setStatusMsg('No credentials — fill in URL and anon key above.'); return }
    setStatus('testing'); setStatusMsg('Connecting…')
    try {
      const { error } = await sb.from('forms').select('id', { count: 'exact', head: true })
      if (error) {
        setStatus('error')
        setStatusMsg(
          error.code === '42P01'
            ? 'Tables not found. Run the SQL setup script in your database first.'
            : `Connection failed: ${error.message}`
        )
      } else {
        setStatus('ok')
        setStatusMsg('Auth connected! Login and session management are working.')
        setConnected(true)
      }
    } catch (e) {
      setStatus('error')
      setStatusMsg(`Error: ${e.message}`)
    }
  }

  function clearKeys() {
    if (!window.confirm('Disconnect Supabase Auth? You will need to re-enter credentials to log in.')) return
    localStorage.removeItem('iwc_sb_url')
    localStorage.removeItem('iwc_sb_key')
    setUrl(''); setKey('')
    reinitSupabase()
    setConnected(false)
    setStatus(null)
  }

  function copySQL() {
    navigator.clipboard.writeText(SQL).then(() => { setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2000) })
  }
  function copyEnv() {
    navigator.clipboard.writeText(SERVER_ENV).then(() => { setEnvCopied(true); setTimeout(() => setEnvCopied(false), 2000) })
  }

  const card         = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: 24, marginBottom: 20 }
  const label        = { fontSize: 10, fontWeight: 700, color: ACC, letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 6 }
  const sectionTitle = { fontSize: 13, fontWeight: 800, color: 'white', marginBottom: 6 }
  const muted        = { fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }

  return (
    <div style={{ minHeight: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#1a0d2e,#2d1654)', borderBottom: `2px solid ${ACC}`, padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: ACC, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>←</button>
        <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${ACC},#e8c060)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🗄️</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Database Setup</div>
          <div style={{ fontSize: 9, color: ACC, letterSpacing: 2, textTransform: 'uppercase' }}>Vercel · Any PostgreSQL</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: connected ? 'rgba(46,204,113,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${connected ? 'rgba(46,204,113,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: connected ? '#2ECC71' : 'rgba(255,255,255,0.5)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#2ECC71' : 'rgba(255,255,255,0.3)', display: 'inline-block' }} />
          {connected ? 'Auth Connected' : 'Auth Not Configured'}
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 28px 80px' }}>

        {/* Architecture note */}
        <div style={{ background: 'rgba(52,152,219,0.08)', border: '1px solid rgba(52,152,219,0.25)', borderRadius: 12, padding: 18, marginBottom: 24, fontSize: 12, lineHeight: 1.8, color: 'rgba(255,255,255,0.6)' }}>
          <strong style={{ color: '#3498DB' }}>How the backend works</strong><br />
          All data (programs, forms, speakers, enrollments…) goes through Vercel serverless functions at <code style={{ color: '#93c5fd', fontSize: 11 }}>/api/db</code>.
          The function connects to PostgreSQL using <code style={{ color: '#93c5fd', fontSize: 11 }}>DATABASE_URL</code> — change that one env var to point at any database: Supabase, Neon, Railway, local, or your own VPS.<br /><br />
          Login and session management still use <strong style={{ color: 'white' }}>Supabase Auth</strong> (configured below), which is a separate service from the database.
        </div>

        {/* Step 1: Create database */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${ACC},#e8c060)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#1a0d2e', flexShrink: 0 }}>1</div>
            <div style={sectionTitle}>Create a PostgreSQL database</div>
          </div>
          <p style={muted}>
            Use any PostgreSQL provider — they all work identically:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginTop: 12 }}>
            {[
              { name: 'Supabase', url: 'https://supabase.com', note: 'Free tier · 500 MB' },
              { name: 'Neon',     url: 'https://neon.tech',    note: 'Free tier · serverless' },
              { name: 'Railway',  url: 'https://railway.app',  note: 'Pay-as-you-go' },
              { name: 'Local',    url: null,                   note: 'postgresql://localhost' },
            ].map(p => (
              <div key={p.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'white', marginBottom: 3 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.note}</div>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 10, color: ACC, textDecoration: 'none', fontWeight: 700 }}>
                    Open ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: SQL */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${ACC},#e8c060)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#1a0d2e', flexShrink: 0 }}>2</div>
            <div style={sectionTitle}>Create the database tables</div>
          </div>
          <p style={muted}>Run this SQL once in your database. It's plain SQL — works in psql, pgAdmin, Supabase SQL Editor, Neon console, Railway, etc. Safe to re-run (uses <code style={{ color: '#93c5fd', fontSize: 11 }}>IF NOT EXISTS</code>).</p>
          <div style={{ position: 'relative', marginTop: 14 }}>
            <pre style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{SQL}</pre>
            <button onClick={copySQL} style={{ position: 'absolute', top: 10, right: 10, background: sqlCopied ? 'rgba(46,204,113,0.25)' : 'rgba(255,255,255,0.1)', border: `1px solid ${sqlCopied ? 'rgba(46,204,113,0.5)' : 'rgba(255,255,255,0.2)'}`, borderRadius: 6, color: sqlCopied ? '#2ECC71' : 'white', padding: '5px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              {sqlCopied ? '✓ Copied!' : 'Copy SQL'}
            </button>
          </div>
        </div>

        {/* Step 3: Server env vars */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${ACC},#e8c060)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#1a0d2e', flexShrink: 0 }}>3</div>
            <div style={sectionTitle}>Configure environment variables</div>
          </div>
          <p style={muted}>
            Add these in the <strong style={{ color: 'white' }}>Vercel Dashboard → Project → Settings → Environment Variables</strong>.
            For local dev, copy <code style={{ color: '#93c5fd', fontSize: 11 }}>.env.example</code> to <code style={{ color: '#93c5fd', fontSize: 11 }}>.env</code> and fill in your values.
          </p>
          <div style={{ position: 'relative', marginTop: 14 }}>
            <pre style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{SERVER_ENV}</pre>
            <button onClick={copyEnv} style={{ position: 'absolute', top: 10, right: 10, background: envCopied ? 'rgba(46,204,113,0.25)' : 'rgba(255,255,255,0.1)', border: `1px solid ${envCopied ? 'rgba(46,204,113,0.5)' : 'rgba(255,255,255,0.2)'}`, borderRadius: 6, color: envCopied ? '#2ECC71' : 'white', padding: '5px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              {envCopied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            <strong style={{ color: ACC }}>Switching databases</strong><br />
            Update <code style={{ color: '#93c5fd' }}>DATABASE_URL</code> in Vercel to point at your new PostgreSQL, run the SQL schema on the new DB, and redeploy. No code changes needed.
          </div>
        </div>

        {/* Step 4: Auth credentials */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${ACC},#e8c060)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#1a0d2e', flexShrink: 0 }}>4</div>
            <div style={sectionTitle}>Configure Supabase Auth (for admin login)</div>
          </div>
          <p style={{ ...muted, marginBottom: 18 }}>
            Login uses <strong style={{ color: 'white' }}>Supabase Auth</strong> — separate from the database.
            Enter your Supabase project URL and anon key so the browser can call <code style={{ color: '#93c5fd', fontSize: 11 }}>supabase.auth.signIn</code>.
            Get these from: <strong style={{ color: 'white' }}>Supabase Dashboard → Settings → API</strong>.
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>Supabase Project URL</label>
            <input style={inp()} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co" />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={label}>Anon Public Key</label>
            <div style={{ position: 'relative' }}>
              <input style={inp({ paddingRight: 70 })} type={showKey ? 'text' : 'password'} value={key} onChange={e => setKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…" />
              <button onClick={() => setShowKey(s => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 11, cursor: 'pointer', fontFamily: "'Montserrat',sans-serif" }}>
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={testConnection} style={{ flex: 1, background: `linear-gradient(135deg,${ACC},#e8c060)`, border: 'none', borderRadius: 9, color: '#1a0d2e', padding: '11px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              {status === 'testing' ? '…Testing' : 'Test Auth & Save'}
            </button>
            {connected && (
              <button onClick={clearKeys} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9, color: '#f87171', padding: '11px 16px', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                Disconnect
              </button>
            )}
          </div>

          {status && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: status === 'ok' ? 'rgba(46,204,113,0.1)' : status === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${status === 'ok' ? 'rgba(46,204,113,0.35)' : status === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`, fontSize: 12, color: status === 'ok' ? '#2ECC71' : status === 'error' ? '#f87171' : 'rgba(255,255,255,0.6)' }}>
              {status === 'ok' ? '✓ ' : status === 'error' ? '✗ ' : '⟳ '}{statusMsg}
            </div>
          )}

          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
            <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Permanent setup</strong><br />
            Add <code style={{ color: '#93c5fd' }}>VITE_SUPABASE_URL</code> and <code style={{ color: '#93c5fd' }}>VITE_SUPABASE_ANON_KEY</code> to the frontend's <code style={{ color: '#93c5fd' }}>.env</code> file so you don't need to re-enter them after clearing browser data.
          </div>
        </div>

        {/* Deploy note */}
        <div style={{ background: 'rgba(52,152,219,0.06)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: 12, padding: 18, fontSize: 12, lineHeight: 1.9, color: 'rgba(255,255,255,0.5)' }}>
          <strong style={{ color: '#3498DB' }}>Deploying to Vercel</strong><br />
          1. Push repo to GitHub<br />
          2. Vercel → <strong style={{ color: 'white' }}>Add New Project</strong> → import your repo<br />
          3. Framework preset: <strong style={{ color: 'white' }}>Vite</strong> (auto-detected)<br />
          4. Add all env vars in <strong style={{ color: 'white' }}>Settings → Environment Variables</strong><br />
          5. Deploy — Vercel builds the frontend and deploys the <code style={{ color: '#93c5fd', fontSize: 11 }}>api/</code> functions automatically<br /><br />
          <strong style={{ color: 'white' }}>Local dev:</strong> <code style={{ color: '#93c5fd', fontSize: 11 }}>npm run dev</code> (runs <code style={{ color: '#93c5fd', fontSize: 11 }}>vercel dev</code> — starts Vite + API functions together)
        </div>

      </div>
    </div>
  )
}
