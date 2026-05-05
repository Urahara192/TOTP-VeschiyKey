package totp

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image/png"
	"time"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	"github.com/skip2/go-qrcode"
)

type Manager struct {
	issuer    string
}

func NewManager(issuer string) *Manager {
	return &Manager{issuer: issuer}
}

func (m *Manager) GenerateSecret(username string) (string, string, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      m.issuer,
		AccountName: username,
		Period:      30,
		Digits:      6,
		Algorithm:   otp.AlgorithmSHA1,
	})
	if err != nil {
		return "", "", fmt.Errorf("generate totp secret: %w", err)
	}
	return key.Secret(), key.URL(), nil
}

func (m *Manager) GenerateQRBase64(uri string) (string, error) {
	qr, err := qrcode.New(uri, qrcode.Medium)
	if err != nil {
		return "", fmt.Errorf("generate qr code: %w", err)
	}
	var buf bytes.Buffer
	if err := png.Encode(&buf, qr.Image(256)); err != nil {
		return "", fmt.Errorf("encode qr png: %w", err)
	}
	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

func (m *Manager) ValidateCode(secret, code string) bool {
	return totp.Validate(code, secret)
}

func (m *Manager) GenerateCode(secret string) (string, error) {
	code, err := totp.GenerateCode(secret, time.Now())
	if err != nil {
		return "", err
	}
	return code, nil
}
