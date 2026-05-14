package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"totp-auth-system/backend/internal/domain"
)

type UserRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) *UserRepo {
	return &UserRepo{pool: pool}
}

func (r *UserRepo) Create(ctx context.Context, user *domain.User) error {
	query := `INSERT INTO users (id, username, email, last_name, first_name, middle_name, password_hash, role, totp_secret, totp_enabled, created_at, updated_at)
	           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
	_, err := r.pool.Exec(ctx, query,
		user.ID, user.Username, user.Email, user.LastName, user.FirstName, user.MiddleName, user.PasswordHash,
		string(user.Role), user.TOTPSecret, user.TOTPEnabled,
		user.CreatedAt, user.UpdatedAt,
	)
	return err
}

func scanUser(row interface{ Scan(dest ...interface{}) error }) (*domain.User, error) {
	u := &domain.User{}
	var role string
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.LastName, &u.FirstName, &u.MiddleName, &u.PasswordHash,
		&role, &u.TOTPSecret, &u.TOTPEnabled, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	u.Role = domain.Role(role)
	return u, nil
}

const userColumns = `id, username, email, last_name, first_name, middle_name, password_hash, role, totp_secret, totp_enabled, created_at, updated_at`

func (r *UserRepo) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `SELECT ` + userColumns + ` FROM users WHERE username = $1`
	return scanUser(r.pool.QueryRow(ctx, query, username))
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `SELECT ` + userColumns + ` FROM users WHERE email = $1`
	return scanUser(r.pool.QueryRow(ctx, query, email))
}

func (r *UserRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `SELECT ` + userColumns + ` FROM users WHERE id = $1`
	return scanUser(r.pool.QueryRow(ctx, query, id))
}

func (r *UserRepo) Update(ctx context.Context, user *domain.User) error {
	query := `UPDATE users SET username=$1, email=$2, last_name=$3, first_name=$4, middle_name=$5, password_hash=$6, role=$7,
	           totp_secret=$8, totp_enabled=$9, updated_at=$10 WHERE id=$11`
	_, err := r.pool.Exec(ctx, query,
		user.Username, user.Email, user.LastName, user.FirstName, user.MiddleName, user.PasswordHash,
		string(user.Role), user.TOTPSecret, user.TOTPEnabled,
		time.Now(), user.ID,
	)
	return err
}

func (r *UserRepo) List(ctx context.Context, offset, limit int) ([]*domain.User, int, error) {
	countQuery := `SELECT COUNT(*) FROM users`
	var total int
	if err := r.pool.QueryRow(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, err
	}
	query := `SELECT ` + userColumns + ` FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var users []*domain.User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	return users, total, nil
}

func (r *UserRepo) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}
