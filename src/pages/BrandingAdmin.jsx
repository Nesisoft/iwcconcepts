import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBranding, saveBranding } from '../utils/formStorage'
import { clearBrandingCache } from '../utils/branding'
import { uploadToCloudinary } from '../utils/cloudinary'
import { ArrowLeft, Image as ImageIcon, Upload } from 'lucide-react'

const ACC  = '#C9A84C'
const DARK = '#0e0a1e'

export default function BrandingAdmin() {
  const navigate = useNavigate()
  const [logoUrl, setLogoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    getBranding().then(b => setLogoUrl(b?.logoUrl || '')).finally(() => setLoading(false))
  }, [])

  async function upload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true); setMsg(null)
    try {
      const url = await uploadToCloudinary(file, { maxPx: 600, quality: 0.9 })
      setLogoUrl(url)
    } catch (err) {
      setMsg({ ok: false, text: 'Upload failed: ' + err.message })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function save() {
    setSaving(true); setMsg(null)
    try {
      await saveBranding({ logoUrl: logoUrl || null })
      clearBrandingCache()
      setMsg({ ok: true, text: 'Logo saved. It now shows across the public site.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={13} /> Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#e8c060)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={18} color="#1A1A2E" /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Branding</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Site logo</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 16 }}>
              Upload your logo and it appears in the site header and footer automatically. Use a transparent PNG or SVG that reads well on a dark background. Leave it empty to fall back to the default “IWC Concepts” wordmark. Change it here anytime — no developer needed.
            </div>

            {loading ? (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Loading…</div>
            ) : (
              <>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: uploading ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,${ACC},#e8c060)`, color: '#1A1A2E', borderRadius: 8, padding: '9px 16px', fontSize: 12, fontWeight: 800, cursor: uploading ? 'wait' : 'pointer' }}>
                  <Upload size={14} /> {uploading ? 'Uploading…' : (logoUrl ? 'Replace logo' : 'Upload logo')}
                  <input type="file" accept="image/*" disabled={uploading} onChange={upload} style={{ display: 'none' }} />
                </label>

                {logoUrl && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Preview</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ background: '#0f0a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 160 }}>
                        <img src={logoUrl} alt="logo on dark" style={{ height: 44, maxWidth: 200, objectFit: 'contain' }} />
                      </div>
                      <div style={{ background: '#ffffff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 160 }}>
                        <img src={logoUrl} alt="logo on light" style={{ height: 44, maxWidth: 200, objectFit: 'contain' }} />
                      </div>
                    </div>
                    <button onClick={() => setLogoUrl('')} style={{ marginTop: 10, background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, color: '#f87171', fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>Remove logo</button>
                  </div>
                )}

                <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={save} disabled={saving} style={{ background: saving ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,#6c3fc5,#9333ea)`, border: 'none', borderRadius: 8, color: 'white', padding: '10px 20px', fontSize: 12, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
                  {msg && <span style={{ fontSize: 12, fontWeight: 600, color: msg.ok ? '#34d399' : '#f87171' }}>{msg.text}</span>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
