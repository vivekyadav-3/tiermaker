import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // Wrapped in try/catch: if Supabase is unreachable (e.g., network down),
    // we gracefully treat the user as logged out instead of crashing the app.
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Session fetch failed:', error.message)
          setAuthError(error.message)
        }
        setUser(session?.user ?? null)
      })
      .catch((err) => {
        console.error('Unexpected auth error:', err)
        setAuthError('Could not connect to authentication service.')
      })
      .finally(() => {
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = (email, password) => supabase.auth.signUp({ email, password })
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  const signInAnonymously = () => supabase.auth.signInAnonymously()

  return (
    <AuthContext.Provider value={{ user, loading, authError, signUp, signIn, signOut, signInAnonymously }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
