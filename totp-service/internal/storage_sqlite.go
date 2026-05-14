package internal

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	_ "modernc.org/sqlite"
)

type SQLiteStorage struct {
	db *sql.DB
}

func NewSQLiteStorage(path string) (*SQLiteStorage, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}

	query := `CREATE TABLE IF NOT EXISTS totp_records (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL UNIQUE,
		secret TEXT NOT NULL,
		enabled INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL
	)`
	if _, err := db.Exec(query); err != nil {
		return nil, fmt.Errorf("create table: %w", err)
	}

	return &SQLiteStorage{db: db}, nil
}

func (s *SQLiteStorage) Save(_ context.Context, record *TOTPRecord) error {
	if record.ID == "" {
		record.ID = uuid.New().String()
	}
	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now()
	}

	enabled := 0
	if record.Enabled {
		enabled = 1
	}

	query := `INSERT INTO totp_records (id, user_id, secret, enabled, created_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(user_id) DO UPDATE SET
			secret = excluded.secret,
			enabled = excluded.enabled,
			created_at = excluded.created_at`
	_, err := s.db.Exec(query, record.ID, record.UserID, record.Secret, enabled, record.CreatedAt.Format(time.RFC3339))
	return err
}

func (s *SQLiteStorage) FindByUserID(_ context.Context, userID string) (*TOTPRecord, error) {
	query := `SELECT id, user_id, secret, enabled, created_at FROM totp_records WHERE user_id = ?`
	row := s.db.QueryRow(query, userID)

	var rec TOTPRecord
	var enabled int
	var createdAt string
	if err := row.Scan(&rec.ID, &rec.UserID, &rec.Secret, &enabled, &createdAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	rec.Enabled = enabled == 1
	rec.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	return &rec, nil
}

func (s *SQLiteStorage) FindBySecret(_ context.Context, secret string) (*TOTPRecord, error) {
	query := `SELECT id, user_id, secret, enabled, created_at FROM totp_records WHERE secret = ?`
	row := s.db.QueryRow(query, secret)

	var rec TOTPRecord
	var enabled int
	var createdAt string
	if err := row.Scan(&rec.ID, &rec.UserID, &rec.Secret, &enabled, &createdAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	rec.Enabled = enabled == 1
	rec.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	return &rec, nil
}

func (s *SQLiteStorage) Delete(_ context.Context, userID string) error {
	query := `DELETE FROM totp_records WHERE user_id = ?`
	_, err := s.db.Exec(query, userID)
	return err
}

func (s *SQLiteStorage) FindAll(_ context.Context) ([]*TOTPRecord, error) {
	query := `SELECT id, user_id, secret, enabled, created_at FROM totp_records ORDER BY created_at DESC`
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*TOTPRecord
	for rows.Next() {
		var rec TOTPRecord
		var enabled int
		var createdAt string
		if err := rows.Scan(&rec.ID, &rec.UserID, &rec.Secret, &enabled, &createdAt); err != nil {
			return nil, err
		}
		rec.Enabled = enabled == 1
		rec.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		result = append(result, &rec)
	}
	return result, rows.Err()
}

var _ Storage = (*SQLiteStorage)(nil)
