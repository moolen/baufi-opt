package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"baufi-optimierer/server/db"
	"baufi-optimierer/server/handlers"
	"baufi-optimierer/server/middleware"
)

//go:embed static/*
var staticFS embed.FS

func main() {
	// Initialize logging
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// Get configuration from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/loans.db"
	}

	// Ensure data directory exists
	if err := os.MkdirAll("./data", 0755); err != nil && !os.IsExist(err) {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	// Initialize database
	if err := db.InitDB(dbPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	log.Println("Starting Baufinanzierungs-Optimierer server...")

	// Create HTTP mux
	mux := http.NewServeMux()

	// Register API routes
	registerRoutes(mux)

	// Serve static files from embedded FS
	serveStatic(mux)

	// Create server with middleware
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      middleware.LoggingMiddleware(middleware.RecoveryMiddleware(mux)),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server listening on http://0.0.0.0:%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down server...")
	if err := server.Close(); err != nil {
		log.Printf("Error closing server: %v", err)
	}
	log.Println("Server stopped")
}

// registerRoutes registers all API routes
func registerRoutes(mux *http.ServeMux) {
	// Loans endpoints
	mux.HandleFunc("GET /api/loans", handlers.HandleGetAllLoans)
	mux.HandleFunc("POST /api/loans", handlers.HandleCreateLoan)
	mux.HandleFunc("GET /api/loans/{id}", handlers.HandleGetLoan)
	mux.HandleFunc("PUT /api/loans/{id}", handlers.HandleUpdateLoan)
	mux.HandleFunc("DELETE /api/loans/{id}", handlers.HandleDeleteLoan)

	// Special payments endpoints
	mux.HandleFunc("POST /api/loans/{id}/special-payments", handlers.HandleCreateSpecialPayment)
	mux.HandleFunc("DELETE /api/loans/{id}/special-payments/{paymentId}", handlers.HandleDeleteSpecialPayment)
}

// serveStatic serves the embedded static files
func serveStatic(mux *http.ServeMux) {
	// Get the static directory from the embedded FS
	staticDir, err := fs.Sub(staticFS, "static")
	if err != nil {
		log.Printf("Warning: Could not load static files: %v", err)
		// If no static files exist, just continue without serving them
		return
	}

	// Serve static files with fallback to index.html for React routing
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Don't serve /api/* through static file handler
		if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
			return
		}

		// Try to serve the requested file
		fs := http.FileServer(http.FS(staticDir))

		// For React SPA, if file doesn't exist, serve index.html
		path := r.URL.Path
		if path == "/" {
			path = "index.html"
		} else if path != "" && path[0] == '/' {
			// Remove leading slash for fs.FS.Open()
			path = path[1:]
		}

		// Try to open the file
		file, err := staticDir.Open(path)
		if err == nil {
			file.Close()
			fs.ServeHTTP(w, r)
			return
		}

		// File not found, try index.html for client-side routing
		r.URL.Path = "/"
		fs.ServeHTTP(w, r)
	}))
}
