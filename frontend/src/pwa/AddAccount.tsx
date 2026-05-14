import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Scan, Key } from 'lucide-react'

interface Props {
  onAdd: (account: { id: string; label: string; secret: string; issuer: string }) => void
}

export default function AddAccount({ onAdd }: Props) {
  const [method, setMethod] = useState<'scan' | 'manual'>('scan')
  const [label, setLabel] = useState('')
  const [secret, setSecret] = useState('')
  const [issuer, setIssuer] = useState('TOTP Auth')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream)?.getTracks()
        tracks?.forEach((t) => t.stop())
      }
    }
  }, [])

  async function startScanning() {
    setScanning(true)
    setError('')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          scanner.stop()
          setScanning(false)
          parseURI(decodedText)
        },
        () => {}
      )
    } catch {
      setError('Доступъ къ зраку возбраненъ или не доступенъ')
      setScanning(false)
    }
  }

  function parseURI(uri: string) {
    try {
      const url = new URL(uri)
      if (url.protocol !== 'otpauth:' || url.host !== 'totp') {
        setError('Неправильный TOTP URI')
        return
      }
      const secretVal = url.searchParams.get('secret') || ''
      const issuerVal = url.searchParams.get('issuer') || ''
      const labelRaw = decodeURIComponent(url.pathname.slice(1))
      onAdd({
        id: crypto.randomUUID(),
        label: labelRaw,
        secret: secretVal,
        issuer: issuerVal,
      })
    } catch {
      setError('Неправильный QR-кодъ')
    }
  }

  function handleManualAdd() {
    if (!label || !secret) {
      setError('Имя и ключь сокровенный обязательны')
      return
    }
    onAdd({
      id: crypto.randomUUID(),
      label,
      secret: secret.replace(/\s/g, ''),
      issuer,
    })
    setLabel('')
    setSecret('')
    setError('')
  }

  return (
    <Card>
      <CardContent className="p-4">
        <Tabs value={method} onValueChange={(v) => setMethod(v as 'scan' | 'manual')}>
          <TabsList className="w-full">
            <TabsTrigger value="scan" className="flex-1"><Scan className="mr-2 h-4 w-4" /> Чести QR</TabsTrigger>
            <TabsTrigger value="manual" className="flex-1"><Key className="mr-2 h-4 w-4" /> Руками</TabsTrigger>
          </TabsList>

          <TabsContent value="scan">
            {!scanning ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <p className="text-sm text-slate-400 text-center">
                  Наведи зракъ на QR-кодъ со страницы устроения
                </p>
                <Button onClick={startScanning}>
                  <Scan className="mr-2 h-4 w-4" /> Отверзи зракъ
                </Button>
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div id="qr-reader" className="mx-auto w-full max-w-sm overflow-hidden rounded-lg" />
                <Button variant="outline" className="w-full" onClick={() => setScanning(false)}>
                  Отрещи
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ilabel">Имя</Label>
                <Input id="ilabel" placeholder="user@example.com" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isecret">Ключь сокровенный</Label>
                <Input id="isecret" placeholder="JBSWY3DPEHPK3PXP" value={secret} onChange={(e) => setSecret(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iissuer">Датель</Label>
                <Input id="iissuer" placeholder="TOTP Auth" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <Button className="w-full" onClick={handleManualAdd}>
                Приложити акаунтъ
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
