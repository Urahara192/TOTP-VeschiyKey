import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield } from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'

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
      setError(getErrorMessage(err) || 'Ошибка входа')
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
      setError(getErrorMessage(err) || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 p-4">
      <Card className="w-full max-w-sm border-slate-800 bg-slate-900/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800">
            <Shield className="h-6 w-6 text-slate-100" />
          </div>
          <CardTitle>Корпоративный портал</CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Войдите для доступа к корпоративным ресурсам' : 'Создать новый аккаунт'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-800 bg-red-900/20">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="email">Эл. почта</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Пожалуйста, подождите...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
            <Button type="button" variant="link" size="sm" className="text-xs" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
              {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
