package postgres

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"totp-auth-system/backend/internal/domain"
)

type LogRepo struct {
	pool *pgxpool.Pool
}

func NewLogRepo(pool *pgxpool.Pool) *LogRepo {
	return &LogRepo{pool: pool}
}

func (r *LogRepo) Insert(ctx context.Context, log *domain.AuditLog) error {
	query := `INSERT INTO audit_logs (id, user_id, action, ip_address, user_agent, details, created_at)
	           VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.pool.Exec(ctx, query,
		log.ID, log.UserID, log.Action,
		log.IPAddress, log.UserAgent, log.Details, log.CreatedAt,
	)
	return err
}

func (r *LogRepo) ListByUser(ctx context.Context, userID uuid.UUID, offset, limit int) ([]*domain.AuditLog, error) {
	query := `SELECT id, user_id, action, ip_address, user_agent, details, created_at
	           FROM audit_logs WHERE user_id = $1
	           ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	return r.queryLogs(ctx, query, userID, limit, offset)
}

func (r *LogRepo) ListAll(ctx context.Context, offset, limit int) ([]*domain.AuditLog, int, error) {
	countQuery := `SELECT COUNT(*) FROM audit_logs`
	var total int
	if err := r.pool.QueryRow(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, err
	}
	query := `SELECT id, user_id, action, ip_address, user_agent, details, created_at
	           FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	logs, err := scanLogs(rows)
	if err != nil {
		return nil, 0, err
	}
	return logs, total, nil
}

func (r *LogRepo) queryLogs(ctx context.Context, query string, args ...interface{}) ([]*domain.AuditLog, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanLogs(rows)
}

func scanLogs(rows pgxRows) ([]*domain.AuditLog, error) {
	var logs []*domain.AuditLog
	for rows.Next() {
		l := &domain.AuditLog{}
		if err := rows.Scan(&l.ID, &l.UserID, &l.Action, &l.IPAddress,
			&l.UserAgent, &l.Details, &l.CreatedAt); err != nil {
			return nil, err
		}
		if l.Details == nil {
			l.Details = json.RawMessage("{}")
		}
		logs = append(logs, l)
	}
	return logs, nil
}

type pgxRows interface {
	Scan(dest ...interface{}) error
	Next() bool
	Close()
	Err() error
}
