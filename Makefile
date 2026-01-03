.PHONY: help build build-frontend build-backend embed run clean test docker-build

help:
	@echo "Baufinanzierungs-Optimierer Build System"
	@echo "=========================================="
	@echo "Available targets:"
	@echo "  make build           - Build frontend and backend"
	@echo "  make build-frontend  - Build React app only"
	@echo "  make build-backend   - Compile Go server only"
	@echo "  make embed           - Build and embed frontend in Go binary"
	@echo "  make run             - Build and run server locally"
	@echo "  make docker-build    - Build Docker image (ghcr.io/moolen/baufi-opt)"
	@echo "  make clean           - Remove build artifacts"
	@echo "  make test            - Run Go tests"

# Build everything
build: build-frontend copy-static build-backend

# Build React frontend
build-frontend:
	@echo "Building React frontend..."
	cd ui && npm install && npm run build
	@echo "Frontend built successfully"

# Copy frontend assets to server/static
copy-static:
	@echo "Copying frontend assets to server/static..."
	mkdir -p server/static
	rm -rf server/static/*
	cp -r ui/dist/* server/static/
	@echo "Frontend assets copied"

# Build Go backend
build-backend:
	@echo "Building Go backend..."
	cd server && go mod tidy && go build -o baufi-optimierer .
	@echo "Backend built: server/baufi-optimierer"

# Embedded build (includes everything in binary)
embed: build
	@echo "Backend ready with embedded frontend"

# Run the server locally
run: build
	@echo "Starting server on http://localhost:8080"
	cd server && PORT=8080 ./baufi-optimierer

# Run in development mode (with verbose logging)
dev-run: build
	@echo "Starting server in development mode"
	cd server && LOG_DB_QUERIES=true PORT=8080 ./baufi-optimierer

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf ui/dist
	rm -rf server/static
	rm -f server/baufi-optimierer
	cd server && go clean
	@echo "Clean complete"

# Run Go tests
test:
	@echo "Running Go tests..."
	cd server && go test ./...

# Build Docker image
docker-build:
	@echo "Building Docker image ghcr.io/moolen/baufi-opt..."
	docker build -t ghcr.io/moolen/baufi-opt .
	@echo "Docker image built successfully"

# Default target
.DEFAULT_GOAL := help
