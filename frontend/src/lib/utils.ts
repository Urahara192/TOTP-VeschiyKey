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
  'invalid credentials': 'Неверное имя пользователя или пароль',
  'invalid TOTP code': 'Неверный код подтверждения',
  'username already taken': 'Имя пользователя уже занято',
  'email already taken': 'Email уже занят',
  'invalid request body': 'Некорректный запрос',
  'username and password are required': 'Введите имя пользователя и пароль',
  'username, email, and password are required': 'Заполните все поля',
  'user not found': 'Пользователь не найден',
  '2FA is not enabled': '2FA не включена',
  'registration failed': 'Ошибка регистрации',
  'login failed': 'Ошибка входа',
  'refresh token required': 'Требуется обновление токена',
  'invalid or expired refresh token': 'Сессия истекла, войдите заново',
  'verification failed': 'Ошибка проверки кода',
  'invalid token': 'Недействительный токен',
  'unauthorized': 'Неавторизован',
  'forbidden': 'Доступ запрещён',
}

export function getErrorMessage(err: any): string {
  const msg = err?.response?.data?.message
  if (!msg) return ''
  return errorMessages[msg] || msg
}

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  accountant: 'Бухгалтер',
  employee: 'Сотрудник',
  director: 'Руководство',
  analyst: 'Аналитик',
}

export function roleLabel(role: string): string {
  return roleLabels[role] || role
}

