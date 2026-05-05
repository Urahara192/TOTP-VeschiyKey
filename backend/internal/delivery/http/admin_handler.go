package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"

	"totp-auth-system/backend/internal/application/usecase"
	"totp-auth-system/backend/internal/domain"
	"totp-auth-system/backend/internal/infrastructure/auth"
)

type AdminHandler struct {
	adminUsecase *usecase.AdminUsecase
}

func NewAdminHandler(adminUsecase *usecase.AdminUsecase) *AdminHandler {
	return &AdminHandler{adminUsecase: adminUsecase}
}

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	page, pageSize := parsePagination(r)
	output, err := h.adminUsecase.ListUsers(r.Context(), page, pageSize)
	if err != nil {
		jsonError(w, http.StatusInternalServerError, "failed to list users")
		return
	}
	type userResponse struct {
		ID          string `json:"id"`
		Username    string `json:"username"`
		Email       string `json:"email"`
		Role        string `json:"role"`
		TOTPEnabled bool   `json:"totp_enabled"`
		CreatedAt   string `json:"created_at"`
	}
	users := make([]userResponse, len(output.Users))
	for i, u := range output.Users {
		users[i] = userResponse{
			ID:          u.ID.String(),
			Username:    u.Username,
			Email:       u.Email,
			Role:        string(u.Role),
			TOTPEnabled: u.TOTPEnabled,
			CreatedAt:   u.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
	}
	jsonData(w, http.StatusOK, map[string]interface{}{
		"users": users,
		"total": output.Total,
	})
}

type changeRoleRequest struct {
	Role string `json:"role"`
}

func (h *AdminHandler) ChangeRole(w http.ResponseWriter, r *http.Request) {
	userIDStr := extractPathParam(r.URL.Path, "/admin/users/", "/role")
	if userIDStr == "" {
		jsonError(w, http.StatusBadRequest, "user id required")
		return
	}
	targetUserID, err := parseUUID(userIDStr)
	if err != nil {
		jsonError(w, http.StatusBadRequest, "invalid user id")
		return
	}
	actorIDStr, _ := r.Context().Value(auth.ContextUserID).(string)
	actorID, _ := parseUUID(actorIDStr)
	var req changeRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	newRole := domain.Role(req.Role)
	switch newRole {
	case domain.RoleAdmin, domain.RoleAccountant, domain.RoleEmployee:
	default:
		jsonError(w, http.StatusBadRequest, "invalid role")
		return
	}
	if err := h.adminUsecase.ChangeRole(r.Context(), usecase.ChangeRoleInput{
		TargetUserID: targetUserID,
		NewRole:      newRole,
		ActorID:      actorID,
	}); err != nil {
		jsonError(w, http.StatusInternalServerError, "failed to change role")
		return
	}
	jsonData(w, http.StatusOK, map[string]string{"message": "role updated"})
}

func (h *AdminHandler) Reset2FA(w http.ResponseWriter, r *http.Request) {
	userIDStr := extractPathParam(r.URL.Path, "/admin/users/", "/reset-2fa")
	if userIDStr == "" {
		jsonError(w, http.StatusBadRequest, "user id required")
		return
	}
	targetUserID, err := parseUUID(userIDStr)
	if err != nil {
		jsonError(w, http.StatusBadRequest, "invalid user id")
		return
	}
	actorIDStr, _ := r.Context().Value(auth.ContextUserID).(string)
	actorID, _ := parseUUID(actorIDStr)
	if err := h.adminUsecase.Reset2FA(r.Context(), targetUserID, actorID); err != nil {
		jsonError(w, http.StatusInternalServerError, "failed to reset 2FA")
		return
	}
	jsonData(w, http.StatusOK, map[string]string{"message": "2FA reset"})
}

func (h *AdminHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	page, pageSize := parsePagination(r)
	userIDStr := r.URL.Query().Get("user_id")
	var userID *uuid.UUID
	if userIDStr != "" {
		uid, err := parseUUID(userIDStr)
		if err == nil {
			userID = &uid
		}
	}
	output, err := h.adminUsecase.GetLogs(r.Context(), usecase.GetLogsInput{
		Page:     page,
		PageSize: pageSize,
		UserID:   userID,
	})
	if err != nil {
		jsonError(w, http.StatusInternalServerError, "failed to get logs")
		return
	}
	type logResponse struct {
		ID        string      `json:"id"`
		UserID    *string     `json:"user_id"`
		Action    string      `json:"action"`
		IPAddress string      `json:"ip_address"`
		UserAgent string      `json:"user_agent"`
		Details   interface{} `json:"details"`
		CreatedAt string      `json:"created_at"`
	}
	logs := make([]logResponse, len(output.Logs))
	for i, l := range output.Logs {
		var uid *string
		if l.UserID != nil {
			s := l.UserID.String()
			uid = &s
		}
		var details interface{}
		if len(l.Details) > 0 {
			json.Unmarshal(l.Details, &details)
		}
		logs[i] = logResponse{
			ID:        l.ID.String(),
			UserID:    uid,
			Action:    l.Action,
			IPAddress: l.IPAddress,
			UserAgent: l.UserAgent,
			Details:   details,
			CreatedAt: l.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
	}
	jsonData(w, http.StatusOK, map[string]interface{}{
		"logs":  logs,
		"total": output.Total,
	})
}

func parsePagination(r *http.Request) (page, pageSize int) {
	page, _ = strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ = strconv.Atoi(r.URL.Query().Get("page_size"))
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	return
}

func extractPathParam(path, prefix, suffix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	rest := strings.TrimPrefix(path, prefix)
	if idx := strings.Index(rest, suffix); idx >= 0 {
		rest = rest[:idx]
	}
	if idx := strings.Index(rest, "/"); idx >= 0 && suffix == "" {
		rest = rest[:idx]
	}
	return rest
}
