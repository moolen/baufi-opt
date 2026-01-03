package models

import (
	"regexp"
)

// ValidationError represents a validation error
type ValidationError string

func (e ValidationError) Error() string {
	return string(e)
}

// IsValidationError checks if an error is a ValidationError
func IsValidationError(err error) bool {
	_, ok := err.(ValidationError)
	return ok
}

// dateRegex matches YYYY-MM-DD format
var dateRegex = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

// isValidDate validates a date string in YYYY-MM-DD format
func isValidDate(date string) bool {
	return dateRegex.MatchString(date)
}
