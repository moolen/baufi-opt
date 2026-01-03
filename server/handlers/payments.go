package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"baufi-optimierer/server/db"
	"baufi-optimierer/server/models"
)

// HandleCreateSpecialPayment creates a new special payment for a loan
func HandleCreateSpecialPayment(w http.ResponseWriter, r *http.Request) {
	// Extract loan ID from path: /api/loans/{loanId}/special-payments
	loanID := extractIDFromPath(r.URL.Path, "/api/loans/")
	if loanID == "" {
		respondWithError(w, http.StatusBadRequest, "Invalid loan ID")
		return
	}
	// Remove /special-payments from the loan ID
	loanID = strings.TrimSuffix(loanID, "/special-payments")

	var paymentInput models.SpecialPayment
	if err := json.NewDecoder(r.Body).Decode(&paymentInput); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := paymentInput.Validate(); err != nil {
		var validationErr models.ValidationError
		if errors.As(err, &validationErr) {
			respondWithError(w, http.StatusBadRequest, err.Error())
		} else {
			respondWithError(w, http.StatusInternalServerError, "Validation error")
		}
		return
	}

	paymentInput.ID = generateID()
	paymentInput.LoanID = loanID

	if err := db.CreateSpecialPayment(&paymentInput); err != nil {
		if strings.Contains(err.Error(), "not found") {
			respondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		log.Printf("Error creating special payment: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to create special payment")
		return
	}

	// Don't include LoanID in response (client already knows it)
	paymentInput.LoanID = ""
	respondWithJSON(w, http.StatusCreated, paymentInput)
}

// HandleDeleteSpecialPayment deletes a special payment
func HandleDeleteSpecialPayment(w http.ResponseWriter, r *http.Request) {
	// Extract IDs from path: /api/loans/{loanId}/special-payments/{paymentId}
	pathParts := strings.Split(r.URL.Path, "/")
	var loanID, paymentID string

	for i, part := range pathParts {
		if part == "loans" && i+1 < len(pathParts) {
			loanID = pathParts[i+1]
		}
		if part == "special-payments" && i+1 < len(pathParts) {
			paymentID = pathParts[i+1]
		}
	}

	if loanID == "" || paymentID == "" {
		respondWithError(w, http.StatusBadRequest, "Invalid loan or payment ID")
		return
	}

	err := db.DeleteSpecialPayment(loanID, paymentID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			respondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		log.Printf("Error deleting special payment: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to delete special payment")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
