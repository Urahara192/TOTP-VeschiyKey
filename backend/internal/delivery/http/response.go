package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

type APIResponse struct {
	Status  string      `json:"status"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIResponse{Status: "ok", Data: data})
}

func jsonError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: message})
}

func jsonData(w http.ResponseWriter, status int, data interface{}) {
	jsonResponse(w, status, data)
}

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}
