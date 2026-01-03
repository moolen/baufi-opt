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

// HandleGetAllLoans returns all loans without special payment details
func HandleGetAllLoans(w http.ResponseWriter, r *http.Request) {
	loans, err := db.GetAllLoans()
	if err != nil {
		log.Printf("Error fetching loans: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch loans")
		return
	}

	if loans == nil {
		loans = []models.Loan{}
	}

	respondWithJSON(w, http.StatusOK, loans)
}

// HandleGetLoan returns a single loan with all special payments
func HandleGetLoan(w http.ResponseWriter, r *http.Request) {
	id := extractIDFromPath(r.URL.Path, "/api/loans/")
	if id == "" {
		respondWithError(w, http.StatusBadRequest, "Invalid loan ID")
		return
	}

	loan, err := db.GetLoan(id)
	if err != nil {
		if strings.Contains(err.Error(), "no rows") {
			respondWithError(w, http.StatusNotFound, "loan not found")
			return
		}
		log.Printf("Error fetching loan %s: %v", id, err)
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch loan")
		return
	}

	respondWithJSON(w, http.StatusOK, loan)
}

// HandleCreateLoan creates a new loan
func HandleCreateLoan(w http.ResponseWriter, r *http.Request) {
	var loanInput models.Loan
	if err := json.NewDecoder(r.Body).Decode(&loanInput); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := loanInput.ValidateCreate(); err != nil {
		var validationErr models.ValidationError
		if errors.As(err, &validationErr) {
			respondWithError(w, http.StatusBadRequest, err.Error())
		} else {
			respondWithError(w, http.StatusInternalServerError, "Validation error")
		}
		return
	}

	// Generate ID
	loanInput.ID = generateID()

	if err := db.CreateLoan(&loanInput); err != nil {
		log.Printf("Error creating loan: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to create loan")
		return
	}

	respondWithJSON(w, http.StatusCreated, loanInput)
}

// HandleUpdateLoan updates an existing loan
func HandleUpdateLoan(w http.ResponseWriter, r *http.Request) {
	id := extractIDFromPath(r.URL.Path, "/api/loans/")
	if id == "" {
		respondWithError(w, http.StatusBadRequest, "Invalid loan ID")
		return
	}

	// Get existing loan first
	existingLoan, err := db.GetLoan(id)
	if err != nil {
		if strings.Contains(err.Error(), "no rows") {
			respondWithError(w, http.StatusNotFound, "loan not found")
			return
		}
		log.Printf("Error fetching loan %s: %v", id, err)
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch loan")
		return
	}

	// Decode update request (partial update)
	var updateData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Apply updates to existing loan
	loanToUpdate := *existingLoan

	// Update only provided fields
	if name, ok := updateData["name"]; ok {
		if str, ok := name.(string); ok {
			loanToUpdate.Name = str
		}
	}
	if amount, ok := updateData["amount"]; ok {
		if num, ok := amount.(float64); ok {
			loanToUpdate.Amount = num
		}
	}
	if rate, ok := updateData["interestRate"]; ok {
		if num, ok := rate.(float64); ok {
			loanToUpdate.InterestRate = num
		}
	}
	if date, ok := updateData["startDate"]; ok {
		if str, ok := date.(string); ok {
			loanToUpdate.StartDate = str
		}
	}
	if years, ok := updateData["fixedInterestYears"]; ok {
		if num, ok := years.(float64); ok {
			loanToUpdate.FixedInterestYears = int(num)
		}
	}
	if repaymentType, ok := updateData["repaymentType"]; ok {
		if str, ok := repaymentType.(string); ok {
			loanToUpdate.RepaymentType = str
		}
	}
	if repaymentValue, ok := updateData["repaymentValue"]; ok {
		if num, ok := repaymentValue.(float64); ok {
			loanToUpdate.RepaymentValue = num
		}
	}

	if err := loanToUpdate.ValidateUpdate(); err != nil {
		var validationErr models.ValidationError
		if errors.As(err, &validationErr) {
			respondWithError(w, http.StatusBadRequest, err.Error())
		} else {
			respondWithError(w, http.StatusInternalServerError, "Validation error")
		}
		return
	}

	if err := db.UpdateLoan(&loanToUpdate); err != nil {
		log.Printf("Error updating loan %s: %v", id, err)
		respondWithError(w, http.StatusInternalServerError, "Failed to update loan")
		return
	}

	// Fetch and return updated loan with special payments
	updated, err := db.GetLoan(id)
	if err != nil {
		log.Printf("Error fetching updated loan %s: %v", id, err)
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch updated loan")
		return
	}

	respondWithJSON(w, http.StatusOK, updated)
}

// HandleDeleteLoan deletes a loan and its special payments
func HandleDeleteLoan(w http.ResponseWriter, r *http.Request) {
	id := extractIDFromPath(r.URL.Path, "/api/loans/")
	if id == "" {
		respondWithError(w, http.StatusBadRequest, "Invalid loan ID")
		return
	}

	err := db.DeleteLoan(id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			respondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		log.Printf("Error deleting loan %s: %v", id, err)
		respondWithError(w, http.StatusInternalServerError, "Failed to delete loan")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
