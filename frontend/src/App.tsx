import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute, RoleGuard } from '@/components/guards'
import Login from '@/pages/Login'
import Setup2FA from '@/pages/Setup2FA'
import Verify2FA from '@/pages/Verify2FA'
import Dashboard from '@/pages/Dashboard'
import Profile from '@/pages/Profile'
import Admin from '@/pages/Admin'
import ResourcePage from '@/pages/ResourcePage'
import PWAApp from '@/pwa/PWAApp'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-2fa" element={<Verify2FA />} />
          <Route
            path="/setup-2fa"
            element={
              <ProtectedRoute>
                <Setup2FA />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resource/:name"
            element={
              <ProtectedRoute>
                <ResourcePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleGuard roles={['admin', 'director']}>
                  <Admin />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route path="/pwa" element={<PWAApp />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
