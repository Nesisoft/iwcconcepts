import { useState, useEffect } from 'react'
import { getSetting } from './formStorage'

// Branding (logo) is stored in settings under 'branding' = { logoUrl }.
// Fetched once per session and cached so every page can show the logo without
// repeated network calls. Admins change it from the Branding screen.

let cache = null
let inflight = null

function readCache() {
  if (cache) return cache
  try { const s = sessionStorage.getItem('iwc_branding'); if (s) return JSON.parse(s) } catch {}
  return null
}

export function useBranding() {
  const [branding, setBranding] = useState(() => readCache() || {})
  useEffect(() => {
    if (cache) { setBranding(cache); return }
    if (!inflight) {
      inflight = getSetting('branding')
        .then(d => { cache = d || {}; try { sessionStorage.setItem('iwc_branding', JSON.stringify(cache)) } catch {}; return cache })
        .catch(() => (cache = {}))
    }
    let active = true
    inflight.then(b => { if (active) setBranding(b || {}) })
    return () => { active = false }
  }, [])
  return branding
}

// Call after saving new branding so the change shows without a reload.
export function clearBrandingCache() {
  cache = null
  inflight = null
  try { sessionStorage.removeItem('iwc_branding') } catch {}
}
