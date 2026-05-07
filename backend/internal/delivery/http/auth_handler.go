package handlers

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"strings"

	"totp-auth-system/backend/internal/application/usecase"
	"totp-auth-system/backend/internal/infrastructure/auth"
)

func getClientIP(r *http.Request) string {
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		return strings.Split(fwd, ",")[0]
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

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
	ctx := r.Context()
	output, err := h.authUsecase.Register(ctx, usecase.RegisterInput{
		Username:  req.Username,
		Email:     req.Email,
		Password:  req.Password,
		IP:        getClientIP(r),
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
			"id":          output.User.ID,
			"username":    output.User.Username,
			"email":       output.User.Email,
			"last_name":   output.User.LastName,
			"first_name":  output.User.FirstName,
			"middle_name": output.User.MiddleName,
			"role":        output.User.Role,
			"totp_enabled": output.User.TOTPEnabled,
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
	output, err := h.authUsecase.Login(r.Context(), usecase.LoginInput{
		Username:  req.Username,
		Password:  req.Password,
		IP:        getClientIP(r),
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
			"id":          output.User.ID,
			"username":    output.User.Username,
			"email":       output.User.Email,
			"last_name":   output.User.LastName,
			"first_name":  output.User.FirstName,
			"middle_name": output.User.MiddleName,
			"role":        output.User.Role,
			"totp_enabled": output.User.TOTPEnabled,
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
	output, err := h.authUsecase.Verify2FA(r.Context(), usecase.Verify2FAInput{
		Username:    req.Username,
		Code:        req.Code,
		IP:          getClientIP(r),
		UserAgent:   r.Header.Get("User-Agent"),
		TrustDevice: req.TrustDevice,
	})
	if err != nil {
		switch {
		case errors.Is(err, usecase.ErrInvalidTOTP):
			jsonError(w, http.StatusBadRequest, "invalid TOTP code")
		case errors.Is(err, usecase.ErrUserNotFound):
			jsonError(w, http.StatusBadRequest, "user not found")
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

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userIDStr, _ := r.Context().Value(auth.ContextUserID).(string)
	userID, err := parseUUID(userIDStr)
	if err != nil {
		jsonError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	user, err := h.authUsecase.GetProfile(r.Context(), userID)
	if err != nil {
		jsonError(w, http.StatusInternalServerError, "failed to get profile")
		return
	}
	jsonData(w, http.StatusOK, map[string]interface{}{
		"user": map[string]interface{}{
			"id":          user.ID.String(),
			"username":    user.Username,
			"email":       user.Email,
			"last_name":   user.LastName,
			"first_name":  user.FirstName,
			"middle_name": user.MiddleName,
			"role":        string(user.Role),
			"totp_enabled": user.TOTPEnabled,
			"created_at":  user.CreatedAt.Format("2006-01-02T15:04:05Z"),
		},
	})
}

type updateMeRequest struct {
	Email      *string `json:"email,omitempty"`
	LastName   *string `json:"last_name,omitempty"`
	FirstName  *string `json:"first_name,omitempty"`
	MiddleName *string `json:"middle_name,omitempty"`
}

func (h *AuthHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userIDStr, _ := r.Context().Value(auth.ContextUserID).(string)
	userID, err := parseUUID(userIDStr)
	if err != nil {
		jsonError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req updateMeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Email == nil && req.LastName == nil && req.FirstName == nil && req.MiddleName == nil {
		jsonError(w, http.StatusBadRequest, "at least one field to update is required")
		return
	}
	if err := h.authUsecase.UpdateProfile(r.Context(), usecase.UpdateProfileInput{
		UserID:     userID,
		Email:      req.Email,
		LastName:   req.LastName,
		FirstName:  req.FirstName,
		MiddleName: req.MiddleName,
	}); err != nil {
		switch {
		case err == usecase.ErrEmailTaken:
			jsonError(w, http.StatusConflict, "email already taken")
		default:
			jsonError(w, http.StatusInternalServerError, "failed to update profile")
		}
		return
	}
	jsonData(w, http.StatusOK, map[string]string{"message": "profile updated"})
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
