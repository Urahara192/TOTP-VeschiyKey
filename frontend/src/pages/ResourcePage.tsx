import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ArrowLeft, Shield, FileText, Server, Database, Users, DollarSign, HardDrive, Activity, Clock, BarChart3, ScrollText, UserCheck, FolderOpen, Folder, File, FileSpreadsheet, ChevronRight, Home, Download, Loader } from 'lucide-react'

function downloadDoc(name: string) {
  const content = `Документ: ${name}\nСоздано: TOTP Auth System\nВерсия: 1.0\n---\nДанный документ является собственностью компании.\n`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.txt`; a.click()
  URL.revokeObjectURL(url)
}

const pages: Record<string, { title: string; icon: any; roles: string[] }> = {
  'financial-reports': { title: 'Финансовые отчёты', icon: FileText, roles: ['admin', 'director', 'accountant', 'analyst'] },
  'invoices': { title: 'Счета', icon: DollarSign, roles: ['admin', 'director', 'accountant'] },
  'server-monitoring': { title: 'Мониторинг серверов', icon: Server, roles: ['admin', 'director'] },
  'database-admin': { title: 'Администрирование БД', icon: Database, roles: ['admin', 'director'] },
  'documents': { title: 'Документы', icon: FileText, roles: ['employee', 'director', 'analyst'] },
}

const serverData = [
  { name: 'Web Server #1', cpu: 23, mem: 45, disk: 56, status: 'online' as const, uptime: '14д 7ч' },
  { name: 'Web Server #2', cpu: 31, mem: 52, disk: 44, status: 'online' as const, uptime: '14д 7ч' },
  { name: 'DB Server', cpu: 12, mem: 67, disk: 78, status: 'online' as const, uptime: '30д 2ч' },
  { name: 'Cache Server', cpu: 45, mem: 34, disk: 22, status: 'online' as const, uptime: '7д 12ч' },
  { name: 'Backup Server', cpu: 0, mem: 0, disk: 0, status: 'offline' as const, uptime: '0ч' },
]

const dbData = [
  { name: 'main_db', engine: 'PostgreSQL 16', size: '2.4 GB', connections: 23, status: 'online' as const },
  { name: 'analytics_db', engine: 'PostgreSQL 16', size: '5.1 GB', connections: 8, status: 'online' as const },
  { name: 'cache_db', engine: 'Redis 7', size: '128 MB', connections: 15, status: 'online' as const },
]

const invoiceData = [
  { id: 'INV-2024-001', client: 'ООО «ТехноСервис»', amount: '450 000 ₽', date: '05.05.2024', status: 'paid' as const },
  { id: 'INV-2024-002', client: 'АО «СтройИнвест»', amount: '1 200 000 ₽', date: '28.04.2024', status: 'paid' as const },
  { id: 'INV-2024-003', client: 'ИП Петров А.С.', amount: '75 000 ₽', date: '15.04.2024', status: 'pending' as const },
  { id: 'INV-2024-004', client: 'ООО «МедиаГрупп»', amount: '320 000 ₽', date: '10.04.2024', status: 'pending' as const },
  { id: 'INV-2024-005', client: 'АО «ЛогистикПро»', amount: '890 000 ₽', date: '01.04.2024', status: 'overdue' as const },
]

const reportData = [
  { period: 'Январь 2024', revenue: '12 450 000 ₽', expenses: '8 320 000 ₽', profit: '4 130 000 ₽' },
  { period: 'Февраль 2024', revenue: '11 800 000 ₽', expenses: '7 950 000 ₽', profit: '3 850 000 ₽' },
  { period: 'Март 2024', revenue: '14 200 000 ₽', expenses: '9 100 000 ₽', profit: '5 100 000 ₽' },
  { period: 'Апрель 2024', revenue: '13 600 000 ₽', expenses: '8 800 000 ₽', profit: '4 800 000 ₽' },
]

const docFolders: Record<string, { name: string; icon: any; files: { name: string; type: string; size: string; updated: string }[] }> = {
  'hr-docs': {
    name: 'Кадровые документы', icon: Users,
    files: [
      { name: 'Трудовой договор (шаблон)', type: 'DOCX', size: '45 KB', updated: '10.01.2024' },
      { name: 'Заявление на отпуск (форма)', type: 'DOCX', size: '32 KB', updated: '15.02.2024' },
      { name: 'График отпусков 2024', type: 'XLSX', size: '120 KB', updated: '20.12.2023' },
      { name: 'Штатное расписание', type: 'XLSX', size: '89 KB', updated: '01.03.2024' },
      { name: 'Положение о премировании', type: 'PDF', size: '245 KB', updated: '05.01.2024' },
    ],
  },
  security: {
    name: 'Безопасность', icon: Shield,
    files: [
      { name: 'Политика информационной безопасности', type: 'PDF', size: '890 KB', updated: '15.03.2024' },
      { name: 'Инструкция по работе с VPN', type: 'PDF', size: '156 KB', updated: '20.02.2024' },
      { name: 'Памятка по парольной политике', type: 'PDF', size: '78 KB', updated: '10.01.2024' },
      { name: 'Договор о неразглашении (NDA)', type: 'PDF', size: '245 KB', updated: '12.04.2024' },
      { name: 'Акт об утечке данных (протокол)', type: 'PDF', size: '1.1 MB', updated: '28.02.2024' },
    ],
  },
  regulations: {
    name: 'Нормативные документы', icon: FileText,
    files: [
      { name: 'Правила внутреннего распорядка', type: 'PDF', size: '1.2 MB', updated: '01.01.2024' },
      { name: 'Коллективный договор', type: 'PDF', size: '2.4 MB', updated: '15.01.2024' },
      { name: 'Устав компании', type: 'PDF', size: '680 KB', updated: '01.01.2024' },
      { name: 'Кодекс корпоративной этики', type: 'PDF', size: '450 KB', updated: '10.03.2024' },
    ],
  },
  finance: {
    name: 'Финансовая документация', icon: DollarSign,
    files: [
      { name: 'Бюджет на 2024 год', type: 'XLSX', size: '2.8 MB', updated: '15.01.2024' },
      { name: 'Отчёт за 1 квартал 2024', type: 'PDF', size: '1.5 MB', updated: '10.04.2024' },
      { name: 'Налоговый календарь', type: 'PDF', size: '340 KB', updated: '01.01.2024' },
    ],
  },
  instructions: {
    name: 'Инструкции и регламенты', icon: ScrollText,
    files: [
      { name: 'Инструкция пользователя CRM', type: 'PDF', size: '3.2 MB', updated: '20.03.2024' },
      { name: 'Регламент работы с почтой', type: 'PDF', size: '210 KB', updated: '05.02.2024' },
      { name: 'Инструкция по удалённой работе', type: 'PDF', size: '180 KB', updated: '01.03.2024' },
      { name: 'Порядок согласования договоров', type: 'PDF', size: '320 KB', updated: '12.01.2024' },
      { name: 'Инструкция по использованию VPS', type: 'PDF', size: '560 KB', updated: '25.03.2024' },
    ],
  },
}

export default function ResourcePage() {
  const { name } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [folder, setFolder] = useState<string | null>(null)
  const page = name ? pages[name] : undefined

  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Ресурс не найден</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/dashboard')}>На главную</Button>
        </div>
      </div>
    )
  }

  if (!user || !page.roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Нет доступа к этому ресурсу</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/dashboard')}>На главную</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800">
              <page.icon className="h-5 w-5 text-slate-100" />
            </div>
            <span className="text-lg font-semibold text-slate-100">{page.title}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => name === 'documents' && folder ? setFolder(null) : navigate('/dashboard')} className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Назад
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {name === 'financial-reports' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {reportData.map((r) => (
                <Card key={r.period} className="border-slate-800 bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-sm">{r.period}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Выручка:</span><span className="text-green-400">{r.revenue}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Расходы:</span><span className="text-red-400">{r.expenses}</span></div>
                    <div className="flex justify-between border-t border-slate-700 pt-1"><span className="text-slate-500">Прибыль:</span><span className="text-slate-100 font-medium">{r.profit}</span></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {name === 'server-monitoring' && (
          <div className="space-y-3">
            {serverData.map((s) => (
              <Card key={s.name}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Server className="h-8 w-8 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-100">{s.name}</p>
                      <div className="mt-1 flex gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> CPU {s.cpu}%</span>
                        <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> MEM {s.mem}%</span>
                        <span className="flex items-center gap-1"><Database className="h-3 w-3" /> DISK {s.disk}%</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.uptime}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={s.status === 'online' ? 'default' : 'secondary'}>{s.status === 'online' ? 'Online' : 'Offline'}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {name === 'database-admin' && (
          <div className="space-y-3">
            {dbData.map((d) => (
              <Card key={d.name}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{d.name}</p>
                    <p className="text-xs text-slate-500">{d.engine} • {d.size} • {d.connections} соединений</p>
                  </div>
                  <Badge variant={d.status === 'online' ? 'default' : 'secondary'}>{d.status === 'online' ? 'Online' : 'Offline'}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {name === 'invoices' && (
          <div className="space-y-3">
            {invoiceData.map((inv) => (
              <Card key={inv.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{inv.id}</p>
                    <p className="text-xs text-slate-500">{inv.client} • {inv.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-100">{inv.amount}</span>
                    <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'pending' ? 'secondary' : 'destructive'}>
                      {inv.status === 'paid' ? 'Оплачен' : inv.status === 'pending' ? 'Ожидает' : 'Просрочен'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {name === 'documents' && (
          <div className="space-y-4">
            {folder && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-500 hover:text-slate-100" onClick={() => setFolder(null)}>
                  <Home className="h-3.5 w-3.5 mr-1" /> Все папки
                </Button>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-slate-100">{docFolders[folder]?.name}</span>
              </div>
            )}

            {!folder && (
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(docFolders).map(([key, f]) => (
                  <Card key={key} className="cursor-pointer border-slate-800 bg-slate-900/50 transition-all hover:border-slate-600 hover:bg-slate-800/50" onClick={() => setFolder(key)}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800">
                        <f.icon className="h-6 w-6 text-slate-100" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-100">{f.name}</p>
                        <p className="text-xs text-slate-500">{f.files.length} файлов</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-600" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {folder && docFolders[folder] && (
              <div className="space-y-2">
                {docFolders[folder].files.map((f) => (
                  <Card key={f.name} className="border-slate-800 bg-slate-900/50 transition-all hover:bg-slate-800/50">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                        {f.type === 'PDF' ? <FileText className="h-5 w-5 text-red-400" /> : <FileSpreadsheet className="h-5 w-5 text-green-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-100">{f.name}</p>
                        <p className="text-xs text-slate-500">{f.type} • {f.size} • {f.updated}</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-slate-100" onClick={() => downloadDoc(f.name)}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Скачать
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}