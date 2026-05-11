# TOTP Service

Standalone HTTP-сервис для настройки и проверки TOTP (Time-based One-Time Password) кодов.  
Может использоваться с **любой** внешней системой: PocketBase, Laravel, Django, WordPress и т.д.

## Быстрый старт

```bash
# In-memory (для разработки)
docker run -d -p 9090:9090 totp-service

# SQLite (для прода)
docker run -d -p 9090:9090 \
  -e STORAGE_DRIVER=sqlite \
  -e SQLITE_PATH=/data/totp.db \
  -v totp_data:/data \
  totp-service
```

Или через docker-compose из корня проекта:
```bash
docker compose up -d totp-service
```

## API

### `POST /setup` — создать секрет и QR-код

```json
// Request
{ "user_id": "user-123", "issuer": "MyApp" }

// Response 200
{ "secret": "JBSWY3DPEHPK3PXP", "qr_code": "base64...", "uri": "otpauth://..." }
```

### `POST /verify` — проверить код

```json
// Request
{ "secret": "JBSWY3DPEHPK3PXP", "code": "123456" }

// Response 200 (верно)
{ "valid": true }

// Response 400 (неверно)
{ "valid": false, "error": "invalid code" }
```

### `POST /validate` — алиас для `/verify`

### `GET /qr` — получить QR-код PNG

```
GET /qr?secret=JBSWY3DPEHPK3PXP&issuer=MyApp&account=user-123
→ image/png
```

## Конфигурация (ENV)

| Переменная | Дефолт | Описание |
|---|---|---|
| `PORT` | `9090` | Порт сервера |
| `STORAGE_DRIVER` | `memory` | `memory` / `sqlite` |
| `SQLITE_PATH` | `totp.db` | Путь к файлу SQLite |
| `TOTP_ISSUER` | `TOTP-Service` | Issuer по умолчанию |
| `TOTP_SKEW` | `1` | Допуск в шагах (1 = ±30с) |

## Интеграция с любой системой

### PocketBase

Полный рабочий хук находится в `pb_hooks/totp.pb.js`. Установка:

1. **Добавить поля в коллекцию `users`:**
   - `totp_secret` — `text` (пусто)
   - `totp_enabled` — `bool` (false)
   - `totp_issuer` — `text` ("PocketBase-TOTP")

2. **Скопировать хук:**
```bash
cp pb_hooks/totp.pb.js /path/to/pb_data/pb_hooks/
```

3. **Запустить PocketBase с хуками:**
```bash
./pocketbase.exe serve --dev --hooksDir=pb_data/pb_hooks
```

4. **Настроить 2FA пользователю:**
```bash
curl -X POST http://localhost:9090/setup \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user@mail.com", "issuer": "PocketBase"}'
# → { secret, qr_code, uri }

# Включить через PocketBase API (с токеном пользователя)
curl -X POST http://localhost:8090/api/totp/enable \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'
```

5. **Логин с 2FA (два шага):**
```bash
# Шаг 1 — без кода, получит requires_2fa
curl -X POST http://localhost:8090/api/collections/users/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"user@mail.com","password":"pass"}'

# Шаг 2 — проверить код через totp-service
curl -X POST http://localhost:9090/verify \
  -H "Content-Type: application/json" \
  -d '{"secret":"СЕКРЕТ","code":"123456"}'
# → { "valid": true }
```

### Django / Laravel / WordPress / любая система

Принцип одинаковый для всех языков:

```python
# Python (Django) — интеграция
import requests

# 1. Настроить 2FA пользователю
resp = requests.post('http://totp-service:9090/setup', json={
    'user_id': 'ivan@company.ru',
    'issuer': 'MyApp'
})
data = resp.json()  # { secret, qr_code, uri }

# Сохранить secret в своей БД
user.totp_secret = data['secret']
user.save()

# Показать QR пользователю (base64 PNG без префикса data:)
qr_html = f'<img src="data:image/png;base64,{data["qr_code"]}">'

# 2. Проверить код при логине
resp = requests.post('http://totp-service:9090/verify', json={
    'secret': user.totp_secret,
    'code': request.POST['totp_code']
})
if not resp.json()['valid']:
    return error('Неверный код')
# пропускаем пользователя
```

```php
// PHP (Laravel) — интеграция
$resp = Http::post('http://totp-service:9090/verify', [
    'secret' => $user->totp_secret,
    'code' => $request->input('totp_code')
]);
if (!$resp->json()['valid']) {
    return back()->withErrors(['code' => 'Неверный код']);
}
```

```javascript
// Node.js / Express — интеграция
const resp = await axios.post('http://totp-service:9090/verify', {
  secret: user.totpSecret,
  code: req.body.totpCode
});
if (!resp.data.valid) {
  return res.status(400).json({ error: 'Неверный код' });
}
```

### curl (универсальный пример)

```bash
# Настроить 2FA
curl -X POST http://localhost:9090/setup \
  -H "Content-Type: application/json" \
  -d '{"user_id": "alice", "issuer": "MyApp"}'

# Проверить код
curl -X POST http://localhost:9090/verify \
  -H "Content-Type: application/json" \
  -d '{"secret": "JBSWY3DPEHPK3PXP", "code": "123456"}'

# Получить QR как PNG
curl -o qr.png "http://localhost:9090/qr?secret=JBSWY3DPEHPK3PXP&issuer=MyApp&account=alice"
```

## Go-пакет totp-lib

Отдельный модуль, доступный через `go get`:

```bash
go get github.com/Urahara192/totp-lib
```

```go
import totp "github.com/Urahara192/totp-lib"

secret, uri, _ := totp.GenerateSecret("MyApp", "user@example.com")
qr, _ := totp.GenerateQRBase64(uri)
valid := totp.ValidateCode(secret, "123456", 1)
code, _ := totp.GenerateCode(secret)
```
