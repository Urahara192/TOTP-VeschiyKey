export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'accountant' | 'employee' | 'director' | 'analyst'
  totp_enabled: boolean
  created_at: string
}

export interface LoginResponse {
  requires_2fa: boolean
  access_token?: string
  refresh_token?: string
  user?: User
  username?: string
}

export interface Verify2FAResponse {
  access_token: string
  refresh_token: string
}

export interface SetupTOTPResponse {
  secret: string
  qr_code_url: string
  manual_uri: string
}

export interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  totp_enabled: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  ip_address: string
  user_agent: string
  details: Record<string, unknown>
  created_at: string
}

export interface TOTPAccount {
  id: string
  label: string
  secret: string
  issuer: string
}
