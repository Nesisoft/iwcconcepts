import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FLYER_EXPORT_SIZES } from '../utils/constants'
import { FLYER_PLATFORMS, PLATFORM_SVG, svgToDataUri, preloadPlatformImages, getPlatformImage } from '../utils/platformIcons'
import { hexToRgba, roundRect, wrapText } from '../utils/canvasHelpers'

// ── Shared UI ──────────────────────────────────────────────────────────────
function SecTitle({ children }) {
  return (
    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#E4600A', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(228,96,10,0.2)' }} />
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

function Toggle({ label, checked, onChange }) {
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

function SwatchRow({ colors, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
      {colors.map(({ c, n }) => (
        <div key={c} title={n || c} onClick={() => onChange(c)} style={{
          width: 22, height: 22, borderRadius: 4, background: c,
          border: `2px solid ${value === c ? 'white' : c === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
          cursor: 'pointer', transform: value === c ? 'scale(1.15)' : 'scale(1)',
          boxShadow: value === c ? '0 0 0 2px rgba(255,255,255,0.25)' : 'none',
          transition: 'transform 0.15s',
        }} />
      ))}
    </div>
  )
}

const EVENT_COLORS = [
  { c: '#E4600A', n: 'Orange' }, { c: '#F5B800', n: 'Yellow' }, { c: '#5B2D8E', n: 'Purple' },
  { c: '#C9A84C', n: 'Gold' }, { c: '#E74C3C', n: 'Red' }, { c: '#2ECC71', n: 'Green' },
  { c: '#3498DB', n: 'Blue' }, { c: '#E91E63', n: 'Pink' }, { c: '#ffffff', n: 'White' },
  { c: '#1A1A2E', n: 'Dark' }, { c: '#555555', n: 'Gray' },
]

const FONT_OPTIONS = ['Montserrat', 'Playfair Display', 'Georgia', 'Arial', 'Lato']

function FontSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 6, color: 'white', fontSize: 10, padding: '5px 8px', width: '100%',
      fontFamily: "'Montserrat',sans-serif", marginBottom: 5,
    }}>
      {FONT_OPTIONS.map(f => <option key={f} value={f} style={{ background: '#1a0d2e' }}>{f}</option>)}
    </select>
  )
}

// ── Canvas helpers for flyer ───────────────────────────────────────────────
function drawSpeakerCircle(ctx, speaker, cx, cy, r, borderColor) {
  ctx.save()
  ctx.shadowColor = hexToRgba(borderColor, 0.45)
  ctx.shadowBlur = r * 0.3
  ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2)
  ctx.fillStyle = borderColor; ctx.fill()
  ctx.shadowBlur = 0

  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
  if (speaker.image) {
    const iw = speaker.image.naturalWidth, ih = speaker.image.naturalHeight
    const sc = Math.max(r * 2 / iw, r * 2 / ih)
    const ox = (speaker.imgOffsetX || 0) / 100 * r * 2
    const oy = (speaker.imgOffsetY || 0) / 100 * r * 2
    ctx.drawImage(speaker.image, cx - iw * sc / 2 + ox, cy - ih * sc / 2 + oy, iw * sc, ih * sc)
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
    g.addColorStop(0, '#c8c8c8'); g.addColorStop(1, '#e8e8e8')
    ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = 'rgba(100,100,100,0.4)'; ctx.font = `bold ${r * 0.65}px serif`
    ctx.textAlign = 'center'; ctx.fillText('👤', cx, cy + r * 0.22)
  }
  ctx.restore()
}

function drawGridBg(ctx, w, h, color = '#f4f4f4') {
  ctx.fillStyle = color; ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(0,0,0,0.055)'; ctx.lineWidth = 1
  const step = w / 30
  for (let x = 0; x <= w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
  for (let y = 0; y <= h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
}

// ── Draw the 3 title parts (shared across all templates) ──────────────────
function drawTitleParts(ctx, w, h, s, opts = {}) {
  const {
    line1BaseScale = 0.075,
    withBaseScale = 0.028,
    hostBaseScale = 0.10,
    line1MaxW = 0.48,
    hostUnderlineOffset = 0.2,
    hostUnderlineColor = null,
  } = opts

  // Part 1 — main title text
  const l1x = s.line1X / 100 * w
  const l1y = s.line1Y / 100 * h
  const l1fs = w * line1BaseScale * (s.line1FontSize / 100)
  ctx.font = `900 ${l1fs}px '${s.line1Font}', Arial`
  ctx.fillStyle = s.line1Color
  ctx.textAlign = 'left'
  wrapText(ctx, s.line1Text, l1x, l1y, w * line1MaxW, l1fs * 1.15)

  // Part 2 — connector word (e.g. "WITH")
  const wx2 = s.withX / 100 * w
  const wy2 = s.withY / 100 * h
  const wfs = w * withBaseScale * (s.withFontSize / 100)
  ctx.font = `400 ${wfs}px '${s.withFont}', Arial`
  ctx.fillStyle = s.withColor
  ctx.textAlign = 'left'
  ctx.fillText(s.withText, wx2, wy2)

  // Part 3 — host name (from speaker 1)
  const hnx = s.hostNameX / 100 * w
  const hny = s.hostNameY / 100 * h
  const hnfs = w * hostBaseScale * (s.hostNameFontSize / 100)
  const hostName = (s.speakers[0] && s.speakers[0].name) || ''
  ctx.font = `900 ${hnfs}px '${s.hostNameFont}', Arial`
  ctx.fillStyle = s.hostNameColor
  ctx.textAlign = 'left'
  if (hostName) ctx.fillText(hostName, hnx, hny)

  // Underline accent beneath host name
  if (hostName) {
    const nmW = ctx.measureText(hostName).width
    ctx.strokeStyle = hostUnderlineColor || s.accentColor
    ctx.lineWidth = Math.max(3, 4 * (w / 1080))
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(hnx, hny + hnfs * hostUnderlineOffset)
    ctx.lineTo(hnx + nmW, hny + hnfs * hostUnderlineOffset)
    ctx.stroke()
  }
}

// ── FLYER TEMPLATES ────────────────────────────────────────────────────────
const FLYER_TEMPLATES = [
  {
    id: 0, name: 'Promo',
    render(ctx, w, h, s) {
      ctx.save()
      drawGridBg(ctx, w, h, '#f5f5f5')

      // Decorative coloured squares (top-right)
      const sqW = w * (s.hostPhotoSize / 100) * 0.42
      const sqH = sqW * 0.9
      const baseX = s.hostPhotoX / 100 * w
      const baseY = s.hostPhotoY / 100 * h
      ctx.fillStyle = s.accentColor2
      roundRect(ctx, baseX - sqW * 0.15, baseY, sqW, sqH, 14); ctx.fill()
      ctx.fillStyle = s.accentColor
      roundRect(ctx, baseX + sqW * 0.1, baseY + sqH * 0.14, sqW * 0.92, sqW * 1.02, 12); ctx.fill()

      // Host photo circle
      const photoR = w * 0.22 * (s.hostPhotoSize / 100)
      const photoCX = baseX + sqW * 0.38
      const photoCY = baseY + sqH * 0.52
      ctx.save()
      ctx.beginPath(); ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2); ctx.clip()
      if (s.speakers[0] && s.speakers[0].image) {
        const img = s.speakers[0].image
        const iw = img.naturalWidth, ih = img.naturalHeight
        const sc = Math.max(photoR * 2 / iw, photoR * 2 / ih)
        const ox = (s.speakers[0].imgOffsetX || 0) / 100 * photoR * 2
        const oy = (s.speakers[0].imgOffsetY || 0) / 100 * photoR * 2
        ctx.drawImage(img, photoCX - iw * sc / 2 + ox, photoCY - ih * sc / 2 + oy, iw * sc, ih * sc)
      } else {
        const g = ctx.createLinearGradient(photoCX - photoR, photoCY - photoR, photoCX + photoR, photoCY + photoR)
        g.addColorStop(0, '#e0c0a0'); g.addColorStop(1, '#c09070')
        ctx.fillStyle = g; ctx.fillRect(photoCX - photoR, photoCY - photoR, photoR * 2, photoR * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = `bold ${photoR * 0.65}px serif`
        ctx.textAlign = 'center'; ctx.fillText('👤', photoCX, photoCY + photoR * 0.22); ctx.textAlign = 'left'
      }
      ctx.restore()

      // Brand tag — uses brandX/brandY independently
      const bx = s.brandX / 100 * w, by = s.brandY / 100 * h
      const tagH2 = h * 0.05, tagW2 = w * 0.28
      ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = Math.max(1.5, 2 * (w / 1080))
      roundRect(ctx, bx, by, tagW2, tagH2, tagH2 / 2); ctx.stroke()
      ctx.font = `700 ${w * 0.02}px 'Montserrat', Arial`; ctx.fillStyle = '#1a1a2e'
      ctx.textAlign = 'center'; ctx.fillText(s.brandName, bx + tagW2 / 2, by + tagH2 * 0.68); ctx.textAlign = 'left'

      // 3-part title — each part fully independent
      drawTitleParts(ctx, w, h, s, {
        line1BaseScale: 0.075,
        withBaseScale: 0.028,
        hostBaseScale: 0.10,
        line1MaxW: 0.48,
        hostUnderlineOffset: 0.2,
      })

      // Date badge — uses dateX/dateY independently
      const dx = s.dateX / 100 * w, dy = s.dateY / 100 * h
      const badgeW = w * 0.26, badgeH = h * 0.065
      ctx.fillStyle = '#1a1a2e'
      roundRect(ctx, dx, dy, badgeW, badgeH, badgeH / 2); ctx.fill()
      ctx.font = `800 ${w * 0.028}px 'Montserrat', Arial`; ctx.fillStyle = s.dateTextColor || s.accentColor
      ctx.textAlign = 'center'; ctx.fillText(s.date, dx + badgeW / 2, dy + badgeH * 0.68); ctx.textAlign = 'left'

      // Platform icon + label — uses platformX/platformY independently
      if (s.meetingPlatform !== 'none') {
        const platImg = getPlatformImage(s.meetingPlatform)
        if (platImg) {
          const platX = s.platformX / 100 * w
          const platY = s.platformY / 100 * h
          const ps = w * 0.068
          ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(platImg, platX, platY, ps, ps); ctx.restore()
          ctx.font = `800 ${w * 0.032}px 'Montserrat', Arial`; ctx.fillStyle = '#1a1a2e'
          ctx.fillText(s.meetingPlatform.charAt(0).toUpperCase() + s.meetingPlatform.slice(1), platX + ps + 10, platY + ps * 0.65)
        }
      }

      // Day badge — uses dayX/dayY independently
      if (s.showDay) {
        const dayX = s.dayX / 100 * w, dayY = s.dayY / 100 * h
        const dbW = w * 0.18
        ctx.fillStyle = s.dayBadgeColor || s.accentColor
        roundRect(ctx, dayX, dayY, dbW, h * 0.058, 8); ctx.fill()
        ctx.font = `900 ${w * 0.03 * (s.dayBadgeFontSize / 100)}px 'Montserrat', Arial`
        ctx.fillStyle = s.dayTextColor || '#fff'
        ctx.textAlign = 'center'; ctx.fillText(`${s.dayLabel || 'DAY'} ${s.dayNumber}`, dayX + dbW / 2, dayY + h * 0.038); ctx.textAlign = 'left'
      }

      ctx.restore()
    }
  },

  {
    id: 1, name: 'Speaker Grid',
    render(ctx, w, h, s) {
      ctx.save()
      drawGridBg(ctx, w, h, '#f8f8f8')

      const spSlots = 4
      const spR = w * 0.09 * (s.speakerSize / 100)
      const spGap = w * 0.24
      const spStartX = (w - spGap * (spSlots - 1)) / 2
      const spCY = s.speakerRowY / 100 * h

      for (let i = 0; i < spSlots; i++) {
        const cx2 = spStartX + i * spGap
        const sp = s.speakers[i] || { name: '', title: '', image: null }

        // Decorative squares per speaker
        const sq = spR * 0.55
        ctx.fillStyle = i % 2 === 0 ? s.accentColor : s.accentColor2
        roundRect(ctx, cx2 + spR * 0.4, spCY - spR * 1.0, sq, sq, 5); ctx.fill()
        ctx.fillStyle = i % 2 === 0 ? s.accentColor2 : s.accentColor
        roundRect(ctx, cx2 + spR * 0.55, spCY - spR * 0.35, sq * 0.9, sq * 0.9, 4); ctx.fill()

        drawSpeakerCircle(ctx, sp, cx2, spCY, spR, sp.name ? s.accentColor : '#ccc')

        if (sp.name) {
          const scale = w / 1080
          ctx.font = `700 ${w * 0.022}px 'Montserrat', Arial`
          ctx.fillStyle = '#1a1a2e'; ctx.textAlign = 'center'
          ctx.fillText(sp.name, cx2, spCY + spR + 28 * scale)

          ctx.font = `400 ${w * 0.016}px 'Montserrat', Arial`; ctx.fillStyle = '#555'
          const titleParts = sp.title ? sp.title.split('&') : []
          titleParts.forEach((part, pi) => ctx.fillText(part.trim(), cx2, spCY + spR + 46 * scale + pi * 18 * scale))
          ctx.textAlign = 'left'
        }
      }

      // Brand tag — uses brandX/brandY (INDEPENDENT from title)
      const bTagX = s.brandX / 100 * w
      const bTagY = s.brandY / 100 * h
      const brandBoxW = w * 0.22, brandBoxH = h * 0.04
      ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = Math.max(1, 1.5 * (w / 1080))
      roundRect(ctx, bTagX, bTagY, brandBoxW, brandBoxH, brandBoxH / 2); ctx.stroke()
      ctx.font = `700 ${w * 0.018}px 'Montserrat', Arial`; ctx.fillStyle = '#1a1a2e'
      ctx.textAlign = 'center'; ctx.fillText(s.brandName, bTagX + brandBoxW / 2, bTagY + brandBoxH * 0.68); ctx.textAlign = 'left'

      // 3-part title — each part has its OWN independent position
      drawTitleParts(ctx, w, h, s, {
        line1BaseScale: 0.055,
        withBaseScale: 0.022,
        hostBaseScale: 0.065,
        line1MaxW: 0.36,
        hostUnderlineOffset: 0.18,
      })

      // "Live on" badge
      const liveY = h * 0.9
      if (s.meetingPlatform !== 'none') {
        const liveX = s.brandX / 100 * w
        ctx.fillStyle = '#1a1a2e'
        roundRect(ctx, liveX, liveY, w * 0.13, h * 0.04, h * 0.02); ctx.fill()
        ctx.font = `700 ${w * 0.016}px 'Montserrat', Arial`; ctx.fillStyle = 'white'
        ctx.textAlign = 'center'; ctx.fillText('Live on', liveX + w * 0.065, liveY + h * 0.026); ctx.textAlign = 'left'
        const platImg = getPlatformImage(s.meetingPlatform)
        if (platImg) {
          const ps = h * 0.05
          ctx.save(); ctx.globalAlpha = 0.95; ctx.drawImage(platImg, liveX + w * 0.14, liveY, ps, ps); ctx.restore()
        }
      }

      // Right — dark details card
      const cardX = s.detailsCardX / 100 * w
      const cardY = s.detailsCardY / 100 * h
      const cardW = s.detailsCardW / 100 * w
      const cardH = h - cardY - h * 0.04
      ctx.fillStyle = '#1a1a2e'
      roundRect(ctx, cardX, cardY, cardW, cardH, 14); ctx.fill()

      // QR code area
      const qrSz = Math.min(cardW * 0.42, cardH * 0.58) * (s.qrCodeSize / 100)
      const qrX = cardX + cardW * 0.04
      const qrY = cardY + cardH * 0.1
      if (s.qrCode) {
        ctx.drawImage(s.qrCode, qrX, qrY, qrSz, qrSz)
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        roundRect(ctx, qrX, qrY, qrSz, qrSz, 6); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = `${qrSz * 0.3}px serif`
        ctx.textAlign = 'center'; ctx.fillText('▦', qrX + qrSz / 2, qrY + qrSz * 0.65); ctx.textAlign = 'left'
      }

      // Scan button
      const btnY = qrY + qrSz + 8
      ctx.fillStyle = s.accentColor2
      roundRect(ctx, qrX, btnY, qrSz, cardH * 0.1, 6); ctx.fill()
      ctx.font = `700 ${qrSz * 0.11}px 'Montserrat', Arial`; ctx.fillStyle = '#1a1a2e'
      ctx.textAlign = 'center'; ctx.fillText('Scan to register', qrX + qrSz / 2, btnY + cardH * 0.068); ctx.textAlign = 'left'

      // Details — date, meeting, time with configurable spacing
      const detX = cardX + cardW * 0.5
      const detY2 = cardY + cardH * 0.1
      const lH = cardH * 0.13
      const spacingMult = (s.detailsLineSpacing || 250) / 100
      const ic = s.accentColor

      const detItems = [
        { emoji: '📅', label: null, value: s.date },
        { emoji: '📹', label: `Meeting ID: ${s.meetingId}`, value: `Passcode: ${s.passcode}` },
        { emoji: '🕐', label: 'Time', value: s.time },
      ]

      detItems.forEach((item, idx) => {
        const iy = detY2 + idx * lH * spacingMult
        ctx.font = `${qrSz * 0.11}px serif`; ctx.fillStyle = ic
        ctx.fillText(item.emoji, detX, iy + lH * 0.55)
        ctx.font = `600 ${qrSz * 0.09}px 'Montserrat', Arial`
        ctx.fillStyle = idx === 0 ? (s.dateTextColor || 'white') : 'white'
        if (item.label) {
          ctx.fillText(item.label, detX + qrSz * 0.18, iy + lH * 0.4)
          ctx.font = `400 ${qrSz * 0.08}px 'Montserrat', Arial`
          ctx.fillText(item.value, detX + qrSz * 0.18, iy + lH * 0.68)
        } else {
          ctx.fillText(item.value, detX + qrSz * 0.18, iy + lH * 0.55)
        }
        if (idx < detItems.length - 1) {
          ctx.strokeStyle = ic; ctx.lineWidth = 1; ctx.globalAlpha = 0.25
          ctx.beginPath(); ctx.moveTo(detX, iy + lH * 1.05); ctx.lineTo(detX + cardW * 0.44, iy + lH * 1.05); ctx.stroke()
          ctx.globalAlpha = 1
        }
      })

      // Day badge on card
      if (s.showDay) {
        const dayX = s.dayX / 100 * w, dayY2 = s.dayY / 100 * h
        ctx.fillStyle = s.dayBadgeColor || s.accentColor
        const dbW = w * 0.18
        roundRect(ctx, dayX, dayY2, dbW, h * 0.055, 6); ctx.fill()
        ctx.font = `900 ${w * 0.026 * (s.dayBadgeFontSize / 100)}px 'Montserrat', Arial`
        ctx.fillStyle = s.dayTextColor || 'white'
        ctx.textAlign = 'center'; ctx.fillText(`${s.dayLabel || 'DAY'} ${s.dayNumber}`, dayX + dbW / 2, dayY2 + h * 0.037); ctx.textAlign = 'left'
      }

      ctx.restore()
    }
  },

  {
    id: 2, name: 'Day Card',
    render(ctx, w, h, s) {
      ctx.save()
      // Dark gradient background
      const bg = ctx.createLinearGradient(0, 0, w, h)
      bg.addColorStop(0, '#0d0520'); bg.addColorStop(1, '#1a0a35')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)

      const g1 = ctx.createRadialGradient(w * 0.1, h * 0.1, 0, w * 0.1, h * 0.1, w * 0.6)
      g1.addColorStop(0, hexToRgba(s.accentColor, 0.3)); g1.addColorStop(1, 'transparent')
      ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h)

      const g2 = ctx.createRadialGradient(w * 0.9, h * 0.9, 0, w * 0.9, h * 0.9, w * 0.5)
      g2.addColorStop(0, hexToRgba(s.accentColor2, 0.25)); g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h)

      // Large "DAY N" background watermark
      if (s.showDay) {
        ctx.font = `900 ${w * 0.28}px 'Montserrat', Arial`
        ctx.fillStyle = hexToRgba('#ffffff', 0.04)
        ctx.textAlign = 'center'; ctx.fillText(`${s.dayLabel || 'DAY'} ${s.dayNumber}`, w / 2, h * 0.55); ctx.textAlign = 'left'
      }

      // Brand tag — uses brandX/brandY independently
      const bx = s.brandX / 100 * w, by = s.brandY / 100 * h
      const bTagW = w * 0.22, bTagH = h * 0.046
      ctx.strokeStyle = s.accentColor; ctx.lineWidth = Math.max(1, 1.5 * (w / 1080))
      roundRect(ctx, bx, by, bTagW, bTagH, bTagH / 2); ctx.stroke()
      ctx.font = `700 ${w * 0.019}px 'Montserrat', Arial`; ctx.fillStyle = s.accentColor
      ctx.textAlign = 'center'; ctx.fillText(s.brandName, bx + bTagW / 2, by + bTagH * 0.67); ctx.textAlign = 'left'

      // Day badge (prominent) — uses dayX/dayY independently
      if (s.showDay) {
        const dayX = s.dayX / 100 * w, dayY2 = s.dayY / 100 * h
        const dbW = w * 0.24, dbH = h * 0.072
        ctx.fillStyle = s.dayBadgeColor || s.accentColor
        roundRect(ctx, dayX, dayY2, dbW, dbH, 12); ctx.fill()
        ctx.font = `900 ${w * 0.034 * (s.dayBadgeFontSize / 100)}px 'Montserrat', Arial`
        ctx.fillStyle = s.dayTextColor || 'white'
        ctx.textAlign = 'center'; ctx.fillText(`${s.dayLabel || 'DAY'} ${s.dayNumber}`, dayX + dbW / 2, dayY2 + dbH * 0.68); ctx.textAlign = 'left'
      }

      // 3-part title — each part fully independent
      drawTitleParts(ctx, w, h, s, {
        line1BaseScale: 0.078,
        withBaseScale: 0.022,
        hostBaseScale: 0.095,
        line1MaxW: 0.6,
        hostUnderlineOffset: 0.15,
        hostUnderlineColor: s.accentColor2,
      })

      // Speaker row
      const spCY = s.speakerRowY / 100 * h
      const spR2 = w * 0.085 * (s.speakerSize / 100)
      const spGap2 = w * 0.22
      const spStartX = w * 0.05 + spR2

      for (let i = 0; i < 4; i++) {
        const sp = s.speakers[i]
        if (!sp || (!sp.name && !sp.image)) continue
        const scx = spStartX + i * spGap2
        drawSpeakerCircle(ctx, sp, scx, spCY, spR2, sp.name ? s.accentColor : '#555')
        if (sp.name) {
          const scale = w / 1080
          ctx.font = `700 ${w * 0.019}px 'Montserrat', Arial`; ctx.fillStyle = 'white'
          ctx.textAlign = 'center'; ctx.fillText(sp.name, scx, spCY + spR2 + 24 * scale)
          ctx.font = `400 ${w * 0.014}px 'Montserrat', Arial`; ctx.fillStyle = hexToRgba(s.accentColor, 0.85)
          ctx.fillText(sp.title || '', scx, spCY + spR2 + 40 * scale)
          ctx.textAlign = 'left'
        }
      }

      // Bottom details strip
      const stripY = h * 0.9
      ctx.fillStyle = hexToRgba('#000', 0.38); ctx.fillRect(0, stripY, w, h - stripY)
      ctx.strokeStyle = s.accentColor; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(0, stripY); ctx.lineTo(w, stripY); ctx.stroke()

      ctx.font = `600 ${w * 0.021}px 'Montserrat', Arial`; ctx.fillStyle = s.dateTextColor || 'white'
      ctx.fillText(s.date, w * 0.05, stripY + (h - stripY) * 0.6)
      if (s.time) {
        ctx.fillStyle = s.accentColor
        ctx.fillText('·', w * 0.37, stripY + (h - stripY) * 0.6)
        ctx.fillStyle = 'white'
        ctx.fillText(s.time, w * 0.40, stripY + (h - stripY) * 0.6)
      }
      if (s.meetingPlatform !== 'none') {
        const platImg = getPlatformImage(s.meetingPlatform)
        if (platImg) {
          const ps = (h - stripY) * 0.72
          ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(platImg, w * 0.88, stripY + (h - stripY) * 0.14, ps, ps); ctx.restore()
        }
      }

      ctx.restore()
    }
  },
]

// ── DEFAULT STATE ──────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  templateId: 0,
  brandName: 'IWC Concepts',
  accentColor: '#E4600A', accentColor2: '#F5B800',
  date: '2nd - 3rd March, 2026',
  time: '6:00pm - 7:30pm GMT0',
  meetingPlatform: 'zoom',
  meetingId: '843 6787 5281', passcode: 'GOHIGHER',
  dayNumber: '1', dayLabel: 'DAY', showDay: true,
  dayBadgeColor: '#E4600A', dayTextColor: '#ffffff', dayBadgeFontSize: 100,
  dateTextColor: '#E4600A',
  platformX: 5, platformY: 75,
  canvasW: 1080, canvasH: 1080,

  // ── Title Part 1 — Main heading (e.g. "Catch Up") ────────────────────────
  line1Text: 'Catch Up',
  line1X: 5, line1Y: 22,
  line1FontSize: 100,
  line1Color: '#1a1a2e',
  line1Font: 'Montserrat',

  // ── Title Part 2 — Connector word (e.g. "WITH") ──────────────────────────
  withText: 'WITH',
  withX: 6, withY: 38,
  withFontSize: 100,
  withColor: '#555555',
  withFont: 'Montserrat',

  // ── Title Part 3 — Host name styling (name from Speaker 1) ───────────────
  hostNameX: 5, hostNameY: 50,
  hostNameFontSize: 100,
  hostNameColor: '#1a1a2e',
  hostNameFont: 'Montserrat',

  // ── Layout positions (all in % of canvas dimensions) ─────────────────────
  hostPhotoX: 45, hostPhotoY: 6, hostPhotoSize: 100,
  brandX: 5, brandY: 5,
  dayX: 77, dayY: 82,
  dateX: 5, dateY: 64,
  detailsCardX: 48, detailsCardY: 60, detailsCardW: 47,
  speakerRowY: 28, speakerSize: 100,
  qrCodeSize: 100,
  detailsLineSpacing: 250,  // divided by 100 = spacing multiplier (2.5x)

  speakers: [
    { name: 'Lady Adel', title: 'Host', image: null, previewSrc: null, imgOffsetX: 0, imgOffsetY: 0 },
    { name: 'Juliet Adu Gyamfi', title: 'Legal Advocate & Social Impact Leader', image: null, previewSrc: null, imgOffsetX: 0, imgOffsetY: 0 },
    { name: 'Dr. Isabella Ntredu', title: 'Obstetrician Gynaecologist', image: null, previewSrc: null, imgOffsetX: 0, imgOffsetY: 0 },
    { name: 'Derrick Agyare', title: 'PR Strategist/ Advisor', image: null, previewSrc: null, imgOffsetX: 0, imgOffsetY: 0 },
  ],
  qrCode: null, qrPreview: null,
  customTextLayers: [],
}

// ── COMPONENT ──────────────────────────────────────────────────────────────
export default function EventFlyerStudio() {
  const navigate = useNavigate()
  const [state, setState] = useState({ ...DEFAULT_STATE, speakers: DEFAULT_STATE.speakers.map(s => ({ ...s })) })
  const [iconsLoaded, setIconsLoaded] = useState(false)
  const [activeExport, setActiveExport] = useState(0)
  const canvasRef = useRef(null)
  const thumbRefs = useRef([])

  const set = (key, val) => setState(prev => ({ ...prev, [key]: val }))

  useEffect(() => { preloadPlatformImages().then(() => setIconsLoaded(true)) }, [])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const w = state.canvasW, h = state.canvasH
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    try { FLYER_TEMPLATES[state.templateId].render(ctx, w, h, state) }
    catch (e) { console.error('FlyerStudio render error (template ' + state.templateId + '):', e) }
    // Draw custom text layers on top of the template
    for (const layer of state.customTextLayers || []) {
      if (!layer.text) continue
      const fs = layer.fontSize * w / 1080
      const weight = layer.bold ? '900' : '400'
      ctx.font = `${weight} ${fs}px '${layer.font}', Arial`
      ctx.fillStyle = layer.color
      ctx.textAlign = layer.align || 'left'
      const px = (layer.x / 100) * w
      const py = (layer.y / 100) * h
      // Optional text shadow for readability
      if (layer.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.7)'
        ctx.shadowBlur = fs * 0.15
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
      }
      ctx.fillText(layer.text, px, py)
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.textAlign = 'left'
    }
  }, [state, iconsLoaded])

  useEffect(() => {
    const t = setTimeout(() => {
      FLYER_TEMPLATES.forEach((_, i) => {
        const c = thumbRefs.current[i]; if (!c) return
        c.width = 240; c.height = 160
        const ts = { ...DEFAULT_STATE, speakers: DEFAULT_STATE.speakers.map(s => ({ ...s })), templateId: i, canvasW: 240, canvasH: 160 }
        try { FLYER_TEMPLATES[i].render(c.getContext('2d'), 240, 160, ts) } catch (_) {}
      })
    }, 250)
    return () => clearTimeout(t)
  }, [iconsLoaded])

  function updateSpeakerField(index, field, value) {
    setState(prev => ({
      ...prev,
      speakers: prev.speakers.map((sp, i) => i === index ? { ...sp, [field]: value } : sp),
    }))
  }

  function handleSpeakerImage(index, e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => setState(prev => ({
        ...prev,
        speakers: prev.speakers.map((sp, i) => i === index ? { ...sp, image: img, previewSrc: ev.target.result } : sp),
      }))
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
    const a = document.createElement('a')
    a.download = `IWC-Flyer-Day${state.dayNumber}-${Date.now()}.png`
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }

  function resetAll() {
    setState({ ...DEFAULT_STATE, speakers: DEFAULT_STATE.speakers.map(s => ({ ...s })) })
    setActiveExport(0)
  }

  const panel = { background: '#120a1e', overflowY: 'auto', padding: 16, height: '100%' }
  const divider = { height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 0' }
  const inp = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', fontFamily: "'Montserrat',sans-serif", fontSize: 12, padding: '7px 10px', width: '100%' }
  const subGroupStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 10px 6px', marginBottom: 8 }
  const subLabel = { fontSize: 8, fontWeight: 800, color: '#E4600A', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'block' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0614' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#1a0a0a,#2d1010)', borderBottom: '2px solid #E4600A', padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E4600A'; e.currentTarget.style.color = '#E4600A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
          >← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#E4600A,#F5B800)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📣</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Event Flyer Studio</div>
              <div style={{ fontSize: 8, color: '#E4600A', letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={resetAll} style={{ padding: '7px 14px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, background: 'transparent', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E4600A'; e.currentTarget.style.color = '#E4600A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white' }}
          >↺ Reset</button>
          <button onClick={downloadFlyer} style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#E4600A,#F5B800)', border: 'none', borderRadius: 8, color: '#1A1A2E', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 16px rgba(228,96,10,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
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
              {FLYER_TEMPLATES.map((t, i) => (
                <div key={i} onClick={() => set('templateId', i)} style={{ borderRadius: 8, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: `2px solid ${state.templateId === i ? '#E4600A' : 'transparent'}`, transform: state.templateId === i ? 'scale(1.01)' : 'scale(1)', transition: 'border-color 0.2s, transform 0.2s' }}
                  onMouseEnter={e => { if (state.templateId !== i) e.currentTarget.style.transform = 'scale(1.02)' }}
                  onMouseLeave={e => { if (state.templateId !== i) e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <canvas ref={el => thumbRefs.current[i] = el} style={{ width: '100%', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.78)', fontSize: 8, fontWeight: 700, textAlign: 'center', padding: 4 }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={divider} />

          {/* Event Info */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Event Info</SecTitle>
            {[['Brand / Organisation', 'brandName'], ['Date', 'date'], ['Time', 'time']].map(([lbl, key]) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>{lbl}</label>
                <input type="text" value={state[key]} onChange={e => set(key, e.target.value)} style={inp} />
              </div>
            ))}
          </div>

          <div style={divider} />

          {/* Title Typography — 3 independent parts */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Title Typography</SecTitle>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', marginBottom: 10, lineHeight: 1.5 }}>
              Each title part is fully independent — own text, font, color, size &amp; position.
            </div>

            {/* Part 1 — Main heading */}
            <div style={subGroupStyle}>
              <span style={subLabel}>Part 1 — Main Heading</span>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Text</label>
                <input type="text" value={state.line1Text} onChange={e => set('line1Text', e.target.value)} style={{ ...inp, fontSize: 11, padding: '5px 8px' }} />
              </div>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Font Family</label>
              <FontSelect value={state.line1Font} onChange={v => set('line1Font', v)} />
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Text Color</label>
              <SwatchRow colors={EVENT_COLORS} value={state.line1Color} onChange={c => set('line1Color', c)} />
              <Slider label="Size %" value={state.line1FontSize} min={30} max={300} small onChange={e => set('line1FontSize', +e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <Slider label="X %" value={state.line1X} min={0} max={95} small onChange={e => set('line1X', +e.target.value)} />
                <Slider label="Y %" value={state.line1Y} min={0} max={95} small onChange={e => set('line1Y', +e.target.value)} />
              </div>
            </div>

            {/* Part 2 — Connector word */}
            <div style={subGroupStyle}>
              <span style={subLabel}>Part 2 — Connector Word</span>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Text (e.g. WITH)</label>
                <input type="text" value={state.withText} onChange={e => set('withText', e.target.value)} style={{ ...inp, fontSize: 11, padding: '5px 8px' }} />
              </div>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Font Family</label>
              <FontSelect value={state.withFont} onChange={v => set('withFont', v)} />
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Text Color</label>
              <SwatchRow colors={EVENT_COLORS} value={state.withColor} onChange={c => set('withColor', c)} />
              <Slider label="Size %" value={state.withFontSize} min={30} max={300} small onChange={e => set('withFontSize', +e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <Slider label="X %" value={state.withX} min={0} max={95} small onChange={e => set('withX', +e.target.value)} />
                <Slider label="Y %" value={state.withY} min={0} max={95} small onChange={e => set('withY', +e.target.value)} />
              </div>
            </div>

            {/* Part 3 — Host name */}
            <div style={subGroupStyle}>
              <span style={subLabel}>Part 3 — Host / Speaker Name</span>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8, lineHeight: 1.4 }}>
                Name is taken from Speaker 1. Edit it in the Speakers section below.
              </div>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Font Family</label>
              <FontSelect value={state.hostNameFont} onChange={v => set('hostNameFont', v)} />
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 3 }}>Text Color</label>
              <SwatchRow colors={EVENT_COLORS} value={state.hostNameColor} onChange={c => set('hostNameColor', c)} />
              <Slider label="Size %" value={state.hostNameFontSize} min={30} max={300} small onChange={e => set('hostNameFontSize', +e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <Slider label="X %" value={state.hostNameX} min={0} max={95} small onChange={e => set('hostNameX', +e.target.value)} />
                <Slider label="Y %" value={state.hostNameY} min={0} max={95} small onChange={e => set('hostNameY', +e.target.value)} />
              </div>
            </div>
          </div>

          <div style={divider} />

          {/* Day Settings */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Day Settings</SecTitle>
            <Toggle label="Show Day Badge" checked={state.showDay} onChange={e => set('showDay', e.target.checked)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>Label (e.g. DAY)</label>
                <input type="text" value={state.dayLabel} onChange={e => set('dayLabel', e.target.value)} style={{ ...inp, fontSize: 11, padding: '5px 8px' }} placeholder="DAY" />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>Number / Text</label>
                <input type="text" value={state.dayNumber} onChange={e => set('dayNumber', e.target.value)} style={{ ...inp, fontSize: 11, padding: '5px 8px' }} placeholder="1" />
              </div>
            </div>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>Badge Color</label>
            <SwatchRow colors={EVENT_COLORS} value={state.dayBadgeColor} onChange={c => set('dayBadgeColor', c)} />
            <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', margin: '8px 0 5px' }}>Badge Text Color</label>
            <SwatchRow colors={EVENT_COLORS} value={state.dayTextColor} onChange={c => set('dayTextColor', c)} />
            <Slider label="Badge Font Size %" value={state.dayBadgeFontSize} min={30} max={200} small onChange={e => set('dayBadgeFontSize', +e.target.value)} />
          </div>

          <div style={divider} />

          {/* Colours */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Colours</SecTitle>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>Primary Accent</label>
            <SwatchRow colors={EVENT_COLORS} value={state.accentColor} onChange={c => set('accentColor', c)} />
            <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', margin: '8px 0 5px' }}>Secondary Accent</label>
            <SwatchRow colors={EVENT_COLORS} value={state.accentColor2} onChange={c => set('accentColor2', c)} />
            <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', margin: '8px 0 5px' }}>Date Text Color</label>
            <SwatchRow colors={EVENT_COLORS} value={state.dateTextColor} onChange={c => set('dateTextColor', c)} />
          </div>

          <div style={divider} />

          {/* Speakers */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Speakers / Host</SecTitle>
            {state.speakers.map((sp, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: 10, marginBottom: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <label style={{ width: 52, height: 52, flexShrink: 0, border: sp.previewSrc ? 'none' : '2px dashed rgba(228,96,10,0.4)', borderRadius: 8, cursor: 'pointer', overflow: 'hidden', background: sp.previewSrc ? 'none' : 'rgba(228,96,10,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input type="file" accept="image/*" onChange={e => handleSpeakerImage(i, e)} style={{ display: 'none' }} />
                    {sp.previewSrc ? <img src={sp.previewSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>👤</span>}
                  </label>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input type="text" placeholder={`Speaker ${i + 1} name`} value={sp.name} onChange={e => updateSpeakerField(i, 'name', e.target.value)} style={{ ...inp, fontSize: 11, padding: '4px 8px' }} />
                    <input type="text" placeholder="Title / Role" value={sp.title} onChange={e => updateSpeakerField(i, 'title', e.target.value)} style={{ ...inp, fontSize: 10, padding: '4px 8px' }} />
                  </div>
                </div>
                {sp.previewSrc && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <Slider label="Face X" value={sp.imgOffsetX || 0} min={-50} max={50} small onChange={e => updateSpeakerField(i, 'imgOffsetX', +e.target.value)} />
                    <Slider label="Face Y" value={sp.imgOffsetY || 0} min={-50} max={50} small onChange={e => updateSpeakerField(i, 'imgOffsetY', +e.target.value)} />
                  </div>
                )}
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 4 }}>
              <Slider label="Circle Size %" value={state.speakerSize} min={30} max={200} small onChange={e => set('speakerSize', +e.target.value)} />
              <Slider label="Host Photo Size %" value={state.hostPhotoSize} min={30} max={200} small onChange={e => set('hostPhotoSize', +e.target.value)} />
            </div>
          </div>

          <div style={divider} />

          {/* ── Custom Text Layers ── */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Custom Text</SecTitle>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', marginBottom: 10, lineHeight: 1.5 }}>
              Add your own text to the flyer — control font, size, color, and position independently.
            </div>
            <button
              onClick={() => {
                const id = 'ct_' + Math.random().toString(36).slice(2, 7)
                set('customTextLayers', [...(state.customTextLayers || []), {
                  id, text: 'Your text here', x: 10, y: 85, fontSize: 48,
                  color: '#ffffff', font: 'Montserrat', bold: false, align: 'left', shadow: true,
                }])
              }}
              style={{ width: '100%', background: 'rgba(228,96,10,0.12)', border: '1px dashed rgba(228,96,10,0.5)', borderRadius: 8, color: '#E4600A', fontSize: 11, fontWeight: 700, padding: '9px', cursor: 'pointer', marginBottom: 10 }}
            >+ Add Text Layer</button>

            {(state.customTextLayers || []).map((layer, idx) => (
              <div key={layer.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(228,96,10,0.25)', borderRadius: 9, padding: 10, marginBottom: 8 }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#E4600A', letterSpacing: 1, textTransform: 'uppercase' }}>Text {idx + 1}</span>
                  <button onClick={() => set('customTextLayers', state.customTextLayers.filter(l => l.id !== layer.id))} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 5, color: '#f87171', padding: '2px 7px', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>✕ Remove</button>
                </div>
                {/* Text input */}
                <div style={{ marginBottom: 6 }}>
                  <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Text</label>
                  <input type="text" value={layer.text}
                    onChange={e => set('customTextLayers', state.customTextLayers.map(l => l.id === layer.id ? { ...l, text: e.target.value } : l))}
                    style={{ ...inp, fontSize: 11, padding: '5px 8px' }} placeholder="Enter text…" />
                </div>
                {/* Font */}
                <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Font Family</label>
                <FontSelect value={layer.font} onChange={v => set('customTextLayers', state.customTextLayers.map(l => l.id === layer.id ? { ...l, font: v } : l))} />
                {/* Color */}
                <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <input type="color" value={layer.color}
                    onChange={e => set('customTextLayers', state.customTextLayers.map(l => l.id === layer.id ? { ...l, color: e.target.value } : l))}
                    style={{ width: 34, height: 26, border: 'none', borderRadius: 5, cursor: 'pointer', background: 'transparent' }} />
                  <SwatchRow colors={EVENT_COLORS} value={layer.color}
                    onChange={c => set('customTextLayers', state.customTextLayers.map(l => l.id === layer.id ? { ...l, color: c } : l))} />
                </div>
                {/* Size */}
                <Slider label="Font Size (px @ 1080w)" value={layer.fontSize} min={12} max={220} small
                  onChange={e => set('customTextLayers', state.customTextLayers.map(l => l.id === layer.id ? { ...l, fontSize: +e.target.value } : l))} />
                {/* X / Y */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  <Slider label="X %" value={layer.x} min={0} max={95} small
                    onChange={e => set('customTextLayers', state.customTextLayers.map(l => l.id === layer.id ? { ...l, x: +e.target.value } : l))} />
                  <Slider label="Y %" value={layer.y} min={2} max={99} small
                    onChange={e => set('customTextLayers', state.customTextLayers.map(l => l.id === layer.id ? { ...l, y: +e.target.value } : l))} />
                </div>
                {/* Alignment */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  {['left', 'center', 'right'].map(a => (
                    <button key={a} onClick={() => set('customTextLayers', state.customTextLayers.map(l => l.id === layer.id ? { ...l, align: a } : l))}
                      style={{ flex: 1, background: layer.align === a ? 'rgba(228,96,10,0.3)' : 'rgba(255,255,255,0.05)', border: `1px solid ${layer.align === a ? '#E4600A' : 'rgba(255,255,255,0.1)'}`, borderRadius: 5, color: layer.align === a ? '#E4600A' : 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, padding: '4px', cursor: 'pointer' }}>
                      {a === 'left' ? '⬅' : a === 'center' ? '☰' : '➡'}
                    </button>
                  ))}
                </div>
                {/* Bold + Shadow toggles */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['Bold', 'bold'], ['Shadow', 'shadow']].map(([lbl, key]) => (
                    <button key={key}
                      onClick={() => set('customTextLayers', state.customTextLayers.map(l => l.id === layer.id ? { ...l, [key]: !l[key] } : l))}
                      style={{ flex: 1, background: layer[key] ? 'rgba(228,96,10,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${layer[key] ? 'rgba(228,96,10,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, color: layer[key] ? '#E4600A' : 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, padding: '5px', cursor: 'pointer' }}>
                      {lbl} {layer[key] ? 'ON' : 'OFF'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 40%,#1e0a30,#0a0614)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div style={{ position: 'relative' }}>
            <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 4, boxShadow: '0 0 0 1px rgba(255,255,255,0.06),0 30px 80px rgba(0,0,0,0.7)', maxWidth: 'min(560px,calc(100vw - 640px))', maxHeight: 'calc(100vh - 120px)' }} />
            <div style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, whiteSpace: 'nowrap' }}>{state.canvasW} × {state.canvasH} px</div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ ...panel, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Export Size */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Export Size</SecTitle>
            {FLYER_EXPORT_SIZES.map((sz, i) => (
              <button key={i} onClick={() => { setActiveExport(i); setState(prev => ({ ...prev, canvasW: sz.w, canvasH: sz.h })) }} style={{ background: activeExport === i ? 'rgba(228,96,10,0.3)' : 'rgba(255,255,255,0.05)', border: `1px solid ${activeExport === i ? '#E4600A' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, padding: '7px 10px', color: 'white', cursor: 'pointer', fontSize: 10, fontWeight: 600, textAlign: 'left', width: '100%', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.1)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>▪</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{sz.l}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>{sz.d}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={divider} />

          {/* Meeting Platform */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Meeting Platform</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, marginBottom: 10 }}>
              {FLYER_PLATFORMS.map(plat => (
                <div key={plat.id} onClick={() => set('meetingPlatform', plat.id)} style={{ borderRadius: 7, padding: '6px 4px', textAlign: 'center', cursor: 'pointer', border: `2px solid ${state.meetingPlatform === plat.id ? '#E4600A' : 'transparent'}`, background: state.meetingPlatform === plat.id ? 'rgba(228,96,10,0.12)' : 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.2s' }}>
                  <img src={svgToDataUri(PLATFORM_SVG[plat.id] || PLATFORM_SVG.none)} width={26} height={26} style={{ borderRadius: 6 }} alt={plat.label} />
                  <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{plat.label}</span>
                </div>
              ))}
            </div>
            {[['Meeting ID', 'meetingId', 'e.g. 843 6787 5281'], ['Passcode', 'passcode', 'e.g. GOHIGHER']].map(([lbl, key, ph]) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>{lbl}</label>
                <input type="text" value={state[key]} onChange={e => set(key, e.target.value)} style={inp} placeholder={ph} />
              </div>
            ))}
          </div>

          <div style={divider} />

          {/* QR Code */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>QR Code</SecTitle>
            {state.qrPreview ? (
              <div style={{ position: 'relative' }}>
                <img src={state.qrPreview} alt="" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
                <button onClick={() => setState(prev => ({ ...prev, qrCode: null, qrPreview: null }))} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.75)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', width: 18, height: 18, fontSize: 11, lineHeight: '18px', textAlign: 'center' }}>✕</button>
              </div>
            ) : (
              <label style={{ display: 'block', border: '2px dashed rgba(228,96,10,0.35)', borderRadius: 9, padding: 14, textAlign: 'center', cursor: 'pointer', background: 'rgba(228,96,10,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E4600A'; e.currentTarget.style.background = 'rgba(228,96,10,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(228,96,10,0.35)'; e.currentTarget.style.background = 'rgba(228,96,10,0.04)' }}
              >
                <input type="file" accept="image/*" onChange={handleQrUpload} style={{ display: 'none' }} />
                <div style={{ fontSize: 22, marginBottom: 4 }}>▦</div>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}><strong style={{ color: '#E4600A' }}>Upload</strong> QR code image</p>
              </label>
            )}
          </div>

          <div style={divider} />

          {/* Layout & Positions */}
          <div style={{ marginBottom: 16 }}>
            <SecTitle>Layout &amp; Positions</SecTitle>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', marginBottom: 10, lineHeight: 1.5 }}>
              Every element is independently repositionable. No two items share position controls.
            </div>

            {[
              {
                heading: 'Host Photo (Promo template)',
                keys: [['Photo X %', 'hostPhotoX', 0, 90], ['Photo Y %', 'hostPhotoY', 0, 85], ['Photo Size %', 'hostPhotoSize', 30, 200]],
              },
              {
                heading: 'Brand Tag',
                keys: [['Brand X %', 'brandX', 0, 90], ['Brand Y %', 'brandY', 0, 90]],
              },
              {
                heading: 'Date Badge',
                keys: [['Date X %', 'dateX', 0, 90], ['Date Y %', 'dateY', 0, 90]],
              },
              {
                heading: 'Day Badge',
                keys: [['Day X %', 'dayX', 0, 90], ['Day Y %', 'dayY', 0, 90]],
              },
              {
                heading: 'Platform Icon (Promo)',
                keys: [['Platform X %', 'platformX', 0, 90], ['Platform Y %', 'platformY', 0, 90]],
              },
              {
                heading: 'Speaker Row (Grid & Day Card)',
                keys: [['Row Y %', 'speakerRowY', 10, 90], ['Speaker Size %', 'speakerSize', 30, 200]],
              },
              {
                heading: 'Details Card (Speaker Grid)',
                keys: [
                  ['Card X %', 'detailsCardX', 0, 90],
                  ['Card Y %', 'detailsCardY', 20, 90],
                  ['Card Width %', 'detailsCardW', 20, 80],
                  ['Line Spacing %', 'detailsLineSpacing', 100, 400],
                ],
              },
              {
                heading: 'QR Code Size',
                keys: [['QR Size %', 'qrCodeSize', 40, 200]],
              },
            ].map(({ heading, keys }) => (
              <div key={heading} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>{heading}</div>
                <div style={{ display: 'grid', gridTemplateColumns: keys.length > 1 ? '1fr 1fr' : '1fr', gap: 4 }}>
                  {keys.map(([lbl, key, mn, mx]) => (
                    <Slider key={key} label={lbl} value={state[key]} min={mn} max={mx} small onChange={e => set(key, +e.target.value)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
