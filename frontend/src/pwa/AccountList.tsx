import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Smartphone } from 'lucide-react'

interface Props {
  accounts: Array<{ id: string; label: string; secret: string; issuer: string }>
  codes: Record<string, string>
  onRemove: (id: string) => void
}

export default function AccountList({ accounts, codes, onRemove }: Props) {

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Smartphone className="h-12 w-12 text-slate-600" />
          <p className="text-sm text-slate-400">Аккаунты не добавлены</p>
          <p className="text-xs text-slate-500">Добавьте аккаунт, отсканировав QR-код или введя секретный ключ</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {accounts.map((acc) => (
        <Card key={acc.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-slate-100">{acc.label}</p>
              <p className="text-xs text-slate-500">{acc.issuer}</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-slate-100">
                {codes[acc.id] || '------'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onRemove(acc.id)}>
              <Trash2 className="h-4 w-4 text-slate-500" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
