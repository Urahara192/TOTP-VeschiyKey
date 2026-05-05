package domain

import (
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleAdmin      Role = "admin"
	RoleAccountant Role = "accountant"
	RoleEmployee   Role = "employee"
	RoleDirector   Role = "director"
	RoleAnalyst    Role = "analyst"
)

type User struct {
	ID           uuid.UUID
	Username     string
	Email        string
	PasswordHash string
	Role         Role
	TOTPSecret   *string
	TOTPEnabled  bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
