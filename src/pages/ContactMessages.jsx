import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getContactMessages, deleteContactMessage } from '../utils/formStorage'
import { ArrowLeft, Mail, Trash2, Search, Inbox } from 'lucide-react'

const ACC  = '#2ECC71'
const DARK = '#0e0a1e'

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

export default function ContactMessages() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [query,    setQuery]    = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    try { setMessages(await getContactMessages() || []) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function remove(id) {
    if (!confirm('Delete this message?')) return
    await deleteContactMessage(id)
    setMessages(ms => ms.filter(m => m.id !== id))
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return messages
    return messages.filter(m => [m.name, m.email, m.subject, m.message].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [messages, query])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={13} /> Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#27ae60)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Inbox size={18} color="white" /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Contact Messages</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: 'white', padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{messages.length} message{messages.length !== 1 ? 's' : ''}</div>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
              <Search size={15} color="rgba(255,255,255,0.35)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search messages…" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '8px 14px 8px 34px', fontSize: 12, color: 'white', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '70px 0', color: 'rgba(255,255,255,0.3)' }}>Loading messages…</div>}
          {error && !loading && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 18px', color: '#f87171', fontSize: 13 }}>{error} — <button onClick={load} style={{ background: 'none', border: 'none', color: '#f87171', textDecoration: 'underline', cursor: 'pointer' }}>try again</button></div>}

          {!loading && !error && visible.length === 0 && (
            <div style={{ textAlign: 'center', padding: '70px 0', color: 'rgba(255,255,255,0.4)' }}>
              <Inbox size={42} color="rgba(255,255,255,0.2)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 700 }}>{messages.length === 0 ? 'No messages yet.' : 'No messages match your search.'}</div>
            </div>
          )}

          {!loading && !error && visible.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visible.map(m => (
                <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: 'white' }}>{m.subject || '(no subject)'}</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                        {m.name || 'Anonymous'} · <a href={`mailto:${m.email}`} style={{ color: '#74b9e8', textDecoration: 'none' }}>{m.email}</a>
                      </div>
                    </div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{formatDate(m.timestamp)}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Your message'))}`} title="Reply" style={{ background: 'rgba(46,204,113,0.15)', border: 'none', borderRadius: 6, color: ACC, padding: '5px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><Mail size={13} /></a>
                      <button onClick={() => remove(m.id)} title="Delete" style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, color: '#f87171', padding: '5px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginTop: 10, whiteSpace: 'pre-wrap' }}>{m.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
