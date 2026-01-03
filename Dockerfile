# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/ui
COPY ui/package*.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build

# Stage 2: Build the Go backend with embedded static files
FROM golang:1.25 AS backend-builder
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential
COPY server/go.mod server/go.sum ./server/
WORKDIR /app/server
RUN go mod download
COPY server/ ./
COPY --from=frontend-builder /app/ui/dist ./static
RUN CGO_ENABLED=1 GOOS=linux go build -tags "linux" -o baufi-opt .

# Stage 3: Runtime image
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates tzdata
WORKDIR /app
COPY --from=backend-builder /app/server/baufi-opt /app/baufi-opt
RUN mkdir -p /app/data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

ENV PORT=8080
ENV DB_PATH=/app/data/loans.db

# Run the application
CMD ["/app/baufi-opt"]
