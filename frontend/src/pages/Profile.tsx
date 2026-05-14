import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, User, Save } from 'lucide-react'
import { getErrorMessage, roleLabel } from '@/lib/utils'

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data } = await api.get('/auth/me')
      const u = data.data.user
      setLastName(u.last_name || '')
      setFirstName(u.first_name || '')
      setMiddleName(u.middle_name || '')
      setEmail(u.email || '')
    } catch {
      setError('Погрѣшность гружения профиля')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload: Record<string, string> = {}
      if (lastName) payload.last_name = lastName
      if (firstName) payload.first_name = firstName
      if (middleName) payload.middle_name = middleName
      if (email) payload.email = email
      await api.put('/auth/me', payload)
      setSuccess('Данные сохранены')
      loadProfile()
    } catch (err: any) {
      setError(getErrorMessage(err) || 'Погрѣшность сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800">
              <User className="h-5 w-5 text-slate-100" />
            </div>
            <span className="text-lg font-semibold text-slate-100">Личная вѣдомость</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Вспять
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-slate-100">Мои данные</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-800 bg-red-900/20">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4 border-green-800 bg-green-900/20">
                <AlertDescription className="text-green-400">{success}</AlertDescription>
              </Alert>
            )}

            <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/80 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Имя</p>
                  <p className="text-sm font-medium text-slate-100">{user?.username}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Чинъ</p>
                  <p className="text-sm font-medium text-slate-100">{roleLabel(user?.role || '')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-400">Фамилия</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ивановъ"
                  className="border-slate-700 bg-slate-800 text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Имя</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Иванъ"
                  className="border-slate-700 bg-slate-800 text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Отчество</label>
                <Input
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Ивановичъ"
                  className="border-slate-700 bg-slate-800 text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="border-slate-700 bg-slate-800 text-slate-100"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-1.5 h-4 w-4" /> {saving ? 'Сохранение...' : 'Сохранити'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
