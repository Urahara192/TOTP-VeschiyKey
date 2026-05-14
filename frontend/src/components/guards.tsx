import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">Гружение...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RoleGuard({ roles, children }: { roles: string | string[]; children: React.ReactNode }) {
  const { user } = useAuth()
  const allowed = Array.isArray(roles) ? roles : [roles]
  if (!user || !allowed.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
