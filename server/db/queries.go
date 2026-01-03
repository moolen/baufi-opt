package db

import (
	"fmt"
	"time"

	"baufi-optimierer/server/models"
)

// Loans queries

// GetAllLoans retrieves all loans with their special payments
func GetAllLoans() ([]models.Loan, error) {
	rows, err := queryRows(`
		SELECT id, name, amount, interest_rate, start_date, fixed_interest_years,
		       repayment_type, repayment_value, created_at, updated_at
		FROM loans
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var loans []models.Loan
	for rows.Next() {
		var loan models.Loan
		var createdAt, updatedAt string

		if err := rows.Scan(
			&loan.ID, &loan.Name, &loan.Amount, &loan.InterestRate,
			&loan.StartDate, &loan.FixedInterestYears, &loan.RepaymentType,
			&loan.RepaymentValue, &createdAt, &updatedAt,
		); err != nil {
			return nil, err
		}

		loan.CreatedAt = createdAt
		loan.UpdatedAt = updatedAt

		// Get special payments for this loan
		payments, err := GetSpecialPayments(loan.ID)
		if err != nil {
			return nil, err
		}
		loan.SpecialPayments = payments

		loans = append(loans, loan)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return loans, nil
}

// GetLoan retrieves a single loan with all its special payments
func GetLoan(id string) (*models.Loan, error) {
	var loan models.Loan
	var createdAt, updatedAt string

	row := queryRow(`
		SELECT id, name, amount, interest_rate, start_date, fixed_interest_years,
		       repayment_type, repayment_value, created_at, updated_at
		FROM loans
		WHERE id = ?
	`, id)

	if err := row.Scan(
		&loan.ID, &loan.Name, &loan.Amount, &loan.InterestRate,
		&loan.StartDate, &loan.FixedInterestYears, &loan.RepaymentType,
		&loan.RepaymentValue, &createdAt, &updatedAt,
	); err != nil {
		return nil, err
	}

	loan.CreatedAt = createdAt
	loan.UpdatedAt = updatedAt

	// Get special payments for this loan
	payments, err := GetSpecialPayments(id)
	if err != nil {
		return nil, err
	}
	loan.SpecialPayments = payments

	return &loan, nil
}

// CreateLoan inserts a new loan
func CreateLoan(loan *models.Loan) error {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := execQuery(`
		INSERT INTO loans (id, name, amount, interest_rate, start_date, fixed_interest_years,
		                   repayment_type, repayment_value, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, loan.ID, loan.Name, loan.Amount, loan.InterestRate, loan.StartDate,
		loan.FixedInterestYears, loan.RepaymentType, loan.RepaymentValue, now, now)

	if err == nil {
		loan.CreatedAt = now
		loan.UpdatedAt = now
		loan.SpecialPayments = []models.SpecialPayment{}
		// Force WAL checkpoint to ensure data is persisted
		if err := forceCheckpoint(); err != nil {
			return fmt.Errorf("failed to checkpoint database: %w", err)
		}
	}
	return err
}

// UpdateLoan updates an existing loan
func UpdateLoan(loan *models.Loan) error {
	now := time.Now().UTC().Format(time.RFC3339)
	result, err := execQuery(`
		UPDATE loans
		SET name = ?, amount = ?, interest_rate = ?, start_date = ?,
		    fixed_interest_years = ?, repayment_type = ?, repayment_value = ?,
		    updated_at = ?
		WHERE id = ?
	`, loan.Name, loan.Amount, loan.InterestRate, loan.StartDate,
		loan.FixedInterestYears, loan.RepaymentType, loan.RepaymentValue, now, loan.ID)

	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("loan not found")
	}

	loan.UpdatedAt = now
	return nil
}

// DeleteLoan deletes a loan (cascades to special_payments)
func DeleteLoan(id string) error {
	result, err := execQuery("DELETE FROM loans WHERE id = ?", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("loan not found")
	}

	return nil
}

// Special Payments queries

// GetSpecialPayments retrieves all special payments for a loan
func GetSpecialPayments(loanID string) ([]models.SpecialPayment, error) {
	rows, err := queryRows(`
		SELECT id, loan_id, date, amount, note, created_at, updated_at
		FROM special_payments
		WHERE loan_id = ?
		ORDER BY date ASC
	`, loanID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []models.SpecialPayment
	for rows.Next() {
		var payment models.SpecialPayment
		var createdAt, updatedAt string
		var note *string

		if err := rows.Scan(&payment.ID, &payment.LoanID, &payment.Date, &payment.Amount,
			&note, &createdAt, &updatedAt); err != nil {
			return nil, err
		}

		if note != nil {
			payment.Note = *note
		}
		payment.CreatedAt = createdAt
		payment.UpdatedAt = updatedAt
		payments = append(payments, payment)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return payments, nil
}

// CreateSpecialPayment inserts a new special payment
func CreateSpecialPayment(payment *models.SpecialPayment) error {
	// Verify loan exists
	row := queryRow("SELECT id FROM loans WHERE id = ?", payment.LoanID)
	var loanID string
	if err := row.Scan(&loanID); err != nil {
		return fmt.Errorf("loan not found")
	}

	now := time.Now().UTC().Format(time.RFC3339)

	// Convert empty note to nil for proper NULL insertion
	var noteValue *string
	if payment.Note != "" {
		noteValue = &payment.Note
	}

	_, err := execQuery(`
		INSERT INTO special_payments (id, loan_id, date, amount, note, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, payment.ID, payment.LoanID, payment.Date, payment.Amount, noteValue, now, now)

	if err == nil {
		payment.CreatedAt = now
		payment.UpdatedAt = now
		// Force WAL checkpoint to ensure data is persisted
		if err := forceCheckpoint(); err != nil {
			return fmt.Errorf("failed to checkpoint database: %w", err)
		}
	}
	return err
}

// DeleteSpecialPayment deletes a special payment
func DeleteSpecialPayment(loanID, paymentID string) error {
	// Verify loan exists
	row := queryRow("SELECT id FROM loans WHERE id = ?", loanID)
	var existingLoanID string
	if err := row.Scan(&existingLoanID); err != nil {
		return fmt.Errorf("loan not found")
	}

	result, err := execQuery("DELETE FROM special_payments WHERE id = ? AND loan_id = ?", paymentID, loanID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("special payment not found")
	}

	return nil
}
