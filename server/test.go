package gameServer

import (
	"encoding/json"
	"errors"
)

const (
	TestTypeLikert       = "likert"
	TestTypeSingleChoice = "single_choice"
	TestTypeText         = "text"
)

type Test struct {
	Id          int             `json:"id" db:"id"`
	Slug        string          `json:"slug" db:"slug"`
	Title       string          `json:"title" db:"title"`
	Description string          `json:"description" db:"description"`
	Config      json.RawMessage `json:"config" db:"config"`
	IsActive    bool            `json:"is_active" db:"is_active"`
	SortOrder   int             `json:"sort_order" db:"sort_order"`
	CreatedAt   string          `json:"created_at" db:"created_at"`
	UpdatedAt   string          `json:"updated_at" db:"updated_at"`
}

type TestWithStatus struct {
	Test
	Completed bool `json:"completed"`
}

type TestResult struct {
	Id          int             `json:"id" db:"id"`
	UserId      int             `json:"user_id" db:"user_id"`
	TestId      int             `json:"test_id" db:"test_id"`
	Answers     json.RawMessage `json:"answers" db:"answers"`
	Score       *float64        `json:"score,omitempty" db:"score"`
	CompletedAt string          `json:"completed_at" db:"completed_at"`
}

type TestResultWithTest struct {
	TestResult
	Slug        string          `json:"slug" db:"slug"`
	Title       string          `json:"title" db:"title"`
	Description string          `json:"description" db:"description"`
	Config      json.RawMessage `json:"config" db:"config"`
}

type TestSessionStatus struct {
	HasActiveTests bool             `json:"has_active_tests"`
	AllCompleted   bool             `json:"all_completed"`
	PendingTests   []TestWithStatus `json:"pending_tests"`
	ActiveTests    []TestWithStatus `json:"active_tests"`
}

type SubmitTestResultInput struct {
	TestId  int             `json:"test_id" binding:"required"`
	Answers json.RawMessage `json:"answers" binding:"required"`
}

func (i *SubmitTestResultInput) Validate() error {
	if i.TestId <= 0 {
		return errors.New("test id is non-positive")
	}
	if len(i.Answers) == 0 {
		return errors.New("answers are empty")
	}
	if !json.Valid(i.Answers) {
		return errors.New("answers must be valid json")
	}
	return nil
}

type CreateTestInput struct {
	Slug        string          `json:"slug" binding:"required"`
	Title       string          `json:"title" binding:"required"`
	Description string          `json:"description"`
	Config      json.RawMessage `json:"config" binding:"required"`
	IsActive    bool            `json:"is_active"`
	SortOrder   int             `json:"sort_order"`
}

func (i *CreateTestInput) Validate() error {
	if len(i.Config) == 0 || !json.Valid(i.Config) {
		return errors.New("config must be valid json")
	}
	return nil
}

type UpdateTestInput struct {
	Slug        *string          `json:"slug"`
	Title       *string          `json:"title"`
	Description *string          `json:"description"`
	Config      *json.RawMessage `json:"config"`
	IsActive    *bool            `json:"is_active"`
	SortOrder   *int             `json:"sort_order"`
}

func (i *UpdateTestInput) Validate() error {
	if i.Slug == nil &&
		i.Title == nil &&
		i.Description == nil &&
		i.Config == nil &&
		i.IsActive == nil &&
		i.SortOrder == nil {
		return errors.New("no values to update")
	}
	if i.Config != nil && !json.Valid(*i.Config) {
		return errors.New("config must be valid json")
	}
	return nil
}
