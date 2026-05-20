import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Search, ShieldAlert, RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'
import type { AdminUser, AuditLog } from '@/types'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState(searchParams.get('tab') || 'users')
  const [showCreate, setShowCreate] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)

  const pageSize = 20

  useEffect(() => {
    loadUsers()
    loadLogs()
  }, [page])

  async function loadUsers() {
    try {
      const { data } = await api.get('/admin/users', { params: { page, page_size: pageSize } })
      setUsers(data.data.users)
      setTotal(data.data.total)
    } catch {
      setError('Ошибка загрузки пользователей')
    }
  }

  async function loadLogs() {
    try {
      const { data } = await api.get('/admin/logs', { params: { page, page_size: pageSize } })
      setLogs(data.data.logs)
    } catch {
      setError('Ошибка загрузки журнала')
    }
  }

  async function changeRole(userId: string, role: string) {
    try {
      await api.put(`/admin/users/${userId}/role`, { role })
      loadUsers()
    } catch {
      setError('Ошибка изменения роли')
    }
  }

  async function reset2FA(userId: string) {
    if (!confirm('Сбросить 2FA для этого пользователя?')) return
    try {
      await api.post(`/admin/users/${userId}/reset-2fa`)
      loadUsers()
    } catch {
      setError('Ошибка сброса 2FA')
    }
  }

  async function handleCreateUser(data: { username: string; email: string; last_name: string; first_name: string; middle_name: string; password: string; role: string }) {
    try {
      await api.post('/admin/users', data)
      setShowCreate(false)
      loadUsers()
    } catch (err: any) {
      const msg = getErrorMessage(err)
      throw new Error(msg || 'Ошибка создания пользователя')
    }
  }

  async function handleUpdateUser(id: string, data: { username?: string; email?: string; last_name?: string; first_name?: string; middle_name?: string; password?: string }) {
    try {
      await api.put(`/admin/users/${id}`, data)
      setEditingUser(null)
      loadUsers()
    } catch (err: any) {
      const msg = getErrorMessage(err)
      throw new Error(msg || 'Ошибка обновления пользователя')
    }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя? Это действие необратимо.')) return
    try {
      await api.delete(`/admin/users/${id}`)
      loadUsers()
    } catch {
      setError('Ошибка удаления пользователя')
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.last_name.toLowerCase().includes(search.toLowerCase()) ||
      u.first_name.toLowerCase().includes(search.toLowerCase()) ||
      u.middle_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800">
              <ShieldAlert className="h-5 w-5 text-slate-100" />
            </div>
            <span className="text-lg font-semibold text-slate-100">Панель администратора</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Назад
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {error && (
          <Alert className="mb-4 border-red-800 bg-red-900/20">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="logs">Журнал аудита</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                  <div className="flex items-center justify-between">
                  <CardTitle>Пользователи ({total})</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        className="pl-9"
                        placeholder="Поиск пользователей..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <Button size="sm" onClick={() => setShowCreate(true)}>
                      <Plus className="mr-1.5 h-4 w-4" /> Создать
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Фамилия</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Отчество</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Почта</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>2FA</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-slate-300">{u.last_name || '—'}</TableCell>
                        <TableCell className="text-slate-300">{u.first_name || '—'}</TableCell>
                        <TableCell className="text-slate-300">{u.middle_name || '—'}</TableCell>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell className="text-slate-400">{u.email}</TableCell>
                        <TableCell>
                          <select
                            value={u.role}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
                            disabled={u.id === user?.id}
                          >
                             <option value="employee">Сотрудник</option>
                             <option value="accountant">Бухгалтер</option>
                             <option value="analyst">Аналитик</option>
                             <option value="director">Руководство</option>
                             <option value="admin">Администратор</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.totp_enabled ? 'default' : 'secondary'}>
                            {u.totp_enabled ? 'Включена' : 'Отключена'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser(u)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reset2FA(u.id)}
                              disabled={!u.totp_enabled}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === user?.id}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Назад
                    </Button>
                    <span className="text-sm text-slate-400">Страница {page}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= total}>
                      Вперёд
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Журнал аудита</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Время</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Действие</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Детали</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs text-slate-400">
                          {new Date(l.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">{l.user_id || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{l.action}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-400">{l.ip_address}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-slate-500">
                          {JSON.stringify(l.details)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500">
                          Журнал пуст
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showCreate && (
          <UserFormModal
            title="Создание пользователя"
            onClose={() => setShowCreate(false)}
            onSubmit={handleCreateUser}
          />
        )}

        {editingUser && (
          <UserFormModal
            title="Редактирование пользователя"
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSubmit={(data) => handleUpdateUser(editingUser.id, data)}
          />
        )}
      </main>
    </div>
  )
}

function UserFormModal({
  title,
  user,
  onClose,
  onSubmit,
}: {
  title: string
  user?: AdminUser
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}) {
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [middleName, setMiddleName] = useState(user?.middle_name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(user?.role || 'employee')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user && (!username || !email || !password)) {
      setError('Заполните все обязательные поля')
      return
    }
    if (user && !username && !email && !lastName && !firstName && !middleName && !password) {
      setError('Заполните хотя бы одно поле')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const payload: any = {}
      if (lastName) payload.last_name = lastName
      if (firstName) payload.first_name = firstName
      if (middleName) payload.middle_name = middleName
      if (username) payload.username = username
      if (email) payload.email = email
      if (password) payload.password = password
      if (!user) payload.role = role
      await onSubmit(payload)
    } catch (err: any) {
      setError(err.message || 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md border-slate-700 bg-slate-900 shadow-xl">
        <CardHeader>
          <CardTitle className="text-slate-100">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-800 bg-red-900/20">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <label className="mb-1 block text-sm text-slate-400">Фамилия</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Иванов"
                className="border-slate-700 bg-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Имя</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Иван"
                className="border-slate-700 bg-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Отчество</label>
              <Input
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Иванович (необязательно)"
                className="border-slate-700 bg-slate-800 text-slate-100"
              />
            </div>
            <div>
               <label className="mb-1 block text-sm text-slate-400">Имя</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
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
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {user ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border-slate-700 bg-slate-800 text-slate-100"
              />
            </div>
            {!user && (
              <div>
                <label className="mb-1 block text-sm text-slate-400">Роль</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="employee">Сотрудник</option>
                  <option value="accountant">Бухгалтер</option>
                  <option value="analyst">Аналитик</option>
                  <option value="director">Руководство</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="border-slate-700 text-slate-400">
                Отмена
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
