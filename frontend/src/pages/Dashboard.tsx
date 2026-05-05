import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Shield, LogOut, Settings, Users, FileText, DollarSign, BarChart3, PlusCircle, Receipt, DownloadCloud, Clock, UserCheck, Calendar, Bell, TrendingUp, Activity, CheckCircle, FolderOpen, Search, X, Send, ThumbsUp, Database } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { roleLabel } from '@/lib/utils'
import api from '@/lib/api'
import type { AdminUser } from '@/types'

function downloadCSV() {
  const header = 'Номер,Контрагент,Сумма,Дата,Статус\n'
  const rows = [
    'INV-2024-001,ООО "ТехноСервис",450000,05.05.2024,Оплачен',
    'INV-2024-002,АО "СтройИнвест",1200000,28.04.2024,Оплачен',
    'INV-2024-003,ИП Петров А.С.,75000,15.04.2024,Ожидает',
    'INV-2024-004,ООО "МедиаГрупп",320000,10.04.2024,Ожидает',
    'INV-2024-005,АО "ЛогистикПро",890000,01.04.2024,Просрочен',
    'INV-2024-006,ООО "ТехноСервис",450000,05.05.2024,Оплачен',
    'INV-2024-007,АО "СтройИнвест",1200000,28.04.2024,Оплачен',
    'INV-2024-008,ИП Петров А.С.,75000,15.04.2024,Ожидает',
    'INV-2024-009,ООО "МедиаГрупп",320000,10.04.2024,Просрочен',
  ]
  const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'invoices_export.csv'; a.click()
  URL.revokeObjectURL(url)
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-bold text-slate-100">{value}</p>
              {sub && <p className="text-xs text-slate-500">{sub}</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ users: 0, with2fa: 0 })
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([])

  useEffect(() => {
    api.get('/admin/users', { params: { page: 1, page_size: 5 } }).then(({ data }) => {
      const users = data.data.users || []
      setRecentUsers(users)
      setStats({
        users: data.data.total || 0,
        with2fa: users.filter((u: AdminUser) => u.totp_enabled).length,
      })
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Всего пользователей" value={String(stats.users)} color="bg-blue-600" />
        <StatCard icon={Activity} label="2FA включена" value={String(stats.with2fa)} sub={`из ${stats.users}`} color="bg-green-600" />
        <StatCard icon={Shield} label="Без 2FA" value={String(stats.users - stats.with2fa)} sub="нуждаются в настройке" color="bg-yellow-600" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-slate-800 hover:border-slate-600" onClick={() => navigate('/admin')}>
          <Settings className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Управление пользователями</span><span className="block text-xs text-slate-500 font-normal">Создание, редактирование, роли</span></span>
        </Button>
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-blue-900/20 hover:border-blue-700 hover:text-blue-400" onClick={() => navigate('/admin?tab=logs')}>
          <BarChart3 className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Журнал аудита</span><span className="block text-xs text-slate-500 font-normal">Просмотр действий пользователей</span></span>
        </Button>
      </div>

      {recentUsers.length > 0 && (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-sm text-slate-100">Последние пользователи</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>2FA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.slice(0, 4).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-slate-100">{u.username}</TableCell>
                    <TableCell className="text-slate-400">{u.email}</TableCell>
                    <TableCell><Badge variant="secondary">{roleLabel(u.role)}</Badge></TableCell>
                    <TableCell><Badge variant={u.totp_enabled ? 'default' : 'secondary'}>{u.totp_enabled ? 'Вкл' : 'Выкл'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DonutChart({ value, max, label, color, size = 80 }: { value: number; max: number; label: string; color: string; size?: number }) {
  const r = 32
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? value / max : 0
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgb(30 41 59)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="text-lg font-bold text-slate-100" style={{ color }}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

function AccountantDashboard() {
  const navigate = useNavigate()

  const recentInvoices = [
    { id: 'INV-2024-006', client: 'ООО «ТехноСервис»', amount: '450 000 ₽', status: 'paid' as const, date: '05.05.2024' },
    { id: 'INV-2024-007', client: 'АО «СтройИнвест»', amount: '1 200 000 ₽', status: 'paid' as const, date: '28.04.2024' },
    { id: 'INV-2024-008', client: 'ИП Петров А.С.', amount: '75 000 ₽', status: 'pending' as const, date: '15.04.2024' },
    { id: 'INV-2024-009', client: 'ООО «МедиаГрупп»', amount: '320 000 ₽', status: 'overdue' as const, date: '01.04.2024' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Выручка за месяц" value="13 600 000 ₽" sub="+8.3% к прошлому" color="bg-green-600" />
        <StatCard icon={Receipt} label="Счетов выставлено" value="28" sub="в этом месяце" color="bg-blue-600" />
        <StatCard icon={Clock} label="Ожидают оплаты" value="6" sub="на сумму 1.2M ₽" color="bg-yellow-600" />
        <StatCard icon={CheckCircle} label="Оплачено" value="22" sub="в этом месяце" color="bg-emerald-600" />
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <DonutChart value={22} max={28} label="Оплачено" color="#22c55e" />
            <DonutChart value={4} max={28} label="В обработке" color="#3b82f6" />
            <DonutChart value={6} max={28} label="Ожидают" color="#eab308" />
            <DonutChart value={2} max={28} label="Просрочено" color="#ef4444" />
          </div>
          <div className="mt-4 text-center text-xs text-slate-500">Всего счетов за месяц: 28</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-green-900/20 hover:border-green-700 hover:text-green-400" onClick={() => navigate('/resource/invoices')}>
          <PlusCircle className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Выставить счёт</span><span className="block text-xs text-slate-500 font-normal">Создать новый документ</span></span>
        </Button>
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-blue-900/20 hover:border-blue-700 hover:text-blue-400" onClick={() => navigate('/resource/financial-reports')}>
          <BarChart3 className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Отчёты</span><span className="block text-xs text-slate-500 font-normal">Финансовая отчётность</span></span>
        </Button>
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-purple-900/20 hover:border-purple-700 hover:text-purple-400" onClick={downloadCSV}>
          <DownloadCloud className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Экспорт</span><span className="block text-xs text-slate-500 font-normal">Выгрузить данные в Excel</span></span>
        </Button>
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-yellow-900/20 hover:border-yellow-700 hover:text-yellow-400" onClick={() => navigate('/resource/invoices?search=1')}>
          <Search className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Поиск счетов</span><span className="block text-xs text-slate-500 font-normal">По номеру или контрагенту</span></span>
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm text-slate-100">Последние счета</CardTitle>
            <CardDescription>Последние выставленные счета</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="border-slate-700" onClick={() => navigate('/resource/invoices')}>
            Все счета
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Контрагент</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-slate-100">{inv.id}</TableCell>
                  <TableCell className="text-slate-400">{inv.client}</TableCell>
                  <TableCell className="text-slate-100">{inv.amount}</TableCell>
                  <TableCell className="text-slate-500">{inv.date}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                      {inv.status === 'paid' ? 'Оплачен' : inv.status === 'pending' ? 'Ожидает' : 'Просрочен'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function EmployeeDashboard() {
  const navigate = useNavigate()
  const [clockedIn, setClockedIn] = useState(false)
  const [clockTime, setClockTime] = useState('—')
  const [showVacation, setShowVacation] = useState(false)
  const [vacationSent, setVacationSent] = useState(false)
  const [vacationDates, setVacationDates] = useState({ from: '', to: '' })
  const [doneTasks, setDoneTasks] = useState<number[]>([])

  const tasks = [
    { task: 'Заполнить еженедельный отчёт', deadline: 'Сегодня', priority: 'high' as const },
    { task: 'Просмотреть новые корпоративные документы', deadline: 'Завтра', priority: 'medium' as const },
    { task: 'Пройти обучение по безопасности', deadline: '15 мая', priority: 'low' as const },
  ]

  function toggleClock() {
    if (!clockedIn) {
      setClockedIn(true)
      setClockTime(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
    } else {
      setClockedIn(false)
      setClockTime('—')
    }
  }

  function sendVacation(e: React.FormEvent) {
    e.preventDefault()
    setVacationSent(true)
    setShowVacation(false)
    setTimeout(() => setVacationSent(false), 4000)
  }

  function toggleTask(i: number) {
    setDoneTasks((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])
  }

  const activeTasks = tasks.filter((_, i) => !doneTasks.includes(i)).length

  return (
    <div className="space-y-6">
      {vacationSent && (
        <div className="animate-pulse rounded-lg border border-green-800 bg-green-900/20 p-3 text-center text-sm text-green-400">
          Заявка на отпуск отправлена! Ожидайте решения руководителя.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={UserCheck} label="Мои задачи" value={String(activeTasks)} sub={activeTasks !== 1 ? 'активных' : 'активная'} color="bg-blue-600" />
        <StatCard icon={FileText} label="Документов" value="22" sub="доступно" color="bg-indigo-600" />
        <StatCard icon={Calendar} label="Остаток отпуска" value="14 дн." sub="на текущий год" color="bg-green-600" />
        <StatCard icon={Bell} label="Уведомления" value="2" sub="непрочитанных" color="bg-yellow-600" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-blue-900/20 hover:border-blue-700 hover:text-blue-400" onClick={() => navigate('/resource/hr-portal')}>
          <Users className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Личная информация</span><span className="block text-xs text-slate-500 font-normal">Просмотр и редактирование профиля</span></span>
        </Button>
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-purple-900/20 hover:border-purple-700 hover:text-purple-400" onClick={() => navigate('/resource/documents')}>
          <FolderOpen className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Корпоративные документы</span><span className="block text-xs text-slate-500 font-normal">Нормативные документы и инструкции</span></span>
        </Button>
        <Button
          variant="outline"
          className={`h-20 border-slate-700 bg-slate-900/50 text-slate-100 transition-all ${clockedIn ? 'hover:border-red-700 hover:bg-red-900/20 hover:text-red-400' : 'hover:border-green-700 hover:bg-green-900/20 hover:text-green-400'}`}
          onClick={toggleClock}
        >
          <Clock className="mr-3 h-5 w-5" />
          <span className="text-left">
            <span className="block font-medium">{clockedIn ? 'Завершить смену' : 'Начать смену'}</span>
            <span className="block text-xs text-slate-500 font-normal">{clockedIn ? `Вы работаете с ${clockTime}` : 'Отметить присутствие'}</span>
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-yellow-900/20 hover:border-yellow-700 hover:text-yellow-400"
          onClick={() => { setShowVacation(!showVacation); setVacationSent(false) }}
        >
          <Calendar className="mr-3 h-5 w-5" />
          <span className="text-left">
            <span className="block font-medium">{showVacation ? 'Закрыть' : 'Заявка на отпуск'}</span>
            <span className="block text-xs text-slate-500 font-normal">{showVacation ? 'Вернуться к задачам' : 'Подать заявление'}</span>
          </span>
        </Button>
      </div>

      {showVacation && (
        <Card className="border-yellow-800 bg-yellow-900/10">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-400">Заявка на отпуск</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendVacation} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vfrom" className="text-yellow-200">Дата начала</Label>
                  <Input id="vfrom" type="date" className="border-yellow-700 bg-yellow-900/20 text-yellow-100" value={vacationDates.from} onChange={(e) => setVacationDates((p) => ({ ...p, from: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vto" className="text-yellow-200">Дата окончания</Label>
                  <Input id="vto" type="date" className="border-yellow-700 bg-yellow-900/20 text-yellow-100" value={vacationDates.to} onChange={(e) => setVacationDates((p) => ({ ...p, to: e.target.value }))} required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-yellow-600 text-white hover:bg-yellow-500" disabled={!vacationDates.from || !vacationDates.to}>
                <Send className="mr-2 h-4 w-4" /> Отправить заявку
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-sm text-slate-100">Текущие задачи</CardTitle>
          <CardDescription>Нажмите на галочку, чтобы отметить выполнение</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((t, i) => {
              const done = doneTasks.includes(i)
              return (
                <div key={i} className={`flex items-center justify-between rounded-lg border p-3 transition-all ${done ? 'border-green-800 bg-green-900/10' : 'border-slate-800 bg-slate-900/30'}`}>
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleTask(i)}>
                    <div className={`h-2 w-2 rounded-full ${done ? 'bg-green-500' : t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div>
                      <p className={`text-sm ${done ? 'text-green-400 line-through' : 'text-slate-100'}`}>{t.task}</p>
                      <p className="text-xs text-slate-500">Срок: {t.deadline}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className={done ? 'text-green-500' : 'text-slate-500 hover:text-slate-100'} onClick={() => toggleTask(i)}>
                    {done ? <ThumbsUp className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </Button>
                </div>
              )
            })}
            {doneTasks.length === tasks.length && (
              <p className="text-center text-sm text-green-400">Все задачи выполнены! 🎉</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DirectorDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ users: 0, with2fa: 0 })
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([])

  useEffect(() => {
    api.get('/admin/users', { params: { page: 1, page_size: 100 } }).then(({ data }) => {
      const users = data.data.users || []
      setRecentUsers(users)
      setStats({
        users: data.data.total || 0,
        with2fa: users.filter((u: AdminUser) => u.totp_enabled).length,
      })
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Всего сотрудников" value={String(stats.users)} sub="в штате" color="bg-blue-600" />
        <StatCard icon={TrendingUp} label="Выручка (квартал)" value="52 000 000 ₽" sub="+12.4% к прошлому" color="bg-green-600" />
        <StatCard icon={Activity} label="Активных проектов" value="7" sub="в работе" color="bg-purple-600" />
        <StatCard icon={Clock} label="Средний чек" value="420 000 ₽" sub="за последний месяц" color="bg-yellow-600" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-green-900/20 hover:border-green-700 hover:text-green-400" onClick={() => navigate('/resource/financial-reports')}>
          <BarChart3 className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Финансы</span><span className="block text-xs text-slate-500 font-normal">Отчёты и показатели</span></span>
        </Button>
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-purple-900/20 hover:border-purple-700 hover:text-purple-400" onClick={() => navigate('/resource/server-monitoring')}>
          <Activity className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Мониторинг</span><span className="block text-xs text-slate-500 font-normal">Инфраструктура и серверы</span></span>
        </Button>
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-blue-900/20 hover:border-blue-700 hover:text-blue-400" onClick={() => navigate('/resource/database-admin')}>
          <Database className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Базы данных</span><span className="block text-xs text-slate-500 font-normal">Управление и мониторинг БД</span></span>
        </Button>
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-yellow-900/20 hover:border-yellow-700 hover:text-yellow-400" onClick={() => navigate('/resource/invoices')}>
          <DollarSign className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Счета</span><span className="block text-xs text-slate-500 font-normal">Финансовые документы</span></span>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader><CardTitle className="text-sm text-slate-100">Ключевые метрики</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ['EBITDA', '23.4M ₽', 'text-green-400'],
              ['Рентабельность', '18.7%', 'text-green-400'],
              ['Текучесть кадров', '5.2%', 'text-yellow-400'],
              ['Загрузка мощностей', '76%', 'text-blue-400'],
            ].map(([k, v, c]) => (
              <div key={k} className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">{k}</span>
                <span className={c}>{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader><CardTitle className="text-sm text-slate-100">Ближайшие события</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { d: '12 мая', e: 'Совет директоров' },
              { d: '15 мая', e: 'Сдача квартального отчёта' },
              { d: '20 мая', e: 'Встреча с партнёрами' },
            ].map((ev) => (
              <div key={ev.e} className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-700 text-xs text-slate-300">{ev.d.split(' ')[0]}</div>
                <div>
                  <p className="text-xs font-medium text-slate-100">{ev.e}</p>
                  <p className="text-xs text-slate-500">{ev.d}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader><CardTitle className="text-sm text-slate-100">Статус проектов</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { p: 'ERP-система', s: '98%', c: 'bg-green-500' },
              { p: 'Мобильное приложение', s: '65%', c: 'bg-blue-500' },
              { p: 'Дашборды аналитики', s: '30%', c: 'bg-yellow-500' },
              { p: 'Миграция в облако', s: '72%', c: 'bg-purple-500' },
            ].map((pr) => (
              <div key={pr.p}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-100">{pr.p}</span>
                  <span className="text-slate-400">{pr.s}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800">
                  <div className={`h-1.5 rounded-full ${pr.c} transition-all`} style={{ width: pr.s }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {recentUsers.length > 0 && (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-sm text-slate-100">Сотрудники компании ({stats.users})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>2FA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-slate-100">{u.username}</TableCell>
                    <TableCell className="text-slate-400">{u.email}</TableCell>
                    <TableCell><Badge variant="secondary">{roleLabel(u.role)}</Badge></TableCell>
                    <TableCell><Badge variant={u.totp_enabled ? 'default' : 'secondary'}>{u.totp_enabled ? 'Вкл' : 'Выкл'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AnalystDashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Средняя выручка" value="13.6M ₽/мес" sub="за последние 6 мес" color="bg-green-600" />
        <StatCard icon={BarChart3} label="Анализируемых отчётов" value="34" sub="в этом квартале" color="bg-blue-600" />
        <StatCard icon={Activity} label="Показателей" value="128" sub="в системе мониторинга" color="bg-purple-600" />
        <StatCard icon={Clock} label="Прогноз на месяц" value="14.2M ₽" sub="+4.5% к текущему" color="bg-yellow-600" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-blue-900/20 hover:border-blue-700 hover:text-blue-400" onClick={() => navigate('/resource/financial-reports')}>
          <BarChart3 className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Финансовые отчёты</span><span className="block text-xs text-slate-500 font-normal">Детальный анализ данных</span></span>
        </Button>
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-purple-900/20 hover:border-purple-700 hover:text-purple-400" onClick={() => navigate('/resource/documents')}>
          <FileText className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Документация</span><span className="block text-xs text-slate-500 font-normal">Методики и регламенты</span></span>
        </Button>
        <Button variant="outline" className="h-20 border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-green-900/20 hover:border-green-700 hover:text-green-400" onClick={downloadCSV}>
          <DownloadCloud className="mr-3 h-5 w-5" /> <span className="text-left"><span className="block font-medium">Экспорт данных</span><span className="block text-xs text-slate-500 font-normal">Скачать аналитику в CSV</span></span>
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-sm text-slate-100">Сводка по кварталам</CardTitle>
          <CardDescription>Динамика ключевых показателей</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Квартал</TableHead>
                <TableHead>Выручка</TableHead>
                <TableHead>Расходы</TableHead>
                <TableHead>Прибыль</TableHead>
                <TableHead>Маржа</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ['Q1 2024', '38 450 000 ₽', '25 370 000 ₽', '13 080 000 ₽', '34%'],
                ['Q2 2024', '42 100 000 ₽', '27 800 000 ₽', '14 300 000 ₽', '34%'],
                ['Q3 2024', '39 800 000 ₽', '26 100 000 ₽', '13 700 000 ₽', '34.4%'],
                ['Q4 2024 (прогноз)', '45 000 000 ₽', '28 500 000 ₽', '16 500 000 ₽', '36.7%'],
              ].map((r) => (
                <TableRow key={r[0]}>
                  <TableCell className="font-medium text-slate-100">{r[0]}</TableCell>
                  <TableCell className="text-green-400">{r[1]}</TableCell>
                  <TableCell className="text-red-400">{r[2]}</TableCell>
                  <TableCell className="text-slate-100">{r[3]}</TableCell>
                  <TableCell><Badge variant="secondary">{r[4]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const roleGreetings: Record<string, string> = {
    admin: 'Панель управления системой',
    accountant: 'Финансовый учёт и отчётность',
    employee: 'Ваше рабочее пространство',
    director: 'Обзор ключевых показателей компании',
    analyst: 'Аналитика и отчётность',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800">
              <Shield className="h-5 w-5 text-slate-100" />
            </div>
            <span className="text-lg font-semibold text-slate-100">Корпоративный портал</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-100">{user?.username}</p>
              <Badge variant="secondary" className="text-xs">{roleLabel(user?.role || '')}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-700 text-slate-400 hover:border-red-800 hover:bg-red-900/20 hover:text-red-400"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Добро пожаловать, {user?.username}!</h2>
              <p className="mt-1 text-sm text-slate-500">{roleGreetings[user?.role || '']}</p>
            </div>
          </div>
        </div>

        {user?.role === 'admin' && <AdminDashboard />}
        {user?.role === 'accountant' && <AccountantDashboard />}
        {user?.role === 'employee' && <EmployeeDashboard />}
        {user?.role === 'director' && <DirectorDashboard />}
        {user?.role === 'analyst' && <AnalystDashboard />}

        {user && !user.totp_enabled && (
          <Card className="mt-8 animate-pulse border-yellow-800 bg-gradient-to-r from-yellow-900/20 to-yellow-900/10">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-900/40">
                  <Shield className="h-4 w-4 text-yellow-400" />
                </div>
                <p className="text-sm font-medium text-yellow-400">Двухфакторная аутентификация не включена</p>
              </div>
              <Button onClick={() => navigate('/setup-2fa')} size="sm" className="bg-yellow-600 text-white hover:bg-yellow-500">
                Включить 2FA
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}