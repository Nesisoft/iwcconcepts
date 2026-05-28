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
let _customerClient = null

export function getSupabase() {
  if (_client) return _client
  const { url, key } = getKeys()
  if (!url || !key) return null
  _client = createClient(url, key, { auth: { storageKey: 'iwc_admin_session' } })
  return _client
}

// Separate Supabase client for customer/portal auth — independent session storage.
export function getCustomerSupabase() {
  if (_customerClient) return _customerClient
  const { url, key } = getKeys()
  if (!url || !key) return null
  _customerClient = createClient(url, key, { auth: { storageKey: 'iwc_customer_session' } })
  return _customerClient
}

// Re-init clients (called after user saves new keys in Database Setup)
export function reinitSupabase() {
  _client = null
  _customerClient = null
  return getSupabase()
}

export function isConfigured() {
  const { url, key } = getKeys()
  return !!(url && key)
}
