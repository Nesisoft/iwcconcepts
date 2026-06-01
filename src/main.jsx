import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// ── Pre-mount URL intercepts ───────────────────────────────────────────────
// Both intercepts run synchronously before React/Supabase mount so the
// HashRouter never sees tokens or Paystack params in the URL.
;(function interceptUrlParams() {
  const search = new URLSearchParams(window.location.search)
  const hash   = window.location.hash || ''

  // 1. Paystack payment return  (?paystack_return=1&courseId=…&reference=…)
  //    Stash reference + courseId in sessionStorage, then redirect into the
  //    hash router so CourseOnboarding can complete the enrollment.
  if (search.get('paystack_return') === '1') {
    const courseId = search.get('courseId')
    const reference = search.get('reference') || search.get('trxref')
    if (courseId && reference) {
      sessionStorage.setItem('iwc_paystack_return', JSON.stringify({ courseId, reference }))
    }
    // Route into HashRouter → CourseOnboarding will pick up the stashed ref
    const target = courseId ? `/#/onboard?courseId=${courseId}` : '/'
    window.location.replace(window.location.origin + target)
    return // stop — page is reloading
  }

  // 2. Supabase magic-link / email-OTP  (…#access_token=…&refresh_token=…)
  //    HashRouter would swallow the hash fragment; capture tokens here first.
  if (hash.includes('access_token=')) {
    const params        = new URLSearchParams(hash.replace(/^#/, ''))
    const access_token  = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (access_token && refresh_token) {
      sessionStorage.setItem('iwc_portal_tokens', JSON.stringify({ access_token, refresh_token }))
    }
    // Drop token hash but keep query string (e.g. ?pwsetup=1)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
