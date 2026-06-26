import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBranding, saveBranding } from '../utils/formStorage'
import { clearBrandingCache } from '../utils/branding'
import { uploadToCloudinary } from '../utils/cloudinary'
import { ArrowLeft, Image as ImageIcon, Upload } from 'lucide-react'

const ACC  = '#C9A84C'
const DARK = '#0e0a1e'
const DEFAULT_LOGO_HEIGHT = 64

export default function BrandingAdmin() {
  const navigate = useNavigate()
  const [logoUrl, setLogoUrl] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [logoHeight, setLogoHeight] = useState(DEFAULT_LOGO_HEIGHT)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null)   // 'logo' | 'favicon' | null
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    getBranding().then(b => {
      setLogoUrl(b?.logoUrl || '')
      setFaviconUrl(b?.faviconUrl || '')
      setLogoHeight(Number(b?.logoHeight) || DEFAULT_LOGO_HEIGHT)
    }).finally(() => setLoading(false))
  }, [])

  async function upload(kind, e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(kind); setMsg(null)
    try {
      const url = await uploadToCloudinary(file, kind === 'favicon' ? { maxPx: 256, quality: 0.92 } : { maxPx: 800, quality: 0.9 })
      if (kind === 'favicon') setFaviconUrl(url); else setLogoUrl(url)
    } catch (err) {
      setMsg({ ok: false, text: 'Upload failed: ' + err.message })
    } finally {
      setUploading(null)
      e.target.value = ''
    }
  }

  async function save() {
    setSaving(true); setMsg(null)
    try {
      await saveBranding({ logoUrl: logoUrl || null, faviconUrl: faviconUrl || null, logoHeight: Number(logoHeight) || DEFAULT_LOGO_HEIGHT })
      clearBrandingCache()
      setMsg({ ok: true, text: 'Saved. Your branding now shows across the site (favicon updates on next page load).' })
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18, marginBottom: 16 }
  const uploadBtn = (kind, has) => ({ display: 'inline-flex', alignItems: 'center', gap: 8, background: uploading === kind ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,${ACC},#e8c060)`, color: '#1A1A2E', borderRadius: 8, padding: '9px 16px', fontSize: 12, fontWeight: 800, cursor: uploading ? 'wait' : 'pointer' })

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
        {!loading && (
          <button onClick={save} disabled={saving} style={{ background: saving ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,#6c3fc5,#9333ea)`, border: 'none', borderRadius: 8, color: 'white', padding: '8px 18px', fontSize: 12, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving…' : 'Save changes'}</button>
        )}
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {loading ? <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Loading…</div> : (
            <>
              {/* Logo */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Site logo</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 16 }}>
                  Shown in the site header and footer. Use a transparent PNG or SVG that reads on a dark background. Empty falls back to the “IWC Concepts” wordmark.
                </div>
                <label style={uploadBtn('logo')}>
                  <Upload size={14} /> {uploading === 'logo' ? 'Uploading…' : (logoUrl ? 'Replace logo' : 'Upload logo')}
                  <input type="file" accept="image/*" disabled={!!uploading} onChange={e => upload('logo', e)} style={{ display: 'none' }} />
                </label>

                {logoUrl && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ background: '#0f0a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 180, flex: 1 }}>
                        <img src={logoUrl} alt="logo on dark" style={{ height: logoHeight, maxWidth: 260, objectFit: 'contain' }} />
                      </div>
                      <div style={{ background: '#ffffff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 180, flex: 1 }}>
                        <img src={logoUrl} alt="logo on light" style={{ height: logoHeight, maxWidth: 260, objectFit: 'contain' }} />
                      </div>
                    </div>

                    {/* Size control */}
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700 }}>Logo size</span><span>{logoHeight}px tall</span>
                      </div>
                      <input type="range" min={32} max={96} step={2} value={logoHeight} onChange={e => setLogoHeight(Number(e.target.value))} style={{ width: '100%', accentColor: ACC }} />
                    </div>
                    <button onClick={() => setLogoUrl('')} style={{ marginTop: 12, background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, color: '#f87171', fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>Remove logo</button>
                  </div>
                )}
              </div>

              {/* Favicon */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Favicon (browser tab icon)</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 16 }}>
                  The small icon shown in the browser tab and bookmarks. Upload a <strong>square</strong> image (PNG, at least 64×64). Empty falls back to the default mark.
                </div>
                <label style={uploadBtn('favicon')}>
                  <Upload size={14} /> {uploading === 'favicon' ? 'Uploading…' : (faviconUrl ? 'Replace favicon' : 'Upload favicon')}
                  <input type="file" accept="image/*" disabled={!!uploading} onChange={e => upload('favicon', e)} style={{ display: 'none' }} />
                </label>
                {faviconUrl && (
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ background: '#fff', borderRadius: 6, padding: 6, display: 'flex' }}><img src={faviconUrl} alt="favicon" style={{ width: 32, height: 32, objectFit: 'contain' }} /></div>
                    <div style={{ background: '#0f0a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: 6, display: 'flex' }}><img src={faviconUrl} alt="favicon small" style={{ width: 16, height: 16, objectFit: 'contain' }} /></div>
                    <button onClick={() => setFaviconUrl('')} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, color: '#f87171', fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>Remove</button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={save} disabled={saving} style={{ background: saving ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,#6c3fc5,#9333ea)`, border: 'none', borderRadius: 8, color: 'white', padding: '11px 22px', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving…' : 'Save changes'}</button>
                {msg && <span style={{ fontSize: 12, fontWeight: 600, color: msg.ok ? '#34d399' : '#f87171' }}>{msg.text}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
