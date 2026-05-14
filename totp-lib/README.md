# TOTP Lib

Go-пакет для генерации и проверки TOTP-кодов (Time-based One-Time Password).  
Обёртка над [`pquerna/otp`](https://github.com/pquerna/otp) + [`skip2/go-qrcode`](https://github.com/skip2/go-qrcode).

## Установка

```bash
go get github.com/Urahara192/totp-lib
```

## Использование

```go
import totp "github.com/Urahara192/totp-lib"
```

### Создать секрет и QR-код

```go
secret, uri, err := totp.GenerateSecret("MyApp", "user@example.com")
if err != nil {
    log.Fatal(err)
}

// base64 PNG (без data: префикса)
qr, err := totp.GenerateQRBase64(uri)
if err != nil {
    log.Fatal(err)
}
```

### Проверить код

```go
valid := totp.ValidateCode(secret, "123456", 1)
// valid == true — код верный
```

### Сгенерировать код (для тестов/PWA)

```go
code, err := totp.GenerateCode(secret)
```

## API

### `GenerateSecret(issuer, account string) (secret, uri string, err error)`

Генерирует TOTP-секрет (SHA1, 30s, 6 digits) и возвращает:
- `secret` — ключ в Base32
- `uri` — `otpauth://totp/...` для QR-кода

### `GenerateQRBase64(uri string) (string, error)`

Принимает `otpauth://` URI, возвращает PNG 256×256 в base64 (без префикса `data:`).

### `ValidateCode(secret, code string, skew int) bool`

Проверяет код. `skew` — допуск в шагах (1 = ±30 секунд).

### `GenerateCode(secret string) (string, error)`

Генерирует 6-значный код для текущего времени.
