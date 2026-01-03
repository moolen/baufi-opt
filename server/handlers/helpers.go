package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// respondWithError sends a JSON error response
func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}

// respondWithJSON sends a JSON response
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(payload)
}

// generateID generates a UUID
func generateID() string {
	return uuid.New().String()
}

// extractIDFromPath extracts the first ID from a path
// e.g., "/api/loans/abc123" with prefix "/api/loans/" returns "abc123"
func extractIDFromPath(path string, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}

	remainder := strings.TrimPrefix(path, prefix)
	parts := strings.Split(remainder, "/")
	if len(parts) > 0 && parts[0] != "" {
		return parts[0]
	}
	return ""
}
