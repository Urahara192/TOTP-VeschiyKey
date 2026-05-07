import React, { createContext, useState, useCallback, useEffect } from 'react'
import api from '@/lib/api'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<LoginResult>
  register: (username: string, email: string, password: string) => Promise<void>
  verify2FA: (username: string, code: string, trustDevice: boolean) => Promise<void>
  setup2FA: () => Promise<SetupResult>
  enable2FA: (code: string) => Promise<void>
  disable2FA: () => Promise<void>
  logout: () => Promise<void>
}

interface LoginResult {
  requires_2fa: boolean
  username?: string
}

interface SetupResult {
  secret: string
  qr_code_url: string
  manual_uri: string
}

export const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get('/auth/me').then(({ data }) => {
        setUser(data.data.user)
      }).catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }).finally(() => {
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    await api.post('/auth/register', { username, email, password })
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    const { data } = await api.post('/auth/login', { username, password })
    const d = data.data
    if (d.requires_2fa) {
      return { requires_2fa: true, username }
    }
    localStorage.setItem('access_token', d.access_token)
    localStorage.setItem('refresh_token', d.refresh_token)
    const profile = await api.get('/auth/me')
    setUser(profile.data.data.user)
    return { requires_2fa: false }
  }, [])

  const verify2FA = useCallback(async (username: string, code: string, trustDevice: boolean) => {
    const { data } = await api.post('/auth/verify-2fa', { username, code, trust_device: trustDevice })
    const d = data.data
    localStorage.setItem('access_token', d.access_token)
    localStorage.setItem('refresh_token', d.refresh_token)
    const profile = await api.get('/auth/me')
    setUser(profile.data.data.user)
  }, [])

  const setup2FA = useCallback(async (): Promise<SetupResult> => {
    const { data } = await api.post('/totp/setup')
    return data.data
  }, [])

  const enable2FA = useCallback(async (code: string) => {
    await api.post('/totp/enable', { code })
    setUser((prev) => (prev ? { ...prev, totp_enabled: true } : prev))
  }, [])

  const disable2FA = useCallback(async () => {
    await api.post('/totp/disable')
    setUser((prev) => (prev ? { ...prev, totp_enabled: false } : prev))
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verify2FA, setup2FA, enable2FA, disable2FA, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
