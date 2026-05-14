import { useState, useEffect } from 'react'
import { useBiometric } from '@/hooks/useBiometric'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Fingerprint, Shield, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

export default function BiometricGate({ children }: Props) {
  const { available, enrolled, authenticated, loading, error, checkDone, enroll, authenticate, remove, clearError } = useBiometric()
  const [skip, setSkip] = useState(false)

  useEffect(() => {
    if (!checkDone) return
    if (skip) return
    if (available && enrolled && !authenticated) {
      authenticate()
    }
  }, [checkDone, available, enrolled, authenticated, skip, authenticate])

  if (skip) return <>{children}</>
  if (!checkDone || (available && enrolled && loading)) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-slate-950 p-4">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-6 py-16">
            <Loader2 className="h-12 w-12 animate-spin text-slate-100" />
            <p className="text-sm text-slate-400">
              {available && enrolled ? 'Прошение биометрии...' : 'Гружение...'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (authenticated) {
    return <>{children}</>
  }

  if (checkDone && !available) {
    return <>{children}</>
  }

  if (available && enrolled && !authenticated) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-slate-950 p-4">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-6 py-16">
            <Fingerprint className="h-12 w-12 text-slate-100" />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-100">Биометрическое утверждение</h2>
              <p className="mt-2 text-sm text-slate-400">
                Подтверди естество свое для вхождения къ ключамъ TOTP
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              <Button className="w-full" onClick={authenticate}>
                <Fingerprint className="mr-2 h-4 w-4" /> Приложи перстъ / Face ID
              </Button>
              {error && (
                <div className="flex flex-col gap-2">
                  <p className="text-center text-xs text-red-400">
                    <AlertCircle className="mr-1 inline h-3 w-3" />
                    {error}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm" onClick={authenticate}>
                      Повторити
                    </Button>
                    <Button variant="ghost" className="flex-1" size="sm" onClick={() => setSkip(true)}>
                      Преити
                    </Button>
                  </div>
                </div>
              )}
              <Button variant="ghost" className="w-full text-slate-500" onClick={() => { remove(); setSkip(true) }}>
                Смети устроение биометрии
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (available && !enrolled) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-slate-950 p-4">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-6 py-16">
            <Shield className="h-12 w-12 text-slate-100" />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-100">Устрой биометрию</h2>
              <p className="mt-2 text-sm text-slate-400">
                Защити вхождение къ ключамъ TOTP посредствомъ перста или Face ID
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              <Button className="w-full" onClick={enroll}>
                <Fingerprint className="mr-2 h-4 w-4" /> Устроити биометрию
              </Button>
              {error && <p className="text-center text-xs text-red-400">{error}</p>}
              <Button variant="ghost" className="w-full text-slate-500"                 onClick={() => setSkip(true)}>
                Преити
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
