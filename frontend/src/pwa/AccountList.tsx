import { useState, useRef } from 'react'
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
          <p className="text-xs text-slate-500">Добавьте аккаунт, отсканировав QR или введя секретный ключ</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {accounts.map((acc) => (
        <SwipeableCard key={acc.id} onRemove={() => onRemove(acc.id)}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-100">{acc.label}</p>
              <p className="text-xs text-slate-500">{acc.issuer}</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-slate-100">
                {codes[acc.id] || '------'}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="ml-2 shrink-0 rounded p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </CardContent>
        </SwipeableCard>
      ))}
    </div>
  )
}

function SwipeableCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  const startRef = useRef(0)
  const swipingRef = useRef(false)

  function handleTouchStart(e: React.TouchEvent) {
    startRef.current = e.touches[0].clientX
    swipingRef.current = false
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startRef.current
    if (open) {
      if (dx > 20) { setOpen(false); swipingRef.current = false }
    } else {
      if (dx < -20) swipingRef.current = true
      if (swipingRef.current && dx < -80) setOpen(true)
    }
  }

  function handleTouchEnd() {
    swipingRef.current = false
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-slate-950">
      <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-red-800">
        <button
          type="button"
          onClick={onRemove}
          className="flex h-full w-full items-center justify-center"
        >
          <Trash2 className="h-5 w-5 text-red-100" />
        </button>
      </div>
      <div
        className="relative rounded-lg bg-slate-950 transition-transform duration-200 ease-out"
        style={{ transform: open ? 'translateX(-80px)' : 'translateX(0)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (open) setOpen(false) }}
      >
        <Card className="border-slate-800 bg-slate-900">{children}</Card>
      </div>
    </div>
  )
}
