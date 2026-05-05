package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type AuditLog struct {
	ID        uuid.UUID
	UserID    *uuid.UUID
	Action    string
	IPAddress string
	UserAgent string
	Details   json.RawMessage
	CreatedAt time.Time
}
