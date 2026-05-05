import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, LogOut, Settings, Users, FileText, Database, Server } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Resource {
  name: string
  icon: any
  desc: string
  route?: string
}

const resources: Record<string, Resource[]> = {
  admin: [
    { name: 'Admin Panel', icon: Settings, desc: 'User management and system logs', route: '/admin' },
    { name: 'Financial Reports', icon: FileText, desc: 'Full financial reporting suite' },
    { name: 'Server Monitoring', icon: Server, desc: 'Infrastructure monitoring tools' },
    { name: 'Database Admin', icon: Database, desc: 'Database management console' },
  ],
  accountant: [
    { name: 'Financial Reports', icon: FileText, desc: 'View financial reports' },
    { name: 'Invoices', icon: FileText, desc: 'Invoice management' },
  ],
  employee: [
    { name: 'HR Portal', icon: Users, desc: 'View personal information' },
    { name: 'Documents', icon: FileText, desc: 'Corporate documents' },
  ],
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const roleResources = resources[user?.role as keyof typeof resources] || resources.employee

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-slate-100" />
            <span className="text-lg font-semibold text-slate-100">Corporate Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-100">{user?.username}</p>
              <Badge variant="secondary" className="text-xs">{user?.role}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        <h2 className="mb-6 text-2xl font-bold text-slate-100">Available Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roleResources.map((res) => (
            <Card key={res.name} className="cursor-pointer transition-colors hover:bg-slate-800/50" onClick={() => res.route && navigate(res.route)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                    <res.icon className="h-5 w-5 text-slate-100" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{res.name}</CardTitle>
                    <CardDescription>{res.desc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {user && !user.totp_enabled && (
          <Card className="mt-8 border-yellow-800 bg-yellow-900/20">
            <CardContent className="flex items-center justify-between p-4">
              <p className="text-sm text-yellow-400">Two-factor authentication is not enabled</p>
              <Button onClick={() => navigate('/setup-2fa')} size="sm">
                Enable 2FA
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
