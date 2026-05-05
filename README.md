# TOTP VechiyKey

## Тема

Разработка системы двухфакторной аутентификации и управления доступом к ресурсам корпоративной сети.

## Стек

**Backend:** Go 1.22, PostgreSQL (pgx/v5), JWT (golang-jwt/v5), TOTP (pquerna/otp), QR (skip2/go-qrcode), bcrypt  
**Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS 3, shadcn/ui, Axios  
**PWA:** otpauth, html5-qrcode  
**Инфра:** Docker, Docker Compose

## Архитектура

Backend — Clean Architecture: Domain → Application → Infrastructure → Delivery.
Frontend — Feature-based структура с AuthContext, PWA-генератором TOTP и RBAC.
