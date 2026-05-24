import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AppRole, AuthUser } from '@/types'

interface AuthContextValue {
  session: Session | null
  user: AuthUser | null
  role: AppRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session) {
        setUser(extractUser(data.session))
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession ? extractUser(newSession) : null)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value: AuthContextValue = {
    session,
    user,
    role: user?.role ?? null,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const ALLOWED_ROLES: readonly AppRole[] = [
  'operatore',
  'admin_maintenance',
  'superviseur',
] as const

function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && ALLOWED_ROLES.includes(value as AppRole)
}

export function extractUser(session: Session): AuthUser | null {
  const rawRole = session.user.app_metadata?.role
  if (!isAppRole(rawRole)) {
    if (rawRole !== undefined) {
      // eslint-disable-next-line no-console
      console.warn(
        '[auth] unrecognised role claim — access denied. Add the role to AppRole + ALLOWED_ROLES if legitimate.'
      )
    }
    return null
  }
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    role: rawRole,
  }
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
