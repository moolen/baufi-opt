package db

// SQL schema definitions for loans and special payments tables
const (
	createLoansTable = `
	CREATE TABLE IF NOT EXISTS loans (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		amount REAL NOT NULL,
		interest_rate REAL NOT NULL,
		start_date TEXT NOT NULL,
		fixed_interest_years INTEGER NOT NULL,
		repayment_type TEXT NOT NULL,
		repayment_value REAL NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`

	createSpecialPaymentsTable = `
	CREATE TABLE IF NOT EXISTS special_payments (
		id TEXT PRIMARY KEY,
		loan_id TEXT NOT NULL,
		date TEXT NOT NULL,
		amount REAL NOT NULL,
		note TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
	);
	`

	createSpecialPaymentsIndex = `
	CREATE INDEX IF NOT EXISTS idx_special_payments_loan_id ON special_payments(loan_id);
	`
)

// initTables creates all necessary tables and indexes
func initTables() error {
	statements := []string{
		createLoansTable,
		createSpecialPaymentsTable,
		createSpecialPaymentsIndex,
	}

	for _, stmt := range statements {
		if _, err := DB.Exec(stmt); err != nil {
			return err
		}
	}

	// Enable foreign key constraints
	if _, err := DB.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		return err
	}

	return nil
}
