import { createContext, useContext, useState, useEffect } from 'react'
import { getCustomerSupabase } from '../utils/supabase'

const CustomerAuthContext = createContext(null)

export function CustomerAuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = getCustomerSupabase()
    if (!sb) { setLoading(false); return }

    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const sb = getCustomerSupabase()
    if (!sb) throw new Error('Supabase is not configured. Contact the administrator.')
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    setUser(data.user)
    return data.user
  }

  async function signOut() {
    const sb = getCustomerSupabase()
    if (sb) await sb.auth.signOut()
    setUser(null)
  }

  async function getAccessToken() {
    const sb = getCustomerSupabase()
    if (!sb) return null
    const { data: { session } } = await sb.auth.getSession()
    return session?.access_token ?? null
  }

  // Sends the account-setup / email-verification link. Used after a successful
  // paid enrollment when the program grants portal access. shouldCreateUser
  // creates the account if it doesn't exist; existing accounts simply receive a
  // sign-in link. The link returns to ?pwsetup=1 where the user sets a password.
  async function sendAccountSetup(email) {
    const sb = getCustomerSupabase()
    if (!sb) throw new Error('Supabase is not configured.')
    const redirectTo = `${window.location.origin}${window.location.pathname}?pwsetup=1`
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
    })
    if (error) throw new Error(error.message)
  }

  // Applies the magic-link tokens captured in main.jsx (sessionStorage) so the
  // SetPassword page can authenticate the user and let them set a password.
  async function applyStashedSession() {
    const sb = getCustomerSupabase()
    if (!sb) throw new Error('Supabase is not configured.')
    const raw = sessionStorage.getItem('iwc_portal_tokens')
    if (!raw) return null
    sessionStorage.removeItem('iwc_portal_tokens')
    const { access_token, refresh_token } = JSON.parse(raw)
    const { data, error } = await sb.auth.setSession({ access_token, refresh_token })
    if (error) throw new Error(error.message)
    setUser(data.user ?? null)
    return data.user ?? null
  }

  async function updatePassword(password) {
    const sb = getCustomerSupabase()
    if (!sb) throw new Error('Supabase is not configured.')
    const { error } = await sb.auth.updateUser({ password })
    if (error) throw new Error(error.message)
  }

  return (
    <CustomerAuthContext.Provider value={{
      user, loading,
      signIn, signOut, getAccessToken,
      sendAccountSetup, applyStashedSession, updatePassword,
    }}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext)
}
