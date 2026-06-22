package repository

import (
	"fmt"
	"strings"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/jmoiron/sqlx"
)

type TestPostgres struct {
	db *sqlx.DB
}

func NewTestPostgres(db *sqlx.DB) *TestPostgres {
	return &TestPostgres{db: db}
}

func (t *TestPostgres) GetAllTests() ([]gameServer.Test, error) {
	var tests []gameServer.Test
	query := fmt.Sprintf(
		"SELECT id, slug, title, description, config, is_active, sort_order, created_at, updated_at FROM %s ORDER BY sort_order, id",
		testsTable,
	)
	err := t.db.Select(&tests, query)
	return tests, err
}

func (t *TestPostgres) GetActiveTests() ([]gameServer.Test, error) {
	var tests []gameServer.Test
	query := fmt.Sprintf(
		"SELECT id, slug, title, description, config, is_active, sort_order, created_at, updated_at FROM %s WHERE is_active=true ORDER BY sort_order, id",
		testsTable,
	)
	err := t.db.Select(&tests, query)
	return tests, err
}

func (t *TestPostgres) GetOneTest(id int) (gameServer.Test, error) {
	var test gameServer.Test
	query := fmt.Sprintf(
		"SELECT id, slug, title, description, config, is_active, sort_order, created_at, updated_at FROM %s WHERE id=$1",
		testsTable,
	)
	err := t.db.Get(&test, query, id)
	return test, err
}

func (t *TestPostgres) CreateTest(input gameServer.CreateTestInput) (int, error) {
	var id int
	timeNow := time.Now().UTC().Add(3 * time.Hour)
	query := fmt.Sprintf(
		"INSERT INTO %s (slug, title, description, config, is_active, sort_order, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
		testsTable,
	)
	err := t.db.QueryRow(query, input.Slug, input.Title, input.Description, input.Config, input.IsActive, input.SortOrder, timeNow, timeNow).Scan(&id)
	return id, err
}

func (t *TestPostgres) UpdateTest(id int, input gameServer.UpdateTestInput) error {
	setValues := make([]string, 0)
	args := make([]any, 0)
	argId := 1

	if input.Slug != nil {
		setValues = append(setValues, fmt.Sprintf("slug=$%d", argId))
		args = append(args, *input.Slug)
		argId++
	}
	if input.Title != nil {
		setValues = append(setValues, fmt.Sprintf("title=$%d", argId))
		args = append(args, *input.Title)
		argId++
	}
	if input.Description != nil {
		setValues = append(setValues, fmt.Sprintf("description=$%d", argId))
		args = append(args, *input.Description)
		argId++
	}
	if input.Config != nil {
		setValues = append(setValues, fmt.Sprintf("config=$%d", argId))
		args = append(args, *input.Config)
		argId++
	}
	if input.IsActive != nil {
		setValues = append(setValues, fmt.Sprintf("is_active=$%d", argId))
		args = append(args, *input.IsActive)
		argId++
	}
	if input.SortOrder != nil {
		setValues = append(setValues, fmt.Sprintf("sort_order=$%d", argId))
		args = append(args, *input.SortOrder)
		argId++
	}

	setValues = append(setValues, fmt.Sprintf("updated_at=$%d", argId))
	args = append(args, time.Now().UTC().Add(3*time.Hour))
	argId++

	query := fmt.Sprintf("UPDATE %s SET %s WHERE id=$%d", testsTable, strings.Join(setValues, ", "), argId)
	args = append(args, id)
	_, err := t.db.Exec(query, args...)
	return err
}

func (t *TestPostgres) DeleteTest(id int) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=$1", testsTable)
	_, err := t.db.Exec(query, id)
	return err
}

func (t *TestPostgres) GetCompletedTestIds(userId int) (map[int]bool, error) {
	rows, err := t.db.Queryx(fmt.Sprintf("SELECT test_id FROM %s WHERE user_id=$1", testResultsTable), userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	completed := make(map[int]bool)
	for rows.Next() {
		var testId int
		if err := rows.Scan(&testId); err != nil {
			return nil, err
		}
		completed[testId] = true
	}
	return completed, rows.Err()
}

func (t *TestPostgres) CreateTestResult(userId int, input gameServer.SubmitTestResultInput, score *float64) (int, error) {
	var id int
	timeNow := time.Now().UTC().Add(3 * time.Hour)
	query := fmt.Sprintf(
		`INSERT INTO %s (user_id, test_id, answers, score, completed_at) VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (user_id, test_id) DO UPDATE SET answers=EXCLUDED.answers, score=EXCLUDED.score, completed_at=EXCLUDED.completed_at
		 RETURNING id`,
		testResultsTable,
	)
	err := t.db.QueryRow(query, userId, input.TestId, input.Answers, score, timeNow).Scan(&id)
	return id, err
}

func (t *TestPostgres) GetUserResults(userId int) ([]gameServer.TestResult, error) {
	var results []gameServer.TestResult
	query := fmt.Sprintf(
		"SELECT id, user_id, test_id, answers, score, completed_at FROM %s WHERE user_id=$1 ORDER BY completed_at",
		testResultsTable,
	)
	err := t.db.Select(&results, query, userId)
	return results, err
}

func (t *TestPostgres) GetUserResultsWithTests(userId int) ([]gameServer.TestResultWithTest, error) {
	var results []gameServer.TestResultWithTest
	query := fmt.Sprintf(
		`SELECT tr.id, tr.user_id, tr.test_id, tr.answers, tr.score, tr.completed_at,
		        t.slug, t.title, t.description, t.config
		 FROM %s tr
		 INNER JOIN %s t ON t.id = tr.test_id
		 WHERE tr.user_id=$1
		 ORDER BY tr.completed_at, tr.id`,
		testResultsTable,
		testsTable,
	)
	err := t.db.Select(&results, query, userId)
	return results, err
}
