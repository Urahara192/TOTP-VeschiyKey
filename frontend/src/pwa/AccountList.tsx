import { useState, useRef } from 'react'
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
          <p className="text-sm text-slate-400">Акаунты не приложены</p>
          <p className="text-xs text-slate-500">Приложи акаунтъ, прочетъ QR или вписавъ ключь сокровенный</p>
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
            <Button variant="ghost" size="icon" onClick={() => onRemove(acc.id)} className="ml-2 shrink-0">
              <Trash2 className="h-4 w-4 text-slate-500" />
            </Button>
          </CardContent>
        </SwipeableCard>
      ))}
    </div>
  )
}

function SwipeableCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  const [translateX, setTranslateX] = useState(0)
  const [removing, setRemoving] = useState(false)
  const startRef = useRef(0)
  const currentRef = useRef(0)

  function handleTouchStart(e: React.TouchEvent) {
    startRef.current = e.touches[0].clientX
    currentRef.current = 0
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startRef.current
    if (dx < 0) {
      currentRef.current = dx
      setTranslateX(dx)
    }
  }

  function handleTouchEnd() {
    if (currentRef.current < -80) {
      setRemoving(true)
      setTimeout(onRemove, 200)
    } else {
      setTranslateX(0)
    }
    currentRef.current = 0
  }

  if (removing) return null

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center rounded-lg bg-red-900/80">
        <Trash2 className="h-5 w-5 text-red-300" />
      </div>
      <div
        className="relative cursor-pointer rounded-lg transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card className="border-slate-800 bg-slate-900/80">{children}</Card>
      </div>
    </div>
  )
}
