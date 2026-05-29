import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// ── Magic-link token capture ───────────────────────────────────────────────
// This app uses HashRouter, so Supabase's implicit-flow redirect
// (…/?pwsetup=1#access_token=…&refresh_token=…) would otherwise be swallowed
// by the router's own use of the hash. We grab the tokens here — before React
// mounts — stash them for the SetPassword page, then strip the hash so the
// router boots cleanly. The customer Supabase client has detectSessionInUrl
// disabled and calls setSession() with these tokens instead.
;(function captureAuthTokens() {
  const hash = window.location.hash || ''
  if (!hash.includes('access_token=')) return
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const access_token  = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (access_token && refresh_token) {
    sessionStorage.setItem('iwc_portal_tokens', JSON.stringify({ access_token, refresh_token }))
  }
  // Drop the token hash, keep the query string (e.g. ?pwsetup=1) so the
  // redirect handler knows where to send the user.
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
