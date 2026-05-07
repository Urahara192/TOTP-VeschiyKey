package handlers

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"

	"totp-auth-system/backend/internal/infrastructure/auth"
)

//go:embed static/*
var staticFiles embed.FS

type Router struct {
	mux        *http.ServeMux
	middleware *auth.Middleware
}

type HandlerDependencies struct {
	AuthHandler  *AuthHandler
	TOTPHandler  *TOTPHandler
	AdminHandler *AdminHandler
	Middleware    *auth.Middleware
}

func NewRouter(deps *HandlerDependencies) *Router {
	mux := http.NewServeMux()
	r := &Router{
		mux:        mux,
		middleware: deps.Middleware,
	}

	r.registerRoutes(deps)
	return r
}

func (ro *Router) registerRoutes(deps *HandlerDependencies) {
	m := deps.Middleware

	ro.mux.HandleFunc("POST /auth/register", deps.AuthHandler.Register)
	ro.mux.HandleFunc("POST /auth/login", deps.AuthHandler.Login)
	ro.mux.HandleFunc("POST /auth/verify-2fa", deps.AuthHandler.Verify2FA)
	ro.mux.HandleFunc("POST /auth/refresh", deps.AuthHandler.Refresh)
	ro.mux.HandleFunc("POST /auth/logout", deps.AuthHandler.Logout)

	ro.mux.Handle("POST /totp/setup", m.Auth(http.HandlerFunc(deps.TOTPHandler.Setup)))
	ro.mux.Handle("POST /totp/enable", m.Auth(http.HandlerFunc(deps.TOTPHandler.Enable)))
	ro.mux.Handle("POST /totp/disable", m.Auth(http.HandlerFunc(deps.TOTPHandler.Disable)))
	ro.mux.Handle("GET /totp/status", m.Auth(http.HandlerFunc(deps.TOTPHandler.Status)))

	adminOnly := m.Role("admin")
	adminOrDirector := m.Role("admin", "director")
	ro.mux.Handle("GET /admin/users", m.Auth(adminOrDirector(http.HandlerFunc(deps.AdminHandler.ListUsers))))
	ro.mux.Handle("POST /admin/users", m.Auth(adminOnly(http.HandlerFunc(deps.AdminHandler.CreateUser))))
	ro.mux.Handle("PUT /admin/users/{id}/role", m.Auth(adminOnly(http.HandlerFunc(deps.AdminHandler.ChangeRole))))
	ro.mux.Handle("POST /admin/users/{id}/reset-2fa", m.Auth(adminOnly(http.HandlerFunc(deps.AdminHandler.Reset2FA))))
	ro.mux.Handle("PUT /admin/users/{id}", m.Auth(adminOnly(http.HandlerFunc(deps.AdminHandler.UpdateUser))))
	ro.mux.Handle("DELETE /admin/users/{id}", m.Auth(adminOnly(http.HandlerFunc(deps.AdminHandler.DeleteUser))))
	ro.mux.Handle("GET /admin/logs", m.Auth(adminOrDirector(http.HandlerFunc(deps.AdminHandler.GetLogs))))

	ro.mux.Handle("GET /static/", http.FileServer(http.FS(staticAssets())))
	ro.mux.HandleFunc("GET /", serveIndex)
}

func (ro *Router) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ro.middleware.CORS(
		ro.middleware.Logging(ro.mux),
	).ServeHTTP(w, r)
}

func staticAssets() fs.FS {
	sub, err := fs.Sub(staticFiles, "static")
	if err != nil {
		panic("static files not found: " + err.Error())
	}
	return sub
}

func serveIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" && !strings.HasPrefix(r.URL.Path, "/static/") {
		data, err := staticFiles.ReadFile("static/index.html")
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(data)
		return
	}
	http.FileServer(http.FS(staticAssets())).ServeHTTP(w, r)
}
