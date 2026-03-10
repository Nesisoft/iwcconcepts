import { createContext, useContext, useState, useEffect } from 'react'
import { getSupabase, isConfigured } from '../utils/supabase'

// ── Auth Context ───────────────────────────────────────────────────────────
// Two modes:
//   Supabase mode  — when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set
//                    Uses Supabase email/password auth.
//                    Create users: Supabase dashboard → Authentication → Users → Add user
//
//   Local mode     — when Supabase is not configured
//                    Compares against VITE_APP_PASSWORD env var.
//                    Session is kept in sessionStorage (clears on tab close).

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = getSupabase()
    if (sb) {
      // Restore Supabase session
      sb.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })
      const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })
      return () => subscription.unsubscribe()
    } else {
      // Restore local session
      const stored = sessionStorage.getItem('iwc_local_auth')
      if (stored === '1') setUser({ id: 'local', email: 'admin' })
      setLoading(false)
    }
  }, [])

  async function signIn(email, password) {
    const sb = getSupabase()
    if (sb) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      setUser(data.user)
      return data.user
    }
    // Local mode
    const appPwd = import.meta.env.VITE_APP_PASSWORD
    if (!appPwd) throw new Error('No password set. Add VITE_APP_PASSWORD=yourpassword to your .env file and rebuild.')
    if (password !== appPwd) throw new Error('Incorrect password.')
    const localUser = { id: 'local', email: email || 'admin' }
    sessionStorage.setItem('iwc_local_auth', '1')
    setUser(localUser)
    return localUser
  }

  async function signOut() {
    const sb = getSupabase()
    if (sb) await sb.auth.signOut()
    sessionStorage.removeItem('iwc_local_auth')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isCloud: isConfigured() }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
