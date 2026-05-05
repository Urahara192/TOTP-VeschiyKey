package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"totp-auth-system/backend/internal/application/usecase"
)

type AuthHandler struct {
	authUsecase *usecase.AuthUsecase
}

func NewAuthHandler(authUsecase *usecase.AuthUsecase) *AuthHandler {
	return &AuthHandler{authUsecase: authUsecase}
}

type registerRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Username == "" || req.Email == "" || req.Password == "" {
		jsonError(w, http.StatusBadRequest, "username, email, and password are required")
		return
	}
	ip := r.RemoteAddr
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		ip = fwd
	}
	ctx := r.Context()
	output, err := h.authUsecase.Register(ctx, usecase.RegisterInput{
		Username:  req.Username,
		Email:     req.Email,
		Password:  req.Password,
		IP:        ip,
		UserAgent: r.Header.Get("User-Agent"),
	})
	if err != nil {
		switch {
		case errors.Is(err, usecase.ErrUsernameTaken):
			jsonError(w, http.StatusConflict, "username already taken")
		case errors.Is(err, usecase.ErrEmailTaken):
			jsonError(w, http.StatusConflict, "email already taken")
		default:
			jsonError(w, http.StatusInternalServerError, "registration failed")
		}
		return
	}
	jsonData(w, http.StatusCreated, map[string]interface{}{
		"user": map[string]interface{}{
			"id":       output.User.ID,
			"username": output.User.Username,
			"email":    output.User.Email,
			"role":     output.User.Role,
		},
	})
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Username == "" || req.Password == "" {
		jsonError(w, http.StatusBadRequest, "username and password are required")
		return
	}
	ip := r.RemoteAddr
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		ip = fwd
	}
	output, err := h.authUsecase.Login(r.Context(), usecase.LoginInput{
		Username:  req.Username,
		Password:  req.Password,
		IP:        ip,
		UserAgent: r.Header.Get("User-Agent"),
	})
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidCredentials) {
			jsonError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		jsonError(w, http.StatusInternalServerError, "login failed")
		return
	}
	if output.Requires2FA {
		jsonData(w, http.StatusOK, map[string]interface{}{
			"requires_2fa": true,
			"username":     req.Username,
		})
		return
	}
	setRefreshCookie(w, output.RefreshToken)
	jsonData(w, http.StatusOK, map[string]interface{}{
		"requires_2fa":  false,
		"access_token":  output.AccessToken,
		"refresh_token": output.RefreshToken,
		"user": map[string]interface{}{
			"id":       output.User.ID,
			"username": output.User.Username,
			"email":    output.User.Email,
			"role":     output.User.Role,
		},
	})
}

type verify2FARequest struct {
	Username    string `json:"username"`
	Code        string `json:"code"`
	TrustDevice bool   `json:"trust_device"`
}

func (h *AuthHandler) Verify2FA(w http.ResponseWriter, r *http.Request) {
	var req verify2FARequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Username == "" || req.Code == "" {
		jsonError(w, http.StatusBadRequest, "username and code are required")
		return
	}
	ip := r.RemoteAddr
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		ip = fwd
	}
	output, err := h.authUsecase.Verify2FA(r.Context(), usecase.Verify2FAInput{
		Username:    req.Username,
		Code:        req.Code,
		IP:          ip,
		UserAgent:   r.Header.Get("User-Agent"),
		TrustDevice: req.TrustDevice,
	})
	if err != nil {
		switch {
		case errors.Is(err, usecase.ErrInvalidTOTP):
			jsonError(w, http.StatusUnauthorized, "invalid TOTP code")
		case errors.Is(err, usecase.ErrUserNotFound):
			jsonError(w, http.StatusUnauthorized, "user not found")
		case errors.Is(err, usecase.ErrTOTPNotEnabled):
			jsonError(w, http.StatusBadRequest, "2FA is not enabled")
		default:
			jsonError(w, http.StatusInternalServerError, "verification failed")
		}
		return
	}
	setRefreshCookie(w, output.RefreshToken)
	jsonData(w, http.StatusOK, map[string]interface{}{
		"access_token":  output.AccessToken,
		"refresh_token": output.RefreshToken,
	})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	token := ""
	if cookie, err := r.Cookie("refresh_token"); err == nil {
		token = cookie.Value
	}
	if token == "" {
		body := struct {
			Token string `json:"refresh_token"`
		}{}
		if err := json.NewDecoder(r.Body).Decode(&body); err == nil && body.Token != "" {
			token = body.Token
		}
	}
	if token == "" {
		jsonError(w, http.StatusUnauthorized, "refresh token required")
		return
	}
	output, err := h.authUsecase.Refresh(r.Context(), token)
	if err != nil {
		jsonError(w, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}
	setRefreshCookie(w, output.RefreshToken)
	jsonData(w, http.StatusOK, map[string]interface{}{
		"access_token":  output.AccessToken,
		"refresh_token": output.RefreshToken,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/auth/refresh",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	})
	jsonData(w, http.StatusOK, map[string]string{"message": "logged out"})
}

func setRefreshCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Path:     "/auth/refresh",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   604800,
	})
}
