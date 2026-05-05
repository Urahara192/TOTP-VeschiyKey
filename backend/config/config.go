package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	ServerPort         string
	DatabaseURL        string
	JWTSecret          string
	AccessTokenTTL     time.Duration
	RefreshTokenTTL    time.Duration
	TOTPIssuer         string
	TrustDeviceTTL     time.Duration
	BcryptCost         int
}

func Load() *Config {
	return &Config{
		ServerPort:      getEnv("SERVER_PORT", "8080"),
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://totp:totp@localhost:5432/totp?sslmode=disable"),
		JWTSecret:       getEnv("JWT_SECRET", "change-me-in-production"),
		AccessTokenTTL:  getDuration("ACCESS_TOKEN_TTL", 15*time.Minute),
		RefreshTokenTTL: getDuration("REFRESH_TOKEN_TTL", 7*24*time.Hour),
		TOTPIssuer:      getEnv("TOTP_ISSUER", "TOTP-Auth-System"),
		TrustDeviceTTL:  getDuration("TRUST_DEVICE_TTL", 30*24*time.Hour),
		BcryptCost:      getInt("BCRYPT_COST", 12),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getDuration(key string, fallback time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		d, err := time.ParseDuration(v)
		if err == nil {
			return d
		}
	}
	return fallback
}

func getInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		i, err := strconv.Atoi(v)
		if err == nil {
			return i
		}
	}
	return fallback
}
