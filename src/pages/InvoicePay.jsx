import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getInvoicePublic, payInvoiceRecord } from '../utils/formStorage'
import { CheckCircle2, FileText } from 'lucide-react'

const BRAND = '#6c3fc5'
const BRAND2 = '#9333ea'
const GOLD  = '#C9A84C'

const money = (n, c = 'GHS') => `${c} ${Math.round(Number(n) || 0).toLocaleString()}`
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return '' } }

export default function InvoicePay() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const id = params.get('id')

  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [paying, setPaying]   = useState(null)
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    if (!id) { setError('No invoice specified.'); setLoading(false); return }
    let cancelled = false

    async function run() {
      // Returning from Paystack? Record the payment first.
      let ret = null
      try { ret = JSON.parse(sessionStorage.getItem('iwc_paystack_return_invoice') || 'null') } catch {}
      if (ret?.invoiceId === id && ret.reference) {
        sessionStorage.removeItem('iwc_paystack_return_invoice')
        setRecording(true)
        try {
          const updated = await payInvoiceRecord(id, ret.reference)
          if (!cancelled) { setInvoice(updated); setLoading(false); setRecording(false); return }
        } catch (e) {
          if (!cancelled) { setError(e.message); setRecording(false) }
        }
      }
      try {
        const inv = await getInvoicePublic(id)
        if (!cancelled) setInvoice(inv)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [id])

  async function pay(channel) {
    if (!invoice) return
    setPaying(channel); setError('')
    const callbackUrl = `${window.location.origin}/?paystack_return=1&invoice=${encodeURIComponent(invoice.id)}`
    try {
      const res = await fetch('/api/paystack-init', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: invoice.email || 'customer@example.com',
          amount: invoice.total,
          currency: invoice.currency || 'GHS',
          channels: [channel],
          callback_url: callbackUrl,
          metadata: { type: 'invoice', invoiceId: invoice.id, participantName: invoice.customerName },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.authorization_url) { setError(data.error || 'Could not start payment. Please try again.'); setPaying(null); return }
      window.location.href = data.authorization_url
    } catch {
      setError('Network error. Please try again.'); setPaying(null)
    }
  }

  const paid = invoice?.status === 'paid'

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 100%)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>← Home</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>Invoice</div>
        <div style={{ color: GOLD, fontWeight: 800, fontSize: 13 }}>IWC CONCEPTS</div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0' }}>{recording ? 'Confirming your payment…' : 'Loading invoice…'}</div>
        ) : error && !invoice ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <FileText size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>{error}</div>
          </div>
        ) : invoice ? (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ background: paid ? 'linear-gradient(135deg,#dcfce7,#bbf7d0)' : 'linear-gradient(135deg, #f5f0ff, #ede9fe)', padding: '24px', textAlign: 'center' }}>
              {paid
                ? <><CheckCircle2 size={44} color="#16a34a" style={{ marginBottom: 8 }} /><div style={{ fontSize: 20, fontWeight: 900, color: '#14532d' }}>Paid — thank you!</div></>
                : <><div style={{ fontSize: 12, fontWeight: 800, color: BRAND, letterSpacing: 2, textTransform: 'uppercase' }}>Invoice {invoice.number}</div><div style={{ fontSize: 30, fontWeight: 900, color: '#111827', marginTop: 4 }}>{money(invoice.total, invoice.currency)}</div></>}
              {invoice.dueDate && !paid && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Due {fmtDate(invoice.dueDate)}</div>}
            </div>

            <div style={{ padding: '22px 24px' }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>Billed to <strong style={{ color: '#111827' }}>{invoice.customerName || invoice.email}</strong></div>
              <div style={{ borderTop: '1px solid #f3f4f6' }}>
                {(invoice.items || []).map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                    <span style={{ color: '#374151' }}>{it.description || 'Item'}</span>
                    <span style={{ fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>{money(it.amount, invoice.currency)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 16, fontWeight: 900, color: '#111827' }}>
                  <span>Total</span><span>{money(invoice.total, invoice.currency)}</span>
                </div>
              </div>
              {invoice.notes && <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.7, marginTop: 8, background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>{invoice.notes}</div>}

              {paid ? (
                <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                  Paid on {fmtDate(invoice.paidAt)}{invoice.paymentRef ? ` · Ref ${invoice.paymentRef}` : ''}. A receipt has been emailed to you.
                </div>
              ) : (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Choose how to pay</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[{ ch: 'mobile_money', icon: '📱', label: 'Mobile Money', sub: 'MTN · Vodafone · AirtelTigo' }, { ch: 'card', icon: '💳', label: 'Card', sub: 'Visa · Mastercard' }].map(({ ch, icon, label, sub }) => (
                      <button key={ch} onClick={() => pay(ch)} disabled={paying !== null} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', borderRadius: 12, border: `2px solid ${paying === ch ? BRAND : '#e5e7eb'}`, background: paying === ch ? '#f5f0ff' : '#fff', cursor: paying ? 'not-allowed' : 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: 28 }}>{icon}</span>
                        <div><div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{paying === ch ? 'Starting…' : `Pay with ${label}`}</div><div style={{ fontSize: 12, color: '#6b7280' }}>{sub}</div></div>
                      </button>
                    ))}
                  </div>
                  {error && <div style={{ marginTop: 12, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{error}</div>}
                  <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 14 }}>🔒 Secured by Paystack.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
