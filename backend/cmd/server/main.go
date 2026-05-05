package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"totp-auth-system/backend/config"
	"totp-auth-system/backend/internal/application/usecase"
	handlers "totp-auth-system/backend/internal/delivery/http"
	"totp-auth-system/backend/internal/infrastructure/auth"
	"totp-auth-system/backend/internal/infrastructure/repository/postgres"
	"totp-auth-system/backend/internal/infrastructure/totp"
)

func main() {
	cfg := config.Load()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("unable to ping database: %v", err)
	}
	log.Println("connected to database")

	runMigrations(pool)

	userRepo := postgres.NewUserRepo(pool)
	deviceRepo := postgres.NewDeviceRepo(pool)
	logRepo := postgres.NewLogRepo(pool)

	hasher := auth.NewBcryptHasher(cfg.BcryptCost)
	jwtManager := auth.NewJWTManager(cfg.JWTSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)
	totpManager := totp.NewManager(cfg.TOTPIssuer)

	authUsecase := usecase.NewAuthUsecase(userRepo, deviceRepo, logRepo, hasher, jwtManager, totpManager, cfg.TrustDeviceTTL)
	totpUsecase := usecase.NewTOTPUsecase(userRepo, logRepo, totpManager)
	adminUsecase := usecase.NewAdminUsecase(userRepo, deviceRepo, logRepo, totpManager)

	middleware := auth.NewMiddleware(jwtManager)

	authHandler := handlers.NewAuthHandler(authUsecase)
	totpHandler := handlers.NewTOTPHandler(totpUsecase)
	adminHandler := handlers.NewAdminHandler(adminUsecase)

	router := handlers.NewRouter(&handlers.HandlerDependencies{
		AuthHandler:  authHandler,
		TOTPHandler:  totpHandler,
		AdminHandler: adminHandler,
		Middleware:   middleware,
	})

	server := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("server starting on :%s", cfg.ServerPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("server forced shutdown: %v", err)
	}
	log.Println("server stopped")
}

func runMigrations(pool *pgxpool.Pool) {
	migration := `
	CREATE EXTENSION IF NOT EXISTS "pgcrypto";

	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		username VARCHAR(50) UNIQUE NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		role VARCHAR(20) NOT NULL DEFAULT 'employee',
		totp_secret VARCHAR(255),
		totp_enabled BOOLEAN NOT NULL DEFAULT false,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS trusted_devices (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		ip_address VARCHAR(45) NOT NULL,
		user_agent TEXT NOT NULL DEFAULT '',
		device_fingerprint VARCHAR(64) NOT NULL,
		trusted_until TIMESTAMPTZ NOT NULL,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
	CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);

	CREATE TABLE IF NOT EXISTS audit_logs (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID REFERENCES users(id) ON DELETE SET NULL,
		action VARCHAR(100) NOT NULL,
		ip_address VARCHAR(45) NOT NULL,
		user_agent TEXT NOT NULL DEFAULT '',
		details JSONB DEFAULT '{}',
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
	CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
	`
	if _, err := pool.Exec(context.Background(), migration); err != nil {
		fmt.Fprintf(os.Stderr, "migration warning: %v\n", err)
	} else {
		log.Println("migrations applied")
	}
}
