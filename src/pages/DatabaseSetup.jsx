import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase, isConfigured, reinitSupabase } from '../utils/supabase'
import { migrateToSupabase } from '../utils/db'

const ACC = '#C9A84C'
const DARK = '#0f0a1a'

const inp = (extra = {}) => ({
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8, color: 'white', fontFamily: "'Montserrat',sans-serif",
  fontSize: 13, padding: '10px 13px',
  ...extra,
})

const SQL = `-- Run this once in your Supabase SQL Editor
-- Project → SQL Editor → New Query → paste → Run

create table forms (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table submissions (
  id text primary key,
  form_id text not null,
  data jsonb not null,
  submitted_at timestamptz not null default now()
);
create index on submissions(form_id);

create table speakers (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table tasks (
  form_id text primary key,
  data jsonb not null
);

-- Allow access with the anon key (single-org app, no user auth)
alter table forms      enable row level security;
alter table submissions enable row level security;
alter table speakers   enable row level security;
alter table tasks      enable row level security;

create policy "anon_all" on forms      for all using (true) with check (true);
create policy "anon_all" on submissions for all using (true) with check (true);
create policy "anon_all" on speakers   for all using (true) with check (true);
create policy "anon_all" on tasks      for all using (true) with check (true);`

export default function DatabaseSetup() {
  const navigate = useNavigate()
  const [url, setUrl] = useState(() => localStorage.getItem('iwc_sb_url') || '')
  const [key, setKey] = useState(() => localStorage.getItem('iwc_sb_key') || '')
  const [status, setStatus] = useState(null) // null | 'testing' | 'ok' | 'error'
  const [statusMsg, setStatusMsg] = useState('')
  const [migrating, setMigrating] = useState(false)
  const [migLog, setMigLog] = useState([])
  const [sqlCopied, setSqlCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [connected, setConnected] = useState(isConfigured())

  useEffect(() => { setConnected(isConfigured()) }, [])

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
    if (!sb) { setStatus('error'); setStatusMsg('No credentials — please fill in URL and key above.'); return }
    setStatus('testing'); setStatusMsg('Connecting…')
    try {
      const { error } = await sb.from('forms').select('id', { count: 'exact', head: true })
      if (error) {
        if (error.code === '42P01') {
          setStatus('error')
          setStatusMsg('Tables not found. Run the SQL setup script in your Supabase SQL Editor first.')
        } else {
          setStatus('error')
          setStatusMsg(`Connection failed: ${error.message}`)
        }
      } else {
        setStatus('ok')
        setStatusMsg('Connected successfully! Your data will now sync to Supabase.')
        setConnected(true)
      }
    } catch (e) {
      setStatus('error')
      setStatusMsg(`Error: ${e.message}`)
    }
  }

  function clearKeys() {
    if (!window.confirm('Disconnect Supabase? The app will fall back to local storage.')) return
    localStorage.removeItem('iwc_sb_url')
    localStorage.removeItem('iwc_sb_key')
    setUrl(''); setKey('')
    reinitSupabase()
    setConnected(false)
    setStatus(null)
  }

  async function runMigration() {
    const sb = getSupabase()
    if (!sb) { alert('Connect Supabase first.'); return }
    setMigrating(true)
    setMigLog(['Starting migration…'])
    const report = await migrateToSupabase(sb, msg => setMigLog(l => [...l, msg]))
    const summary = `✓ ${report.forms} forms, ${report.submissions} submissions, ${report.speakers} speakers, ${report.tasks} task lists migrated.`
    setMigLog(l => [...l, summary, ...(report.errors.length ? ['Errors: ' + report.errors.join(', ')] : [])])
    setMigrating(false)
  }

  function copySQL() {
    navigator.clipboard.writeText(SQL).then(() => { setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2000) })
  }

  const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: 24, marginBottom: 20 }
  const label = { fontSize: 10, fontWeight: 700, color: ACC, letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 6 }
  const sectionTitle = { fontSize: 13, fontWeight: 800, color: 'white', marginBottom: 6 }
  const muted = { fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }

  return (
    <div style={{ minHeight: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#1a0d2e,#2d1654)', borderBottom: `2px solid ${ACC}`, padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: ACC, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>←</button>
        <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${ACC},#e8c060)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🗄️</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Database Setup</div>
          <div style={{ fontSize: 9, color: ACC, letterSpacing: 2, textTransform: 'uppercase' }}>Cloud Persistence · Supabase</div>
        </div>
        {/* Status badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: connected ? 'rgba(46,204,113,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${connected ? 'rgba(46,204,113,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: connected ? '#2ECC71' : 'rgba(255,255,255,0.5)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#2ECC71' : 'rgba(255,255,255,0.3)', display: 'inline-block' }} />
          {connected ? 'Supabase Connected' : 'Local Storage Only'}
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 28px 80px' }}>

        {/* Step 1: Create project */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${ACC},#e8c060)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#1a0d2e', flexShrink: 0 }}>1</div>
            <div style={sectionTitle}>Create a free Supabase project</div>
          </div>
          <p style={muted}>
            Go to <strong style={{ color: 'white' }}>supabase.com</strong> → New project → choose a name and region. The free tier gives you 500 MB database storage and 1 GB file storage — more than enough for this app.
          </p>
          <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12, background: `linear-gradient(135deg,${ACC},#e8c060)`, color: '#1a0d2e', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
            Open Supabase ↗
          </a>
        </div>

        {/* Step 2: SQL */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${ACC},#e8c060)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#1a0d2e', flexShrink: 0 }}>2</div>
            <div style={sectionTitle}>Create the database tables</div>
          </div>
          <p style={muted}>In your Supabase project: <strong style={{ color: 'white' }}>SQL Editor → New Query</strong> → paste the SQL below → click <strong style={{ color: 'white' }}>Run</strong>.</p>
          <div style={{ position: 'relative', marginTop: 14 }}>
            <pre style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{SQL}</pre>
            <button onClick={copySQL} style={{ position: 'absolute', top: 10, right: 10, background: sqlCopied ? 'rgba(46,204,113,0.25)' : 'rgba(255,255,255,0.1)', border: `1px solid ${sqlCopied ? 'rgba(46,204,113,0.5)' : 'rgba(255,255,255,0.2)'}`, borderRadius: 6, color: sqlCopied ? '#2ECC71' : 'white', padding: '5px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              {sqlCopied ? '✓ Copied!' : 'Copy SQL'}
            </button>
          </div>
        </div>

        {/* Step 3: API keys */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${ACC},#e8c060)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#1a0d2e', flexShrink: 0 }}>3</div>
            <div style={sectionTitle}>Enter your API credentials</div>
          </div>
          <p style={{ ...muted, marginBottom: 18 }}>In your Supabase project: <strong style={{ color: 'white' }}>Settings → API</strong>. Copy the <em>Project URL</em> and the <em>anon public</em> key.</p>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>Project URL</label>
            <input style={inp()} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co" />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={label}>Anon Public Key</label>
            <div style={{ position: 'relative' }}>
              <input style={inp({ paddingRight: 70 })} type={showKey ? 'text' : 'password'} value={key} onChange={e => setKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…" />
              <button onClick={() => setShowKey(s => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 11, cursor: 'pointer', fontFamily: "'Montserrat',sans-serif" }}>{showKey ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={testConnection} style={{ flex: 1, background: `linear-gradient(135deg,${ACC},#e8c060)`, border: 'none', borderRadius: 9, color: '#1a0d2e', padding: '11px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              {status === 'testing' ? '…Testing' : 'Test Connection & Save'}
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
        </div>

        {/* Step 4: Migrate */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, background: connected ? `linear-gradient(135deg,${ACC},#e8c060)` : 'rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: connected ? '#1a0d2e' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>4</div>
            <div style={{ ...sectionTitle, color: connected ? 'white' : 'rgba(255,255,255,0.4)' }}>Migrate existing local data (optional)</div>
          </div>
          <p style={muted}>If you've already created forms, added speakers, or received submissions, click below to copy all local IndexedDB data into your Supabase database. Safe to run multiple times.</p>
          <button
            onClick={runMigration}
            disabled={!connected || migrating}
            style={{ marginTop: 14, background: connected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${connected ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 9, color: connected ? ACC : 'rgba(255,255,255,0.25)', padding: '10px 20px', fontWeight: 700, fontSize: 12, cursor: connected ? 'pointer' : 'not-allowed', fontFamily: "'Montserrat',sans-serif" }}
          >
            {migrating ? '⟳ Migrating…' : '↑ Migrate Local Data → Supabase'}
          </button>

          {migLog.length > 0 && (
            <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
              {migLog.map((line, i) => (
                <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, fontFamily: 'monospace' }}>{line}</div>
              ))}
            </div>
          )}
        </div>

        {/* Info box */}
        <div style={{ background: 'rgba(52,152,219,0.08)', border: '1px solid rgba(52,152,219,0.25)', borderRadius: 12, padding: 18, fontSize: 12, lineHeight: 1.8, color: 'rgba(255,255,255,0.55)' }}>
          <strong style={{ color: '#3498DB' }}>How it works</strong><br />
          Your credentials are saved in this browser so the app reconnects automatically. For a permanent setup (so you don't need to re-enter them after clearing browser data), add a <code style={{ color: '#93c5fd', fontSize: 11 }}>.env</code> file to the project root with:<br />
          <code style={{ color: '#93c5fd', fontSize: 11, display: 'block', marginTop: 6 }}>VITE_SUPABASE_URL=your_url</code>
          <code style={{ color: '#93c5fd', fontSize: 11 }}>VITE_SUPABASE_ANON_KEY=your_key</code><br />
          Then rebuild with <code style={{ color: '#93c5fd', fontSize: 11 }}>npm run build</code>.
        </div>
      </div>
    </div>
  )
}
