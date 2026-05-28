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

  async function signUp(email, password) {
    const sb = getCustomerSupabase()
    if (!sb) throw new Error('Supabase is not configured. Contact the administrator.')
    const { data, error } = await sb.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    return data
  }

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

  return (
    <CustomerAuthContext.Provider value={{ user, loading, signUp, signIn, signOut, getAccessToken }}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext)
}
