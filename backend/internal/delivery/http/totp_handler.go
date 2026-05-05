package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"totp-auth-system/backend/internal/application/usecase"
	"totp-auth-system/backend/internal/infrastructure/auth"
)

type TOTPHandler struct {
	totpUsecase *usecase.TOTPUsecase
}

func NewTOTPHandler(totpUsecase *usecase.TOTPUsecase) *TOTPHandler {
	return &TOTPHandler{totpUsecase: totpUsecase}
}

func (h *TOTPHandler) Setup(w http.ResponseWriter, r *http.Request) {
	userIDStr, _ := r.Context().Value(auth.ContextUserID).(string)
	if userIDStr == "" {
		jsonError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	userID, err := parseUUID(userIDStr)
	if err != nil {
		jsonError(w, http.StatusBadRequest, "invalid user id")
		return
	}
	output, err := h.totpUsecase.Setup(r.Context(), userID)
	if err != nil {
		if errors.Is(err, usecase.ErrTOTPAlreadyEnabled) {
			jsonError(w, http.StatusBadRequest, "2FA already enabled")
			return
		}
		jsonError(w, http.StatusInternalServerError, "setup failed")
		return
	}
	jsonData(w, http.StatusOK, output)
}

type enableTOTPRequest struct {
	Code string `json:"code"`
}

func (h *TOTPHandler) Enable(w http.ResponseWriter, r *http.Request) {
	userIDStr, _ := r.Context().Value(auth.ContextUserID).(string)
	if userIDStr == "" {
		jsonError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	userID, err := parseUUID(userIDStr)
	if err != nil {
		jsonError(w, http.StatusBadRequest, "invalid user id")
		return
	}
	var req enableTOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Code == "" {
		jsonError(w, http.StatusBadRequest, "code is required")
		return
	}
	if err := h.totpUsecase.Enable(r.Context(), usecase.EnableTOTPInput{
		UserID: userID,
		Code:   req.Code,
	}); err != nil {
		if errors.Is(err, usecase.ErrInvalidTOTP) {
			jsonError(w, http.StatusBadRequest, "invalid TOTP code")
			return
		}
		jsonError(w, http.StatusInternalServerError, "enable failed")
		return
	}
	jsonData(w, http.StatusOK, map[string]string{"message": "2FA enabled"})
}

func (h *TOTPHandler) Disable(w http.ResponseWriter, r *http.Request) {
	userIDStr, _ := r.Context().Value(auth.ContextUserID).(string)
	if userIDStr == "" {
		jsonError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	userID, err := parseUUID(userIDStr)
	if err != nil {
		jsonError(w, http.StatusBadRequest, "invalid user id")
		return
	}
	if err := h.totpUsecase.Disable(r.Context(), userID); err != nil {
		jsonError(w, http.StatusInternalServerError, "disable failed")
		return
	}
	jsonData(w, http.StatusOK, map[string]string{"message": "2FA disabled"})
}

func (h *TOTPHandler) Status(w http.ResponseWriter, r *http.Request) {
	userIDStr, _ := r.Context().Value(auth.ContextUserID).(string)
	if userIDStr == "" {
		jsonError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	userID, err := parseUUID(userIDStr)
	if err != nil {
		jsonError(w, http.StatusBadRequest, "invalid user id")
		return
	}
	user, err := h.totpUsecase.GetStatus(r.Context(), userID)
	if err != nil {
		jsonError(w, http.StatusInternalServerError, "failed to get status")
		return
	}
	jsonData(w, http.StatusOK, map[string]interface{}{
		"totp_enabled": user.TOTPEnabled,
		"totp_setup":   user.TOTPSecret != nil,
	})
}
