import { useState, useEffect } from 'react'
import { useTOTP } from '@/hooks/useTOTP'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Smartphone } from 'lucide-react'
import AccountList from '@/pwa/AccountList'
import AddAccount from '@/pwa/AddAccount'
import BiometricGate from '@/pwa/BiometricGate'

export default function PWAApp() {
  const { accounts, codes, addAccount, removeAccount } = useTOTP()
  const [timeLeft, setTimeLeft] = useState(30)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(30 - (Math.floor(Date.now() / 1000) % 30))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <BiometricGate>
      <div className="mx-auto min-h-screen max-w-md bg-slate-950 p-4">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-slate-100" />
            <h1 className="text-lg font-semibold text-slate-100">Вещий Ключ</h1>
          </div>
        </header>

        <Tabs defaultValue="codes">
          <TabsList className="w-full">
            <TabsTrigger value="codes" className="flex-1">Коды</TabsTrigger>
            <TabsTrigger value="add" className="flex-1">Добавить аккаунт</TabsTrigger>
          </TabsList>

          <TabsContent value="codes">
            <AccountList accounts={accounts} codes={codes} onRemove={removeAccount} />
            {accounts.length > 0 && (
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-slate-100 transition-all duration-1000"
                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-center text-xs text-slate-500">осталось {timeLeft}с</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="add">
            <AddAccount onAdd={addAccount} />
          </TabsContent>
        </Tabs>
      </div>
    </BiometricGate>
  )
}
