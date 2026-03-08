import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { THUMB_EXPORT_SIZES } from '../utils/constants'
import { hexToRgba, roundRect, wrapText, drawBg, drawPfp } from '../utils/canvasHelpers'

// ── Shared UI ──────────────────────────────────────────────────────────────
function SecTitle({ children }) {
  return (
    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#3498DB', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(52,152,219,0.2)' }} />
    </div>
  )
}

function Slider({ label, value, min, max, onChange, small }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: small ? 5 : 8 }}>
      {label && <label style={{ fontSize: small ? 9 : 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="range" min={min} max={max} value={value} onChange={onChange} style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', width: 32, textAlign: 'right', flexShrink: 0 }}>{value}</span>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
      <span>{label}</span>
      <label style={{ position: 'relative', width: 34, height: 18, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: checked ? '#3498DB' : 'rgba(255,255,255,0.2)', borderRadius: 20, transition: 'background 0.3s' }}>
          <div style={{ position: 'absolute', width: 12, height: 12, left: checked ? 19 : 3, top: 3, background: 'white', borderRadius: '50%', transition: 'left 0.3s' }} />
        </div>
      </label>
    </div>
  )
}

function SwatchRow({ colors, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
      {colors.map(({ c, n }) => (
        <div key={c} title={n || c} onClick={() => onChange(c)} style={{
          width: 22, height: 22, borderRadius: 4, background: c,
          border: `2px solid ${value === c ? 'white' : c === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
          cursor: 'pointer', transform: value === c ? 'scale(1.15)' : 'scale(1)',
          boxShadow: value === c ? '0 0 0 2px rgba(255,255,255,0.22)' : 'none',
          transition: 'transform 0.15s',
        }} />
      ))}
    </div>
  )
}

const THUMB_COLORS = [
  { c: '#ffffff', n: 'White' }, { c: '#1a1a2e', n: 'Dark' }, { c: '#cccccc', n: 'Silver' },
  { c: '#3498DB', n: 'Blue' }, { c: '#C9A84C', n: 'Gold' }, { c: '#E4600A', n: 'Orange' },
  { c: '#F5B800', n: 'Yellow' }, { c: '#E74C3C', n: 'Red' }, { c: '#2ECC71', n: 'Green' },
  { c: '#5B2D8E', n: 'Purple' }, { c: '#E91E63', n: 'Pink' }, { c: '#00BCD4', n: 'Cyan' },
]

const FONT_OPTIONS = ['Montserrat', 'Playfair Display', 'Georgia', 'Arial', 'Lato']

function FontSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 6, color: 'white', fontSize: 10, padding: '5px 8px', width: '100%',
      fontFamily: "'Montserrat',sans-serif", marginBottom: 5,
    }}>
      {FONT_OPTIONS.map(f => <option key={f} value={f} style={{ background: '#0d1a2e' }}>{f}</option>)}
    </select>
  )
}

// ── Canvas helpers ─────────────────────────────────────────────────────────
// Draw a photo circle manually (for Split Frame left panel)
function drawPhotoCircle(ctx, cx, cy, r, image, imgZoom, imgX, imgY, borderColor, borderW = 6) {
  ctx.save()
  ctx.shadowColor = hexToRgba(borderColor, 0.5)
  ctx.shadowBlur = r * 0.35
  ctx.beginPath(); ctx.arc(cx, cy, r + borderW, 0, Math.PI * 2)
  ctx.fillStyle = borderColor; ctx.fill()
  ctx.shadowBlur = 0

  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
  if (image) {
    const iw = image.naturalWidth, ih = image.naturalHeight
    const sc = Math.max(r * 2 / iw, r * 2 / ih) * ((imgZoom || 100) / 100)
    ctx.drawImage(image, cx - iw * sc / 2 + (imgX || 0), cy - ih * sc / 2 + (imgY || 0), iw * sc, ih * sc)
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
    g.addColorStop(0, '#3a4a7a'); g.addColorStop(1, '#1a2a4a')
    ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = `bold ${r * 0.58}px serif`
    ctx.textAlign = 'center'; ctx.fillText('👤', cx, cy + r * 0.2)
  }
  ctx.restore()
}

// Draw episode badge pill
function drawEpisodeBadge(ctx, ex, ey, label, accentColor, w, h) {
  const bH = h * 0.072
  const bW = Math.max(ctx.measureText(label).width + w * 0.06, w * 0.1)
  ctx.fillStyle = accentColor
  roundRect(ctx, ex, ey, bW, bH, bH / 2); ctx.fill()
  ctx.font = `800 ${w * 0.021}px 'Montserrat', Arial`
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
  ctx.fillText(label, ex + bW / 2, ey + bH * 0.67)
  ctx.textAlign = 'left'
  return { bW, bH }
}

// Draw channel/brand tag (bordered pill)
function drawBrandTag(ctx, bx, by, label, color, w, h) {
  const tagW = Math.max(ctx.measureText(label).width + w * 0.06, w * 0.16)
  const tagH = h * 0.072
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, 2 * (w / 1280))
  roundRect(ctx, bx, by, tagW, tagH, tagH / 2); ctx.stroke()
  ctx.font = `700 ${w * 0.018}px 'Montserrat', Arial`
  ctx.fillStyle = color; ctx.textAlign = 'center'
  ctx.fillText(label, bx + tagW / 2, by + tagH * 0.67)
  ctx.textAlign = 'left'
}

// ── THUMBNAIL TEMPLATES ────────────────────────────────────────────────────
const THUMB_TEMPLATES = [
  // ── 0: Bold Strike ────────────────────────────────────────────────────────
  {
    id: 0, name: 'Bold Strike',
    render(ctx, w, h, s) {
      ctx.save()

      // Base background
      ctx.fillStyle = '#0d0f1a'
      ctx.fillRect(0, 0, w, h)

      // Background image
      if (s.bgImage) drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity)

      // Horizontal gradient overlay — darker on text side, lighter on photo side
      const grad = ctx.createLinearGradient(0, 0, w, 0)
      grad.addColorStop(0, `rgba(0,0,0,${Math.min(0.97, (s.overlayOpacity / 100) * 1.4)})`)
      grad.addColorStop(0.45, `rgba(0,0,0,${s.overlayOpacity / 100})`)
      grad.addColorStop(1, `rgba(0,0,0,${Math.max(0, (s.overlayOpacity / 100) * 0.2)})`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Accent bars (top + bottom edge strips)
      ctx.fillStyle = s.accentColor
      ctx.fillRect(0, 0, w, Math.max(4, h * 0.007))
      ctx.fillRect(0, h - Math.max(4, h * 0.007), w, Math.max(4, h * 0.007))

      // Episode badge
      if (s.showEpisode) {
        const ex = s.episodeX / 100 * w, ey = s.episodeY / 100 * h
        ctx.font = `800 ${w * 0.021}px 'Montserrat', Arial`
        drawEpisodeBadge(ctx, ex, ey, `EP. ${s.episodeNum}`, s.accentColor, w, h)
      }

      // Brand tag
      if (s.showBrand) {
        const bx = s.brandX / 100 * w, by = s.brandY / 100 * h
        ctx.font = `700 ${w * 0.018}px 'Montserrat', Arial`
        drawBrandTag(ctx, bx, by, s.channelName, 'rgba(255,255,255,0.85)', w, h)
      }

      // Title
      const tx = s.titleX / 100 * w, ty = s.titleY / 100 * h
      const tfs = w * 0.058 * (s.titleFontSize / 100)
      ctx.font = `900 ${tfs}px '${s.titleFont}', Arial`
      ctx.fillStyle = s.titleColor
      ctx.textAlign = 'left'
      wrapText(ctx, s.title, tx, ty, w * 0.5, tfs * 1.18)

      // Accent underline below title
      const titleLines = Math.ceil(ctx.measureText(s.title).width / (w * 0.5)) || 1
      const underlineY = ty + titleLines * tfs * 1.18 + tfs * 0.35
      ctx.strokeStyle = s.accentColor
      ctx.lineWidth = Math.max(3, 5 * (w / 1280))
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(tx, underlineY)
      ctx.lineTo(tx + Math.min(ctx.measureText(s.title).width, w * 0.4), underlineY)
      ctx.stroke()

      // Subtitle
      if (s.showSubtitle) {
        const sx2 = s.subtitleX / 100 * w, sy2 = s.subtitleY / 100 * h
        const sfs = w * 0.024 * (s.subtitleFontSize / 100)
        ctx.font = `600 ${sfs}px '${s.subtitleFont}', Arial`
        ctx.fillStyle = s.subtitleColor
        ctx.textAlign = 'left'
        ctx.fillText(s.subtitle, sx2, sy2)
      }

      // Profile photo (right side)
      if (s.showProfile) {
        drawPfp(ctx, w, h, { ...s, borderColor: s.accentColor })
      }

      ctx.restore()
    },
  },

  // ── 1: Split Frame ─────────────────────────────────────────────────────────
  {
    id: 1, name: 'Split Frame',
    render(ctx, w, h, s) {
      ctx.save()
      const splitX = w * 0.42

      // ── Right panel (dark + optional bg image) first so left overlaps ──
      ctx.fillStyle = '#08101e'
      ctx.fillRect(splitX, 0, w - splitX, h)

      if (s.bgImage) {
        ctx.save()
        ctx.beginPath(); ctx.rect(splitX, 0, w - splitX, h); ctx.clip()
        drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity * 0.65)
        ctx.fillStyle = `rgba(8,16,30,${Math.min(0.92, s.overlayOpacity / 100 * 1.2)})`
        ctx.fillRect(splitX, 0, w - splitX, h)
        ctx.restore()
      }

      // Right content — Episode badge
      if (s.showEpisode) {
        ctx.font = `800 ${w * 0.021}px 'Montserrat', Arial`
        const ex = splitX + (w - splitX) * 0.06
        const ey = h * 0.07
        drawEpisodeBadge(ctx, ex, ey, `EP. ${s.episodeNum}`, s.accentColor, w, h)
      }

      // Right content — Title (clamped to right panel)
      const tx = Math.max(s.titleX / 100 * w, splitX + (w - splitX) * 0.06)
      const ty = s.titleY / 100 * h
      const tfs = (w - splitX) * 0.1 * (s.titleFontSize / 100)
      ctx.font = `900 ${tfs}px '${s.titleFont}', Arial`
      ctx.fillStyle = s.titleColor
      ctx.textAlign = 'left'
      wrapText(ctx, s.title, tx, ty, (w - splitX) * 0.88, tfs * 1.15)

      // Accent divider line
      ctx.strokeStyle = s.accentColor
      ctx.lineWidth = Math.max(2, 3 * (w / 1280))
      ctx.beginPath()
      ctx.moveTo(tx, ty - tfs * 0.6)
      ctx.lineTo(tx + (w - splitX) * 0.55, ty - tfs * 0.6)
      ctx.stroke()

      // Right content — Subtitle
      if (s.showSubtitle) {
        const sy2 = s.subtitleY / 100 * h
        const sfs = w * 0.022 * (s.subtitleFontSize / 100)
        ctx.font = `600 ${sfs}px '${s.subtitleFont}', Arial`
        ctx.fillStyle = s.subtitleColor
        ctx.fillText(s.subtitle, tx, sy2)
      }

      // Right content — Brand tag bottom-right
      if (s.showBrand) {
        const bx = s.brandX / 100 * w, by = s.brandY / 100 * h
        const clampedBx = Math.max(bx, splitX + (w - splitX) * 0.06)
        ctx.font = `700 ${w * 0.018}px 'Montserrat', Arial`
        drawBrandTag(ctx, clampedBx, by, s.channelName, 'rgba(255,255,255,0.75)', w, h)
      }

      // ── Left panel (accent color) ──
      ctx.fillStyle = s.accentColor
      ctx.fillRect(0, 0, splitX, h)

      // Concentric circle decoration
      const cirCX = splitX / 2, cirCY = h / 2
      for (let i = 4; i >= 1; i--) {
        ctx.strokeStyle = hexToRgba('#ffffff', 0.06 * i)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(cirCX, cirCY, h * 0.22 * i, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Secondary accent decorative squares
      ctx.fillStyle = hexToRgba(s.accentColor2, 0.55)
      ;[[splitX * 0.08, h * 0.06, 22], [splitX * 0.72, h * 0.08, 15], [splitX * 0.12, h * 0.82, 30], [splitX * 0.78, h * 0.76, 18]].forEach(([ex2, ey2, es]) => {
        roundRect(ctx, ex2, ey2, es, es, 4); ctx.fill()
      })

      // Host photo circle in left panel
      if (s.showProfile) {
        const pfpR = h * 0.31 * (s.pfpSize / 340)
        drawPhotoCircle(ctx, cirCX, cirCY, pfpR, s.pfpImage, s.pfpImgZoom, s.pfpImgX, s.pfpImgY, '#ffffff', 6)

        // Channel label below photo in left panel
        if (s.showBrand) {
          ctx.font = `700 ${splitX * 0.08}px 'Montserrat', Arial`
          ctx.fillStyle = hexToRgba('#ffffff', 0.85)
          ctx.textAlign = 'center'
          ctx.fillText(s.channelName, cirCX, cirCY + pfpR + 22 + splitX * 0.08)
          ctx.textAlign = 'left'
        }
      }

      // Gradient blend at split edge
      const blendGrad = ctx.createLinearGradient(splitX - 1, 0, splitX + h * 0.04, 0)
      blendGrad.addColorStop(0, s.accentColor)
      blendGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = blendGrad
      ctx.fillRect(splitX - 1, 0, h * 0.04 + 1, h)

      ctx.restore()
    },
  },

  // ── 2: Dark Glow ───────────────────────────────────────────────────────────
  {
    id: 2, name: 'Dark Glow',
    render(ctx, w, h, s) {
      ctx.save()

      // Deep dark gradient base
      const bg = ctx.createLinearGradient(0, 0, w, h)
      bg.addColorStop(0, '#040812'); bg.addColorStop(1, '#0c1428')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)

      // Background image at reduced opacity
      if (s.bgImage) {
        ctx.save()
        ctx.globalAlpha = Math.min(0.38, s.bgOpacity / 100 * 0.4)
        drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, 100)
        ctx.restore()
        ctx.fillStyle = `rgba(4,8,18,${s.overlayOpacity / 100})`
        ctx.fillRect(0, 0, w, h)
      }

      // Glow halos
      const glow1 = ctx.createRadialGradient(w * 0.82, h * 0.2, 0, w * 0.82, h * 0.2, w * 0.55)
      glow1.addColorStop(0, hexToRgba(s.accentColor, 0.35)); glow1.addColorStop(1, 'transparent')
      ctx.fillStyle = glow1; ctx.fillRect(0, 0, w, h)

      const glow2 = ctx.createRadialGradient(w * 0.08, h * 0.85, 0, w * 0.08, h * 0.85, w * 0.42)
      glow2.addColorStop(0, hexToRgba(s.accentColor2, 0.3)); glow2.addColorStop(1, 'transparent')
      ctx.fillStyle = glow2; ctx.fillRect(0, 0, w, h)

      // Large semi-transparent episode watermark
      if (s.showEpisode) {
        ctx.font = `900 ${w * 0.3}px 'Montserrat', Arial`
        ctx.fillStyle = hexToRgba('#ffffff', 0.03)
        ctx.textAlign = 'center'
        ctx.fillText(`EP${s.episodeNum}`, w / 2, h * 0.72)
        ctx.textAlign = 'left'
      }

      // Episode badge (small, top-center-left)
      if (s.showEpisode) {
        const ex = s.episodeX / 100 * w, ey = s.episodeY / 100 * h
        ctx.font = `800 ${w * 0.021}px 'Montserrat', Arial`
        drawEpisodeBadge(ctx, ex, ey, `EP. ${s.episodeNum}`, s.accentColor, w, h)
      }

      // Brand tag
      if (s.showBrand) {
        const bx = s.brandX / 100 * w, by = s.brandY / 100 * h
        ctx.font = `700 ${w * 0.018}px 'Montserrat', Arial`
        drawBrandTag(ctx, bx, by, s.channelName, hexToRgba(s.accentColor, 0.9), w, h)
      }

      // Title
      const tx = s.titleX / 100 * w, ty = s.titleY / 100 * h
      const tfs = w * 0.058 * (s.titleFontSize / 100)

      // Title glow (text shadow effect via multiple draws)
      ctx.font = `900 ${tfs}px '${s.titleFont}', Arial`
      ctx.fillStyle = hexToRgba(s.accentColor, 0.15)
      ctx.textAlign = 'left'
      for (let d = 4; d >= 1; d--) {
        ctx.fillText(s.title.split('\n')[0], tx + d, ty + d)
      }

      ctx.fillStyle = s.titleColor
      wrapText(ctx, s.title, tx, ty, w * 0.52, tfs * 1.18)

      // Gradient line below title
      const titleLineCount = Math.ceil(ctx.measureText(s.title).width / (w * 0.52)) || 1
      const lineY = ty + titleLineCount * tfs * 1.18 + tfs * 0.25
      const lineGrad = ctx.createLinearGradient(tx, 0, tx + w * 0.38, 0)
      lineGrad.addColorStop(0, s.accentColor); lineGrad.addColorStop(1, 'transparent')
      ctx.strokeStyle = lineGrad
      ctx.lineWidth = Math.max(2, 3.5 * (w / 1280)); ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(tx, lineY); ctx.lineTo(tx + w * 0.38, lineY); ctx.stroke()

      // Subtitle
      if (s.showSubtitle) {
        const sx2 = s.subtitleX / 100 * w, sy2 = s.subtitleY / 100 * h
        const sfs = w * 0.023 * (s.subtitleFontSize / 100)
        ctx.font = `600 ${sfs}px '${s.subtitleFont}', Arial`
        ctx.fillStyle = s.subtitleColor
        ctx.fillText(s.subtitle, sx2, sy2)
      }

      // Profile photo with glowing border (right side)
      if (s.showProfile) {
        // Custom glow pass
        const sc2 = w / 1080
        const r2 = s.pfpSize * sc2 / 2
        const bw2 = s.pfpBorderW * sc2
        const cx2 = s.pfpX / 100 * w + r2 + bw2
        const cy2 = s.pfpY / 100 * h + r2 + bw2
        const glowRad = ctx.createRadialGradient(cx2, cy2, r2 * 0.8, cx2, cy2, r2 * 2.5)
        glowRad.addColorStop(0, hexToRgba(s.accentColor, 0.3))
        glowRad.addColorStop(1, 'transparent')
        ctx.fillStyle = glowRad; ctx.fillRect(0, 0, w, h)
        drawPfp(ctx, w, h, { ...s, borderColor: s.accentColor })
      }

      ctx.restore()
    },
  },

  // ── 3: Podcast Cover ───────────────────────────────────────────────────────
  {
    id: 3, name: 'Podcast Cover',
    render(ctx, w, h, s) {
      ctx.save()

      // Dark background
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0a0d16'); bg.addColorStop(1, '#060810')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)

      // Background image
      if (s.bgImage) {
        ctx.save()
        ctx.globalAlpha = s.bgOpacity / 100 * 0.45
        drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, 100)
        ctx.restore()
        ctx.fillStyle = `rgba(6,8,16,${s.overlayOpacity / 100})`
        ctx.fillRect(0, 0, w, h)
      }

      // Large accent background circle
      const bigCR = Math.min(w, h) * 0.62
      const bigCX = w * 0.5, bigCY = h * 0.42
      const circBg = ctx.createRadialGradient(bigCX, bigCY, 0, bigCX, bigCY, bigCR)
      circBg.addColorStop(0, hexToRgba(s.accentColor, 0.22))
      circBg.addColorStop(0.7, hexToRgba(s.accentColor, 0.08))
      circBg.addColorStop(1, 'transparent')
      ctx.fillStyle = circBg; ctx.fillRect(0, 0, w, h)

      // Accent ring
      ctx.save()
      ctx.strokeStyle = hexToRgba(s.accentColor, 0.35)
      ctx.lineWidth = Math.max(2, 3 * (w / 1280))
      ctx.beginPath(); ctx.arc(bigCX, bigCY, bigCR, 0, Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = hexToRgba(s.accentColor2, 0.18)
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(bigCX, bigCY, bigCR * 1.1, 0, Math.PI * 2); ctx.stroke()
      ctx.restore()

      // Secondary accent decorative dots
      const dotPositions = [[w * 0.15, h * 0.12], [w * 0.82, h * 0.1], [w * 0.1, h * 0.88], [w * 0.88, h * 0.85]]
      dotPositions.forEach(([dx, dy]) => {
        ctx.fillStyle = hexToRgba(s.accentColor2, 0.4)
        ctx.beginPath(); ctx.arc(dx, dy, Math.min(w, h) * 0.012, 0, Math.PI * 2); ctx.fill()
      })

      // Channel name — top, large styled heading
      if (s.showBrand) {
        ctx.font = `900 ${w * 0.026}px 'Montserrat', Arial`
        ctx.letterSpacing = '4px'
        const cnW = ctx.measureText(s.channelName.toUpperCase()).width
        ctx.fillStyle = s.accentColor
        ctx.textAlign = 'center'
        ctx.fillText(s.channelName.toUpperCase(), w / 2, h * 0.1)
        // Underline
        ctx.strokeStyle = hexToRgba(s.accentColor, 0.5)
        ctx.lineWidth = Math.max(1, 2 * (w / 1280)); ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(w / 2 - cnW / 2, h * 0.115)
        ctx.lineTo(w / 2 + cnW / 2, h * 0.115)
        ctx.stroke()
        ctx.textAlign = 'left'
      }

      // Episode badge
      if (s.showEpisode) {
        const ex = s.episodeX / 100 * w, ey = s.episodeY / 100 * h
        ctx.font = `800 ${w * 0.021}px 'Montserrat', Arial`
        drawEpisodeBadge(ctx, ex, ey, `EP. ${s.episodeNum}`, s.accentColor2, w, h)
      }

      // Title — large, centered
      const ty = s.titleY / 100 * h
      const tfs = w * 0.068 * (s.titleFontSize / 100)
      ctx.font = `900 ${tfs}px '${s.titleFont}', Arial`
      ctx.fillStyle = s.titleColor
      wrapText(ctx, s.title, w / 2, ty, w * 0.7, tfs * 1.15, 'center', w / 2)

      // Subtitle
      if (s.showSubtitle) {
        const sy2 = s.subtitleY / 100 * h
        const sfs = w * 0.024 * (s.subtitleFontSize / 100)
        ctx.font = `600 ${sfs}px '${s.subtitleFont}', Arial`
        ctx.fillStyle = s.subtitleColor
        ctx.textAlign = 'center'
        ctx.fillText(s.subtitle, w / 2, sy2)
        ctx.textAlign = 'left'
      }

      // Profile photo — bottom center, large
      if (s.showProfile) {
        const pfpR = Math.min(w, h) * 0.22 * (s.pfpSize / 340)
        const pfpCX = s.pfpX / 100 * w
        const pfpCY = s.pfpY / 100 * h
        // Glow beneath
        const pfpGlow = ctx.createRadialGradient(pfpCX, pfpCY, pfpR * 0.5, pfpCX, pfpCY, pfpR * 2.2)
        pfpGlow.addColorStop(0, hexToRgba(s.accentColor, 0.28))
        pfpGlow.addColorStop(1, 'transparent')
        ctx.fillStyle = pfpGlow; ctx.fillRect(0, 0, w, h)
        drawPhotoCircle(ctx, pfpCX, pfpCY, pfpR, s.pfpImage, s.pfpImgZoom, s.pfpImgX, s.pfpImgY, s.accentColor, Math.max(4, 7 * (w / 1280)))
      }

      ctx.restore()
    },
  },
]

// ── DEFAULT STATE ──────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  templateId: 0,

  // Content
  title: 'Transform Your Content Strategy',
  subtitle: 'Season 2 · Episode 12',
  channelName: 'IWC Concepts',
  episodeNum: '12',
  showEpisode: true,
  showProfile: true,
  showBrand: true,
  showSubtitle: true,

  // Colors
  accentColor: '#3498DB',
  accentColor2: '#C9A84C',
  overlayOpacity: 55,

  // Background image
  bgImage: null, bgPreview: null,
  bgX: 0, bgY: 0, bgZoom: 100, bgOpacity: 100,

  // Profile / host photo
  pfpImage: null, pfpPreview: null,
  pfpSize: 340,     // diameter (px) at 1080-scale — used by drawPfp
  pfpX: 55, pfpY: 5,
  pfpBorderW: 8,
  pfpImgX: 0, pfpImgY: 0, pfpImgZoom: 100,

  // Title typography
  titleFont: 'Montserrat',
  titleFontSize: 100,
  titleColor: '#ffffff',
  titleX: 5, titleY: 28,

  // Subtitle typography
  subtitleFont: 'Montserrat',
  subtitleFontSize: 100,
  subtitleColor: '#cccccc',
  subtitleX: 5, subtitleY: 72,

  // Element positions
  episodeX: 5, episodeY: 5,
  brandX: 72, brandY: 5,

  canvasW: 1280, canvasH: 720,
}

// ── COMPONENT ──────────────────────────────────────────────────────────────
export default function VideoThumbnailStudio() {
  const navigate = useNavigate()
  const [state, setState] = useState({ ...DEFAULT_STATE })
  const [activeExport, setActiveExport] = useState(0)
  const canvasRef = useRef(null)
  const thumbRefs = useRef([])

  const set = (key, val) => setState(prev => ({ ...prev, [key]: val }))

  // Main canvas render
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.width = state.canvasW; canvas.height = state.canvasH
    const ctx = canvas.getContext('2d')
    try { THUMB_TEMPLATES[state.templateId].render(ctx, state.canvasW, state.canvasH, state) }
    catch (e) { console.error('ThumbStudio render error (template ' + state.templateId + '):', e) }
  }, [state])

  // Template picker thumbnails
  useEffect(() => {
    const t = setTimeout(() => {
      THUMB_TEMPLATES.forEach((_, i) => {
        const c = thumbRefs.current[i]; if (!c) return
        c.width = 240; c.height = 135
        const ts = { ...DEFAULT_STATE, templateId: i, canvasW: 240, canvasH: 135 }
        try { THUMB_TEMPLATES[i].render(c.getContext('2d'), 240, 135, ts) } catch (_) {}
      })
    }, 120)
    return () => clearTimeout(t)
  }, [])

  function handleBgUpload(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => setState(prev => ({ ...prev, bgImage: img, bgPreview: ev.target.result }))
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function handlePfpUpload(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => setState(prev => ({ ...prev, pfpImage: img, pfpPreview: ev.target.result }))
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function downloadThumb() {
    const a = document.createElement('a')
    a.download = `IWC-Thumbnail-EP${state.episodeNum}-${Date.now()}.png`
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }

  function resetAll() {
    setState({ ...DEFAULT_STATE })
    setActiveExport(0)
  }

  const panel = { background: '#0d1a2e', overflowY: 'auto', padding: 16, height: '100%' }
  const divider = { height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 0' }
  const inp = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 7, color: 'white', fontFamily: "'Montserrat',sans-serif",
    fontSize: 12, padding: '7px 10px', width: '100%',
  }
  const subGroupStyle = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8, padding: '10px 10px 6px', marginBottom: 8,
  }
  const subLabel = {
    fontSize: 8, fontWeight: 800, color: '#3498DB', letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: 8, display: 'block',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080d18', fontFamily: "'Montserrat', sans-serif", color: 'white' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#0a1428,#0d2040)', borderBottom: '2px solid #3498DB', padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3498DB'; e.currentTarget.style.color = '#3498DB' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
          >← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#3498DB,#C9A84C)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Video Thumbnail Studio</div>
              <div style={{ fontSize: 8, color: '#3498DB', letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={resetAll} style={{ padding: '7px 14px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, background: 'transparent', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3498DB'; e.currentTarget.style.color = '#3498DB' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white' }}
          >↺ Reset</button>
          <button onClick={downloadThumb} style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#3498DB,#C9A84C)', border: 'none', borderRadius: 8, color: '#0a1428', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 18px rgba(52,152,219,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}
          >⬇ Download PNG</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr 280px', flex: 1, overflow: 'hidden' }}>
        {/* ── LEFT PANEL ── */}
        <div style={{ ...panel, borderRight: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Templates */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Templates</SecTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {THUMB_TEMPLATES.map((t, i) => (
                <div key={i} onClick={() => set('templateId', i)} style={{ borderRadius: 8, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: `2px solid ${state.templateId === i ? '#3498DB' : 'transparent'}`, transform: state.templateId === i ? 'scale(1.01)' : 'scale(1)', transition: 'border-color 0.2s, transform 0.2s' }}
                  onMouseEnter={e => { if (state.templateId !== i) e.currentTarget.style.transform = 'scale(1.02)' }}
                  onMouseLeave={e => { if (state.templateId !== i) e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <canvas ref={el => thumbRefs.current[i] = el} style={{ width: '100%', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.8)', fontSize: 8, fontWeight: 700, textAlign: 'center', padding: 4, letterSpacing: 1 }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={divider} />

          {/* Content */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Content</SecTitle>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Title</label>
              <textarea value={state.title} onChange={e => set('title', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
            </div>
            {[['Subtitle / Episode Info', 'subtitle'], ['Channel / Brand Name', 'channelName'], ['Episode Number', 'episodeNum']].map(([lbl, key]) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>{lbl}</label>
                <input type="text" value={state[key]} onChange={e => set(key, e.target.value)} style={inp} />
              </div>
            ))}
          </div>

          <div style={divider} />

          {/* Visibility toggles */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Show / Hide</SecTitle>
            <Toggle label="Episode Badge" checked={state.showEpisode} onChange={e => set('showEpisode', e.target.checked)} />
            <Toggle label="Host / Profile Photo" checked={state.showProfile} onChange={e => set('showProfile', e.target.checked)} />
            <Toggle label="Channel Name Tag" checked={state.showBrand} onChange={e => set('showBrand', e.target.checked)} />
            <Toggle label="Subtitle Line" checked={state.showSubtitle} onChange={e => set('showSubtitle', e.target.checked)} />
          </div>

          <div style={divider} />

          {/* Title Typography */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Title Typography</SecTitle>
            <div style={subGroupStyle}>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Font Family</label>
              <FontSelect value={state.titleFont} onChange={v => set('titleFont', v)} />
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Text Color</label>
              <SwatchRow colors={THUMB_COLORS} value={state.titleColor} onChange={c => set('titleColor', c)} />
              <Slider label="Size %" value={state.titleFontSize} min={30} max={250} small onChange={e => set('titleFontSize', +e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <Slider label="X %" value={state.titleX} min={0} max={90} small onChange={e => set('titleX', +e.target.value)} />
                <Slider label="Y %" value={state.titleY} min={0} max={90} small onChange={e => set('titleY', +e.target.value)} />
              </div>
            </div>
          </div>

          {/* Subtitle Typography */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Subtitle Typography</SecTitle>
            <div style={subGroupStyle}>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Font Family</label>
              <FontSelect value={state.subtitleFont} onChange={v => set('subtitleFont', v)} />
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Text Color</label>
              <SwatchRow colors={THUMB_COLORS} value={state.subtitleColor} onChange={c => set('subtitleColor', c)} />
              <Slider label="Size %" value={state.subtitleFontSize} min={30} max={200} small onChange={e => set('subtitleFontSize', +e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <Slider label="X %" value={state.subtitleX} min={0} max={90} small onChange={e => set('subtitleX', +e.target.value)} />
                <Slider label="Y %" value={state.subtitleY} min={0} max={95} small onChange={e => set('subtitleY', +e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 40%,#101e30,#080d18)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div style={{ position: 'relative' }}>
            <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 4, boxShadow: '0 0 0 1px rgba(255,255,255,0.06),0 30px 80px rgba(0,0,0,0.75)', maxWidth: 'min(660px,calc(100vw - 640px))', maxHeight: 'calc(100vh - 120px)' }} />
            <div style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, whiteSpace: 'nowrap' }}>{state.canvasW} × {state.canvasH} px</div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ ...panel, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Export Size */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Export Size</SecTitle>
            {THUMB_EXPORT_SIZES.map((sz, i) => (
              <button key={i} onClick={() => { setActiveExport(i); setState(prev => ({ ...prev, canvasW: sz.w, canvasH: sz.h })) }} style={{ background: activeExport === i ? 'rgba(52,152,219,0.25)' : 'rgba(255,255,255,0.05)', border: `1px solid ${activeExport === i ? '#3498DB' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, padding: '7px 10px', color: 'white', cursor: 'pointer', fontSize: 10, fontWeight: 600, textAlign: 'left', width: '100%', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.08)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>▪</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{sz.l}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>{sz.d}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={divider} />

          {/* Background Image */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Background Image</SecTitle>
            {state.bgPreview ? (
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <img src={state.bgPreview} alt="" style={{ width: '100%', borderRadius: 6, display: 'block', maxHeight: 90, objectFit: 'cover' }} />
                <button onClick={() => setState(prev => ({ ...prev, bgImage: null, bgPreview: null }))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', width: 20, height: 20, fontSize: 11, lineHeight: '20px', textAlign: 'center' }}>✕</button>
              </div>
            ) : (
              <label style={{ display: 'block', border: '2px dashed rgba(52,152,219,0.35)', borderRadius: 9, padding: 14, textAlign: 'center', cursor: 'pointer', background: 'rgba(52,152,219,0.04)', marginBottom: 10 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3498DB'; e.currentTarget.style.background = 'rgba(52,152,219,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(52,152,219,0.35)'; e.currentTarget.style.background = 'rgba(52,152,219,0.04)' }}
              >
                <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
                <div style={{ fontSize: 20, marginBottom: 4 }}>🖼</div>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}><strong style={{ color: '#3498DB' }}>Upload</strong> background image</p>
              </label>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <Slider label="Zoom %" value={state.bgZoom} min={80} max={400} small onChange={e => set('bgZoom', +e.target.value)} />
              <Slider label="Opacity %" value={state.bgOpacity} min={0} max={100} small onChange={e => set('bgOpacity', +e.target.value)} />
              <Slider label="Pan X %" value={state.bgX} min={-50} max={50} small onChange={e => set('bgX', +e.target.value)} />
              <Slider label="Pan Y %" value={state.bgY} min={-50} max={50} small onChange={e => set('bgY', +e.target.value)} />
            </div>
            <Slider label="Overlay Opacity %" value={state.overlayOpacity} min={0} max={97} small onChange={e => set('overlayOpacity', +e.target.value)} />
          </div>

          <div style={divider} />

          {/* Profile / Host Photo */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Host / Profile Photo</SecTitle>
            {state.pfpPreview ? (
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <img src={state.pfpPreview} alt="" style={{ width: 72, height: 72, borderRadius: '50%', display: 'block', objectFit: 'cover', border: `3px solid ${state.accentColor}` }} />
                <button onClick={() => setState(prev => ({ ...prev, pfpImage: null, pfpPreview: null }))} style={{ position: 'absolute', top: 0, left: 62, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', width: 18, height: 18, fontSize: 10, lineHeight: '18px', textAlign: 'center' }}>✕</button>
              </div>
            ) : (
              <label style={{ display: 'block', border: '2px dashed rgba(52,152,219,0.35)', borderRadius: 9, padding: 14, textAlign: 'center', cursor: 'pointer', background: 'rgba(52,152,219,0.04)', marginBottom: 10 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3498DB'; e.currentTarget.style.background = 'rgba(52,152,219,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(52,152,219,0.35)'; e.currentTarget.style.background = 'rgba(52,152,219,0.04)' }}
              >
                <input type="file" accept="image/*" onChange={handlePfpUpload} style={{ display: 'none' }} />
                <div style={{ fontSize: 20, marginBottom: 4 }}>👤</div>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}><strong style={{ color: '#3498DB' }}>Upload</strong> host / speaker photo</p>
              </label>
            )}
            <Slider label="Photo Size" value={state.pfpSize} min={80} max={700} small onChange={e => set('pfpSize', +e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <Slider label="Position X %" value={state.pfpX} min={0} max={90} small onChange={e => set('pfpX', +e.target.value)} />
              <Slider label="Position Y %" value={state.pfpY} min={0} max={85} small onChange={e => set('pfpY', +e.target.value)} />
            </div>
            <Slider label="Image Zoom %" value={state.pfpImgZoom} min={50} max={250} small onChange={e => set('pfpImgZoom', +e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <Slider label="Image X (px)" value={state.pfpImgX} min={-200} max={200} small onChange={e => set('pfpImgX', +e.target.value)} />
              <Slider label="Image Y (px)" value={state.pfpImgY} min={-200} max={200} small onChange={e => set('pfpImgY', +e.target.value)} />
            </div>
          </div>

          <div style={divider} />

          {/* Colors */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Colours</SecTitle>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>Primary Accent</label>
            <SwatchRow colors={THUMB_COLORS} value={state.accentColor} onChange={c => set('accentColor', c)} />
            <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', margin: '8px 0 5px' }}>Secondary Accent</label>
            <SwatchRow colors={THUMB_COLORS} value={state.accentColor2} onChange={c => set('accentColor2', c)} />
          </div>

          <div style={divider} />

          {/* Element Positions */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Element Positions</SecTitle>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 10, lineHeight: 1.5 }}>
              Episode Badge, Brand Tag, and Podcast Cover photo positions. Title &amp; Subtitle positions are in the left panel.
            </div>
            {[
              { heading: 'Episode Badge', keys: [['X %', 'episodeX', 0, 90], ['Y %', 'episodeY', 0, 90]] },
              { heading: 'Brand / Channel Tag', keys: [['X %', 'brandX', 0, 90], ['Y %', 'brandY', 0, 90]] },
              { heading: 'Podcast Cover Photo', keys: [['Center X %', 'pfpX', 5, 95], ['Center Y %', 'pfpY', 5, 95]] },
            ].map(({ heading, keys }) => (
              <div key={heading} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>{heading}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {keys.map(([lbl, key, mn, mx]) => (
                    <Slider key={key} label={lbl} value={state[key]} min={mn} max={mx} small onChange={e => set(key, +e.target.value)} />
                  ))}
                </div>
              </div>
            ))}

            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Photo Border Width</div>
            <Slider value={state.pfpBorderW} min={0} max={25} small onChange={e => set('pfpBorderW', +e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}
