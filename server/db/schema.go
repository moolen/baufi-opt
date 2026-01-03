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
	// Configure SQLite for proper persistence and concurrency
	pragmas := []string{
		"PRAGMA journal_mode = WAL;",           // Write-Ahead Logging for better concurrency
		"PRAGMA synchronous = FULL;",            // Ensure writes are synced to disk
		"PRAGMA foreign_keys = ON;",             // Enable foreign key constraints
		"PRAGMA temp_store = MEMORY;",           // Use memory for temporary tables
	}

	for _, pragma := range pragmas {
		if _, err := DB.Exec(pragma); err != nil {
			return err
		}
	}

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

	return nil
}
