import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllLessonComments, addAdminLessonComment, deleteLessonCommentAdmin } from '../utils/formStorage'
import { MessagesSquare, Send, Trash2, CornerDownRight, CheckCircle, Filter } from 'lucide-react'

const ACC  = '#9333ea'
const DARK = '#0e0a1e'

function timeAgo(iso) {
  const d = new Date(iso)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
}

export default function DiscussionsAdmin() {
  const navigate = useNavigate()
  const [comments, setComments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [filter,   setFilter]   = useState('unanswered') // unanswered | all
  const [replyTo,  setReplyTo]  = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [busy,     setBusy]     = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      setComments(await getAllLessonComments() || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Group into threads keyed by courseId+itemId
  const threads = useMemo(() => buildThreads(comments), [comments])

  const visibleThreads = useMemo(() => {
    if (filter === 'all') return threads
    return threads.filter(t => t.questions.some(q => !q.answered))
  }, [threads, filter])

  async function reply(question) {
    const text = (replyBody || '').trim()
    if (!text || busy) return
    setBusy(true)
    try {
      const created = await addAdminLessonComment({
        courseId: question.courseId,
        itemId: question.itemId,
        body: text,
        parentId: question.id,
        authorName: 'Instructor',
        courseTitle: question.courseTitle,
        lessonTitle: question.lessonTitle,
      })
      setComments(c => [...c, { ...created, courseId: question.courseId, itemId: question.itemId }])
      setReplyTo(null); setReplyBody('')
    } catch (e) {
      alert('Could not reply: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    if (!confirm('Delete this comment (and its replies)?')) return
    try {
      await deleteLessonCommentAdmin(id)
      setComments(c => c.filter(x => x.id !== id && x.parentId !== id))
    } catch (e) {
      alert('Could not delete: ' + e.message)
    }
  }

  const unansweredCount = threads.reduce((s, t) => s + t.questions.filter(q => !q.answered).length, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#c084e0)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessagesSquare size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Discussions & Q&amp;A</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {unansweredCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20, padding: '4px 12px' }}>
              {unansweredCount} awaiting reply
            </span>
          )}
          <button onClick={load} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'rgba(255,255,255,0.7)', padding: '6px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Refresh</button>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Filter toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
            <Filter size={14} color="rgba(255,255,255,0.4)" />
            {[['unanswered', 'Needs Reply'], ['all', 'All']].map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} style={{
                border: filter === k ? `1px solid ${ACC}` : '1px solid rgba(255,255,255,0.12)',
                background: filter === k ? `${ACC}22` : 'transparent',
                color: filter === k ? '#d8b4fe' : 'rgba(255,255,255,0.55)',
                borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>{label}</button>
            ))}
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading discussions…</div>}
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '16px 20px', color: '#f87171', fontSize: 13 }}>{error}</div>}

          {!loading && !error && visibleThreads.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
              <MessagesSquare size={44} color="rgba(255,255,255,0.15)" style={{ marginBottom: 14 }} />
              <div style={{ fontSize: 14 }}>{filter === 'unanswered' ? 'Nothing awaiting a reply. 🎉' : 'No discussion yet.'}</div>
            </div>
          )}

          {!loading && visibleThreads.map(thread => (
            <div key={thread.key} style={{ marginBottom: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, overflow: 'hidden' }}>
              {/* Thread header */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{thread.lessonTitle || 'Lesson'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{thread.courseTitle || 'Course'}</div>
              </div>

              {/* Questions */}
              <div style={{ padding: '6px 18px 14px' }}>
                {thread.questions
                  .filter(q => filter === 'all' || !q.answered)
                  .map(q => (
                  <div key={q.id} style={{ padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Question */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Dot name={q.authorName} admin={q.isAdmin} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 800 }}>{q.authorName}</span>
                          {q.isAdmin && <Badge>Instructor</Badge>}
                          {!q.answered && !q.isAdmin && <Badge color="#fbbf24" bg="rgba(251,191,36,0.15)">Needs reply</Badge>}
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{timeAgo(q.createdAt)}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>· {q.authorEmail}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{q.body}</div>
                        <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                          <button onClick={() => { setReplyTo(replyTo === q.id ? null : q.id); setReplyBody('') }} style={miniBtn}><CornerDownRight size={12} /> Reply</button>
                          <button onClick={() => remove(q.id)} style={{ ...miniBtn, color: '#f87171' }}><Trash2 size={12} /> Delete</button>
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {q.replies.length > 0 && (
                      <div style={{ marginLeft: 36, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, borderLeft: '2px solid rgba(255,255,255,0.08)', paddingLeft: 14 }}>
                        {q.replies.map(r => (
                          <div key={r.id} style={{ display: 'flex', gap: 10 }}>
                            <Dot name={r.authorName} admin={r.isAdmin} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <span style={{ fontSize: 12, fontWeight: 800 }}>{r.authorName}</span>
                                {r.isAdmin && <Badge>Instructor</Badge>}
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{timeAgo(r.createdAt)}</span>
                              </div>
                              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.body}</div>
                              <button onClick={() => remove(r.id)} style={{ ...miniBtn, color: '#f87171', marginTop: 5 }}><Trash2 size={12} /> Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply box */}
                    {replyTo === q.id && (
                      <div style={{ marginLeft: 36, marginTop: 12, display: 'flex', gap: 8 }}>
                        <textarea
                          value={replyBody}
                          onChange={e => setReplyBody(e.target.value)}
                          placeholder="Write an instructor reply…"
                          rows={2}
                          autoFocus
                          style={{ flex: 1, boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, padding: '9px 12px', fontSize: 13, color: 'white', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                        />
                        <button onClick={() => reply(q)} disabled={!replyBody.trim() || busy} style={{ alignSelf: 'flex-end', background: replyBody.trim() ? ACC : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 9, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: replyBody.trim() && !busy ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Send size={14} /> {busy ? '…' : 'Send'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Dot({ name, admin }) {
  const ch = (name || '?')[0]?.toUpperCase() || '?'
  return (
    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: admin ? `linear-gradient(135deg,${ACC},#c084e0)` : 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>{ch}</div>
  )
}

function Badge({ children, color = '#d8b4fe', bg = 'rgba(147,51,234,0.18)' }) {
  return <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', background: bg, color, borderRadius: 20, padding: '2px 8px' }}>{children}</span>
}

const miniBtn = { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, padding: 0 }

// ── Threading ───────────────────────────────────────────────────────────────────

function buildThreads(comments) {
  const byId = {}
  for (const c of comments) byId[c.id] = c

  // Group top-level questions by course+item
  const map = {}
  for (const c of comments) {
    if (c.parentId) continue
    const key = `${c.courseId}::${c.itemId}`
    map[key] ??= {
      key, courseId: c.courseId, itemId: c.itemId,
      courseTitle: c.courseTitle, lessonTitle: c.lessonTitle,
      questions: [],
    }
    const replies = comments
      .filter(r => r.parentId === c.id)
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    map[key].questions.push({
      ...c,
      replies,
      answered: replies.some(r => r.isAdmin),
    })
  }

  const threads = Object.values(map)
  // Sort questions newest first within a thread
  for (const t of threads) {
    t.questions.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  }
  // Threads with unanswered questions first, then by most recent activity
  threads.sort((a, b) => {
    const au = a.questions.some(q => !q.answered) ? 0 : 1
    const bu = b.questions.some(q => !q.answered) ? 0 : 1
    if (au !== bu) return au - bu
    const at = a.questions[0]?.createdAt || ''
    const bt = b.questions[0]?.createdAt || ''
    return String(bt).localeCompare(String(at))
  })
  return threads
}
