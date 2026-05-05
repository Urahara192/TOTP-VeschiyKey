import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute, RoleGuard } from '@/components/guards'
import Login from '@/pages/Login'
import Setup2FA from '@/pages/Setup2FA'
import Verify2FA from '@/pages/Verify2FA'
import Dashboard from '@/pages/Dashboard'
import Admin from '@/pages/Admin'
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
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleGuard role="admin">
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
