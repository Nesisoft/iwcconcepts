// ── Shared canvas helper utilities ────────────────────────────────────────────

export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function wrapText(ctx, text, x, y, maxW, lineH, align = 'left', centerX) {
  const cleanText = text.replace(/^["""''«\u201C\u201D]/, '').replace(/["""''»\u201C\u201D]$/, '').trim()
  const words = cleanText.split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  lines.push(line)
  ctx.textAlign = align
  lines.forEach((ln, i) => {
    ctx.fillText(ln, align === 'center' ? (centerX || x) : x, y + i * lineH)
  })
  ctx.textAlign = 'left'
  return y + lines.length * lineH
}

export function drawBg(ctx, w, h, bgImage, bgX, bgY, bgZoom, bgOpacity) {
  if (!bgImage) return
  ctx.save()
  ctx.globalAlpha = bgOpacity / 100
  const xo = bgX / 100
  const yo = bgY / 100
  const zm = bgZoom / 100
  const iw = bgImage.naturalWidth
  const ih = bgImage.naturalHeight
  const sc = Math.max(w / iw, h / ih) * zm
  ctx.drawImage(bgImage, (w - iw * sc) / 2 + xo * w, (h - ih * sc) / 2 + yo * h, iw * sc, ih * sc)
  ctx.restore()
}

export function drawOverlay(ctx, w, h, show, opacity) {
  if (!show) return
  ctx.fillStyle = `rgba(0,0,0,${opacity / 100})`
  ctx.fillRect(0, 0, w, h)
}

// Draw profile circle with optional in-circle image pan/zoom
export function drawPfp(ctx, w, h, state) {
  if (!state.showProfile) return null
  const sc = w / 1080
  const r = state.pfpSize * sc / 2
  const bw = state.pfpBorderW * sc
  const cx = state.pfpX / 100 * w + r + bw
  const cy = state.pfpY / 100 * h + r + bw

  ctx.save()
  // Glowing border ring
  ctx.shadowColor = hexToRgba(state.borderColor, 0.6)
  ctx.shadowBlur = r * 0.4
  ctx.beginPath()
  ctx.arc(cx, cy, r + bw, 0, Math.PI * 2)
  ctx.fillStyle = state.borderColor
  ctx.fill()
  ctx.shadowBlur = 0

  // Clip circle for photo
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  if (state.pfpImage) {
    const iw = state.pfpImage.naturalWidth
    const ih = state.pfpImage.naturalHeight
    const zoom = (state.pfpImgZoom || 100) / 100
    const baseSc = Math.max(r * 2 / iw, r * 2 / ih) * zoom
    const imgX = cx - iw * baseSc / 2 + (state.pfpImgX || 0) * sc
    const imgY = cy - ih * baseSc / 2 + (state.pfpImgY || 0) * sc
    ctx.drawImage(state.pfpImage, imgX, imgY, iw * baseSc, ih * baseSc)
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
    g.addColorStop(0, '#5B2D8E')
    g.addColorStop(1, '#C9A84C')
    ctx.fillStyle = g
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  }

  ctx.restore()
  return { cx, cy, r, bw }
}

// Draw author name near profile circle
export function drawAuthorNearPfp(ctx, w, h, state, pfpInfo) {
  if (!pfpInfo || !state.showProfile) return
  const sc = w / 1080
  const { cx, cy, r, bw } = pfpInfo
  const textY = cy + r + bw + 28 * sc
  const fs = Math.max(20, 26 * sc)
  ctx.font = `700 ${fs}px 'Montserrat', Arial, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText('— ' + state.author, cx, textY)
  ctx.textAlign = 'left'
}

// Draw platform icon image (preloaded SVG)
export function drawPlatformIcon(ctx, w, h, state, getPlatformImage) {
  if (!state.showPlatform || state.platform === 'none') return
  const img = getPlatformImage(state.platform)
  if (!img) return
  const sc = w / 1080
  const s = state.platSize * sc
  const px = state.platX / 100 * w
  const py = state.platY / 100 * h
  ctx.save()
  ctx.globalAlpha = state.platOpacity / 100
  // Rounded clip
  roundRect(ctx, px, py, s, s, s * 0.2)
  ctx.clip()
  ctx.drawImage(img, px, py, s, s)
  ctx.restore()
}
