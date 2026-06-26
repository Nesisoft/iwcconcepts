import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInvoices, saveInvoice, deleteInvoice, sendInvoice } from '../utils/formStorage'
import { ArrowLeft, FileText, Plus, Trash2, Send, Copy, Check, Pencil } from 'lucide-react'

const ACC  = '#0d9488'
const DARK = '#0e0a1e'

const STATUS = {
  draft: { c: '#9ca3af', label: 'Draft' },
  sent:  { c: '#fbbf24', label: 'Sent' },
  paid:  { c: '#34d399', label: 'Paid' },
}
const money = (n, c = 'GHS') => `${c} ${Math.round(Number(n) || 0).toLocaleString()}`
const fmtDate = (iso) => { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '—' } }
const blankDraft = () => ({ id: null, customerName: '', email: '', currency: 'GHS', dueDate: '', notes: '', items: [{ description: '', amount: '' }] })

export default function InvoicesAdmin() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState(blankDraft())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setInvoices(await getInvoices() || []) } catch (e) { setMsg(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const total = draft.items.reduce((s, it) => s + (Number(it.amount) || 0), 0)
  const setD = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  const setItem = (i, k, v) => setDraft(d => ({ ...d, items: d.items.map((it, j) => j === i ? { ...it, [k]: v } : it) }))
  const addItem = () => setDraft(d => ({ ...d, items: [...d.items, { description: '', amount: '' }] }))
  const rmItem = (i) => setDraft(d => ({ ...d, items: d.items.filter((_, j) => j !== i) }))

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)
  const canSave = draft.customerName.trim() && validEmail && total > 0

  async function save() {
    if (!canSave) return
    setSaving(true); setMsg('')
    try {
      await saveInvoice({ ...draft, items: draft.items.map(it => ({ description: it.description, amount: Number(it.amount) || 0 })).filter(it => it.description || it.amount) })
      setDraft(blankDraft())
      await load()
      setMsg('Invoice saved.')
    } catch (e) { setMsg('⚠ ' + e.message) } finally { setSaving(false) }
  }

  async function send(inv) {
    if (!confirm(`Email invoice ${inv.number} to ${inv.email}?`)) return
    try { await sendInvoice(inv.id); await load(); setMsg(`Sent to ${inv.email}.`) }
    catch (e) { setMsg('⚠ ' + e.message) }
  }
  async function remove(inv) {
    if (!confirm(`Delete invoice ${inv.number}?`)) return
    await deleteInvoice(inv.id); await load()
  }
  function edit(inv) {
    setDraft({ id: inv.id, customerName: inv.customerName || '', email: inv.email || '', currency: inv.currency || 'GHS', dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : '', notes: inv.notes || '', items: (inv.items || []).length ? inv.items.map(it => ({ description: it.description, amount: it.amount })) : [{ description: '', amount: '' }] })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function copyLink(inv) {
    navigator.clipboard?.writeText(`${window.location.origin}/#/invoice?id=${inv.id}`)
    setCopied(inv.id); setTimeout(() => setCopied(null), 1500)
  }

  const inp = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 12, padding: '9px 11px', fontFamily: 'inherit', outline: 'none' }
  const lbl = { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }
  const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18, marginBottom: 18 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={13} /> Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#14b8a6)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={18} color="white" /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Invoices</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: 'white', padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Create / edit */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>{draft.id ? 'Edit invoice' : 'New invoice'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><label style={lbl}>Customer name</label><input style={inp} value={draft.customerName} onChange={e => setD('customerName', e.target.value)} placeholder="e.g. Acme Ltd" /></div>
              <div><label style={lbl}>Customer email</label><input style={inp} type="email" value={draft.email} onChange={e => setD('email', e.target.value)} placeholder="billing@acme.com" /></div>
            </div>
            <label style={lbl}>Line items (service &amp; amount)</label>
            {draft.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...inp, flex: 1 }} value={it.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="e.g. Social media management — June" />
                <input style={{ ...inp, width: 120 }} type="number" min={0} value={it.amount} onChange={e => setItem(i, 'amount', e.target.value)} placeholder="0" />
                <button onClick={() => rmItem(i)} disabled={draft.items.length === 1} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, color: '#f87171', padding: '0 10px', cursor: draft.items.length === 1 ? 'not-allowed' : 'pointer', opacity: draft.items.length === 1 ? 0.4 : 1 }}><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={addItem} style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 7, color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, padding: '7px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={12} /> Add line item</button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '12px 0' }}>
              <div><label style={lbl}>Currency</label><input style={inp} value={draft.currency} onChange={e => setD('currency', e.target.value.toUpperCase().slice(0, 4))} /></div>
              <div><label style={lbl}>Due date (optional)</label><input style={{ ...inp, colorScheme: 'dark' }} type="date" value={draft.dueDate} onChange={e => setD('dueDate', e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={lbl}>Notes (optional)</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 56 }} value={draft.notes} onChange={e => setD('notes', e.target.value)} placeholder="Payment terms, thank-you note, etc." /></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 900 }}>Total: {money(total, draft.currency)}</div>
              <div style={{ flex: 1 }} />
              {draft.id && <button onClick={() => setDraft(blankDraft())} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.7)', padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>}
              <button onClick={save} disabled={!canSave || saving} style={{ background: (canSave && !saving) ? `linear-gradient(135deg,${ACC},#14b8a6)` : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', padding: '9px 20px', fontSize: 12, fontWeight: 800, cursor: (canSave && !saving) ? 'pointer' : 'not-allowed' }}>{saving ? 'Saving…' : (draft.id ? 'Update invoice' : 'Create invoice')}</button>
            </div>
            {msg && <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: msg.startsWith('⚠') ? '#f87171' : '#34d399' }}>{msg}</div>}
          </div>

          {/* List */}
          {loading ? <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', padding: '30px 0' }}>Loading…</div>
            : invoices.length === 0 ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0', fontSize: 13 }}><FileText size={36} color="rgba(255,255,255,0.2)" style={{ marginBottom: 10 }} /><div>No invoices yet.</div></div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {invoices.map(inv => {
                  const s = STATUS[inv.status] || STATUS.draft
                  return (
                    <div key={inv.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 800 }}>{inv.number} · <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{inv.customerName || inv.email}</span></div>
                        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{money(inv.total, inv.currency)} · {inv.email} · due {fmtDate(inv.dueDate)}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: `${s.c}22`, color: s.c, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => copyLink(inv)} title="Copy pay link" style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: copied === inv.id ? '#34d399' : 'rgba(255,255,255,0.7)', padding: '6px 8px', cursor: 'pointer' }}>{copied === inv.id ? <Check size={13} /> : <Copy size={13} />}</button>
                        <button onClick={() => edit(inv)} title="Edit" style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.7)', padding: '6px 8px', cursor: 'pointer' }}><Pencil size={13} /></button>
                        {inv.status !== 'paid' && <button onClick={() => send(inv)} title="Email to customer" style={{ background: 'rgba(13,148,136,0.2)', border: 'none', borderRadius: 6, color: '#5eead4', padding: '6px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Send size={12} /> {inv.status === 'sent' ? 'Resend' : 'Send'}</button>}
                        <button onClick={() => remove(inv)} title="Delete" style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, color: '#f87171', padding: '6px 8px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
