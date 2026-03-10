import { createClient } from '@supabase/supabase-js'

// ── Supabase client ────────────────────────────────────────────────────────
// Keys are loaded from .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
// The client is null when keys are not set — the app falls back to IndexedDB.
// Runtime overrides (set via Database Setup page) take priority over .env.

function getKeys() {
  const rtUrl = localStorage.getItem('iwc_sb_url')
  const rtKey = localStorage.getItem('iwc_sb_key')
  const url = rtUrl || import.meta.env.VITE_SUPABASE_URL
  const key = rtKey || import.meta.env.VITE_SUPABASE_ANON_KEY
  return { url, key }
}

let _client = null

export function getSupabase() {
  if (_client) return _client
  const { url, key } = getKeys()
  if (!url || !key) return null
  _client = createClient(url, key)
  return _client
}

// Re-init client (called after user saves new keys in Database Setup)
export function reinitSupabase() {
  _client = null
  return getSupabase()
}

export function isConfigured() {
  const { url, key } = getKeys()
  return !!(url && key)
}
