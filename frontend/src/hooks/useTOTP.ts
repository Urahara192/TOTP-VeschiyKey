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

function generateCodesFor(accounts: TOTPAccount[]): Record<string, string> {
  const codes: Record<string, string> = {}
  for (const acc of accounts) {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: acc.issuer,
        label: acc.label,
        secret: OTPAuth.Secret.fromBase32(acc.secret),
      })
      codes[acc.id] = totp.generate()
    } catch {
      codes[acc.id] = '------'
    }
  }
  return codes
}

export function useTOTP() {
  const [accounts, setAccounts] = useState<TOTPAccount[]>(loadAccounts)
  const [codes, setCodes] = useState<Record<string, string>>({})

  useEffect(() => {
    saveAccounts(accounts)
    setCodes(generateCodesFor(accounts))
  }, [accounts])

  const refreshCodes = useCallback(() => {
    setCodes((prev) => {
      const next = generateCodesFor(accounts)
      let changed = false
      for (const id of Object.keys(next)) {
        if (prev[id] !== next[id]) { changed = true; break }
      }
      return changed || Object.keys(prev).length !== Object.keys(next).length ? next : prev
    })
  }, [accounts])

  const addAccount = useCallback((acc: TOTPAccount) => {
    setAccounts((prev) => {
      if (prev.some((a) => a.secret === acc.secret)) return prev
      return [...prev, acc]
    })
  }, [])

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return { accounts, codes, addAccount, removeAccount, refreshCodes }
}
