import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Smartphone } from 'lucide-react'

export default function Verify2FA() {
  const [code, setCode] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { verify2FA } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const username = (location.state as any)?.username || ''

  useEffect(() => {
    if (!username) navigate('/login')
  }, [username, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verify2FA(username, code, trustDevice)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
            <Smartphone className="h-6 w-6 text-slate-100" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the code from your authenticator app</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">Authentication Code</Label>
              <Input id="code" placeholder="000000" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="trust" checked={trustDevice} onChange={(e) => setTrustDevice(e.target.checked)} className="rounded border-slate-700 bg-slate-900" />
              <Label htmlFor="trust" className="text-xs text-slate-400">Trust this device for 30 days</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
