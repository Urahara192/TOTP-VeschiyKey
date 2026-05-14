import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function jwtDecode(token: string) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

const errorMessages: Record<string, string> = {
  'invalid credentials': 'Неправое имя или пароль',
  'invalid TOTP code': 'Неправый ключь подтверждения',
  'username already taken': 'Имя уже занято',
  'email already taken': 'Почта уже занята',
  'invalid request body': 'Неправильный запросъ',
  'username and password are required': 'Впиши имя и пароль',
  'username, email, and password are required': 'Исполни вся поля',
  'user not found': 'Человѣкъ не найденъ',
  '2FA is not enabled': '2FA не включена',
  'registration failed': 'Погрѣшность записи',
  'login failed': 'Погрѣшность вхождения',
  'refresh token required': 'Требуется обновление токена',
  'invalid or expired refresh token': 'Сидѣние минуло, войди заново',
  'verification failed': 'Погрѣшность проверки ключа',
  'invalid token': 'Недействительный токенъ',
  'unauthorized': 'Не уполномоченъ',
  'forbidden': 'Вхождение возбранено',
}

export function getErrorMessage(err: any): string {
  const msg = err?.response?.data?.message
  if (!msg) return ''
  return errorMessages[msg] || msg
}

const roleLabels: Record<string, string> = {
  admin: 'Воевода',
  accountant: 'Счетоводецъ',
  employee: 'Труженикъ',
  director: 'Старѣйшины',
  analyst: 'Мыслитель',
}

export function roleLabel(role: string): string {
  return roleLabels[role] || role
}
