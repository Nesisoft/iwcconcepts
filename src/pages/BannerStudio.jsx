import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { hexToRgba, roundRect, wrapText, drawBg } from '../utils/canvasHelpers'

// ── Export sizes ────────────────────────────────────────────────────────────
// previewH: canvas height at 1280px width for editing preview
const BANNER_EXPORT_SIZES = [
  { l: 'YouTube Banner',    d: '2560×1440', w: 2560, h: 1440, previewH: 720 },
  { l: 'Twitter / X Header', d: '1500×500', w: 1500, h: 500,  previewH: 427 },
  { l: 'Facebook Cover',    d: '851×315',   w: 851,  h: 315,  previewH: 320 },
  { l: 'LinkedIn Banner',   d: '1584×396',  w: 1584, h: 396,  previewH: 320 },
  { l: 'Twitch Banner',     d: '1920×480',  w: 1920, h: 480,  previewH: 320 },
]

// Per-template default colors / content applied when clicking a template
const TEMPLATE_DEFAULTS = {
  0: {
    bgColor: '#650030', accentColor: '#8a0040', accentColor2: '#f0c4a8',
    titleColor: '#f0c4a8', subtitleColor: '#e8b89a',
    channelName: 'Marie Wells', tagline: 'Beauty  |  Makeup  |  Hauls', ctaLine2: '',
    titleX: 52, titleY: 46, subtitleX: 50, subtitleY: 57, pfpX: 37, splashX: 55,
  },
  1: {
    bgColor: '#8B0000', accentColor: '#CC2000', accentColor2: '#FF5500',
    titleColor: '#ffffff', subtitleColor: '#ffffff',
    channelName: 'Henry Wotton Channel', tagline: 'SUBSCRIBE  &  ALLOW NOTIFICATION',
    ctaLine2: 'NEW VIDEOS EVERYDAY', titleX: 40, titleY: 50, subtitleX: 38, subtitleY: 58, pfpX: 14,
  },
  2: {
    bgColor: '#1a0535', accentColor: '#E91E63', accentColor2: '#1e1060',
    titleColor: '#E91E63', subtitleColor: '#ffffff',
    channelName: 'James Smith', tagline: 'Games and Speed Runs',
    ctaLine2: 'New videos every Tuesday and Friday',
    titleX: 48, titleY: 43, subtitleX: 46, subtitleY: 55, pfpX: 34,
  },
}

// ── Shared UI ──────────────────────────────────────────────────────────────
function SecTitle({ children }) {
  return (
    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#2ECC71', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(46,204,113,0.2)' }} />
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
        <div style={{ position: 'absolute', inset: 0, background: checked ? '#2ECC71' : 'rgba(255,255,255,0.2)', borderRadius: 20, transition: 'background 0.3s' }}>
          <div style={{ position: 'absolute', width: 12, height: 12, left: checked ? 19 : 3, top: 3, background: 'white', borderRadius: '50%', transition: 'left 0.3s' }} />
        </div>
      </label>
    </div>
  )
}
const BANNER_COLORS = [
  { c: '#ffffff', n: 'White' }, { c: '#1a1a2e', n: 'Dark' }, { c: '#cccccc', n: 'Silver' },
  { c: '#E74C3C', n: 'Red' }, { c: '#C9A84C', n: 'Gold' }, { c: '#E4600A', n: 'Orange' },
  { c: '#F5B800', n: 'Yellow' }, { c: '#2ECC71', n: 'Green' }, { c: '#3498DB', n: 'Blue' },
  { c: '#5B2D8E', n: 'Purple' }, { c: '#E91E63', n: 'Pink' }, { c: '#650030', n: 'Maroon' },
  { c: '#f0c4a8', n: 'Peach' }, { c: '#00BCD4', n: 'Cyan' },
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
function SwatchRow({ colors, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
      {colors.map(({ c, n }) => (
        <div key={c} title={n || c} onClick={() => onChange(c)} style={{
          width: 22, height: 22, borderRadius: 4, background: c,
          border: `2px solid ${value === c ? 'white' : c === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
          cursor: 'pointer', transform: value === c ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s',
          boxShadow: value === c ? '0 0 0 2px rgba(255,255,255,0.22)' : 'none',
        }} />
      ))}
    </div>
  )
}

// ── Canvas helpers ──────────────────────────────────────────────────────────
// Zone helper: returns the 4:1 content band centered in any canvas
function zone(w, h) {
  const cH = Math.min(h, Math.round(w / 4))
  const zY = Math.round((h - cH) / 2)
  return { zY, cH, zBot: zY + cH }
}

// Organic paint/powder splash blob
function drawSplash(ctx, cx, cy, r, color) {
  ctx.save()
  const pts = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2
    const rad = r * (0.72 + 0.28 * Math.sin(a * 4.1 + 0.8) + 0.18 * Math.cos(a * 2.7 + 1.4) + 0.1 * Math.sin(a * 6.3 + 2.1))
    return { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad * 0.7 }
  })
  ctx.beginPath()
  const m = { x: (pts[0].x + pts[13].x) / 2, y: (pts[0].y + pts[13].y) / 2 }
  ctx.moveTo(m.x, m.y)
  for (let i = 0; i < pts.length; i++) {
    const n = pts[(i + 1) % pts.length]
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + n.x) / 2, (pts[i].y + n.y) / 2)
  }
  ctx.closePath()
  ctx.fillStyle = color; ctx.fill()
  // Scattered droplets
  const drops = [
    [0.45,1.38,0.07],[0.95,1.32,0.045],[1.45,1.20,0.06],[1.95,1.35,0.035],
    [2.45,1.25,0.075],[3.05,1.28,0.05],[3.85,1.22,0.055],[4.55,1.36,0.04],
    [5.05,1.26,0.065],[5.55,1.30,0.045],[0.22,1.55,0.035],[1.12,1.48,0.028],
    [2.22,1.44,0.042],[3.55,1.40,0.032],[4.82,1.47,0.038],[5.2,1.52,0.025],
  ]
  drops.forEach(([a, d, sz]) => {
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * r * d, cy + Math.sin(a) * r * d * 0.7, r * sz, 0, Math.PI * 2)
    ctx.fillStyle = color; ctx.fill()
  })
  ctx.restore()
}

// Matrix vertical rain lines (deterministic)
function drawMatrixRain(ctx, w, h, color) {
  ctx.save(); ctx.lineCap = 'round'
  const cols = [
    [0.03,0.0,0.52,1.5,0.18],[0.07,0.15,0.72,1.0,0.13],[0.11,0.05,0.45,2.0,0.17],[0.15,0.22,0.78,1.5,0.14],
    [0.20,0.0,0.38,1.0,0.20],[0.25,0.12,0.65,2.0,0.16],[0.30,0.28,0.85,1.5,0.12],[0.35,0.08,0.55,1.0,0.18],
    [0.42,0.0,0.42,2.0,0.16],[0.47,0.18,0.70,1.5,0.13],[0.52,0.05,0.48,1.0,0.20],[0.57,0.25,0.80,2.0,0.14],
    [0.63,0.10,0.60,1.5,0.17],[0.68,0.0,0.35,1.0,0.12],[0.73,0.20,0.75,2.0,0.18],[0.78,0.08,0.50,1.5,0.15],
    [0.83,0.15,0.68,1.0,0.13],[0.88,0.0,0.45,2.0,0.19],[0.92,0.22,0.72,1.5,0.14],[0.96,0.05,0.38,1.0,0.16],
    [0.05,0.60,1.0,1.0,0.10],[0.13,0.55,0.95,1.5,0.08],[0.22,0.42,0.88,1.0,0.12],[0.32,0.38,0.82,2.0,0.09],
    [0.45,0.50,0.92,1.5,0.11],[0.58,0.45,0.90,1.0,0.10],[0.70,0.40,0.85,2.0,0.12],[0.82,0.52,0.95,1.5,0.09],
    [0.95,0.48,0.88,1.0,0.11],
  ]
  cols.forEach(([xR, y0, y1, lw, alpha]) => {
    ctx.lineWidth = lw * (w / 1280); ctx.globalAlpha = alpha
    ctx.strokeStyle = color
    ctx.beginPath(); ctx.moveTo(w * xR, h * y0); ctx.lineTo(w * xR, h * y1); ctx.stroke()
  })
  ctx.globalAlpha = 1; ctx.restore()
}

// Simple 3D cube (front+top+right faces)
function draw3DCube(ctx, x, y, size, fc, tc, rc) {
  const off = size * 0.4
  ctx.fillStyle = fc; ctx.fillRect(x, y, size, size)
  ctx.fillStyle = tc
  ctx.beginPath()
  ctx.moveTo(x, y); ctx.lineTo(x+off, y-off*0.6); ctx.lineTo(x+size+off, y-off*0.6); ctx.lineTo(x+size, y)
  ctx.closePath(); ctx.fill()
  ctx.fillStyle = rc
  ctx.beginPath()
  ctx.moveTo(x+size, y); ctx.lineTo(x+size+off, y-off*0.6); ctx.lineTo(x+size+off, y-off*0.6+size); ctx.lineTo(x+size, y+size)
  ctx.closePath(); ctx.fill()
}

// Cross/plus shape
function drawCross(ctx, cx, cy, armLen, thickness, color) {
  ctx.fillStyle = color
  ctx.fillRect(cx - armLen/2, cy - thickness/2, armLen, thickness)
  ctx.fillRect(cx - thickness/2, cy - armLen/2, thickness, armLen)
}

// Bell icon
function drawBellIcon(ctx, cx, cy, r, color) {
  ctx.save(); ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy - r*0.05, r*0.62, Math.PI, 0, false)
  ctx.lineTo(cx + r*0.62, cy + r*0.38); ctx.lineTo(cx - r*0.62, cy + r*0.38)
  ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy - r*0.67, r*0.18, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy + r*0.52, r*0.18, 0, Math.PI*2); ctx.fill()
  ctx.restore()
}

// Rectangular photo clip (cover-fit, with placeholder)
function drawPersonRect(ctx, x, y, pw, ph, image, zoom, imgX, imgY) {
  ctx.save()
  ctx.beginPath(); ctx.rect(x, y, pw, ph); ctx.clip()
  if (image) {
    const iw = image.naturalWidth, ih = image.naturalHeight
    const sc = Math.max(pw/iw, ph/ih) * ((zoom||100)/100)
    ctx.drawImage(image, x+pw/2-iw*sc/2+(imgX||0), y+ph/2-ih*sc/2+(imgY||0), iw*sc, ih*sc)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(x, y, pw, ph)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = `${ph*0.38}px sans-serif`
    ctx.textAlign = 'center'; ctx.fillText('👤', x+pw/2, y+ph/2+ph*0.12)
  }
  ctx.restore()
}

// Circular photo clip with border
function drawCirclePhoto(ctx, cx, cy, r, image, zoom, imgX, imgY, borderColor, bw) {
  ctx.save()
  ctx.shadowColor = hexToRgba(borderColor, 0.4); ctx.shadowBlur = r*0.28
  ctx.beginPath(); ctx.arc(cx, cy, r+bw, 0, Math.PI*2); ctx.fillStyle = borderColor; ctx.fill()
  ctx.shadowBlur = 0
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip()
  if (image) {
    const iw = image.naturalWidth, ih = image.naturalHeight
    const sc = Math.max(r*2/iw, r*2/ih) * ((zoom||100)/100)
    ctx.drawImage(image, cx-iw*sc/2+(imgX||0), cy-ih*sc/2+(imgY||0), iw*sc, ih*sc)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(cx-r, cy-r, r*2, r*2)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = `${r*0.7}px sans-serif`
    ctx.textAlign = 'center'; ctx.fillText('👤', cx, cy+r*0.22)
  }
  ctx.restore()
}

// ── BANNER TEMPLATES ────────────────────────────────────────────────────────
const BANNER_TEMPLATES = [
  // ── 0: Splash Banner (Image 1 reference) ─────────────────────────────────
  // Dark background, center strip, paint splash blob, portrait photo, text
  {
    id: 0, name: 'Splash Banner',
    render(ctx, w, h, s) {
      ctx.save()
      const { zY, cH } = zone(w, h)

      // Dark full background
      ctx.fillStyle = s.bgColor; ctx.fillRect(0, 0, w, h)
      if (s.bgImage) drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, s.bgOpacity * 0.35)

      // Center horizontal strip (slightly brighter)
      ctx.fillStyle = s.accentColor; ctx.fillRect(0, zY, w, cH)

      // Paint splash blob (organic blotch in center-right area)
      if (s.showSplash) {
        const splashCX = (s.splashX / 100) * w, splashCY = zY + cH * 0.5
        const splashR = cH * 0.54 * (s.splashSize / 100)
        drawSplash(ctx, splashCX, splashCY, splashR, hexToRgba(s.accentColor2, 0.82))
      }

      // Person photo — portrait, slightly overflows strip top/bottom
      if (s.showPhoto) {
        const photoH = cH * 1.28 * (s.pfpSize / 100)
        const photoW = photoH * 0.6
        const photoX = (s.pfpX / 100) * w - photoW / 2
        drawPersonRect(ctx, photoX, zY + (cH - photoH) / 2, photoW, photoH, s.pfpImage, s.pfpImgZoom, s.pfpImgX, s.pfpImgY)
        // Right-edge fade so photo blends into splash
        const fade = ctx.createLinearGradient(photoX + photoW * 0.6, 0, photoX + photoW, 0)
        fade.addColorStop(0, 'transparent'); fade.addColorStop(1, hexToRgba(s.accentColor, 0.65))
        ctx.fillStyle = fade; ctx.fillRect(photoX, zY, photoW, cH)
      }

      // Channel name
      const tfs = cH * 0.32 * (s.titleFontSize / 100)
      ctx.font = `800 ${tfs}px '${s.titleFont}', Arial`
      ctx.fillStyle = s.titleColor; ctx.textAlign = 'left'
      ctx.fillText(s.channelName, (s.titleX / 100) * w, (s.titleY / 100) * h)

      // Tagline
      if (s.showTagline) {
        const sfs = cH * 0.13 * (s.subtitleFontSize / 100)
        ctx.font = `400 ${sfs}px '${s.subtitleFont}', Arial`
        ctx.fillStyle = s.subtitleColor; ctx.textAlign = 'left'
        ctx.fillText(s.tagline, (s.subtitleX / 100) * w, (s.subtitleY / 100) * h)
      }
      ctx.restore()
    },
  },

  // ── 1: Subscribe Banner (Image 2 reference) ───────────────────────────────
  // Dark top, orange bottom band, red pill card, circular photo, subscribe CTA
  {
    id: 1, name: 'Subscribe Banner',
    render(ctx, w, h, s) {
      ctx.save()
      const { zY, cH } = zone(w, h)

      // Full dark background
      ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, w, h)
      // Dark radial spotlight top-left
      const spot = ctx.createRadialGradient(w*0.1, h*0.3, 0, w*0.1, h*0.3, w*0.5)
      spot.addColorStop(0, hexToRgba(s.bgColor, 0.6)); spot.addColorStop(1, 'transparent')
      ctx.fillStyle = spot; ctx.fillRect(0, 0, w, h)
      if (s.bgImage) {
        ctx.save(); ctx.globalAlpha = s.bgOpacity/100*0.28
        drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, 100); ctx.restore()
      }

      // Orange → red horizontal band (lower 55% of content zone)
      const bandY = zY + cH * 0.12
      const bandGrad = ctx.createLinearGradient(0, 0, w, 0)
      bandGrad.addColorStop(0, s.accentColor2); bandGrad.addColorStop(0.55, s.accentColor); bandGrad.addColorStop(1, s.accentColor)
      ctx.fillStyle = bandGrad; ctx.fillRect(0, bandY, w, cH * 0.88)

      // Main red pill card
      const cardPad = cH * 0.1
      const cardX = cardPad, cardW = w - cardPad * 2
      const cardH = cH * 0.88, cardY = zY + cH * 0.06
      const cardR = cardH * 0.48
      ctx.fillStyle = s.bgColor
      roundRect(ctx, cardX, cardY, cardW, cardH, cardR); ctx.fill()

      const cardCY = cardY + cardH / 2

      // Circular profile photo (left side of pill)
      const photoR = cardH * 0.38 * (s.pfpSize / 100)
      const photoCX = cardX + cardR * 0.45 + photoR * 0.9
      if (s.showPhoto) {
        drawCirclePhoto(ctx, photoCX, cardCY, photoR, s.pfpImage, s.pfpImgZoom, s.pfpImgX, s.pfpImgY, '#ffffff', Math.max(3, 5*(w/1280)))
      }

      // Channel name (left-center text)
      const textLeft = photoCX + photoR + w * 0.016
      const tfs = cardH * 0.33 * (s.titleFontSize / 100)
      ctx.font = `800 ${tfs}px '${s.titleFont}', Arial`
      ctx.fillStyle = s.titleColor; ctx.textAlign = 'left'
      ctx.fillText(s.channelName, textLeft, cardCY - tfs * 0.05)

      // Tagline (subscribe text below name)
      if (s.showTagline) {
        const sfs = cardH * 0.115 * (s.subtitleFontSize / 100)
        ctx.font = `600 ${sfs}px '${s.subtitleFont}', Arial`
        ctx.fillStyle = hexToRgba(s.subtitleColor, 0.82); ctx.textAlign = 'left'
        ctx.fillText(s.tagline, textLeft, cardCY + tfs * 0.62)
      }

      // Bell icon circle
      if (s.showBell) {
        const bellR = cardH * 0.24
        const bellX = w * 0.738
        const bg = ctx.createLinearGradient(bellX-bellR, 0, bellX+bellR, 0)
        bg.addColorStop(0, s.accentColor2); bg.addColorStop(1, s.accentColor)
        ctx.beginPath(); ctx.arc(bellX, cardCY, bellR, 0, Math.PI*2)
        ctx.fillStyle = bg; ctx.fill()
        drawBellIcon(ctx, bellX, cardCY, bellR*0.58, '#ffffff')
      }

      // Subscribe button (right side)
      if (s.showSubscribeBtn) {
        const btnW = w * 0.152, btnH = cardH * 0.38
        const btnX = w * 0.81, btnY = cardCY - btnH * 1.18
        const bGrad = ctx.createLinearGradient(btnX, 0, btnX+btnW, 0)
        bGrad.addColorStop(0, s.accentColor2); bGrad.addColorStop(1, s.accentColor)
        ctx.fillStyle = bGrad
        roundRect(ctx, btnX, btnY, btnW, btnH, btnH/2); ctx.fill()
        // Play triangle
        const triS = btnH*0.28, triX = btnX+btnH*0.38, triY2 = btnY+btnH/2
        ctx.fillStyle = '#ffffff'
        ctx.beginPath(); ctx.moveTo(triX, triY2-triS*0.8); ctx.lineTo(triX+triS*1.2, triY2); ctx.lineTo(triX, triY2+triS*0.8)
        ctx.closePath(); ctx.fill()
        ctx.font = `900 ${btnH*0.32}px 'Montserrat', Arial`
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
        ctx.fillText('SUBSCRIBE', btnX+btnW/2+btnH*0.1, btnY+btnH*0.66)
        // "NEW VIDEOS EVERYDAY" below button
        if (s.ctaLine2) {
          const cfs = cardH * 0.155
          ctx.font = `800 ${cfs}px 'Montserrat', Arial`
          ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
          ctx.fillText(s.ctaLine2, btnX+btnW/2+btnH*0.1, btnY+btnH+cfs*1.2)
        }
      }
      ctx.restore()
    },
  },

  // ── 2: Gaming Banner (Image 3 reference) ─────────────────────────────────
  // Purple/blue bg, matrix rain, dark strip, full-body person photo, gaming decor
  {
    id: 2, name: 'Gaming Banner',
    render(ctx, w, h, s) {
      ctx.save()
      const { zY, cH } = zone(w, h)

      // Purple-blue gradient background
      const bg = ctx.createLinearGradient(0, 0, w, h)
      bg.addColorStop(0, s.bgColor); bg.addColorStop(0.5, s.accentColor2); bg.addColorStop(1, hexToRgba(s.bgColor, 0.8))
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)
      if (s.bgImage) {
        ctx.save(); ctx.globalAlpha = s.bgOpacity/100*0.42
        drawBg(ctx, w, h, s.bgImage, s.bgX, s.bgY, s.bgZoom, 100); ctx.restore()
      }

      // Matrix rain vertical lines
      if (s.showMatrixRain) drawMatrixRain(ctx, w, h, hexToRgba(s.titleColor, 1))

      // 3D gaming decorations (left + right)
      if (s.showDecorations) {
        const cs = cH * 0.4, cubeX = w*0.02, cubeY = zY+(cH-cs)*0.52
        draw3DCube(ctx, cubeX, cubeY, cs, hexToRgba('#000000',0.65), hexToRgba('#111',0.45), hexToRgba('#1a1a1a',0.35))
        // Sphere (left, upper)
        const sR = cH*0.17, sCX = w*0.1, sCY = zY+cH*0.28
        const sg = ctx.createRadialGradient(sCX-sR*0.35, sCY-sR*0.35, 0, sCX, sCY, sR)
        sg.addColorStop(0, hexToRgba(s.accentColor2, 0.4)); sg.addColorStop(1, hexToRgba('#000', 0.7))
        ctx.beginPath(); ctx.arc(sCX, sCY, sR, 0, Math.PI*2); ctx.fillStyle = sg; ctx.fill()
        // Cross/plus (right side, upper)
        drawCross(ctx, w*0.9, zY+cH*0.32, cH*0.36, cH*0.085, hexToRgba(s.accentColor, 0.78))
        // Small cube (right side, lower)
        const cs2 = cH*0.2
        draw3DCube(ctx, w*0.885, zY+cH*0.6, cs2, hexToRgba(s.accentColor, 0.5), hexToRgba(s.accentColor, 0.3), hexToRgba(s.accentColor, 0.2))
      }

      // Semi-transparent dark strip (content zone overlay)
      ctx.fillStyle = hexToRgba('#060810', 0.74); ctx.fillRect(0, zY, w, cH)

      // Person photo — full-height strip, left-center
      if (s.showPhoto) {
        const photoW = w * 0.3 * (s.pfpSize / 100)
        const photoX = (s.pfpX / 100) * w - photoW / 2
        drawPersonRect(ctx, photoX, zY, photoW, cH, s.pfpImage, s.pfpImgZoom, s.pfpImgX, s.pfpImgY)
        // Fade right edge into dark strip
        const pf = ctx.createLinearGradient(photoX+photoW*0.58, 0, photoX+photoW, 0)
        pf.addColorStop(0, 'transparent'); pf.addColorStop(1, hexToRgba('#060810', 0.74))
        ctx.fillStyle = pf; ctx.fillRect(photoX+photoW*0.5, zY, photoW*0.5, cH)
      }

      // Channel name
      const tfs = cH * 0.27 * (s.titleFontSize / 100)
      ctx.font = `700 ${tfs}px '${s.titleFont}', Arial`
      ctx.fillStyle = s.titleColor; ctx.textAlign = 'left'
      ctx.fillText(s.channelName, (s.titleX/100)*w, (s.titleY/100)*h)

      // Niche / subtitle with highlight bar behind text
      if (s.showTagline) {
        const sfs = cH * 0.13 * (s.subtitleFontSize / 100)
        ctx.font = `700 ${sfs}px '${s.subtitleFont}', Arial`
        const tagX = (s.subtitleX/100)*w, tagY = (s.subtitleY/100)*h
        const tagW = ctx.measureText(s.tagline).width
        const pad = sfs * 0.28
        ctx.fillStyle = hexToRgba(s.accentColor, 0.68)
        ctx.fillRect(tagX-pad, tagY-sfs*0.88, tagW+pad*2, sfs*1.18)
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'
        ctx.fillText(s.tagline, tagX, tagY)
      }

      // Schedule / CTA line with small play icon
      if (s.ctaLine2) {
        const cfs = cH * 0.09 * (s.subtitleFontSize / 100)
        const ctaX = (s.subtitleX/100)*w, ctaY = (s.subtitleY/100)*h + cfs*2.1
        const triS = cfs * 0.42
        ctx.fillStyle = hexToRgba('#ffffff', 0.62)
        ctx.beginPath(); ctx.moveTo(ctaX, ctaY-triS); ctx.lineTo(ctaX+triS*1.3, ctaY); ctx.lineTo(ctaX, ctaY+triS)
        ctx.closePath(); ctx.fill()
        ctx.font = `500 ${cfs}px '${s.subtitleFont}', Arial`
        ctx.fillStyle = hexToRgba('#ffffff', 0.65); ctx.textAlign = 'left'
        ctx.fillText(s.ctaLine2, ctaX+triS*2.2, ctaY+cfs*0.3)
      }
      ctx.restore()
    },
  },
]

// ── DEFAULT STATE ────────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  templateId: 0,
  channelName: 'Marie Wells',
  tagline: 'Beauty  |  Makeup  |  Hauls',
  ctaLine2: '',
  showPhoto: true, showTagline: true, showSplash: true,
  showSubscribeBtn: true, showBell: true, showMatrixRain: true, showDecorations: true,
  bgColor: '#650030', accentColor: '#8a0040', accentColor2: '#f0c4a8',
  titleColor: '#f0c4a8', subtitleColor: '#e8b89a',
  bgImage: null, bgPreview: null, bgX: 0, bgY: 0, bgZoom: 100, bgOpacity: 40, overlayOpacity: 55,
  pfpImage: null, pfpPreview: null, pfpSize: 100,
  pfpX: 37, pfpY: 50, pfpImgZoom: 100, pfpImgX: 0, pfpImgY: 0,
  splashX: 55, splashSize: 100,
  titleFont: 'Montserrat', titleFontSize: 100, titleX: 52, titleY: 46,
  subtitleFont: 'Montserrat', subtitleFontSize: 100, subtitleX: 50, subtitleY: 57,
  canvasW: 1280, canvasH: 720,
}

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function BannerStudio() {
  const navigate = useNavigate()
  const [state, setState] = useState({ ...DEFAULT_STATE })
  const [activePlatform, setActivePlatform] = useState(0)
  const canvasRef = useRef(null)
  const thumbRefs = useRef([])

  const set = (k, v) => setState(prev => ({ ...prev, [k]: v }))

  const switchTemplate = (id) => {
    const defs = TEMPLATE_DEFAULTS[id] || {}
    setState(prev => ({ ...prev, ...defs, templateId: id }))
  }

  // Main canvas render
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.width = state.canvasW; canvas.height = state.canvasH
    const ctx = canvas.getContext('2d')
    try { BANNER_TEMPLATES[state.templateId].render(ctx, state.canvasW, state.canvasH, state) }
    catch (e) { console.error('BannerStudio render error:', e) }
  }, [state])

  // Template thumbnails
  useEffect(() => {
    const t = setTimeout(() => {
      BANNER_TEMPLATES.forEach((_, i) => {
        const c = thumbRefs.current[i]; if (!c) return
        c.width = 240; c.height = 60
        const ts = { ...DEFAULT_STATE, ...TEMPLATE_DEFAULTS[i], templateId: i, canvasW: 240, canvasH: 60 }
        try { BANNER_TEMPLATES[i].render(c.getContext('2d'), 240, 60, ts) } catch (_) {}
      })
    }, 120)
    return () => clearTimeout(t)
  }, [])

  function handlePhotoUpload(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => setState(prev => ({ ...prev, pfpImage: img, pfpPreview: ev.target.result }))
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

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

  function downloadBanner() {
    const sz = BANNER_EXPORT_SIZES[activePlatform]
    const tmp = document.createElement('canvas')
    tmp.width = sz.w; tmp.height = sz.h
    const ctx = tmp.getContext('2d')
    try { BANNER_TEMPLATES[state.templateId].render(ctx, sz.w, sz.h, state) }
    catch (e) { console.error(e) }
    const a = document.createElement('a')
    a.download = `IWC-Banner-${BANNER_TEMPLATES[state.templateId].name.replace(/\s/g,'-')}-${sz.l.replace(/\s\/\s/,'-').replace(/\s/g,'-')}.png`
    a.href = tmp.toDataURL('image/png')
    a.click()
  }

  const panel = { background: '#0d1a16', overflowY: 'auto', padding: 16, height: '100%' }
  const divider = { height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 0' }
  const inp = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 7, color: 'white', fontFamily: "'Montserrat',sans-serif",
    fontSize: 12, padding: '7px 10px', width: '100%', boxSizing: 'border-box',
  }
  const subG = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8, padding: '10px 10px 6px', marginBottom: 8,
  }

  const tpl = state.templateId

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080d12', fontFamily: "'Montserrat', sans-serif", color: 'white' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#0a1c10,#0d2818)', borderBottom: '2px solid #2ECC71', padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2ECC71'; e.currentTarget.style.color = '#2ECC71' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
          >← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#2ECC71,#C9A84C)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🖼</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Banner Studio</div>
              <div style={{ fontSize: 8, color: '#2ECC71', letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
            {BANNER_EXPORT_SIZES[activePlatform].l} · {BANNER_EXPORT_SIZES[activePlatform].d}
          </div>
          <button onClick={() => setState({ ...DEFAULT_STATE, ...TEMPLATE_DEFAULTS[tpl], templateId: tpl })} style={{ padding: '7px 14px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, background: 'transparent', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2ECC71'; e.currentTarget.style.color = '#2ECC71' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white' }}
          >↺ Reset</button>
          <button onClick={downloadBanner} style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#2ECC71,#C9A84C)', border: 'none', borderRadius: 8, color: '#0a1c10', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(46,204,113,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >⬇ Download PNG</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 270px', flex: 1, overflow: 'hidden' }}>
        {/* ── LEFT PANEL ── */}
        <div style={{ ...panel, borderRight: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Templates */}
          <SecTitle>Templates</SecTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {BANNER_TEMPLATES.map((t, i) => (
              <div key={i} onClick={() => switchTemplate(i)} style={{ borderRadius: 7, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: `2px solid ${tpl === i ? '#2ECC71' : 'transparent'}`, transition: 'border-color 0.2s, transform 0.2s', transform: tpl === i ? 'scale(1.01)' : 'scale(1)' }}
                onMouseEnter={e => { if (tpl !== i) e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { if (tpl !== i) e.currentTarget.style.transform = 'scale(1)' }}
              >
                <canvas ref={el => thumbRefs.current[i] = el} style={{ width: '100%', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.82)', fontSize: 8, fontWeight: 700, textAlign: 'center', padding: '3px 0', letterSpacing: 1 }}>{t.name}</div>
              </div>
            ))}
          </div>

          <div style={divider} />

          {/* Content */}
          <SecTitle>Content</SecTitle>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 3 }}>Channel / Brand Name</label>
            <input value={state.channelName} onChange={e => set('channelName', e.target.value)} style={inp} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 3 }}>Tagline / Niche</label>
            <input value={state.tagline} onChange={e => set('tagline', e.target.value)} style={inp} />
          </div>
          {(tpl === 1 || tpl === 2) && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 3 }}>
                {tpl === 1 ? 'CTA Line (e.g. NEW VIDEOS EVERYDAY)' : 'Schedule / CTA Line'}
              </label>
              <input value={state.ctaLine2} onChange={e => set('ctaLine2', e.target.value)} style={inp} />
            </div>
          )}

          <div style={divider} />

          {/* Visibility */}
          <SecTitle>Show / Hide</SecTitle>
          <Toggle label="Person Photo" checked={state.showPhoto} onChange={e => set('showPhoto', e.target.checked)} />
          <Toggle label="Tagline" checked={state.showTagline} onChange={e => set('showTagline', e.target.checked)} />
          {tpl === 0 && <Toggle label="Paint Splash" checked={state.showSplash} onChange={e => set('showSplash', e.target.checked)} />}
          {tpl === 1 && <Toggle label="Subscribe Button" checked={state.showSubscribeBtn} onChange={e => set('showSubscribeBtn', e.target.checked)} />}
          {tpl === 1 && <Toggle label="Bell Icon" checked={state.showBell} onChange={e => set('showBell', e.target.checked)} />}
          {tpl === 2 && <Toggle label="Matrix Rain Lines" checked={state.showMatrixRain} onChange={e => set('showMatrixRain', e.target.checked)} />}
          {tpl === 2 && <Toggle label="3D Decorations" checked={state.showDecorations} onChange={e => set('showDecorations', e.target.checked)} />}

          <div style={divider} />

          {/* Title Typography */}
          <SecTitle>Channel Name Typography</SecTitle>
          <div style={subG}>
            <FontSelect value={state.titleFont} onChange={v => set('titleFont', v)} />
            <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Text Color</label>
            <SwatchRow colors={BANNER_COLORS} value={state.titleColor} onChange={c => set('titleColor', c)} />
            <Slider label="Size %" value={state.titleFontSize} min={30} max={220} small onChange={e => set('titleFontSize', +e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <Slider label="X %" value={state.titleX} min={0} max={90} small onChange={e => set('titleX', +e.target.value)} />
              <Slider label="Y %" value={state.titleY} min={0} max={95} small onChange={e => set('titleY', +e.target.value)} />
            </div>
          </div>

          {/* Subtitle Typography */}
          <SecTitle>Tagline Typography</SecTitle>
          <div style={subG}>
            <FontSelect value={state.subtitleFont} onChange={v => set('subtitleFont', v)} />
            <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Text Color</label>
            <SwatchRow colors={BANNER_COLORS} value={state.subtitleColor} onChange={c => set('subtitleColor', c)} />
            <Slider label="Size %" value={state.subtitleFontSize} min={30} max={200} small onChange={e => set('subtitleFontSize', +e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <Slider label="X %" value={state.subtitleX} min={0} max={90} small onChange={e => set('subtitleX', +e.target.value)} />
              <Slider label="Y %" value={state.subtitleY} min={0} max={95} small onChange={e => set('subtitleY', +e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── CENTER CANVAS ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 40%,#0e1c12,#080d12)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div style={{ position: 'relative' }}>
            <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 4, boxShadow: '0 0 0 1px rgba(255,255,255,0.06),0 24px 60px rgba(0,0,0,0.7)', maxWidth: 'min(700px,calc(100vw - 610px))', maxHeight: 'calc(100vh - 120px)' }} />
            <div style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, whiteSpace: 'nowrap' }}>
              {state.canvasW} × {state.canvasH} px · exports at {BANNER_EXPORT_SIZES[activePlatform].w}×{BANNER_EXPORT_SIZES[activePlatform].h}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ ...panel, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Platform / Export Size */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Platform</SecTitle>
            {BANNER_EXPORT_SIZES.map((sz, i) => (
              <button key={i}
                onClick={() => {
                  setActivePlatform(i)
                  setState(prev => ({ ...prev, canvasW: 1280, canvasH: sz.previewH }))
                }}
                style={{
                  background: activePlatform === i ? 'rgba(46,204,113,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activePlatform === i ? '#2ECC71' : 'rgba(255,255,255,0.09)'}`,
                  borderRadius: 7, padding: '8px 10px', color: 'white', cursor: 'pointer',
                  fontSize: 10, fontWeight: 600, textAlign: 'left', width: '100%', marginBottom: 5,
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                }}>
                <div style={{ width: 26, height: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 2, border: `1px solid ${activePlatform === i ? '#2ECC71' : 'rgba(255,255,255,0.15)'}` }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{sz.l}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>{sz.d}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={divider} />

          {/* Photo Upload */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Person Photo</SecTitle>
            {state.pfpPreview ? (
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <img src={state.pfpPreview} alt="" style={{ width: '100%', maxHeight: 100, borderRadius: 6, display: 'block', objectFit: 'cover', border: `2px solid ${state.accentColor}` }} />
                <button onClick={() => setState(prev => ({ ...prev, pfpImage: null, pfpPreview: null }))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', width: 20, height: 20, fontSize: 11, lineHeight: '20px', textAlign: 'center' }}>✕</button>
              </div>
            ) : (
              <label style={{ display: 'block', border: '2px dashed rgba(46,204,113,0.35)', borderRadius: 8, padding: 14, textAlign: 'center', cursor: 'pointer', background: 'rgba(46,204,113,0.04)', marginBottom: 10 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2ECC71'; e.currentTarget.style.background = 'rgba(46,204,113,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(46,204,113,0.35)'; e.currentTarget.style.background = 'rgba(46,204,113,0.04)' }}
              >
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                <div style={{ fontSize: 22, marginBottom: 4 }}>👤</div>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', margin: 0 }}><strong style={{ color: '#2ECC71' }}>Upload</strong> person photo</p>
              </label>
            )}
            <Slider label="Photo Size %" value={state.pfpSize} min={20} max={200} small onChange={e => set('pfpSize', +e.target.value)} />
            <Slider label="Horizontal Position %" value={state.pfpX} min={5} max={90} small onChange={e => set('pfpX', +e.target.value)} />
            <Slider label="Image Zoom %" value={state.pfpImgZoom} min={50} max={300} small onChange={e => set('pfpImgZoom', +e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <Slider label="Pan X" value={state.pfpImgX} min={-400} max={400} small onChange={e => set('pfpImgX', +e.target.value)} />
              <Slider label="Pan Y" value={state.pfpImgY} min={-400} max={400} small onChange={e => set('pfpImgY', +e.target.value)} />
            </div>
          </div>

          {/* Splash controls (Template 0 only) */}
          {tpl === 0 && (
            <>
              <div style={divider} />
              <div style={{ marginBottom: 16 }}>
                <SecTitle>Splash / Blob</SecTitle>
                <Slider label="Splash Center X %" value={state.splashX} min={10} max={90} small onChange={e => set('splashX', +e.target.value)} />
                <Slider label="Splash Size %" value={state.splashSize} min={30} max={180} small onChange={e => set('splashSize', +e.target.value)} />
              </div>
            </>
          )}

          <div style={divider} />

          {/* Background Image */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Background Image</SecTitle>
            {state.bgPreview ? (
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <img src={state.bgPreview} alt="" style={{ width: '100%', maxHeight: 80, borderRadius: 6, display: 'block', objectFit: 'cover' }} />
                <button onClick={() => setState(prev => ({ ...prev, bgImage: null, bgPreview: null }))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', width: 20, height: 20, fontSize: 11, lineHeight: '20px', textAlign: 'center' }}>✕</button>
              </div>
            ) : (
              <label style={{ display: 'block', border: '2px dashed rgba(46,204,113,0.3)', borderRadius: 8, padding: 12, textAlign: 'center', cursor: 'pointer', background: 'rgba(46,204,113,0.03)', marginBottom: 10 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2ECC71' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(46,204,113,0.3)' }}
              >
                <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', margin: 0 }}><strong style={{ color: '#2ECC71' }}>Upload</strong> background image</p>
              </label>
            )}
            <Slider label="Opacity %" value={state.bgOpacity} min={0} max={100} small onChange={e => set('bgOpacity', +e.target.value)} />
          </div>

          <div style={divider} />

          {/* Colours */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Colours</SecTitle>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                {tpl === 0 ? 'Dark Background' : tpl === 1 ? 'Card / Pill Color' : 'Dark Background'}
              </label>
              <SwatchRow colors={BANNER_COLORS} value={state.bgColor} onChange={c => set('bgColor', c)} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                {tpl === 0 ? 'Center Strip' : tpl === 1 ? 'Main Accent / Red' : 'Accent / Highlight'}
              </label>
              <SwatchRow colors={BANNER_COLORS} value={state.accentColor} onChange={c => set('accentColor', c)} />
            </div>
            <div>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                {tpl === 0 ? 'Splash Color' : tpl === 1 ? 'Orange / CTA Color' : 'Secondary / Background Accent'}
              </label>
              <SwatchRow colors={BANNER_COLORS} value={state.accentColor2} onChange={c => set('accentColor2', c)} />
            </div>
            {/* Custom hex input */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
              {[['BG', 'bgColor'], ['Accent 1', 'accentColor'], ['Accent 2', 'accentColor2']].map(([l, k]) => (
                <div key={k}>
                  <label style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 2 }}>{l}</label>
                  <input type="color" value={state[k]} onChange={e => set(k, e.target.value)}
                    style={{ width: '100%', height: 26, borderRadius: 5, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', background: 'none', padding: 1 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
