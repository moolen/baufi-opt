package models

// SpecialPayment represents a special payment (Sondertilgung) for a loan
type SpecialPayment struct {
	ID        string  `json:"id"`
	LoanID    string  `json:"loanId,omitempty"`
	Date      string  `json:"date"` // YYYY-MM-DD format
	Amount    float64 `json:"amount"`
	Note      string  `json:"note,omitempty"`
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
}

// Validate validates a special payment
func (sp *SpecialPayment) Validate() error {
	if sp.Date == "" {
		return ValidationError("date is required")
	}
	if !isValidDate(sp.Date) {
		return ValidationError("date must be in YYYY-MM-DD format")
	}
	if sp.Amount <= 0 {
		return ValidationError("amount must be > 0")
	}
	return nil
}
