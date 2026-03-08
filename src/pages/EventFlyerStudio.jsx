import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FLYER_EXPORT_SIZES } from '../utils/constants'
import { FLYER_PLATFORMS, PLATFORM_SVG, svgToDataUri, preloadPlatformImages, getPlatformImage } from '../utils/platformIcons'
import { hexToRgba, roundRect, wrapText } from '../utils/canvasHelpers'

// ── Shared UI bits ──────────────────────────────────────────────────────────
function SecTitle({ children }) {
  return (
    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#E4600A', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(228,96,10,0.2)' }} />
    </div>
  )
}

function RangeCtrl({ label, value, min, max, onChange, small }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: small ? 6 : 9 }}>
      {label && <label style={{ fontSize: small ? 9 : 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="range" min={min} max={max} value={value} onChange={onChange} style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', width: 30, textAlign: 'right', flexShrink: 0 }}>{value}</span>
      </div>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
      <span>{label}</span>
      <label style={{ position: 'relative', width: 34, height: 18, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: checked ? '#E4600A' : 'rgba(255,255,255,0.2)', borderRadius: 20, transition: 'background 0.3s' }}>
          <div style={{ position: 'absolute', width: 12, height: 12, left: checked ? 19 : 3, top: 3, background: 'white', borderRadius: '50%', transition: 'left 0.3s' }} />
        </div>
      </label>
    </div>
  )
}

function ColorSwatchRow({ colors, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {colors.map(({ c, n }) => (
        <div key={c} title={n || c} onClick={() => onChange(c)} style={{
          width: 26, height: 26, borderRadius: 5, background: c,
          border: `2px solid ${value === c ? 'white' : c === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
          cursor: 'pointer', transition: 'transform 0.15s',
          transform: value === c ? 'scale(1.12)' : 'scale(1)',
          boxShadow: value === c ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none',
        }} />
      ))}
    </div>
  )
}

function SpeakerUpload({ speaker, index, onUpdate, onImageUpload }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: 10, marginBottom: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {/* Photo */}
        <label style={{
          width: 54, height: 54, flexShrink: 0,
          border: speaker.previewSrc ? 'none' : '2px dashed rgba(228,96,10,0.4)',
          borderRadius: 8, cursor: 'pointer', overflow: 'hidden',
          background: speaker.previewSrc ? 'none' : 'rgba(228,96,10,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <input type="file" accept="image/*" onChange={e => onImageUpload(index, e)} style={{ display: 'none' }} />
          {speaker.previewSrc
            ? <img src={speaker.previewSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 20 }}>👤</span>
          }
        </label>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <input type="text" placeholder={`Speaker ${index + 1} name`} value={speaker.name}
            onChange={e => onUpdate(index, 'name', e.target.value)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'white', fontFamily: "'Montserrat',sans-serif", fontSize: 11, padding: '5px 8px', width: '100%' }} />
          <input type="text" placeholder="Title / Role" value={speaker.title}
            onChange={e => onUpdate(index, 'title', e.target.value)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'white', fontFamily: "'Montserrat',sans-serif", fontSize: 10, padding: '5px 8px', width: '100%' }} />
        </div>
      </div>
    </div>
  )
}

// ── COLOR PALETTE ──────────────────────────────────────────────────────────
const EVENT_COLORS = [
  { c: '#E4600A', n: 'Orange' },
  { c: '#F5B800', n: 'Yellow' },
  { c: '#5B2D8E', n: 'Purple' },
  { c: '#C9A84C', n: 'Gold' },
  { c: '#E74C3C', n: 'Red' },
  { c: '#2ECC71', n: 'Green' },
  { c: '#3498DB', n: 'Blue' },
  { c: '#E91E63', n: 'Pink' },
  { c: '#ffffff', n: 'White' },
  { c: '#1A1A2E', n: 'Dark' },
]

// ── CANVAS TEMPLATES ───────────────────────────────────────────────────────
function drawGridBg(ctx, w, h, bgColor = '#f0f0f0') {
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 1
  const step = w / 30
  for (let x = 0; x <= w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
  for (let y = 0; y <= h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
}

function drawSpeakerCircle(ctx, w, h, speaker, cx, cy, r, borderColor) {
  ctx.save()
  ctx.shadowColor = hexToRgba(borderColor, 0.5)
  ctx.shadowBlur = r * 0.3
  ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2)
  ctx.fillStyle = borderColor; ctx.fill()
  ctx.shadowBlur = 0

  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
  if (speaker.image) {
    const iw = speaker.image.naturalWidth, ih = speaker.image.naturalHeight
    const sc = Math.max(r * 2 / iw, r * 2 / ih)
    ctx.drawImage(speaker.image, cx - iw * sc / 2, cy - ih * sc / 2, iw * sc, ih * sc)
  } else {
    // Gradient placeholder
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
    g.addColorStop(0, '#c8c8c8'); g.addColorStop(1, '#e8e8e8')
    ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = 'rgba(100,100,100,0.3)'; ctx.font = `bold ${r * 0.7}px serif`
    ctx.textAlign = 'center'; ctx.fillText('👤', cx, cy + r * 0.25)
  }
  ctx.restore()
}

function drawDecorativeSquares(ctx, w, h, cx, cy, r, color1, color2) {
  const sq = r * 0.7
  // Yellow square (offset top-right)
  ctx.fillStyle = color2
  roundRect(ctx, cx + r * 0.5, cy - r * 1.2, sq, sq, 8)
  ctx.fill()
  // Orange square (offset bottom-right)
  ctx.fillStyle = color1
  roundRect(ctx, cx + r * 0.7, cy - r * 0.4, sq * 1.1, sq * 1.1, 10)
  ctx.fill()
}

const FLYER_TEMPLATES = [
  {
    id: 0, name: 'Promo',
    render(ctx, w, h, s, getImg) {
      // Light grid background
      drawGridBg(ctx, w, h, '#f5f5f5')

      // Decorative background squares (top-right quadrant)
      const sq1 = w * 0.38
      ctx.fillStyle = s.accentColor2
      roundRect(ctx, w * 0.58, h * 0.05, sq1, sq1 * 0.9, 16)
      ctx.fill()
      ctx.fillStyle = s.accentColor
      roundRect(ctx, w * 0.66, h * 0.18, sq1 * 0.9, sq1 * 1.0, 14)
      ctx.fill()

      // Host photo circle
      const photoR = w * 0.22
      const photoCX = w * 0.73
      const photoCY = h * 0.45
      ctx.save()
      ctx.beginPath(); ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2); ctx.clip()
      if (s.speakers[0].image) {
        const img = s.speakers[0].image
        const iw = img.naturalWidth, ih = img.naturalHeight
        const sc = Math.max(photoR * 2 / iw, photoR * 2 / ih)
        ctx.drawImage(img, photoCX - iw * sc / 2, photoCY - ih * sc / 2, iw * sc, ih * sc)
      } else {
        const g = ctx.createLinearGradient(photoCX - photoR, photoCY - photoR, photoCX + photoR, photoCY + photoR)
        g.addColorStop(0, '#e0c0a0'); g.addColorStop(1, '#c09070')
        ctx.fillStyle = g; ctx.fillRect(photoCX - photoR, photoCY - photoR, photoR * 2, photoR * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = `bold ${photoR * 0.7}px serif`
        ctx.textAlign = 'center'; ctx.fillText('👤', photoCX, photoCY + photoR * 0.25); ctx.textAlign = 'left'
      }
      ctx.restore()

      // Brand tag box (top-center / top-left area)
      const tagW = w * 0.28, tagH = h * 0.05
      const tagX = w * 0.05, tagY = h * 0.05
      ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2
      roundRect(ctx, tagX, tagY, tagW, tagH, tagH / 2)
      ctx.stroke()
      ctx.font = `bold ${w * 0.022}px 'Montserrat', Arial`; ctx.fillStyle = '#1a1a2e'
      ctx.textAlign = 'center'; ctx.fillText(s.brandName, tagX + tagW / 2, tagY + tagH * 0.68); ctx.textAlign = 'left'

      // Event title - large left side
      const titleFontSize = w * 0.075 * (s.titleScale / 100)
      ctx.font = `900 ${titleFontSize}px 'Montserrat', Arial`
      ctx.fillStyle = '#1a1a2e'
      wrapText(ctx, s.eventTitle, w * 0.05, h * 0.22, w * 0.48, titleFontSize * 1.15)

      // "WITH" small
      ctx.font = `400 ${w * 0.028}px 'Montserrat', Arial`
      ctx.fillStyle = '#555'
      ctx.fillText('WITH', w * 0.06, h * 0.42)

      // Host/Speaker name — big bold
      const hostFontSize = w * 0.1 * (s.titleScale / 100)
      ctx.font = `900 ${hostFontSize}px 'Montserrat', Arial`
      ctx.fillStyle = '#1a1a2e'
      ctx.fillText(s.speakers[0].name || 'LADY ADEL', w * 0.05, h * 0.55)

      // Underline accent
      const nameW = ctx.measureText(s.speakers[0].name || 'LADY ADEL').width
      ctx.strokeStyle = s.accentColor; ctx.lineWidth = 4; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(w * 0.05, h * 0.575); ctx.lineTo(w * 0.05 + nameW, h * 0.575); ctx.stroke()

      // Date badge
      const badgeW = w * 0.26, badgeH = h * 0.065
      const badgeX = w * 0.05, badgeY = h * 0.64
      ctx.fillStyle = '#1a1a2e'
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2)
      ctx.fill()
      ctx.font = `800 ${w * 0.03}px 'Montserrat', Arial`; ctx.fillStyle = s.accentColor
      ctx.textAlign = 'center'; ctx.fillText(s.date, badgeX + badgeW / 2, badgeY + badgeH * 0.68); ctx.textAlign = 'left'

      // Platform logo
      if (s.meetingPlatform !== 'none') {
        const platImg = getImg(s.meetingPlatform)
        if (platImg) {
          const ps = w * 0.07
          ctx.save(); ctx.globalAlpha = 0.9
          ctx.drawImage(platImg, w * 0.05, h * 0.76, ps, ps)
          ctx.restore()
          ctx.font = `800 ${w * 0.035}px 'Montserrat', Arial`; ctx.fillStyle = '#1a1a2e'
          ctx.fillText(s.meetingPlatform.charAt(0).toUpperCase() + s.meetingPlatform.slice(1), w * 0.05 + ps + 10, h * 0.76 + ps * 0.65)
        }
      }

      // Day badge if > 0
      if (s.showDay) {
        const dayText = `DAY ${s.dayNumber}`
        const dayBadgeW = w * 0.18
        ctx.fillStyle = s.accentColor
        roundRect(ctx, w * 0.77, h * 0.82, dayBadgeW, h * 0.06, 8)
        ctx.fill()
        ctx.font = `900 ${w * 0.032}px 'Montserrat', Arial`; ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'; ctx.fillText(dayText, w * 0.77 + dayBadgeW / 2, h * 0.82 + h * 0.04); ctx.textAlign = 'left'
      }
    }
  },
  {
    id: 1, name: 'Speaker Grid',
    render(ctx, w, h, s, getImg) {
      drawGridBg(ctx, w, h, '#f8f8f8')

      // Speaker photos in grid (top 50%)
      const speakers = s.speakers.filter(sp => sp.name)
      const count = Math.max(1, Math.min(4, speakers.length || 4))
      const r = w * 0.1
      const totalW = count * r * 2.8
      const startX = (w - totalW) / 2 + r
      const cy = h * 0.28

      // Draw all 4 slots (even if empty)
      const slots = 4
      const slotR = w * 0.1
      const slotSpacing = w * 0.24
      const slotStartX = (w - slotSpacing * (slots - 1)) / 2

      for (let i = 0; i < slots; i++) {
        const cx = slotStartX + i * slotSpacing
        const sp = s.speakers[i] || { name: '', title: '', image: null }

        // Decorative colored squares behind photo
        const sq = slotR * 0.55
        ctx.fillStyle = i % 2 === 0 ? s.accentColor : s.accentColor2
        roundRect(ctx, cx + slotR * 0.4, cy - slotR * 1.0, sq, sq, 5); ctx.fill()
        ctx.fillStyle = i % 2 === 0 ? s.accentColor2 : s.accentColor
        roundRect(ctx, cx + slotR * 0.55, cy - slotR * 0.35, sq * 0.9, sq * 0.9, 4); ctx.fill()

        drawSpeakerCircle(ctx, w, h, sp, cx, cy, slotR, sp.name ? s.accentColor : '#ccc')

        // Name below
        if (sp.name) {
          ctx.font = `700 ${w * 0.022}px 'Montserrat', Arial`
          ctx.fillStyle = '#1a1a2e'; ctx.textAlign = 'center'
          ctx.fillText(sp.name, cx, cy + slotR + 28 * (w / 1080))
          ctx.font = `400 ${w * 0.016}px 'Montserrat', Arial`
          ctx.fillStyle = '#666'
          // Wrap title in 2 lines max
          const titleLines = sp.title ? sp.title.split('&') : []
          titleLines.forEach((ln, li) => ctx.fillText(ln.trim(), cx, cy + slotR + 46 * (w / 1080) + li * 18 * (w / 1080)))
          ctx.textAlign = 'left'
        }
      }

      // Bottom branding section split
      const bY = h * 0.62

      // Left: brand + event title
      ctx.font = `800 ${w * 0.012}px 'Montserrat', Arial`; ctx.fillStyle = '#888'
      const brandBoxW = w * 0.22, brandBoxH = h * 0.04
      ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 1.5
      roundRect(ctx, w * 0.05, bY, brandBoxW, brandBoxH, brandBoxH / 2); ctx.stroke()
      ctx.font = `700 ${w * 0.018}px 'Montserrat', Arial`; ctx.fillStyle = '#1a1a2e'
      ctx.textAlign = 'center'; ctx.fillText(s.brandName, w * 0.05 + brandBoxW / 2, bY + brandBoxH * 0.68); ctx.textAlign = 'left'

      const eTitleSize = w * 0.06 * (s.titleScale / 100)
      ctx.font = `900 ${eTitleSize}px 'Montserrat', Arial`; ctx.fillStyle = '#1a1a2e'
      wrapText(ctx, s.eventTitle, w * 0.05, bY + brandBoxH + 16 * (w / 1080), w * 0.36, eTitleSize * 1.15)

      const hostTitleSize = w * 0.07 * (s.titleScale / 100)
      ctx.font = `900 ${hostTitleSize}px 'Montserrat', Arial`; ctx.fillStyle = '#1a1a2e'
      ctx.fillText(s.speakers[0].name || '', w * 0.05, bY + brandBoxH + eTitleSize * 1.3 + 18 * (w / 1080))

      // Underline
      ctx.strokeStyle = s.accentColor; ctx.lineWidth = 3; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(w * 0.05, bY + brandBoxH + eTitleSize * 1.3 + 24 * (w / 1080))
      ctx.lineTo(w * 0.05 + w * 0.26, bY + brandBoxH + eTitleSize * 1.3 + 24 * (w / 1080))
      ctx.stroke()

      // Live on badge
      if (s.meetingPlatform !== 'none') {
        const liveY = h * 0.9
        ctx.fillStyle = '#1a1a2e'
        roundRect(ctx, w * 0.05, liveY, w * 0.13, h * 0.04, h * 0.02); ctx.fill()
        ctx.font = `700 ${w * 0.018}px 'Montserrat', Arial`; ctx.fillStyle = 'white'
        ctx.textAlign = 'center'; ctx.fillText('Live on', w * 0.05 + w * 0.065, liveY + h * 0.026); ctx.textAlign = 'left'

        const platImg = getImg(s.meetingPlatform)
        if (platImg) {
          const ps = h * 0.055
          ctx.save(); ctx.globalAlpha = 0.95
          ctx.drawImage(platImg, w * 0.2, liveY - ps * 0.1, ps, ps)
          ctx.restore()
        }
      }

      // Right: dark details card
      const cardX = w * 0.48, cardY = bY - 10, cardW = w * 0.47, cardH = h - cardY - h * 0.04
      ctx.fillStyle = '#1a1a2e'
      roundRect(ctx, cardX, cardY, cardW, cardH, 14); ctx.fill()

      // QR code area
      const qrSize = Math.min(cardW * 0.42, cardH * 0.6)
      const qrX = cardX + cardW * 0.04, qrY = cardY + cardH * 0.1
      if (s.qrCode) {
        ctx.drawImage(s.qrCode, qrX, qrY, qrSize, qrSize)
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        roundRect(ctx, qrX, qrY, qrSize, qrSize, 6); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = `${qrSize * 0.3}px serif`
        ctx.textAlign = 'center'; ctx.fillText('▦', qrX + qrSize / 2, qrY + qrSize * 0.65); ctx.textAlign = 'left'
      }

      // Scan to register button
      const btnY = qrY + qrSize + 8
      ctx.fillStyle = s.accentColor2
      roundRect(ctx, qrX, btnY, qrSize, cardH * 0.1, 6); ctx.fill()
      ctx.font = `700 ${qrSize * 0.12}px 'Montserrat', Arial`; ctx.fillStyle = '#1a1a2e'
      ctx.textAlign = 'center'; ctx.fillText('Scan to register', qrX + qrSize / 2, btnY + cardH * 0.068); ctx.textAlign = 'left'

      // Details right side
      const detX = cardX + cardW * 0.5, detY = cardY + cardH * 0.12
      const lineH = cardH * 0.14
      const iconCol = s.accentColor

      // Date
      ctx.font = `${qrSize * 0.12}px serif`; ctx.fillStyle = iconCol; ctx.fillText('📅', detX, detY + lineH * 0.55)
      ctx.font = `600 ${qrSize * 0.1}px 'Montserrat', Arial`; ctx.fillStyle = 'white'
      ctx.fillText(s.date, detX + qrSize * 0.18, detY + lineH * 0.55)

      // Separator
      ctx.strokeStyle = iconCol; ctx.lineWidth = 1; ctx.globalAlpha = 0.3
      ctx.beginPath(); ctx.moveTo(detX, detY + lineH * 0.75); ctx.lineTo(detX + cardW * 0.42, detY + lineH * 0.75); ctx.stroke()
      ctx.globalAlpha = 1

      // Meeting
      ctx.font = `${qrSize * 0.12}px serif`; ctx.fillStyle = iconCol; ctx.fillText('📹', detX, detY + lineH * 1.6)
      ctx.font = `600 ${qrSize * 0.09}px 'Montserrat', Arial`; ctx.fillStyle = 'white'
      if (s.meetingId) {
        ctx.fillText(`Meeting ID: ${s.meetingId}`, detX + qrSize * 0.18, detY + lineH * 1.55)
        ctx.font = `400 ${qrSize * 0.08}px 'Montserrat', Arial`
        ctx.fillText(`Passcode: ${s.passcode}`, detX + qrSize * 0.18, detY + lineH * 1.8)
      }

      ctx.strokeStyle = iconCol; ctx.lineWidth = 1; ctx.globalAlpha = 0.3
      ctx.beginPath(); ctx.moveTo(detX, detY + lineH * 1.95); ctx.lineTo(detX + cardW * 0.42, detY + lineH * 1.95); ctx.stroke()
      ctx.globalAlpha = 1

      // Time
      ctx.font = `${qrSize * 0.12}px serif`; ctx.fillStyle = iconCol; ctx.fillText('🕐', detX, detY + lineH * 2.55)
      ctx.font = `600 ${qrSize * 0.09}px 'Montserrat', Arial`; ctx.fillStyle = 'white'
      ctx.fillText('Time', detX + qrSize * 0.18, detY + lineH * 2.45)
      ctx.font = `400 ${qrSize * 0.08}px 'Montserrat', Arial`
      ctx.fillText(s.time, detX + qrSize * 0.18, detY + lineH * 2.68)

      // Day badge
      if (s.showDay) {
        ctx.fillStyle = s.accentColor
        const dayBadgeW = cardW * 0.35
        roundRect(ctx, cardX + cardW - dayBadgeW - 10, cardY + 10, dayBadgeW, cardH * 0.1, 6); ctx.fill()
        ctx.font = `900 ${qrSize * 0.12}px 'Montserrat', Arial`; ctx.fillStyle = 'white'
        ctx.textAlign = 'center'
        ctx.fillText(`DAY ${s.dayNumber}`, cardX + cardW - dayBadgeW / 2 - 10, cardY + cardH * 0.088)
        ctx.textAlign = 'left'
      }
    }
  },
  {
    id: 2, name: 'Day Card',
    render(ctx, w, h, s, getImg) {
      // Dark gradient base
      const bg = ctx.createLinearGradient(0, 0, w, h)
      bg.addColorStop(0, '#0d0520'); bg.addColorStop(1, '#1a0a35')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)

      // Glowing radials
      const g1 = ctx.createRadialGradient(w * 0.1, h * 0.1, 0, w * 0.1, h * 0.1, w * 0.6)
      g1.addColorStop(0, hexToRgba(s.accentColor, 0.3)); g1.addColorStop(1, 'transparent')
      ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h)
      const g2 = ctx.createRadialGradient(w * 0.9, h * 0.9, 0, w * 0.9, h * 0.9, w * 0.5)
      g2.addColorStop(0, hexToRgba(s.accentColor2, 0.25)); g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h)

      // Big "DAY N" watermark
      if (s.showDay) {
        ctx.font = `900 ${w * 0.28}px 'Montserrat', Arial`
        ctx.fillStyle = hexToRgba('#ffffff', 0.04)
        ctx.textAlign = 'center'
        ctx.fillText(`DAY ${s.dayNumber}`, w / 2, h * 0.55)
        ctx.textAlign = 'left'
      }

      // Brand tag
      ctx.strokeStyle = s.accentColor; ctx.lineWidth = 1.5
      const bw2 = w * 0.22, bh2 = h * 0.046
      roundRect(ctx, w * 0.05, h * 0.05, bw2, bh2, bh2 / 2); ctx.stroke()
      ctx.font = `700 ${w * 0.02}px 'Montserrat', Arial`; ctx.fillStyle = s.accentColor
      ctx.textAlign = 'center'; ctx.fillText(s.brandName, w * 0.05 + bw2 / 2, h * 0.05 + bh2 * 0.67); ctx.textAlign = 'left'

      // Day badge (prominent)
      if (s.showDay) {
        const dbadgeW = w * 0.24, dbadgeH = h * 0.075
        ctx.fillStyle = s.accentColor
        roundRect(ctx, w * 0.05, h * 0.14, dbadgeW, dbadgeH, 12); ctx.fill()
        ctx.font = `900 ${w * 0.036}px 'Montserrat', Arial`; ctx.fillStyle = 'white'
        ctx.textAlign = 'center'
        ctx.fillText(`DAY ${s.dayNumber}`, w * 0.05 + dbadgeW / 2, h * 0.14 + dbadgeH * 0.68)
        ctx.textAlign = 'left'
      }

      // Event title
      const titleSize = w * 0.08 * (s.titleScale / 100)
      ctx.font = `900 ${titleSize}px 'Montserrat', Arial`; ctx.fillStyle = 'white'
      wrapText(ctx, s.eventTitle, w * 0.05, h * 0.27, w * 0.6, titleSize * 1.15)
      const hostSize = w * 0.1 * (s.titleScale / 100)
      ctx.font = `900 ${hostSize}px 'Montserrat', Arial`; ctx.fillStyle = s.accentColor
      const hostY = h * 0.27 + titleSize * 2.2
      ctx.fillText(s.speakers[0].name || '', w * 0.05, hostY)
      ctx.strokeStyle = s.accentColor2; ctx.lineWidth = 4; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(w * 0.05, hostY + 12); ctx.lineTo(w * 0.05 + w * 0.3, hostY + 12); ctx.stroke()

      // Speaker photos row
      const spCount = Math.min(4, s.speakers.filter(sp => sp.name).length || 1)
      const spR = w * 0.09
      const spGap = w * 0.22
      const spStartX = w * 0.05 + spR
      const spY = h * 0.7

      for (let i = 0; i < 4; i++) {
        const sp = s.speakers[i]
        if (!sp || (!sp.name && !sp.image)) continue
        const scx = spStartX + i * spGap
        drawSpeakerCircle(ctx, w, h, sp, scx, spY, spR, sp.name ? s.accentColor : '#555')
        if (sp.name) {
          ctx.font = `700 ${w * 0.02}px 'Montserrat', Arial`; ctx.fillStyle = 'white'
          ctx.textAlign = 'center'; ctx.fillText(sp.name, scx, spY + spR + 24 * (w / 1080))
          ctx.font = `400 ${w * 0.015}px 'Montserrat', Arial`; ctx.fillStyle = hexToRgba(s.accentColor, 0.8)
          ctx.fillText(sp.title || '', scx, spY + spR + 40 * (w / 1080))
          ctx.textAlign = 'left'
        }
      }

      // Details strip at bottom
      const stripY = h * 0.9
      ctx.fillStyle = hexToRgba('#000', 0.4); ctx.fillRect(0, stripY, w, h - stripY)
      ctx.strokeStyle = s.accentColor; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(0, stripY); ctx.lineTo(w, stripY); ctx.stroke()

      ctx.font = `600 ${w * 0.022}px 'Montserrat', Arial`; ctx.fillStyle = 'white'
      ctx.fillText(s.date, w * 0.05, stripY + (h - stripY) * 0.55)
      if (s.time) {
        ctx.fillStyle = hexToRgba(s.accentColor, 0.9)
        ctx.fillText('·', w * 0.38, stripY + (h - stripY) * 0.55)
        ctx.fillStyle = 'white'
        ctx.fillText(s.time, w * 0.41, stripY + (h - stripY) * 0.55)
      }
      if (s.meetingPlatform !== 'none') {
        const platImg = getImg(s.meetingPlatform)
        if (platImg) {
          const ps = (h - stripY) * 0.75
          ctx.save(); ctx.globalAlpha = 0.9
          ctx.drawImage(platImg, w * 0.88, stripY + (h - stripY) * 0.12, ps, ps)
          ctx.restore()
        }
      }
    }
  },
]

// ── DEFAULT STATE ──────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  templateId: 0,
  eventTitle: 'Catch Up',
  brandName: 'IWC Concepts',
  accentColor: '#E4600A',
  accentColor2: '#F5B800',
  date: '2nd - 3rd March, 2026',
  time: '6:00pm - 7:30pm GMT0',
  meetingPlatform: 'zoom',
  meetingId: '843 6787 5281',
  passcode: 'GOHIGHER',
  dayNumber: 1,
  showDay: true,
  titleScale: 100,
  canvasW: 1080, canvasH: 1080,
  speakers: [
    { name: 'Lady Adel', title: 'Host', image: null, previewSrc: null },
    { name: 'Juliet Adu Gyamfi', title: 'Legal Advocate & Social Impact Leader', image: null, previewSrc: null },
    { name: 'Dr. Isabella Ntredu', title: 'Obstetrician Gynaecologist', image: null, previewSrc: null },
    { name: 'Derrick Agyare', title: 'PR Strategist/ Advisor', image: null, previewSrc: null },
  ],
  qrCode: null, qrPreview: null,
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function EventFlyerStudio() {
  const navigate = useNavigate()
  const [state, setState] = useState({ ...DEFAULT_STATE, speakers: DEFAULT_STATE.speakers.map(s => ({ ...s })) })
  const [iconsLoaded, setIconsLoaded] = useState(false)
  const [activeExport, setActiveExport] = useState(0)
  const canvasRef = useRef(null)
  const thumbCanvases = useRef([])

  const set = (key, val) => setState(prev => ({ ...prev, [key]: val }))

  useEffect(() => { preloadPlatformImages().then(() => setIconsLoaded(true)) }, [])
  useEffect(() => { renderCanvas() }, [state, iconsLoaded])
  useEffect(() => {
    const t = setTimeout(() => FLYER_TEMPLATES.forEach((_, i) => renderThumb(i)), 250)
    return () => clearTimeout(t)
  }, [iconsLoaded])

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.width = state.canvasW; canvas.height = state.canvasH
    const ctx = canvas.getContext('2d')
    try { FLYER_TEMPLATES[state.templateId].render(ctx, state.canvasW, state.canvasH, state, getPlatformImage) } catch (e) { console.warn(e) }
  }, [state, iconsLoaded])

  function renderThumb(i) {
    const canvas = thumbCanvases.current[i]; if (!canvas) return
    canvas.width = 240; canvas.height = 160
    const ctx = canvas.getContext('2d')
    const thumbState = {
      ...DEFAULT_STATE,
      speakers: DEFAULT_STATE.speakers.map(s => ({ ...s })),
      templateId: i, canvasW: 240, canvasH: 160,
    }
    try { FLYER_TEMPLATES[i].render(ctx, 240, 160, thumbState, getPlatformImage) } catch (e) {}
  }

  function updateSpeaker(index, field, value) {
    setState(prev => {
      const speakers = prev.speakers.map((sp, i) => i === index ? { ...sp, [field]: value } : sp)
      return { ...prev, speakers }
    })
  }

  function handleSpeakerImage(index, e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => updateSpeaker(index, 'image', img)
      img.src = ev.target.result
      updateSpeaker(index, 'previewSrc', ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  // Need to handle image separately (can't set both at once easily)
  function handleSpeakerImageFull(index, e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        setState(prev => {
          const speakers = prev.speakers.map((sp, i) =>
            i === index ? { ...sp, image: img, previewSrc: ev.target.result } : sp
          )
          return { ...prev, speakers }
        })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function handleQrUpload(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => setState(prev => ({ ...prev, qrCode: img, qrPreview: ev.target.result }))
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function downloadFlyer() {
    const canvas = canvasRef.current
    const a = document.createElement('a')
    a.download = `IWC-Flyer-Day${state.dayNumber}-${Date.now()}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  function resetAll() {
    setState({ ...DEFAULT_STATE, speakers: DEFAULT_STATE.speakers.map(s => ({ ...s })) })
    setActiveExport(0)
  }

  const panelStyle = { background: '#120a1e', overflowY: 'auto', padding: 16, height: '100%' }
  const secStyle = { marginBottom: 18 }
  const dividerStyle = { height: 1, background: 'rgba(255,255,255,0.07)', margin: '14px 0' }
  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', fontFamily: "'Montserrat',sans-serif", fontSize: 12, padding: '7px 10px', width: '100%' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0614' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1a0a0a, #2d1010)',
        borderBottom: '2px solid #E4600A',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E4600A'; e.currentTarget.style.color = '#E4600A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
          >← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#E4600A,#F5B800)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📣</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Event Flyer Studio</div>
              <div style={{ fontSize: 8, color: '#E4600A', letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={resetAll} style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, background: 'transparent', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E4600A'; e.currentTarget.style.color = '#E4600A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white' }}
          >↺ Reset</button>
          <button onClick={downloadFlyer} style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#E4600A,#F5B800)', border: 'none', borderRadius: 8, color: '#1A1A2E', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(228,96,10,0.4)' }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FLYER_TEMPLATES.map((t, i) => (
                <div key={i} onClick={() => set('templateId', i)} style={{
                  borderRadius: 8, overflow: 'hidden',
                  border: `2px solid ${state.templateId === i ? '#E4600A' : 'transparent'}`,
                  cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s',
                  transform: state.templateId === i ? 'scale(1.01)' : 'scale(1)',
                  position: 'relative',
                }}
                  onMouseEnter={e => { if (state.templateId !== i) e.currentTarget.style.transform = 'scale(1.02)' }}
                  onMouseLeave={e => { if (state.templateId !== i) e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <canvas ref={el => thumbCanvases.current[i] = el} style={{ width: '100%', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.75)', fontSize: 8, fontWeight: 700, textAlign: 'center', padding: 4 }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Event Info */}
          <div style={secStyle}>
            <SecTitle>Event Info</SecTitle>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Event Title</label>
              <input type="text" value={state.eventTitle} onChange={e => set('eventTitle', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Brand / Organisation</label>
              <input type="text" value={state.brandName} onChange={e => set('brandName', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Date</label>
              <input type="text" value={state.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Time</label>
              <input type="text" value={state.time} onChange={e => set('time', e.target.value)} style={inputStyle} />
            </div>
            <RangeCtrl label="Title Scale %" value={state.titleScale} min={50} max={150} onChange={e => set('titleScale', +e.target.value)} />
          </div>

          <div style={dividerStyle} />

          {/* Day Control */}
          <div style={secStyle}>
            <SecTitle>Day Settings</SecTitle>
            <ToggleRow label="Show Day Number" checked={state.showDay} onChange={e => set('showDay', e.target.checked)} />
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Day Number</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                  <button key={d} onClick={() => set('dayNumber', d)} style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: state.dayNumber === d ? '#E4600A' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${state.dayNumber === d ? '#E4600A' : 'rgba(255,255,255,0.12)'}`,
                    color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>{d}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Colours */}
          <div style={secStyle}>
            <SecTitle>Colours</SecTitle>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>Primary Accent</label>
            <ColorSwatchRow colors={EVENT_COLORS} value={state.accentColor} onChange={c => set('accentColor', c)} />
            <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', margin: '10px 0 5px' }}>Secondary Accent</label>
            <ColorSwatchRow colors={EVENT_COLORS} value={state.accentColor2} onChange={c => set('accentColor2', c)} />
          </div>
        </div>

        {/* CENTER */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at 50% 40%, #1e0a30, #0a0614)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div style={{ position: 'relative' }}>
            <canvas ref={canvasRef} style={{
              display: 'block', borderRadius: 4,
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.7)',
              maxWidth: 'min(560px, calc(100vw - 620px))',
              maxHeight: 'calc(100vh - 120px)',
            }} />
            <div style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, whiteSpace: 'nowrap' }}>
              {state.canvasW} × {state.canvasH} px
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ ...panelStyle, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Export Size */}
          <div style={secStyle}>
            <SecTitle>Export Size</SecTitle>
            {FLYER_EXPORT_SIZES.map((sz, i) => (
              <button key={i} onClick={() => { setActiveExport(i); set('canvasW', sz.w); set('canvasH', sz.h) }} style={{
                background: activeExport === i ? 'rgba(228,96,10,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeExport === i ? '#E4600A' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 7, padding: '7px 10px', color: 'white', cursor: 'pointer',
                fontSize: 10, fontWeight: 600, textAlign: 'left', width: '100%', marginBottom: 5,
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
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

          {/* Platform / Meeting */}
          <div style={secStyle}>
            <SecTitle>Meeting Platform</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, marginBottom: 12 }}>
              {FLYER_PLATFORMS.map(plat => (
                <div key={plat.id} onClick={() => set('meetingPlatform', plat.id)} style={{
                  borderRadius: 7, padding: '6px 4px', textAlign: 'center', cursor: 'pointer',
                  border: `2px solid ${state.meetingPlatform === plat.id ? '#E4600A' : 'transparent'}`,
                  background: state.meetingPlatform === plat.id ? 'rgba(228,96,10,0.12)' : 'rgba(255,255,255,0.04)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  transition: 'all 0.2s',
                }}>
                  <img src={svgToDataUri(PLATFORM_SVG[plat.id] || PLATFORM_SVG.none)} width={28} height={28} style={{ borderRadius: 6 }} alt={plat.label} />
                  <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{plat.label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Meeting ID</label>
              <input type="text" value={state.meetingId} onChange={e => set('meetingId', e.target.value)} style={inputStyle} placeholder="e.g. 843 6787 5281" />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Passcode</label>
              <input type="text" value={state.passcode} onChange={e => set('passcode', e.target.value)} style={inputStyle} placeholder="e.g. GOHIGHER" />
            </div>
          </div>

          <div style={dividerStyle} />

          {/* QR Code */}
          <div style={secStyle}>
            <SecTitle>QR Code</SecTitle>
            {state.qrPreview ? (
              <div style={{ position: 'relative' }}>
                <img src={state.qrPreview} alt="" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
                <button onClick={() => setState(prev => ({ ...prev, qrCode: null, qrPreview: null }))} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.75)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', width: 18, height: 18, fontSize: 11, lineHeight: '18px', textAlign: 'center' }}>✕</button>
              </div>
            ) : (
              <label style={{ display: 'block', border: '2px dashed rgba(228,96,10,0.35)', borderRadius: 9, padding: 16, textAlign: 'center', cursor: 'pointer', background: 'rgba(228,96,10,0.04)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E4600A'; e.currentTarget.style.background = 'rgba(228,96,10,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(228,96,10,0.35)'; e.currentTarget.style.background = 'rgba(228,96,10,0.04)' }}
              >
                <input type="file" accept="image/*" onChange={handleQrUpload} style={{ display: 'none' }} />
                <div style={{ fontSize: 24, marginBottom: 4 }}>▦</div>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}><strong style={{ color: '#E4600A' }}>Upload</strong> QR code image</p>
              </label>
            )}
          </div>

          <div style={dividerStyle} />

          {/* Speakers */}
          <div style={secStyle}>
            <SecTitle>Speakers / Host</SecTitle>
            {state.speakers.map((sp, i) => (
              <SpeakerUpload
                key={i}
                speaker={sp}
                index={i}
                onUpdate={(idx, field, val) => {
                  if (field === 'previewSrc') return
                  setState(prev => {
                    const speakers = prev.speakers.map((s, si) => si === idx ? { ...s, [field]: val } : s)
                    return { ...prev, speakers }
                  })
                }}
                onImageUpload={handleSpeakerImageFull}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
