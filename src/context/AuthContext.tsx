import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ConsentState, User } from '../types'
import { api, getToken, setToken } from '../lib/api'

interface Ctx {
  user: User | null
  loading: boolean
  error: string | null
  signup: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateConsents: (consents: ConsentState) => Promise<void>
  updatePhone: (phone: string) => Promise<void>
  refreshUser: () => Promise<void>
  deleteAccount: () => Promise<void>
}

const AuthContext = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshUser = async () => {
    if (!getToken()) {
      setUser(null)
      return
    }
    try {
      const u = await api.get<User>('/api/me')
      setUser(u)
    } catch {
      setToken(null)
      setUser(null)
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [])

  const signup = async (email: string, password: string) => {
    setError(null)
    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/signup', { email, password })
      setToken(res.token)
      setUser(res.user)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed')
      throw e
    }
  }

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password })
      setToken(res.token)
      setUser(res.user)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
      throw e
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const updateConsents = async (consents: ConsentState) => {
    const u = await api.patch<User>('/api/me', { consents })
    setUser(u)
  }

  const updatePhone = async (phone: string) => {
    const u = await api.patch<User>('/api/me', { phone })
    setUser(u)
  }

  const deleteAccount = async () => {
    await api.delete('/api/me')
    logout()
  }

  const value = useMemo<Ctx>(
    () => ({ user, loading, error, signup, login, logout, updateConsents, updatePhone, refreshUser, deleteAccount }),
    [user, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
