package internal

import (
	"context"
	"time"
)

type TOTPRecord struct {
	ID        string
	UserID    string
	Secret    string
	Enabled   bool
	CreatedAt time.Time
}

type Storage interface {
	Save(ctx context.Context, record *TOTPRecord) error
	FindByUserID(ctx context.Context, userID string) (*TOTPRecord, error)
	FindBySecret(ctx context.Context, secret string) (*TOTPRecord, error)
	Delete(ctx context.Context, userID string) error
	FindAll(ctx context.Context) ([]*TOTPRecord, error)
}
