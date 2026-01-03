package db

import (
	"database/sql"
	"log"
	"os"
	"sync"

	_ "github.com/mattn/go-sqlite3"
)

var (
	DB    *sql.DB
	dbMu  sync.Mutex
	logDB = os.Getenv("LOG_DB_QUERIES") == "true"
)

// InitDB initializes the SQLite database connection pool
func InitDB(dbPath string) error {
	dbMu.Lock()
	defer dbMu.Unlock()

	if DB != nil {
		return nil // Already initialized
	}

	// Open database connection
	sqldb, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}

	// Test the connection
	if err := sqldb.Ping(); err != nil {
		return err
	}

	// Configure connection pool
	sqldb.SetMaxOpenConns(25)
	sqldb.SetMaxIdleConns(5)

	DB = sqldb
	log.Printf("Database initialized: %s", dbPath)

	// Initialize tables
	if err := initTables(); err != nil {
		DB.Close()
		DB = nil
		return err
	}

	log.Println("Database tables initialized")
	return nil
}

// Close closes the database connection
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

// execQuery logs and executes a query
func execQuery(query string, args ...interface{}) (sql.Result, error) {
	if logDB {
		log.Printf("QUERY: %s | ARGS: %v", query, args)
	}
	return DB.Exec(query, args...)
}

// queryRow logs and executes a single row query
func queryRow(query string, args ...interface{}) *sql.Row {
	if logDB {
		log.Printf("QUERY: %s | ARGS: %v", query, args)
	}
	return DB.QueryRow(query, args...)
}

// queryRows logs and executes a rows query
func queryRows(query string, args ...interface{}) (*sql.Rows, error) {
	if logDB {
		log.Printf("QUERY: %s | ARGS: %v", query, args)
	}
	return DB.Query(query, args...)
}
