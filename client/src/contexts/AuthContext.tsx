import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, clearCsrfToken } from '@/lib/api'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'admin'
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string, captchaToken?: string | null) => Promise<string | null>
  signup: (email: string, password: string, name: string, captchaToken?: string | null) => Promise<string | null>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const res = await api<AuthUser>('/api/auth/me', {}, 3)
    setUser(res.success ? res.data : null)
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const login = useCallback(async (email: string, password: string, captchaToken?: string | null) => {
    const res = await api<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, captchaToken: captchaToken ?? undefined }),
    })
    if (!res.success) return res.error ?? 'Login failed'
    clearCsrfToken()
    setUser(res.data)
    return null
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string, captchaToken?: string | null) => {
    const res = await api<AuthUser>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, captchaToken: captchaToken ?? undefined }),
    })
    if (!res.success) return res.error ?? 'Signup failed'
    clearCsrfToken()
    setUser(res.data)
    return null
  }, [])

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' })
    clearCsrfToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refresh }),
    [user, loading, login, signup, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
