package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"totp-auth-system/totp-service/internal"
)

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getEnvInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func main() {
	port := getEnv("PORT", "9090")
	driver := getEnv("STORAGE_DRIVER", "memory")
	sqlitePath := getEnv("SQLITE_PATH", "totp.db")
	issuer := getEnv("TOTP_ISSUER", "TOTP-Service")
	skew := getEnvInt("TOTP_SKEW", 1)

	var storage internal.Storage
	switch driver {
	case "sqlite":
		var err error
		storage, err = internal.NewSQLiteStorage(sqlitePath)
		if err != nil {
			log.Fatalf("failed to init sqlite storage: %v", err)
		}
		log.Printf("storage: sqlite (%s)", sqlitePath)
	default:
		storage = internal.NewMemoryStorage()
		log.Printf("storage: memory")
	}

	h := internal.NewHandler(storage, issuer, skew)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /setup", h.Setup)
	mux.HandleFunc("POST /verify", h.Verify)
	mux.HandleFunc("POST /validate", h.Verify)
	mux.HandleFunc("GET /qr", h.QR)

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("TOTP Service starting on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	<-quit
	log.Print("shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("forced shutdown: %v", err)
	}
	fmt.Println("server stopped")
}
