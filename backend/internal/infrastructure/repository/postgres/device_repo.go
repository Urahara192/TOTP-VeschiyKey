package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"totp-auth-system/backend/internal/domain"
)

type DeviceRepo struct {
	pool *pgxpool.Pool
}

func NewDeviceRepo(pool *pgxpool.Pool) *DeviceRepo {
	return &DeviceRepo{pool: pool}
}

func (r *DeviceRepo) Create(ctx context.Context, d *domain.TrustedDevice) error {
	query := `INSERT INTO trusted_devices (id, user_id, ip_address, user_agent, device_fingerprint, trusted_until, created_at)
	           VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.pool.Exec(ctx, query,
		d.ID, d.UserID, d.IPAddress, d.UserAgent,
		d.DeviceFingerprint, d.TrustedUntil, d.CreatedAt,
	)
	return err
}

func (r *DeviceRepo) FindByFingerprint(ctx context.Context, userID uuid.UUID, fingerprint string) (*domain.TrustedDevice, error) {
	query := `SELECT id, user_id, ip_address, user_agent, device_fingerprint, trusted_until, created_at
	           FROM trusted_devices
	           WHERE user_id = $1 AND device_fingerprint = $2 AND trusted_until > NOW()
	           LIMIT 1`
	row := r.pool.QueryRow(ctx, query, userID, fingerprint)
	d := &domain.TrustedDevice{}
	err := row.Scan(&d.ID, &d.UserID, &d.IPAddress, &d.UserAgent,
		&d.DeviceFingerprint, &d.TrustedUntil, &d.CreatedAt)
	if err != nil {
		return nil, err
	}
	return d, nil
}

func (r *DeviceRepo) UpdateTrust(ctx context.Context, id uuid.UUID, trustedUntil time.Time) error {
	query := `UPDATE trusted_devices SET trusted_until = $1 WHERE id = $2`
	_, err := r.pool.Exec(ctx, query, trustedUntil, id)
	return err
}

func (r *DeviceRepo) DeleteByUserID(ctx context.Context, userID uuid.UUID) error {
	query := `DELETE FROM trusted_devices WHERE user_id = $1`
	_, err := r.pool.Exec(ctx, query, userID)
	return err
}
