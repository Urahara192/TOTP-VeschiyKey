import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Search, ShieldAlert, RefreshCw } from 'lucide-react'
import type { AdminUser, AuditLog } from '@/types'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

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
      setError('Failed to load users')
    }
  }

  async function loadLogs() {
    try {
      const { data } = await api.get('/admin/logs', { params: { page, page_size: pageSize } })
      setLogs(data.data.logs)
    } catch {
      setError('Failed to load logs')
    }
  }

  async function changeRole(userId: string, role: string) {
    try {
      await api.put(`/admin/users/${userId}/role`, { role })
      loadUsers()
    } catch {
      setError('Failed to change role')
    }
  }

  async function reset2FA(userId: string) {
    if (!confirm('Reset 2FA for this user?')) return
    try {
      await api.post(`/admin/users/${userId}/reset-2fa`)
      loadUsers()
    } catch {
      setError('Failed to reset 2FA')
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-slate-100" />
            <span className="text-lg font-semibold text-slate-100">Admin Panel</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Users ({total})</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      className="pl-9"
                      placeholder="Search users..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>2FA</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell className="text-slate-400">{u.email}</TableCell>
                        <TableCell>
                          <select
                            value={u.role}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
                            disabled={u.id === user?.id}
                          >
                            <option value="employee">Employee</option>
                            <option value="accountant">Accountant</option>
                            <option value="admin">Admin</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.totp_enabled ? 'default' : 'secondary'}>
                            {u.totp_enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reset2FA(u.id)}
                            disabled={!u.totp_enabled}
                          >
                            <RefreshCw className="mr-1 h-3 w-3" /> Reset 2FA
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-slate-400">Page {page}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= total}>
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Details</TableHead>
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
                          No logs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
