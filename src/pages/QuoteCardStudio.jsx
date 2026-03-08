import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACCENT_COLORS, BORDER_COLORS, EXPORT_SIZES } from '../utils/constants'
import { SOCIAL_PLATFORMS, PLATFORM_SVG, svgToDataUri, preloadPlatformImages, getPlatformImage } from '../utils/platformIcons'
import { hexToRgba, roundRect, wrapText, drawBg, drawOverlay, drawPfp, drawPlatformIcon } from '../utils/canvasHelpers'

// ── Section Title Component ────────────────────────────────────────────────
function SecTitle({ children }) {
  return (
    <div style={{
      fontSize: 8, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase',
      color: '#C9A84C', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.2)' }} />
    </div>
  )
}

// ── Toggle Row ─────────────────────────────────────────────────────────────
function ToggleRow({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
      <span>{label}</span>
      <label style={{ position: 'relative', width: 34, height: 18, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <div style={{
          position: 'absolute', inset: 0, background: checked ? '#C9A84C' : 'rgba(255,255,255,0.2)',
          borderRadius: 20, transition: 'background 0.3s',
        }}>
          <div style={{
            position: 'absolute', width: 12, height: 12, left: checked ? 19 : 3, top: 3,
            background: 'white', borderRadius: '50%', transition: 'left 0.3s',
          }} />
        </div>
      </label>
    </div>
  )
}

// ── Range Control ──────────────────────────────────────────────────────────
function RangeCtrl({ label, value, min, max, onChange, small }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: small ? 6 : 9 }}>
      {label && <label style={{ fontSize: small ? 9 : 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="range" min={min} max={max} value={value} onChange={onChange} style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', width: 26, textAlign: 'right', flexShrink: 0 }}>{value}</span>
      </div>
    </div>
  )
}

// ── Color Swatch Row ───────────────────────────────────────────────────────
function ColorSwatchRow({ colors, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {colors.map(({ c, n }) => (
        <div
          key={c}
          title={n || c}
          onClick={() => onChange(c)}
          style={{
            width: 26, height: 26, borderRadius: 5,
            background: c,
            border: `2px solid ${value === c ? 'white' : c === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
            cursor: 'pointer', transition: 'transform 0.15s',
            transform: value === c ? 'scale(1.12)' : 'scale(1)',
            boxShadow: value === c ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ── Upload Zone ────────────────────────────────────────────────────────────
function UploadZone({ label, icon, onUpload, previewSrc, onRemove }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      {previewSrc ? (
        <div style={{ position: 'relative' }}>
          <img src={previewSrc} alt="" style={{ width: '100%', borderRadius: 6, display: 'block', objectFit: 'cover', maxHeight: 70 }} />
          <button onClick={onRemove} style={{
            position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.75)',
            border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer',
            width: 18, height: 18, fontSize: 11, lineHeight: '18px', textAlign: 'center',
          }}>✕</button>
        </div>
      ) : (
        <label style={{
          display: 'block', border: '2px dashed rgba(201,168,76,0.35)', borderRadius: 9,
          padding: 12, textAlign: 'center', cursor: 'pointer',
          background: 'rgba(201,168,76,0.04)', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'; e.currentTarget.style.background = 'rgba(201,168,76,0.04)' }}
        >
          <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
          <div style={{ fontSize: 20, marginBottom: 3 }}>{icon}</div>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
            <strong style={{ color: '#C9A84C' }}>Upload</strong> {label.toLowerCase()}
          </p>
        </label>
      )}
    </div>
  )
}

// ── CANVAS TEMPLATES ───────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 0, name: 'Dark Quote',
    render(ctx, w, h, s, getImg) {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#0d0520'); g.addColorStop(1, '#1a0a35')
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity)
      drawOverlay(ctx, w, h, s.darkOverlay, s.overlayOpacity)

      const gl = ctx.createRadialGradient(w * 0.72, h * 0.28, 0, w * 0.72, h * 0.28, w * 0.5)
      gl.addColorStop(0, hexToRgba(s.accentColor, 0.14)); gl.addColorStop(1, 'transparent')
      ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h)

      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.2}px Georgia,serif`
        ctx.fillStyle = hexToRgba(s.accentColor, 0.2)
        ctx.fillText('\u201C', w * 0.06, h * 0.32)
      }
      ctx.fillStyle = s.accentColor; ctx.fillRect(w * 0.08, h * 0.38, w * 0.006, h * 0.28)

      const qs = s.quoteFontSize * (w / 1080)
      ctx.font = `bold ${qs}px Georgia,serif`
      ctx.fillStyle = '#fff'
      wrapText(ctx, s.quote, w * 0.1, h * 0.43, w * 0.82, qs * 1.35)

      ctx.strokeStyle = s.accentColor; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.73); ctx.lineTo(w * 0.35, h * 0.73); ctx.stroke()

      // Corner accents
      ctx.strokeStyle = s.accentColor; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(w * 0.88, h * 0.05); ctx.lineTo(w * 0.94, h * 0.05); ctx.lineTo(w * 0.94, h * 0.12); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(w * 0.06, h * 0.88); ctx.lineTo(w * 0.06, h * 0.95); ctx.lineTo(w * 0.13, h * 0.95); ctx.stroke()

      if (s.showBrand) {
        ctx.font = `${w * 0.022}px Arial`
        ctx.fillStyle = hexToRgba(s.accentColor, 0.85)
        ctx.textAlign = 'right'; ctx.fillText(s.brand, w * 0.92, h * 0.93); ctx.textAlign = 'left'
      }

      const pfpInfo = drawPfp(ctx, w, h, s)
      if (pfpInfo) {
        const { cx, cy, r, bw } = pfpInfo
        const sc = w / 1080
        const fs = Math.max(18, 26 * sc)
        ctx.font = `700 ${fs}px 'Montserrat', Arial`
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.fillText('— ' + s.author, cx, cy + r + bw + 28 * sc)
        ctx.textAlign = 'left'
      } else {
        ctx.font = `600 ${w * 0.036}px Arial`
        ctx.fillStyle = '#fff'
        ctx.fillText('— ' + s.author, w * 0.1, h * 0.785)
      }
      drawPlatformIcon(ctx, w, h, s, getImg)
    }
  },
  {
    id: 1, name: 'Royal Border',
    render(ctx, w, h, s, getImg) {
      ctx.fillStyle = '#0d0820'; ctx.fillRect(0, 0, w, h)
      drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity)
      drawOverlay(ctx, w, h, s.darkOverlay, s.overlayOpacity)

      const bw2 = w * 0.04
      ctx.strokeStyle = s.accentColor; ctx.lineWidth = bw2 * 0.32
      ctx.strokeRect(bw2, bw2, w - bw2 * 2, h - bw2 * 2)

      [[bw2, bw2], [w - bw2, bw2], [bw2, h - bw2], [w - bw2, h - bw2]].forEach(([x, y]) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4)
        ctx.fillStyle = s.accentColor; ctx.fillRect(-9, -9, 18, 18)
        ctx.restore()
      })

      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.13}px serif`
        ctx.fillStyle = hexToRgba(s.accentColor, 0.28)
        ctx.textAlign = 'center'; ctx.fillText('\u201C', w * 0.5, h * 0.3); ctx.textAlign = 'left'
      }

      const qs = s.quoteFontSize * (w / 1080)
      ctx.font = `italic bold ${qs}px Georgia,serif`
      ctx.fillStyle = '#fff'
      wrapText(ctx, s.quote, w * 0.13, h * 0.37, w * 0.74, qs * 1.4, 'center', w * 0.5)

      ctx.strokeStyle = s.accentColor; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(w * 0.4, h * 0.72); ctx.lineTo(w * 0.6, h * 0.72); ctx.stroke()

      if (s.showBrand) {
        ctx.font = `${w * 0.021}px Arial`
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.textAlign = 'center'; ctx.fillText(s.brand, w * 0.5, h * 0.9); ctx.textAlign = 'left'
      }

      const pfpInfo = drawPfp(ctx, w, h, s)
      if (pfpInfo) {
        const { cx, cy, r, bw } = pfpInfo
        const sc = w / 1080; const fs = Math.max(18, 26 * sc)
        ctx.font = `700 ${fs}px Arial`; ctx.fillStyle = s.accentColor
        ctx.textAlign = 'center'; ctx.fillText(s.author, cx, cy + r + bw + 28 * sc); ctx.textAlign = 'left'
      } else {
        ctx.font = `${w * 0.034}px Arial`; ctx.fillStyle = s.accentColor
        ctx.textAlign = 'center'; ctx.fillText(s.author, w * 0.5, h * 0.785); ctx.textAlign = 'left'
      }
      drawPlatformIcon(ctx, w, h, s, getImg)
    }
  },
  {
    id: 2, name: 'Split Light',
    render(ctx, w, h, s, getImg) {
      const pc = s.accentColor === '#C9A84C' ? '#5B2D8E' : s.accentColor
      ctx.fillStyle = pc; ctx.fillRect(0, 0, w * 0.46, h)
      ctx.fillStyle = '#FFF8F0'; ctx.fillRect(w * 0.46, 0, w * 0.54, h)

      if (s.bgImage) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w * 0.5, h); ctx.clip()
        drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity)
        if (s.darkOverlay) { ctx.fillStyle = `rgba(0,0,0,${s.overlayOpacity / 100 * 0.75})`; ctx.fillRect(0, 0, w * 0.5, h) }
        ctx.restore()
      }

      // Diagonal slash
      ctx.fillStyle = pc; ctx.beginPath()
      ctx.moveTo(w * 0.41, 0); ctx.lineTo(w * 0.53, 0); ctx.lineTo(w * 0.39, h); ctx.lineTo(w * 0.27, h)
      ctx.closePath(); ctx.fill()

      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.19}px serif`; ctx.fillStyle = 'rgba(255,255,255,0.1)'
        ctx.fillText('\u201C', w * 0.04, h * 0.38)
      }
      const qs = s.quoteFontSize * 0.78 * (w / 1080)
      ctx.font = `bold ${qs}px Georgia,serif`; ctx.fillStyle = '#fff'
      wrapText(ctx, s.quote, w * 0.05, h * 0.3, w * 0.35, qs * 1.35)

      ctx.fillStyle = s.accentColor; ctx.fillRect(w * 0.55, h * 0.52, w * 0.1, 3)
      ctx.font = `bold ${w * 0.038}px Arial`; ctx.fillStyle = '#1A1A2E'
      ctx.fillText(s.author, w * 0.56, h * 0.48)
      ctx.font = `${w * 0.028}px Arial`; ctx.fillStyle = 'rgba(26,26,46,0.5)'
      ctx.fillText('Speaker / Author', w * 0.56, h * 0.57)

      if (s.showBrand) {
        ctx.font = `bold ${w * 0.026}px Arial`; ctx.fillStyle = pc
        ctx.fillText(s.brand, w * 0.56, h * 0.9)
      }
      drawPfp(ctx, w, h, s)
      drawPlatformIcon(ctx, w, h, s, getImg)
    }
  },
  {
    id: 3, name: 'Gradient Glow',
    render(ctx, w, h, s, getImg) {
      ctx.fillStyle = '#08041a'; ctx.fillRect(0, 0, w, h)
      drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity)
      drawOverlay(ctx, w, h, s.darkOverlay, s.overlayOpacity)

      const g1 = ctx.createRadialGradient(w * 0.2, h * 0.2, 0, w * 0.2, h * 0.2, w * 0.7)
      g1.addColorStop(0, hexToRgba('#5B2D8E', 0.65)); g1.addColorStop(1, 'transparent')
      ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h)

      const g2 = ctx.createRadialGradient(w * 0.8, h * 0.8, 0, w * 0.8, h * 0.8, w * 0.6)
      g2.addColorStop(0, hexToRgba(s.accentColor, 0.45)); g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      roundRect(ctx, w * 0.08, h * 0.2, w * 0.84, h * 0.58, 40)
      ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.stroke()

      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.1}px serif`; ctx.fillStyle = hexToRgba(s.accentColor, 0.55)
        ctx.fillText('\u201C', w * 0.11, h * 0.38)
        ctx.textAlign = 'right'; ctx.fillText('\u201D', w * 0.9, h * 0.64); ctx.textAlign = 'left'
      }

      const qs = s.quoteFontSize * 0.92 * (w / 1080)
      ctx.font = `bold ${qs}px Georgia,serif`; ctx.fillStyle = '#fff'
      wrapText(ctx, s.quote, w * 0.14, h * 0.38, w * 0.72, qs * 1.4, 'center', w * 0.5)

      ctx.strokeStyle = s.accentColor; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(w * 0.4, h * 0.68); ctx.lineTo(w * 0.6, h * 0.68); ctx.stroke()

      if (s.showBrand) {
        ctx.font = `${w * 0.022}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.35)'
        ctx.textAlign = 'center'; ctx.fillText(s.brand, w * 0.5, h * 0.93); ctx.textAlign = 'left'
      }

      const pfpInfo = drawPfp(ctx, w, h, s)
      if (pfpInfo) {
        const { cx, cy, r, bw } = pfpInfo; const sc = w / 1080
        ctx.font = `700 ${Math.max(18, 26 * sc)}px Arial`; ctx.fillStyle = s.accentColor
        ctx.textAlign = 'center'; ctx.fillText('— ' + s.author, cx, cy + r + bw + 28 * sc); ctx.textAlign = 'left'
      } else {
        ctx.font = `${w * 0.03}px Arial`; ctx.fillStyle = s.accentColor
        ctx.textAlign = 'center'; ctx.fillText('— ' + s.author, w * 0.5, h * 0.745); ctx.textAlign = 'left'
      }
      drawPlatformIcon(ctx, w, h, s, getImg)
    }
  },
  {
    id: 4, name: 'Minimalist',
    render(ctx, w, h, s, getImg) {
      ctx.fillStyle = '#F9F5FF'; ctx.fillRect(0, 0, w, h)
      if (s.bgImage) {
        ctx.save(); ctx.globalAlpha = (s.bgOpacity / 100) * 0.15
        drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, 100)
        ctx.restore()
      }

      const pc = s.accentColor === '#C9A84C' ? '#5B2D8E' : s.accentColor
      ctx.fillStyle = pc; ctx.fillRect(0, 0, w, h * 0.01)

      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.26}px Georgia,serif`
        ctx.fillStyle = hexToRgba(pc, 0.07); ctx.fillText('\u201C', w * 0.05, h * 0.42)
      }

      const qs = s.quoteFontSize * 0.88 * (w / 1080)
      ctx.font = `bold ${qs}px Georgia,serif`; ctx.fillStyle = '#1A1A2E'
      wrapText(ctx, s.quote, w * 0.1, h * 0.33, w * 0.8, qs * 1.35)

      ctx.strokeStyle = pc; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.71); ctx.lineTo(w * 0.24, h * 0.71); ctx.stroke()

      if (s.showBrand) {
        ctx.font = `${w * 0.024}px Arial`; ctx.fillStyle = pc
        ctx.textAlign = 'right'; ctx.fillText(s.brand, w * 0.9, h * 0.93); ctx.textAlign = 'left'
      }

      const pfpInfo = drawPfp(ctx, w, h, s)
      if (pfpInfo) {
        const { cx, cy, r, bw } = pfpInfo; const sc = w / 1080
        ctx.font = `600 ${Math.max(18, 28 * sc)}px Arial`; ctx.fillStyle = '#1A1A2E'
        ctx.textAlign = 'center'; ctx.fillText(s.author, cx, cy + r + bw + 28 * sc); ctx.textAlign = 'left'
      } else {
        ctx.font = `600 ${w * 0.036}px Arial`; ctx.fillStyle = '#1A1A2E'
        ctx.fillText(s.author, w * 0.1, h * 0.775)
      }
      drawPlatformIcon(ctx, w, h, s, getImg)
    }
  },
  {
    id: 5, name: 'Photo Quote',
    render(ctx, w, h, s, getImg) {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#1a0a2e'); g.addColorStop(1, '#0d0520')
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity)

      const fade = ctx.createLinearGradient(0, h * 0.35, 0, h)
      fade.addColorStop(0, 'transparent'); fade.addColorStop(1, 'rgba(0,0,0,0.88)')
      ctx.fillStyle = fade; ctx.fillRect(0, 0, w, h)

      if (s.darkOverlay) {
        ctx.fillStyle = `rgba(0,0,0,${s.overlayOpacity / 200})`
        ctx.fillRect(0, 0, w, h * 0.55)
      }

      ctx.fillStyle = s.accentColor; ctx.fillRect(0, 0, w, h * 0.007)
      ctx.fillStyle = 'rgba(0,0,0,0.52)'
      roundRect(ctx, w * 0.07, h * 0.13, w * 0.86, h * 0.54, 18); ctx.fill()
      ctx.strokeStyle = hexToRgba(s.accentColor, 0.5); ctx.lineWidth = 2; ctx.stroke()

      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.1}px serif`; ctx.fillStyle = s.accentColor
        ctx.fillText('\u201C', w * 0.1, h * 0.32)
      }

      const qs = s.quoteFontSize * 0.9 * (w / 1080)
      ctx.font = `bold ${qs}px Georgia,serif`; ctx.fillStyle = '#fff'
      wrapText(ctx, s.quote, w * 0.12, h * 0.33, w * 0.74, qs * 1.35)

      ctx.fillStyle = s.accentColor; ctx.fillRect(w * 0.07, h * 0.73, w * 0.16, 4)

      if (s.showBrand) {
        ctx.font = `${w * 0.023}px Arial`; ctx.fillStyle = hexToRgba(s.accentColor, 0.9)
        ctx.textAlign = 'right'; ctx.fillText(s.brand, w * 0.93, h * 0.94); ctx.textAlign = 'left'
      }

      const pfpInfo = drawPfp(ctx, w, h, s)
      if (pfpInfo) {
        const { cx, cy, r, bw } = pfpInfo; const sc = w / 1080
        ctx.font = `bold ${Math.max(18, 26 * sc)}px Arial`; ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'; ctx.fillText('— ' + s.author, cx, cy + r + bw + 28 * sc); ctx.textAlign = 'left'
      } else {
        ctx.font = `bold ${w * 0.036}px Arial`; ctx.fillStyle = '#fff'
        ctx.fillText(s.author, w * 0.07, h * 0.79)
      }
      drawPlatformIcon(ctx, w, h, s, getImg)
    }
  },
]

// ── DEFAULT STATE ──────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  templateId: 0,
  quote: '"The Kingdom is built on principles, not feelings."',
  author: 'Lady Adel',
  brand: 'IWC Concepts',
  accentColor: '#C9A84C',
  borderColor: '#C9A84C',
  canvasW: 1080, canvasH: 1080,
  platform: 'instagram',
  showQuoteMarks: true, showBrand: true, darkOverlay: true,
  showProfile: true, showPlatform: true,
  overlayOpacity: 62, quoteFontSize: 44,
  bgOpacity: 100,
  bgX: 0, bgY: 0, bgZoom: 100,
  pfpSize: 130, pfpX: 65, pfpY: 68, pfpBorderW: 7,
  pfpImgX: 0, pfpImgY: 0, pfpImgZoom: 100,
  platX: 5, platY: 5, platSize: 80, platOpacity: 90,
  bgImage: null, pfpImage: null,
  bgPreview: null, pfpPreview: null,
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function QuoteCardStudio() {
  const navigate = useNavigate()
  const [state, setState] = useState({ ...DEFAULT_STATE })
  const [iconsLoaded, setIconsLoaded] = useState(false)
  const [activeExport, setActiveExport] = useState(0)
  const canvasRef = useRef(null)
  const thumbCanvases = useRef([])

  const set = (key, val) => setState(prev => ({ ...prev, [key]: val }))
  const setMulti = (obj) => setState(prev => ({ ...prev, ...obj }))

  // Preload platform images
  useEffect(() => {
    preloadPlatformImages().then(() => setIconsLoaded(true))
  }, [])

  // Re-render canvas when state changes
  useEffect(() => {
    renderCanvas()
  }, [state, iconsLoaded])

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = state.canvasW
    canvas.height = state.canvasH
    const ctx = canvas.getContext('2d')
    TEMPLATES[state.templateId].render(ctx, state.canvasW, state.canvasH, state, getPlatformImage)
  }, [state, iconsLoaded])

  // Render thumbnails after templates load
  useEffect(() => {
    const timer = setTimeout(() => {
      TEMPLATES.forEach((_, i) => renderThumb(i))
    }, 200)
    return () => clearTimeout(timer)
  }, [iconsLoaded])

  function renderThumb(i) {
    const canvas = thumbCanvases.current[i]
    if (!canvas) return
    canvas.width = 200; canvas.height = 200
    const ctx = canvas.getContext('2d')
    const thumbState = {
      ...DEFAULT_STATE,
      quote: '"Faith. Business. Impact."',
      author: 'Lady Adel',
      templateId: i,
      canvasW: 200, canvasH: 200,
    }
    try { TEMPLATES[i].render(ctx, 200, 200, thumbState, getPlatformImage) } catch (e) {}
  }

  function handleBgUpload(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => setMulti({ bgImage: img, bgPreview: ev.target.result })
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function handlePfpUpload(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => setMulti({ pfpImage: img, pfpPreview: ev.target.result, showProfile: true })
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function downloadCard() {
    const canvas = canvasRef.current
    const a = document.createElement('a')
    a.download = `IWC-QuoteCard-${Date.now()}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  function resetAll() {
    setState({ ...DEFAULT_STATE })
    setActiveExport(0)
  }

  const panelStyle = {
    background: '#120b22',
    overflowY: 'auto',
    padding: 16,
    height: '100%',
  }

  const secStyle = { marginBottom: 18 }
  const dividerStyle = { height: 1, background: 'rgba(255,255,255,0.07)', margin: '14px 0' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f0a1a' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1a0d2e, #2d1654)',
        borderBottom: '2px solid #C9A84C',
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
          >
            ← Dashboard
          </button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#C9A84C,#e8c060)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 15, color: '#1A1A2E' }}>IW</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Quote Card Studio</div>
              <div style={{ fontSize: 8, color: '#C9A84C', letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={resetAll} style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, background: 'transparent', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white' }}
          >↺ Reset</button>
          <button onClick={downloadCard} style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#C9A84C,#e8c060)', border: 'none', borderRadius: 8, color: '#1A1A2E', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(201,168,76,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >⬇ Download PNG</button>
        </div>
      </header>

      {/* 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 270px', flex: 1, overflow: 'hidden' }}>

        {/* LEFT PANEL */}
        <div style={{ ...panelStyle, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Templates */}
          <div style={secStyle}>
            <SecTitle>Templates</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TEMPLATES.map((t, i) => (
                <div key={i}
                  onClick={() => set('templateId', i)}
                  style={{
                    borderRadius: 8, overflow: 'hidden',
                    border: `2px solid ${state.templateId === i ? '#C9A84C' : 'transparent'}`,
                    cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s',
                    aspectRatio: '1', position: 'relative',
                    transform: state.templateId === i ? 'scale(1.02)' : 'scale(1)',
                  }}
                  onMouseEnter={e => { if (state.templateId !== i) e.currentTarget.style.transform = 'scale(1.04)' }}
                  onMouseLeave={e => { if (state.templateId !== i) e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <canvas ref={el => thumbCanvases.current[i] = el} style={{ width: '100%', height: '100%', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.75)', fontSize: 8, fontWeight: 700, textAlign: 'center', padding: 4 }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Images */}
          <div style={secStyle}>
            <SecTitle>Images</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <UploadZone label="Background" icon="🖼" onUpload={handleBgUpload}
                previewSrc={state.bgPreview}
                onRemove={() => setMulti({ bgImage: null, bgPreview: null })} />
              <UploadZone label="Profile Photo" icon="👤" onUpload={handlePfpUpload}
                previewSrc={state.pfpPreview}
                onRemove={() => setMulti({ pfpImage: null, pfpPreview: null })} />
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Text */}
          <div style={secStyle}>
            <SecTitle>Text Content</SecTitle>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Quote</label>
              <textarea rows={3} value={state.quote} onChange={e => set('quote', e.target.value)} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Author / Speaker</label>
              <input type="text" value={state.author} onChange={e => set('author', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Brand Tag</label>
              <input type="text" value={state.brand} onChange={e => set('brand', e.target.value)} />
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Accent Colour */}
          <div style={secStyle}>
            <SecTitle>Accent Colour</SecTitle>
            <ColorSwatchRow colors={ACCENT_COLORS} value={state.accentColor} onChange={c => set('accentColor', c)} />
          </div>

          <div style={dividerStyle} />

          {/* Options */}
          <div style={secStyle}>
            <SecTitle>Options</SecTitle>
            <ToggleRow label="Quote Marks" checked={state.showQuoteMarks} onChange={e => set('showQuoteMarks', e.target.checked)} />
            <ToggleRow label="Brand Tag" checked={state.showBrand} onChange={e => set('showBrand', e.target.checked)} />
            <ToggleRow label="Dark Overlay" checked={state.darkOverlay} onChange={e => set('darkOverlay', e.target.checked)} />
            <ToggleRow label="Profile Circle" checked={state.showProfile} onChange={e => set('showProfile', e.target.checked)} />
            <ToggleRow label="Platform Icon" checked={state.showPlatform} onChange={e => set('showPlatform', e.target.checked)} />
            <RangeCtrl label="Overlay Opacity" value={state.overlayOpacity} min={5} max={95} onChange={e => set('overlayOpacity', +e.target.value)} />
            <RangeCtrl label="Background Image Opacity" value={state.bgOpacity} min={5} max={100} onChange={e => set('bgOpacity', +e.target.value)} />
            <RangeCtrl label="Quote Font Size" value={state.quoteFontSize} min={22} max={72} onChange={e => set('quoteFontSize', +e.target.value)} />
            <RangeCtrl label="Profile Circle Size" value={state.pfpSize} min={60} max={240} onChange={e => set('pfpSize', +e.target.value)} />
          </div>
        </div>

        {/* CENTER */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at 50% 40%, #1e1040, #0a061a)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              style={{
                display: 'block', borderRadius: 3,
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.7)',
                maxWidth: 'min(540px, calc(100vw - 620px))',
                maxHeight: 'calc(100vh - 120px)',
              }}
            />
            <div style={{
              position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)',
              fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, whiteSpace: 'nowrap',
            }}>
              {state.canvasW} × {state.canvasH} px
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ ...panelStyle, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Export Size */}
          <div style={secStyle}>
            <SecTitle>Export Size</SecTitle>
            {EXPORT_SIZES.map((sz, i) => (
              <button key={i} onClick={() => {
                setActiveExport(i)
                setMulti({ canvasW: sz.w, canvasH: sz.h })
              }} style={{
                background: activeExport === i ? 'rgba(91,45,142,0.4)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeExport === i ? '#5B2D8E' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 7, padding: '7px 10px', color: 'white', cursor: 'pointer',
                fontSize: 10, fontWeight: 600, textAlign: 'left', width: '100%',
                marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s',
              }}>
                <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.1)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>▪</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{sz.l}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>{sz.d}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={dividerStyle} />

          {/* Platform Icon */}
          <div style={secStyle}>
            <SecTitle>Platform Icon</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 10 }}>
              {SOCIAL_PLATFORMS.map(plat => (
                <div key={plat.id} onClick={() => set('platform', plat.id)}
                  style={{
                    borderRadius: 7, padding: '5px 3px', textAlign: 'center', cursor: 'pointer',
                    border: `2px solid ${state.platform === plat.id ? '#C9A84C' : 'transparent'}`,
                    background: state.platform === plat.id ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (state.platform !== plat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                  onMouseLeave={e => { if (state.platform !== plat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                >
                  <img src={svgToDataUri(PLATFORM_SVG[plat.id] || PLATFORM_SVG.none)} width={28} height={28} style={{ borderRadius: 6 }} alt={plat.label} />
                  <span style={{ fontSize: 6.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{plat.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <RangeCtrl label="Icon X %" value={state.platX} min={2} max={90} small onChange={e => set('platX', +e.target.value)} />
              <RangeCtrl label="Icon Y %" value={state.platY} min={2} max={90} small onChange={e => set('platY', +e.target.value)} />
              <RangeCtrl label="Icon Size" value={state.platSize} min={40} max={200} small onChange={e => set('platSize', +e.target.value)} />
              <RangeCtrl label="Opacity" value={state.platOpacity} min={20} max={100} small onChange={e => set('platOpacity', +e.target.value)} />
            </div>
          </div>

          <div style={dividerStyle} />

          {/* BG Image Position */}
          <div style={secStyle}>
            <SecTitle>BG Image Position</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <RangeCtrl label="X Offset %" value={state.bgX} min={-50} max={50} small onChange={e => set('bgX', +e.target.value)} />
              <RangeCtrl label="Y Offset %" value={state.bgY} min={-50} max={50} small onChange={e => set('bgY', +e.target.value)} />
              <RangeCtrl label="Zoom" value={state.bgZoom} min={80} max={200} small onChange={e => set('bgZoom', +e.target.value)} />
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Profile Position */}
          <div style={secStyle}>
            <SecTitle>Profile Position</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <RangeCtrl label="Circle X %" value={state.pfpX} min={0} max={90} small onChange={e => set('pfpX', +e.target.value)} />
              <RangeCtrl label="Circle Y %" value={state.pfpY} min={0} max={85} small onChange={e => set('pfpY', +e.target.value)} />
            </div>
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Image within circle</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <RangeCtrl label="Img Pan X" value={state.pfpImgX} min={-200} max={200} small onChange={e => set('pfpImgX', +e.target.value)} />
                <RangeCtrl label="Img Pan Y" value={state.pfpImgY} min={-200} max={200} small onChange={e => set('pfpImgY', +e.target.value)} />
                <RangeCtrl label="Img Zoom %" value={state.pfpImgZoom} min={50} max={300} small onChange={e => set('pfpImgZoom', +e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Border Colour</label>
              <ColorSwatchRow colors={BORDER_COLORS} value={state.borderColor} onChange={c => set('borderColor', c)} />
            </div>
            <div style={{ marginTop: 8 }}>
              <RangeCtrl label="Border Width" value={state.pfpBorderW} min={0} max={20} small onChange={e => set('pfpBorderW', +e.target.value)} />
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Platform Guide */}
          <div style={secStyle}>
            <SecTitle>Platform Guide</SecTitle>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', lineHeight: 2.2 }}>
              {[
                ['📸', 'Instagram', '1080×1080 / 1080×1920'],
                ['📘', 'Facebook', '1080×1080 / 1200×630'],
                ['▶', 'YouTube', '1280×720 thumbnail'],
                ['🎵', 'TikTok', '1080×1920'],
                ['💼', 'LinkedIn', '1200×627'],
                ['🎙', 'Podcast', '3000×3000 cover'],
              ].map(([icon, name, dims]) => (
                <div key={name}>{icon} <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{name}</strong> {dims}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
