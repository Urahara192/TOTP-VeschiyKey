package domain

import (
	"time"

	"github.com/google/uuid"
)

type TrustedDevice struct {
	ID                uuid.UUID
	UserID            uuid.UUID
	IPAddress         string
	UserAgent         string
	DeviceFingerprint string
	TrustedUntil      time.Time
	CreatedAt         time.Time
}
