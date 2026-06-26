/**
 * ConfirmModal — in-app confirmation dialog (replaces native confirm()/alert()).
 * Render once per page; drive it with a state object:
 *   const [confirm, setConfirm] = useState(null)
 *   <ConfirmModal open={!!confirm} {...confirm} onCancel={() => setConfirm(null)} />
 *   setConfirm({ title, message, confirmLabel, danger, onConfirm })
 */
export default function ConfirmModal({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, busy = false, onConfirm, onCancel,
}) {
  if (!open) return null
  const ACC = danger ? '#ef4444' : '#0d9488'
  return (
    <div
      onClick={busy ? undefined : onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(4,2,12,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#171127', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 22, maxWidth: 400, width: '100%', boxShadow: '0 24px 70px rgba(0,0,0,0.55)', fontFamily: "'Montserrat',sans-serif" }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: 'white', marginBottom: 8 }}>{title}</div>
        {message && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 18 }}>{message}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel} disabled={busy}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.75)', padding: '9px 16px', fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}
          >{cancelLabel}</button>
          <button
            onClick={onConfirm} disabled={busy}
            style={{ background: ACC, border: 'none', borderRadius: 8, color: 'white', padding: '9px 18px', fontSize: 12, fontWeight: 800, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}
          >{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
