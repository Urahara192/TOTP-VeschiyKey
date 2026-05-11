package internal

import (
	"context"
	"sync"
	"time"
)

type MemoryStorage struct {
	mu   sync.RWMutex
	data map[string]*TOTPRecord
}

func NewMemoryStorage() *MemoryStorage {
	return &MemoryStorage{
		data: make(map[string]*TOTPRecord),
	}
}

func (s *MemoryStorage) Save(_ context.Context, record *TOTPRecord) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now()
	}
	s.data[record.UserID] = record
	return nil
}

func (s *MemoryStorage) FindByUserID(_ context.Context, userID string) (*TOTPRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	rec, ok := s.data[userID]
	if !ok {
		return nil, nil
	}
	return rec, nil
}

func (s *MemoryStorage) FindBySecret(_ context.Context, secret string) (*TOTPRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, rec := range s.data {
		if rec.Secret == secret {
			return rec, nil
		}
	}
	return nil, nil
}

func (s *MemoryStorage) Delete(_ context.Context, userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.data, userID)
	return nil
}

func (s *MemoryStorage) FindAll(_ context.Context) ([]*TOTPRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*TOTPRecord, 0, len(s.data))
	for _, rec := range s.data {
		result = append(result, rec)
	}
	return result, nil
}

var _ Storage = (*MemoryStorage)(nil)
