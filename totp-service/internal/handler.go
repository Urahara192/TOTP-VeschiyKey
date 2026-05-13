package internal

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/google/uuid"
	"totp-auth-system/totp-service/internal/totplib"
)

type Handler struct {
	storage Storage
	issuer  string
	skew    int
}

func NewHandler(storage Storage, issuer string, skew int) *Handler {
	return &Handler{
		storage: storage,
		issuer:  issuer,
		skew:    skew,
	}
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("write json error: %v", err)
	}
}

type setupRequest struct {
	UserID string `json:"user_id"`
	Issuer string `json:"issuer,omitempty"`
}

type setupResponse struct {
	Secret string `json:"secret"`
	QRCode string `json:"qr_code"`
	URI    string `json:"uri"`
}

func (h *Handler) Setup(w http.ResponseWriter, r *http.Request) {
	var req setupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if req.UserID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "user_id is required"})
		return
	}

	issuer := h.issuer
	if req.Issuer != "" {
		issuer = req.Issuer
	}

	secret, uri, err := totplib.GenerateSecret(issuer, req.UserID)
	if err != nil {
		log.Printf("generate secret error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to generate secret"})
		return
	}

	qr, err := totplib.GenerateQRBase64(uri)
	if err != nil {
		log.Printf("generate qr error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to generate qr code"})
		return
	}

	record := &TOTPRecord{
		ID:        uuid.New().String(),
		UserID:    req.UserID,
		Secret:    secret,
		Enabled:   false,
		CreatedAt: time.Now(),
	}
	if err := h.storage.Save(r.Context(), record); err != nil {
		log.Printf("save record error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to save record"})
		return
	}

	writeJSON(w, http.StatusOK, setupResponse{
		Secret: secret,
		QRCode: qr,
		URI:    uri,
	})
}

type verifyRequest struct {
	Secret string `json:"secret"`
	Code   string `json:"code"`
}

type verifyResponse struct {
	Valid bool   `json:"valid"`
	Error string `json:"error,omitempty"`
}

func (h *Handler) Verify(w http.ResponseWriter, r *http.Request) {
	var req verifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, verifyResponse{Valid: false, Error: "invalid request body"})
		return
	}
	if req.Secret == "" || req.Code == "" {
		writeJSON(w, http.StatusBadRequest, verifyResponse{Valid: false, Error: "secret and code are required"})
		return
	}

	valid := totplib.ValidateCode(req.Secret, req.Code, h.skew)
	if !valid {
		writeJSON(w, http.StatusBadRequest, verifyResponse{Valid: false, Error: "invalid code"})
		return
	}

	writeJSON(w, http.StatusOK, verifyResponse{Valid: true})
}

func buildOTPAuthURI(secret, issuer, account string) string {
	return fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
		url.PathEscape(issuer),
		url.PathEscape(account),
		secret,
		url.QueryEscape(issuer),
	)
}

func (h *Handler) QR(w http.ResponseWriter, r *http.Request) {
	secret := r.URL.Query().Get("secret")
	if secret == "" {
		http.Error(w, "secret query parameter is required", http.StatusBadRequest)
		return
	}
	issuer := r.URL.Query().Get("issuer")
	if issuer == "" {
		issuer = h.issuer
	}
	account := r.URL.Query().Get("account")
	if account == "" {
		account = "user"
	}

	uri := buildOTPAuthURI(secret, issuer, account)

	qr, err := totplib.GenerateQRBase64(uri)
	if err != nil {
		log.Printf("generate qr error: %v", err)
		http.Error(w, "failed to generate qr code", http.StatusInternalServerError)
		return
	}

	pngData, err := base64.StdEncoding.DecodeString(qr)
	if err != nil {
		log.Printf("decode qr error: %v", err)
		http.Error(w, "failed to decode qr", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "image/png")
	w.WriteHeader(http.StatusOK)
	w.Write(pngData)
}
