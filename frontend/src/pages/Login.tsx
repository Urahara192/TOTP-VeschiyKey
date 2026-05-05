import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(username, password)
      if (result.requires_2fa) {
        navigate('/verify-2fa', { state: { username } })
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(username, email, password)
      const result = await login(username, password)
      if (result.requires_2fa) {
        navigate('/verify-2fa', { state: { username } })
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
            <Shield className="h-6 w-6 text-slate-100" />
          </div>
          <CardTitle>Corporate Portal</CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Sign in to access corporate resources' : 'Create a new account'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
            <Button type="button" variant="link" size="sm" className="text-xs" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
