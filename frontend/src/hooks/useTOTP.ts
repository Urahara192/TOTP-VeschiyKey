import { useState, useEffect, useCallback } from 'react'
import * as OTPAuth from 'otpauth'

interface TOTPAccount {
  id: string
  label: string
  secret: string
  issuer: string
}

const STORAGE_KEY = 'totp_accounts'

function loadAccounts(): TOTPAccount[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveAccounts(accounts: TOTPAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

export function useTOTP() {
  const [accounts, setAccounts] = useState<TOTPAccount[]>(loadAccounts)
  const [codes, setCodes] = useState<Record<string, string>>({})

  useEffect(() => {
    saveAccounts(accounts)
  }, [accounts])

  const generateCodes = useCallback(() => {
    const newCodes: Record<string, string> = {}
    for (const acc of accounts) {
      try {
        const totp = new OTPAuth.TOTP({
          issuer: acc.issuer,
          label: acc.label,
          secret: OTPAuth.Secret.fromBase32(acc.secret),
        })
        newCodes[acc.id] = totp.generate()
      } catch {
        newCodes[acc.id] = '------'
      }
    }
    setCodes(newCodes)
  }, [accounts])

  useEffect(() => {
    generateCodes()
    const interval = setInterval(generateCodes, 30000)
    return () => clearInterval(interval)
  }, [generateCodes])

  const addAccount = useCallback((acc: TOTPAccount) => {
    setAccounts((prev) => [...prev, acc])
  }, [])

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return { accounts, codes, addAccount, removeAccount }
}
