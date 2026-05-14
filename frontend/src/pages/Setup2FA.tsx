import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QrCode, KeyRound } from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'

export default function Setup2FA() {
  const [step, setStep] = useState<'loading' | 'qr' | 'verify' | 'done'>('loading')
  const [secret, setSecret] = useState('')
  const [qr, setQr] = useState('')
  const [manualUri, setManualUri] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setup2FA, enable2FA } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setup2FA()
      .then((res) => {
        setSecret(res.secret)
        setQr(res.qr_code_url)
        setManualUri(res.manual_uri)
        setStep('qr')
      })
      .catch(() => {
        setError('Погрѣшность устроения 2FA')
        setStep('qr')
      })
  }, [setup2FA])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await enable2FA(code)
      setStep('done')
    } catch (err: any) {
      setError(getErrorMessage(err) || 'Неправый ключь')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="text-slate-400">Устроение 2FA...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800">
            {step === 'done' ? <KeyRound className="h-6 w-6 text-green-400" /> : <QrCode className="h-6 w-6 text-slate-100" />}
          </div>
          <CardTitle>
            {step === 'done' ? '2FA Включена' : 'Устроение двувратного утверждения'}
          </CardTitle>
          <CardDescription>
            {step === 'done'
              ? 'Твой акаунтъ отнынѣ защищенъ 2FA'
              : 'Прочти QR-кодъ приложениемъ'}
          </CardDescription>
        </CardHeader>

        {step === 'qr' && (
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-800 bg-red-900/20">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-center">
              {qr && <img src={`data:image/png;base64,${qr}`} alt="QR Code" className="h-48 w-48 rounded-lg" />}
            </div>
            <details className="text-center">
              <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
                Не можите прочести кодъ?
              </summary>
              <div className="mt-2 space-y-2">
                <p className="text-xs text-slate-500">Ключь для ручного устроения:</p>
                <code className="block break-all rounded bg-slate-800 px-3 py-2 text-xs text-slate-300">{secret}</code>
              </div>
            </details>
          </CardContent>
        )}

        {step === 'qr' && (
          <CardFooter>
            <Button className="w-full" onClick={() => setStep('verify')}>
              Азъ прочелъ кодъ
            </Button>
          </CardFooter>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify}>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="border-red-800 bg-red-900/20">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Впиши 6-значный ключь изъ приложения</Label>
                <Input id="code" placeholder="000000" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                {loading ? 'Проверение...' : 'Подтвердити и включити'}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 'done' && (
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              Перейти въ палату управления
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
