package models

// Loan represents a mortgage loan with all its details
type Loan struct {
	ID                  string            `json:"id"`
	Name                string            `json:"name"`
	Amount              float64           `json:"amount"`
	InterestRate        float64           `json:"interestRate"`
	StartDate           string            `json:"startDate"` // YYYY-MM-DD format
	FixedInterestYears  int               `json:"fixedInterestYears"`
	RepaymentType       string            `json:"repaymentType"` // "PERCENTAGE" or "ABSOLUTE"
	RepaymentValue      float64           `json:"repaymentValue"`
	SpecialPayments     []SpecialPayment  `json:"specialPayments"`
	CreatedAt           string            `json:"createdAt"`
	UpdatedAt           string            `json:"updatedAt"`
}

// RepaymentType constants
const (
	RepaymentTypePercentage = "PERCENTAGE"
	RepaymentTypeAbsolute   = "ABSOLUTE"
)

// ValidateCreate validates a loan for creation
func (l *Loan) ValidateCreate() error {
	if l.Name == "" {
		return ValidationError("name is required")
	}
	if l.Amount <= 0 {
		return ValidationError("amount must be > 0")
	}
	if l.InterestRate < 0 || l.InterestRate > 20 {
		return ValidationError("interestRate must be between 0 and 20")
	}
	if !isValidDate(l.StartDate) {
		return ValidationError("startDate must be in YYYY-MM-DD format")
	}
	if l.FixedInterestYears < 1 || l.FixedInterestYears > 50 {
		return ValidationError("fixedInterestYears must be between 1 and 50")
	}
	if l.RepaymentType != RepaymentTypePercentage && l.RepaymentType != RepaymentTypeAbsolute {
		return ValidationError("repaymentType must be PERCENTAGE or ABSOLUTE")
	}
	if l.RepaymentValue <= 0 {
		return ValidationError("repaymentValue must be > 0")
	}
	return nil
}

// ValidateUpdate validates a loan for updates (all fields optional)
func (l *Loan) ValidateUpdate() error {
	if l.Name != "" && len(l.Name) == 0 {
		return ValidationError("name cannot be empty")
	}
	if l.Amount != 0 && l.Amount <= 0 {
		return ValidationError("amount must be > 0")
	}
	if l.InterestRate != 0 && (l.InterestRate < 0 || l.InterestRate > 20) {
		return ValidationError("interestRate must be between 0 and 20")
	}
	if l.StartDate != "" && !isValidDate(l.StartDate) {
		return ValidationError("startDate must be in YYYY-MM-DD format")
	}
	if l.FixedInterestYears != 0 && (l.FixedInterestYears < 1 || l.FixedInterestYears > 50) {
		return ValidationError("fixedInterestYears must be between 1 and 50")
	}
	if l.RepaymentType != "" && l.RepaymentType != RepaymentTypePercentage && l.RepaymentType != RepaymentTypeAbsolute {
		return ValidationError("repaymentType must be PERCENTAGE or ABSOLUTE")
	}
	if l.RepaymentValue != 0 && l.RepaymentValue <= 0 {
		return ValidationError("repaymentValue must be > 0")
	}
	return nil
}
