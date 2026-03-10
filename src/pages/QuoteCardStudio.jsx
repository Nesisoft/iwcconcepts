import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACCENT_COLORS, BORDER_COLORS, EXPORT_SIZES } from '../utils/constants'
import { SOCIAL_PLATFORMS, PLATFORM_SVG, svgToDataUri, preloadPlatformImages, getPlatformImage } from '../utils/platformIcons'
import { hexToRgba, roundRect, wrapText, drawBg, drawOverlay, drawPfp, drawPlatformIcon } from '../utils/canvasHelpers'

// ── Tiny shared UI ─────────────────────────────────────────────────────────
function SecTitle({ children, color = '#C9A84C' }) {
  return (
    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: `${color}33` }} />
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
      <span>{label}</span>
      <label style={{ position: 'relative', width: 34, height: 18, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: checked ? '#C9A84C' : 'rgba(255,255,255,0.2)', borderRadius: 20, transition: 'background 0.3s' }}>
          <div style={{ position: 'absolute', width: 12, height: 12, left: checked ? 19 : 3, top: 3, background: 'white', borderRadius: '50%', transition: 'left 0.3s' }} />
        </div>
      </label>
    </div>
  )
}

function Slider({ label, value, min, max, onChange, small }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: small ? 5 : 8 }}>
      {label && <label style={{ fontSize: small ? 9 : 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="range" min={min} max={max} value={value} onChange={onChange} style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', width: 28, textAlign: 'right', flexShrink: 0 }}>{value}</span>
      </div>
    </div>
  )
}

function SwatchRow({ colors, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {colors.map(({ c, n }) => (
        <div key={c} title={n || c} onClick={() => onChange(c)} style={{
          width: 26, height: 26, borderRadius: 5, background: c,
          border: `2px solid ${value === c ? 'white' : c === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
          cursor: 'pointer', transform: value === c ? 'scale(1.12)' : 'scale(1)',
          boxShadow: value === c ? '0 0 0 2px rgba(255,255,255,0.25)' : 'none',
          transition: 'transform 0.15s',
        }} />
      ))}
    </div>
  )
}

function UploadZone({ label, icon, onUpload, previewSrc, onRemove }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      {previewSrc ? (
        <div style={{ position: 'relative' }}>
          <img src={previewSrc} alt="" style={{ width: '100%', borderRadius: 6, display: 'block', objectFit: 'cover', maxHeight: 70 }} />
          <button onClick={onRemove} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.75)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', width: 18, height: 18, fontSize: 11, lineHeight: '18px', textAlign: 'center' }}>✕</button>
        </div>
      ) : (
        <label style={{ display: 'block', border: '2px dashed rgba(201,168,76,0.35)', borderRadius: 9, padding: 12, textAlign: 'center', cursor: 'pointer', background: 'rgba(201,168,76,0.04)', transition: 'all 0.2s' }}
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
// Each template draws author at its natural position PLUS the user-set offsets.
// Decorative elements (lines, rects) also shift with the author position.

const TEMPLATES = [
  {
    id: 0, name: 'Dark Quote',
    render(ctx, w, h, s) {
      ctx.save()
      // Background
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#0d0520'); g.addColorStop(1, '#1a0a35')
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity)
      drawOverlay(ctx, w, h, s.darkOverlay, s.overlayOpacity)

      // Accent radial glow
      const gl = ctx.createRadialGradient(w * 0.72, h * 0.28, 0, w * 0.72, h * 0.28, w * 0.5)
      gl.addColorStop(0, hexToRgba(s.accentColor, 0.14)); gl.addColorStop(1, 'transparent')
      ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h)

      // Opening quote mark
      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.2}px Georgia, serif`
        ctx.fillStyle = hexToRgba(s.accentColor, 0.2)
        ctx.textAlign = 'left'
        ctx.fillText('\u201C', w * 0.06, h * 0.32)
      }

      // Left accent bar
      ctx.fillStyle = s.accentColor
      ctx.fillRect(w * 0.08, h * 0.38, w * 0.006, h * 0.28)

      // Quote text
      const qs = s.quoteFontSize * (w / 1080)
      ctx.font = `bold ${qs}px Georgia, serif`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      wrapText(ctx, s.quote, w * 0.1, h * 0.43, w * 0.82, qs * 1.35)

      // Author name at natural position + user offset
      const ax = w * 0.1 + s.authorOffsetX / 100 * w
      const ay = h * 0.785 + s.authorOffsetY / 100 * h
      const afs = s.authorFontSize * (w / 1080)

      // Accent line decoration above author
      ctx.strokeStyle = s.accentColor; ctx.lineWidth = Math.max(2, 3 * (w / 1080))
      ctx.beginPath()
      ctx.moveTo(ax, ay - afs * 1.1)
      ctx.lineTo(ax + w * 0.25, ay - afs * 1.1)
      ctx.stroke()

      ctx.font = `600 ${afs}px Arial, sans-serif`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.fillText('— ' + s.author, ax, ay)

      // Brand tag
      if (s.showBrand) {
        ctx.font = `${w * 0.022}px Arial`
        ctx.fillStyle = hexToRgba(s.accentColor, 0.85)
        ctx.textAlign = 'right'
        ctx.fillText(s.brand, w * 0.92, h * 0.93)
        ctx.textAlign = 'left'
      }

      // Corner accents
      ctx.strokeStyle = s.accentColor; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(w * 0.88, h * 0.05); ctx.lineTo(w * 0.94, h * 0.05); ctx.lineTo(w * 0.94, h * 0.12); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(w * 0.06, h * 0.88); ctx.lineTo(w * 0.06, h * 0.95); ctx.lineTo(w * 0.13, h * 0.95); ctx.stroke()

      drawPfp(ctx, w, h, s)
      drawPlatformIcon(ctx, w, h, s, getPlatformImage)
      ctx.restore()
    }
  },

  {
    id: 1, name: 'Royal Border',
    render(ctx, w, h, s) {
      ctx.save()
      // Dark background
      ctx.fillStyle = '#0d0820'
      ctx.fillRect(0, 0, w, h)
      drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity)
      drawOverlay(ctx, w, h, s.darkOverlay, s.overlayOpacity)

      // Border rectangle
      const bInset = w * 0.04
      ctx.strokeStyle = s.accentColor
      ctx.lineWidth = Math.max(1, bInset * 0.32)
      ctx.strokeRect(bInset, bInset, w - bInset * 2, h - bInset * 2)

      // Corner diamond ornaments — drawn without ctx.rotate to avoid any state issues
      const dSize = Math.max(8, 10 * (w / 1080))
      const corners = [[bInset, bInset], [w - bInset, bInset], [bInset, h - bInset], [w - bInset, h - bInset]]
      ctx.fillStyle = s.accentColor
      corners.forEach(([cx2, cy2]) => {
        ctx.beginPath()
        ctx.moveTo(cx2, cy2 - dSize)
        ctx.lineTo(cx2 + dSize, cy2)
        ctx.lineTo(cx2, cy2 + dSize)
        ctx.lineTo(cx2 - dSize, cy2)
        ctx.closePath()
        ctx.fill()
      })

      // Opening quote mark
      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.13}px serif`
        ctx.fillStyle = hexToRgba(s.accentColor, 0.28)
        ctx.textAlign = 'center'
        ctx.fillText('\u201C', w * 0.5, h * 0.3)
        ctx.textAlign = 'left'
      }

      // Quote text — italic bold centered
      const qs = s.quoteFontSize * (w / 1080)
      ctx.font = `italic bold ${qs}px Georgia, serif`
      ctx.fillStyle = '#ffffff'
      wrapText(ctx, s.quote, w * 0.13, h * 0.37, w * 0.74, qs * 1.4, 'center', w * 0.5)

      // Author name at natural centered position + user offset
      const ax = w * 0.5 + s.authorOffsetX / 100 * w
      const ay = h * 0.785 + s.authorOffsetY / 100 * h
      const afs = s.authorFontSize * (w / 1080)

      // Short horizontal line decoration
      ctx.strokeStyle = s.accentColor
      ctx.lineWidth = Math.max(2, 3 * (w / 1080))
      ctx.beginPath()
      ctx.moveTo(ax - w * 0.1, ay - afs * 1.15)
      ctx.lineTo(ax + w * 0.1, ay - afs * 1.15)
      ctx.stroke()

      ctx.font = `${afs}px Arial, sans-serif`
      ctx.fillStyle = s.accentColor
      ctx.textAlign = 'center'
      ctx.fillText(s.author, ax, ay)
      ctx.textAlign = 'left'

      // Brand
      if (s.showBrand) {
        ctx.font = `${w * 0.021}px Arial`
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.textAlign = 'center'
        ctx.fillText(s.brand, w * 0.5, h * 0.9)
        ctx.textAlign = 'left'
      }

      drawPfp(ctx, w, h, s)
      drawPlatformIcon(ctx, w, h, s, getPlatformImage)
      ctx.restore()
    }
  },

  {
    id: 2, name: 'Split Light',
    render(ctx, w, h, s) {
      ctx.save()
      const pc = s.accentColor === '#C9A84C' ? '#5B2D8E' : s.accentColor
      ctx.fillStyle = pc; ctx.fillRect(0, 0, w * 0.46, h)
      ctx.fillStyle = '#FFF8F0'; ctx.fillRect(w * 0.46, 0, w * 0.54, h)

      // Bg on left half only
      if (s.bgImage) {
        ctx.save()
        ctx.beginPath(); ctx.rect(0, 0, w * 0.5, h); ctx.clip()
        drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity)
        if (s.darkOverlay) {
          ctx.fillStyle = `rgba(0,0,0,${s.overlayOpacity / 100 * 0.75})`
          ctx.fillRect(0, 0, w * 0.5, h)
        }
        ctx.restore()
      }

      // Diagonal slash
      ctx.fillStyle = pc
      ctx.beginPath()
      ctx.moveTo(w * 0.41, 0); ctx.lineTo(w * 0.53, 0)
      ctx.lineTo(w * 0.39, h); ctx.lineTo(w * 0.27, h)
      ctx.closePath(); ctx.fill()

      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.19}px serif`
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        ctx.textAlign = 'left'
        ctx.fillText('\u201C', w * 0.04, h * 0.38)
      }

      const qs = s.quoteFontSize * 0.78 * (w / 1080)
      ctx.font = `bold ${qs}px Georgia, serif`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      wrapText(ctx, s.quote, w * 0.05, h * 0.3, w * 0.35, qs * 1.35)

      // Author on right side
      const ax = w * 0.56 + s.authorOffsetX / 100 * w
      const ay = h * 0.48 + s.authorOffsetY / 100 * h
      const afs = s.authorFontSize * (w / 1080)

      ctx.font = `bold ${afs * 1.05}px Arial, sans-serif`
      ctx.fillStyle = '#1A1A2E'
      ctx.textAlign = 'left'
      ctx.fillText(s.author, ax, ay)

      ctx.font = `${afs * 0.75}px Arial`
      ctx.fillStyle = 'rgba(26,26,46,0.5)'
      ctx.fillText('Speaker / Author', ax, ay + afs * 1.1)

      // Accent line below author subtitle
      ctx.fillStyle = s.accentColor
      ctx.fillRect(ax, ay + afs * 1.4, w * 0.1, Math.max(2, 3 * (w / 1080)))

      if (s.showBrand) {
        ctx.font = `bold ${w * 0.026}px Arial`
        ctx.fillStyle = pc
        ctx.fillText(s.brand, ax, h * 0.9)
      }

      drawPfp(ctx, w, h, s)
      drawPlatformIcon(ctx, w, h, s, getPlatformImage)
      ctx.restore()
    }
  },

  {
    id: 3, name: 'Gradient Glow',
    render(ctx, w, h, s) {
      ctx.save()
      ctx.fillStyle = '#08041a'; ctx.fillRect(0, 0, w, h)
      drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity)
      drawOverlay(ctx, w, h, s.darkOverlay, s.overlayOpacity)

      const g1 = ctx.createRadialGradient(w * 0.2, h * 0.2, 0, w * 0.2, h * 0.2, w * 0.7)
      g1.addColorStop(0, hexToRgba('#5B2D8E', 0.65)); g1.addColorStop(1, 'transparent')
      ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h)

      const g2 = ctx.createRadialGradient(w * 0.8, h * 0.8, 0, w * 0.8, h * 0.8, w * 0.6)
      g2.addColorStop(0, hexToRgba(s.accentColor, 0.45)); g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h)

      // Frosted card
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      roundRect(ctx, w * 0.08, h * 0.2, w * 0.84, h * 0.58, 40)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.stroke()

      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.1}px serif`
        ctx.fillStyle = hexToRgba(s.accentColor, 0.55)
        ctx.textAlign = 'left'; ctx.fillText('\u201C', w * 0.11, h * 0.38)
        ctx.textAlign = 'right'; ctx.fillText('\u201D', w * 0.9, h * 0.64)
        ctx.textAlign = 'left'
      }

      const qs = s.quoteFontSize * 0.92 * (w / 1080)
      ctx.font = `bold ${qs}px Georgia, serif`
      ctx.fillStyle = '#ffffff'
      wrapText(ctx, s.quote, w * 0.14, h * 0.38, w * 0.72, qs * 1.4, 'center', w * 0.5)

      // Author at natural centered position + offset
      const ax = w * 0.5 + s.authorOffsetX / 100 * w
      const ay = h * 0.745 + s.authorOffsetY / 100 * h
      const afs = s.authorFontSize * (w / 1080)

      // Short line decoration
      ctx.strokeStyle = s.accentColor; ctx.lineWidth = Math.max(2, 2 * (w / 1080))
      ctx.beginPath()
      ctx.moveTo(ax - w * 0.1, ay - afs * 1.15)
      ctx.lineTo(ax + w * 0.1, ay - afs * 1.15)
      ctx.stroke()

      ctx.font = `${afs}px Arial, sans-serif`
      ctx.fillStyle = s.accentColor
      ctx.textAlign = 'center'
      ctx.fillText('— ' + s.author, ax, ay)
      ctx.textAlign = 'left'

      if (s.showBrand) {
        ctx.font = `${w * 0.022}px Arial`
        ctx.fillStyle = 'rgba(255,255,255,0.35)'
        ctx.textAlign = 'center'
        ctx.fillText(s.brand, w * 0.5, h * 0.93)
        ctx.textAlign = 'left'
      }

      drawPfp(ctx, w, h, s)
      drawPlatformIcon(ctx, w, h, s, getPlatformImage)
      ctx.restore()
    }
  },

  {
    id: 4, name: 'Minimalist',
    render(ctx, w, h, s) {
      ctx.save()
      ctx.fillStyle = '#F9F5FF'; ctx.fillRect(0, 0, w, h)
      if (s.bgImage) {
        ctx.save(); ctx.globalAlpha = (s.bgOpacity / 100) * 0.12
        drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, 100)
        ctx.restore()
      }

      const pc = s.accentColor === '#C9A84C' ? '#5B2D8E' : s.accentColor
      ctx.fillStyle = pc; ctx.fillRect(0, 0, w, h * 0.01)

      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.26}px Georgia, serif`
        ctx.fillStyle = hexToRgba(pc, 0.07)
        ctx.textAlign = 'left'
        ctx.fillText('\u201C', w * 0.05, h * 0.42)
      }

      const qs = s.quoteFontSize * 0.88 * (w / 1080)
      ctx.font = `bold ${qs}px Georgia, serif`
      ctx.fillStyle = '#1A1A2E'
      ctx.textAlign = 'left'
      wrapText(ctx, s.quote, w * 0.1, h * 0.33, w * 0.8, qs * 1.35)

      // Author at natural position + offset
      const ax = w * 0.1 + s.authorOffsetX / 100 * w
      const ay = h * 0.775 + s.authorOffsetY / 100 * h
      const afs = s.authorFontSize * (w / 1080)

      // Thick accent line
      ctx.strokeStyle = pc
      ctx.lineWidth = Math.max(3, 4 * (w / 1080))
      ctx.lineCap = 'square'
      ctx.beginPath()
      ctx.moveTo(ax, ay - afs * 1.15)
      ctx.lineTo(ax + w * 0.14, ay - afs * 1.15)
      ctx.stroke()

      ctx.font = `600 ${afs}px Arial, sans-serif`
      ctx.fillStyle = '#1A1A2E'
      ctx.textAlign = 'left'
      ctx.fillText(s.author, ax, ay)

      if (s.showBrand) {
        ctx.font = `${w * 0.024}px Arial`
        ctx.fillStyle = pc
        ctx.textAlign = 'right'
        ctx.fillText(s.brand, w * 0.9, h * 0.93)
        ctx.textAlign = 'left'
      }

      drawPfp(ctx, w, h, s)
      drawPlatformIcon(ctx, w, h, s, getPlatformImage)
      ctx.restore()
    }
  },

  {
    id: 5, name: 'Photo Quote',
    render(ctx, w, h, s) {
      ctx.save()
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#1a0a2e'); g.addColorStop(1, '#0d0520')
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)

      drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity)

      // Bottom fade
      const fade = ctx.createLinearGradient(0, h * 0.35, 0, h)
      fade.addColorStop(0, 'transparent'); fade.addColorStop(1, 'rgba(0,0,0,0.88)')
      ctx.fillStyle = fade; ctx.fillRect(0, 0, w, h)

      if (s.darkOverlay) {
        ctx.fillStyle = `rgba(0,0,0,${s.overlayOpacity / 200})`
        ctx.fillRect(0, 0, w, h * 0.55)
      }

      // Top accent line
      ctx.fillStyle = s.accentColor; ctx.fillRect(0, 0, w, h * 0.007)

      // Quote card box
      ctx.fillStyle = 'rgba(0,0,0,0.52)'
      roundRect(ctx, w * 0.07, h * 0.13, w * 0.86, h * 0.54, 18); ctx.fill()
      ctx.strokeStyle = hexToRgba(s.accentColor, 0.5); ctx.lineWidth = 2; ctx.stroke()

      if (s.showQuoteMarks) {
        ctx.font = `bold ${w * 0.1}px serif`
        ctx.fillStyle = s.accentColor
        ctx.textAlign = 'left'
        ctx.fillText('\u201C', w * 0.1, h * 0.32)
      }

      const qs = s.quoteFontSize * 0.9 * (w / 1080)
      ctx.font = `bold ${qs}px Georgia, serif`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      wrapText(ctx, s.quote, w * 0.12, h * 0.33, w * 0.74, qs * 1.35)

      // Author at natural position + offset
      const ax = w * 0.07 + s.authorOffsetX / 100 * w
      const ay = h * 0.79 + s.authorOffsetY / 100 * h
      const afs = s.authorFontSize * (w / 1080)

      // Thick accent bar decoration
      ctx.fillStyle = s.accentColor
      ctx.fillRect(ax, ay - afs * 1.3, w * 0.16, Math.max(3, 4 * (w / 1080)))

      ctx.font = `bold ${afs}px Arial, sans-serif`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.fillText(s.author, ax, ay)

      if (s.showBrand) {
        ctx.font = `${w * 0.023}px Arial`
        ctx.fillStyle = hexToRgba(s.accentColor, 0.9)
        ctx.textAlign = 'right'
        ctx.fillText(s.brand, w * 0.93, h * 0.94)
        ctx.textAlign = 'left'
      }

      drawPfp(ctx, w, h, s)
      drawPlatformIcon(ctx, w, h, s, getPlatformImage)
      ctx.restore()
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
  // Author name positioning
  authorOffsetX: 0, authorOffsetY: 0, authorFontSize: 36,
  bgImage: null, pfpImage: null,
  bgPreview: null, pfpPreview: null,
}

// ── COMPONENT ──────────────────────────────────────────────────────────────
export default function QuoteCardStudio() {
  const navigate = useNavigate()
  const [state, setState] = useState({ ...DEFAULT_STATE })
  const [iconsLoaded, setIconsLoaded] = useState(false)
  const [activeExport, setActiveExport] = useState(0)
  const canvasRef = useRef(null)
  const thumbRefs = useRef([])

  const set = (key, val) => setState(prev => ({ ...prev, [key]: val }))
  const setMany = obj => setState(prev => ({ ...prev, ...obj }))

  useEffect(() => { preloadPlatformImages().then(() => setIconsLoaded(true)) }, [])

  // Main canvas render
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = state.canvasW
    canvas.height = state.canvasH
    const ctx = canvas.getContext('2d')
    try {
      TEMPLATES[state.templateId].render(ctx, state.canvasW, state.canvasH, state)
    } catch (e) {
      console.error('QuoteCardStudio render error (template ' + state.templateId + '):', e)
    }
  }, [state, iconsLoaded])

  // Thumbnails
  useEffect(() => {
    const t = setTimeout(() => {
      TEMPLATES.forEach((_, i) => {
        const c = thumbRefs.current[i]
        if (!c) return
        c.width = 200; c.height = 200
        const thumbS = { ...DEFAULT_STATE, quote: '"Faith. Business. Impact."', author: 'Lady Adel', templateId: i, canvasW: 200, canvasH: 200 }
        try { TEMPLATES[i].render(c.getContext('2d'), 200, 200, thumbS) } catch (_) {}
      })
    }, 200)
    return () => clearTimeout(t)
  }, [iconsLoaded])

  function handleImg(key, previewKey, e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => setMany({ [key]: img, [previewKey]: ev.target.result, ...(key === 'pfpImage' ? { showProfile: true } : {}) })
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function downloadCard() {
    const a = document.createElement('a')
    a.download = `IWC-QuoteCard-${Date.now()}.png`
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }

  function resetAll() {
    setState({ ...DEFAULT_STATE })
    setActiveExport(0)
  }

  const panel = { background: '#120b22', overflowY: 'auto', padding: 16, height: '100%' }
  const divider = { height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 0' }
  const textInput = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 7, color: 'white', fontFamily: "'Montserrat',sans-serif",
    fontSize: 12, padding: '7px 10px', width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f0a1a' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#1a0d2e,#2d1654)', borderBottom: '2px solid #C9A84C', padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
          >← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#C9A84C,#e8c060)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 14, color: '#1A1A2E' }}>IW</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Quote Card Studio</div>
              <div style={{ fontSize: 8, color: '#C9A84C', letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={resetAll} style={{ padding: '7px 14px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, background: 'transparent', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white' }}
          >↺ Reset</button>
          <button onClick={downloadCard} style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#C9A84C,#e8c060)', border: 'none', borderRadius: 8, color: '#1A1A2E', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 16px rgba(201,168,76,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}
          >⬇ Download PNG</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 270px', flex: 1, overflow: 'hidden' }}>
        {/* ── LEFT PANEL ── */}
        <div style={{ ...panel, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Templates</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TEMPLATES.map((t, i) => (
                <div key={i} onClick={() => set('templateId', i)} style={{
                  borderRadius: 8, overflow: 'hidden', aspectRatio: '1', position: 'relative', cursor: 'pointer',
                  border: `2px solid ${state.templateId === i ? '#C9A84C' : 'transparent'}`,
                  transform: state.templateId === i ? 'scale(1.02)' : 'scale(1)',
                  transition: 'border-color 0.2s, transform 0.2s',
                }}
                  onMouseEnter={e => { if (state.templateId !== i) e.currentTarget.style.transform = 'scale(1.05)' }}
                  onMouseLeave={e => { if (state.templateId !== i) e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <canvas ref={el => thumbRefs.current[i] = el} style={{ width: '100%', height: '100%', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.78)', fontSize: 8, fontWeight: 700, textAlign: 'center', padding: 4 }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={divider} />
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Images</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <UploadZone label="Background" icon="🖼" onUpload={e => handleImg('bgImage', 'bgPreview', e)} previewSrc={state.bgPreview} onRemove={() => setMany({ bgImage: null, bgPreview: null })} />
              <UploadZone label="Profile Photo" icon="👤" onUpload={e => handleImg('pfpImage', 'pfpPreview', e)} previewSrc={state.pfpPreview} onRemove={() => setMany({ pfpImage: null, pfpPreview: null })} />
            </div>
          </div>

          <div style={divider} />
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Text Content</SecTitle>
            {[['Quote', 'quote', true], ['Author / Speaker', 'author', false], ['Brand Tag', 'brand', false]].map(([lbl, key, isTextarea]) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>{lbl}</label>
                {isTextarea
                  ? <textarea rows={3} value={state[key]} onChange={e => set(key, e.target.value)} style={textInput} />
                  : <input type="text" value={state[key]} onChange={e => set(key, e.target.value)} style={textInput} />
                }
              </div>
            ))}
          </div>

          <div style={divider} />
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Accent Colour</SecTitle>
            <SwatchRow colors={ACCENT_COLORS} value={state.accentColor} onChange={c => set('accentColor', c)} />
          </div>

          <div style={divider} />
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Options</SecTitle>
            {[['Quote Marks', 'showQuoteMarks'], ['Brand Tag', 'showBrand'], ['Dark Overlay', 'darkOverlay'], ['Profile Circle', 'showProfile'], ['Platform Icon', 'showPlatform']].map(([lbl, key]) => (
              <Toggle key={key} label={lbl} checked={state[key]} onChange={e => set(key, e.target.checked)} />
            ))}
            <Slider label="Overlay Opacity" value={state.overlayOpacity} min={5} max={95} onChange={e => set('overlayOpacity', +e.target.value)} />
            <Slider label="Background Image Opacity" value={state.bgOpacity} min={5} max={100} onChange={e => set('bgOpacity', +e.target.value)} />
            <Slider label="Quote Font Size" value={state.quoteFontSize} min={22} max={72} onChange={e => set('quoteFontSize', +e.target.value)} />
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 40%,#1e1040,#0a061a)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div style={{ position: 'relative' }}>
            <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 3, boxShadow: '0 0 0 1px rgba(255,255,255,0.06),0 30px 80px rgba(0,0,0,0.7)', maxWidth: 'min(540px,calc(100vw - 620px))', maxHeight: 'calc(100vh - 120px)' }} />
            <div style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, whiteSpace: 'nowrap' }}>{state.canvasW} × {state.canvasH} px</div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ ...panel, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Export Size</SecTitle>
            {EXPORT_SIZES.map((sz, i) => (
              <button key={i} onClick={() => { setActiveExport(i); setMany({ canvasW: sz.w, canvasH: sz.h }) }} style={{ background: activeExport === i ? 'rgba(91,45,142,0.4)' : 'rgba(255,255,255,0.05)', border: `1px solid ${activeExport === i ? '#5B2D8E' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, padding: '7px 10px', color: 'white', cursor: 'pointer', fontSize: 10, fontWeight: 600, textAlign: 'left', width: '100%', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.1)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>▪</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{sz.l}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>{sz.d}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={divider} />
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Platform Icon</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 10 }}>
              {SOCIAL_PLATFORMS.map(plat => (
                <div key={plat.id} onClick={() => set('platform', plat.id)} style={{ borderRadius: 7, padding: '5px 3px', textAlign: 'center', cursor: 'pointer', border: `2px solid ${state.platform === plat.id ? '#C9A84C' : 'transparent'}`, background: state.platform === plat.id ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all 0.2s' }}
                  onMouseEnter={e => { if (state.platform !== plat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                  onMouseLeave={e => { if (state.platform !== plat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                >
                  <img src={svgToDataUri(PLATFORM_SVG[plat.id] || PLATFORM_SVG.none)} width={28} height={28} style={{ borderRadius: 6 }} alt={plat.label} />
                  <span style={{ fontSize: 6.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{plat.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <Slider label="Icon X %" value={state.platX} min={2} max={90} small onChange={e => set('platX', +e.target.value)} />
              <Slider label="Icon Y %" value={state.platY} min={2} max={90} small onChange={e => set('platY', +e.target.value)} />
              <Slider label="Icon Size" value={state.platSize} min={40} max={200} small onChange={e => set('platSize', +e.target.value)} />
              <Slider label="Opacity" value={state.platOpacity} min={20} max={100} small onChange={e => set('platOpacity', +e.target.value)} />
            </div>
          </div>

          <div style={divider} />
          <div style={{ marginBottom: 16 }}>
            <SecTitle>BG Image Position</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <Slider label="X Offset %" value={state.bgX} min={-50} max={50} small onChange={e => set('bgX', +e.target.value)} />
              <Slider label="Y Offset %" value={state.bgY} min={-50} max={50} small onChange={e => set('bgY', +e.target.value)} />
              <Slider label="Zoom %" value={state.bgZoom} min={80} max={200} small onChange={e => set('bgZoom', +e.target.value)} />
            </div>
          </div>

          <div style={divider} />
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Profile Circle</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <Slider label="Circle X %" value={state.pfpX} min={0} max={90} small onChange={e => set('pfpX', +e.target.value)} />
              <Slider label="Circle Y %" value={state.pfpY} min={0} max={85} small onChange={e => set('pfpY', +e.target.value)} />
              <Slider label="Circle Size" value={state.pfpSize} min={60} max={240} small onChange={e => set('pfpSize', +e.target.value)} />
              <Slider label="Border Width" value={state.pfpBorderW} min={0} max={20} small onChange={e => set('pfpBorderW', +e.target.value)} />
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Image within circle</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <Slider label="Pan X" value={state.pfpImgX} min={-200} max={200} small onChange={e => set('pfpImgX', +e.target.value)} />
                <Slider label="Pan Y" value={state.pfpImgY} min={-200} max={200} small onChange={e => set('pfpImgY', +e.target.value)} />
                <Slider label="Zoom %" value={state.pfpImgZoom} min={50} max={300} small onChange={e => set('pfpImgZoom', +e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>Border Colour</label>
              <SwatchRow colors={BORDER_COLORS} value={state.borderColor} onChange={c => set('borderColor', c)} />
            </div>
          </div>

          <div style={divider} />
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Author Name</SecTitle>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 8, lineHeight: 1.5 }}>
              Offsets shift from the template's natural position. 0 = default.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <Slider label="Offset X %" value={state.authorOffsetX} min={-50} max={50} small onChange={e => set('authorOffsetX', +e.target.value)} />
              <Slider label="Offset Y %" value={state.authorOffsetY} min={-50} max={50} small onChange={e => set('authorOffsetY', +e.target.value)} />
            </div>
            <Slider label="Author Font Size" value={state.authorFontSize} min={14} max={72} onChange={e => set('authorFontSize', +e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}
