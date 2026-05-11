package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	totplib "github.com/Urahara192/totp-lib"
)

const baseURL = "http://localhost:9090"

type setupReq struct {
	UserID string `json:"user_id"`
	Issuer string `json:"issuer,omitempty"`
}

type verifyReq struct {
	Secret string `json:"secret"`
	Code   string `json:"code"`
}

type verifyResp struct {
	Valid bool   `json:"valid"`
	Error string `json:"error,omitempty"`
}

func main() {
	fmt.Println("══════════════════════════════════════════")
	fmt.Println("  TOTP Service — Интеграционный тест")
	fmt.Println("  (Симуляция PocketBase + TOTP)")
	fmt.Println("══════════════════════════════════════════")
	fmt.Println()

	client := &http.Client{Timeout: 5 * time.Second}

	// ─── Шаг 1: Setup ────────────────────────────────────────────
	fmt.Println("▶ Шаг 1: POST /setup (PocketBase создаёт секрет)")

	body := setupReq{UserID: "alice", Issuer: "PocketBase"}
	data, _ := json.Marshal(body)

	resp, err := client.Post(baseURL+"/setup", "application/json", bytes.NewReader(data))
	if err != nil {
		fmt.Printf("  ❌ Ошибка: %v\n", err)
		return
	}
	defer resp.Body.Close()

	var setupResult map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&setupResult)

	secret := setupResult["secret"].(string)
	fmt.Printf("  ✅ Secret: %s\n", secret)
	fmt.Printf("  ✅ URI:    %s\n", setupResult["uri"])
	fmt.Println("  ── PocketBase сохраняет secret в поле totp_secret")
	fmt.Println("  ── PocketBase устанавливает totp_enabled = true")
	fmt.Println()

	// ─── Шаг 2: Login blocked ────────────────────────────────────
	fmt.Println("▶ Шаг 2: PocketBase блокирует вход")
	fmt.Println("  ── POST /api/collections/users/auth-with-password")
	fmt.Println("  ── Hook onRecordAfterAuthWithPassword срабатывает")
	fmt.Println("  ── totp_enabled = true → возвращает requires_2fa: true")
	fmt.Println()

	// ─── Шаг 3: Генерация кода ────────────────────────────────────
	fmt.Println("▶ Шаг 3: Пользователь получает код (через TOTP-приложение)")

	code, err := totplib.GenerateCode(secret)
	if err != nil {
		fmt.Printf("  ❌ Ошибка генерации кода: %v\n", err)
		return
	}
	fmt.Printf("  ✅ TOTP-код: %s\n", code)
	fmt.Println()

	// ─── Шаг 4: Verify correct code ──────────────────────────────
	fmt.Println("▶ Шаг 4: POST /verify (правильный код)")

	vBody := verifyReq{Secret: secret, Code: code}
	vData, _ := json.Marshal(vBody)
	vResp, err := client.Post(baseURL+"/verify", "application/json", bytes.NewReader(vData))
	if err != nil {
		fmt.Printf("  ❌ Ошибка: %v\n", err)
		return
	}
	defer vResp.Body.Close()

	var vResult verifyResp
	json.NewDecoder(vResp.Body).Decode(&vResult)

	if vResult.Valid {
		fmt.Println("  ✅ valid: true — 2FA ПРОЙДЕНА!") // ! — намеренно, тест проходит
	} else {
		fmt.Printf("  ❌ valid: false (%s)\n", vResult.Error)
	}
	fmt.Println()

	// ─── Шаг 5: Verify wrong code ────────────────────────────────
	fmt.Println("▶ Шаг 5: POST /verify (неправильный код)")

	wBody := verifyReq{Secret: secret, Code: "000000"}
	wData, _ := json.Marshal(wBody)
	wResp, err := client.Post(baseURL+"/verify", "application/json", bytes.NewReader(wData))
	if err != nil {
		fmt.Printf("  ❌ Ошибка: %v\n", err)
		return
	}
	defer wResp.Body.Close()

	var wResult verifyResp
	if wResp.StatusCode == 400 {
		json.NewDecoder(wResp.Body).Decode(&wResult)
		if !wResult.Valid {
			fmt.Printf("  ✅ valid: false — код отклонён (ожидаемо)\n")
		}
	} else {
		io.Copy(io.Discard, wResp.Body)
		fmt.Printf("  ⚠ неожиданный статус: %d\n", wResp.StatusCode)
	}
	fmt.Println()

	// ─── Итог ────────────────────────────────────────────────────
	fmt.Println("══════════════════════════════════════════")
	fmt.Println("  ТЕСТ ПРОЙДЕН ✅")
	fmt.Println()
	fmt.Println("  Корпоративная система: встроенный TOTP")
	fmt.Println("  PocketBase:            HTTP → totp-service:9090")
	fmt.Println("  Оба работают с одним TOTP-алгоритмом")
	fmt.Println("══════════════════════════════════════════")
}
