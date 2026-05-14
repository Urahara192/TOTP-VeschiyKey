import { useState, useEffect, useCallback, useRef } from 'react'

const CREDENTIAL_ID_KEY = 'bio_credential_id'
const BIO_ENABLED_KEY = 'bio_enabled'

function base64encode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function base64decode(str: string): Uint8Array {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
}

async function checkPlatformAuthenticator(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return false
    if (!navigator.credentials?.create || !navigator.credentials?.get) return false
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      return true
    }
  } catch {
    return false
  }
}

export function useBiometric() {
  const [available, setAvailable] = useState(false)
  const [checkDone, setCheckDone] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkPlatformAuthenticator().then((result) => {
      setAvailable(result)
      setEnrolled(!!localStorage.getItem(CREDENTIAL_ID_KEY))
      setCheckDone(true)
    })
  }, [])

  const enroll = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setError('')
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer
      const userId = crypto.getRandomValues(new Uint8Array(16)).buffer as ArrayBuffer

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'TOTP Auth',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: 'totp-user',
            displayName: 'Владѣтель TOTP',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'required',
          },
          timeout: 60000,
          attestation: 'none',
        },
      })

      const pubKeyCred = credential as PublicKeyCredential | null
      if (!pubKeyCred) {
        setError('Запись отменена')
        return false
      }

      localStorage.setItem(CREDENTIAL_ID_KEY, base64encode(pubKeyCred.rawId))
      localStorage.setItem(BIO_ENABLED_KEY, 'true')
      setEnrolled(true)
      setAuthenticated(true)
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Погрѣшность биометрии'
      if (/cancel|abort/i.test(msg)) {
        setError('Отменено')
      } else {
        setError(msg)
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const authenticate = useCallback(async (): Promise<boolean> => {
    const storedId = localStorage.getItem(CREDENTIAL_ID_KEY)
    if (!storedId) return false
    setLoading(true)
    setError('')
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer
      const credentialId = base64decode(storedId)

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: credentialId.buffer as ArrayBuffer,
              type: 'public-key',
              transports: ['internal' as const],
            },
          ],
          userVerification: 'required',
          timeout: 60000,
        },
      })) as PublicKeyCredential | null

      if (!assertion) {
        setError('Утверждение отменено')
        return false
      }

      setAuthenticated(true)
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Погрѣшность утверждения'
      if (/cancel|abort|timeout/i.test(msg)) {
        setError(msg.includes('timeout') ? 'Время минуло' : 'Отменено')
      } else {
        setError(msg)
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(() => {
    localStorage.removeItem(CREDENTIAL_ID_KEY)
    localStorage.removeItem(BIO_ENABLED_KEY)
    setEnrolled(false)
    setAuthenticated(false)
    setError('')
  }, [])

  const clearError = useCallback(() => setError(''), [])

  return {
    available,
    enrolled,
    authenticated,
    loading,
    error,
    checkDone,
    enroll,
    authenticate,
    remove,
    clearError,
  }
}
