package repository

import (
	"fmt"

	"github.com/jmoiron/sqlx"
)

type Config struct {
	Host     string
	Port     string
	Username string
	Password string
	DBName   string
	SSLMode  string
}

const (
	chartsTable            = "charts"
	parameterSetsTable     = "parameter_sets"
	pointsTable            = "points"
	userParameterSetsTable = "user_parameter_sets"
	usersTable             = "users"
	groupsTable            = "groups"
	userGroupsTable        = "user_groups"
	statisticsTable        = "statistics"
	testsTable             = "tests"
	testResultsTable       = "test_results"
	parSetColumns          = "id, a, b, noise_mean, noise_stdev, false_warning_prob, missing_danger_prob, scoring_config, hint_cost, false_alarm_threshold, rules_text, created_at"
	parSetAliasedColumns   = "pst.id, pst.a, pst.b, pst.noise_mean, pst.noise_stdev, pst.false_warning_prob, pst.missing_danger_prob, pst.scoring_config, pst.hint_cost, pst.false_alarm_threshold, pst.rules_text, pst.created_at"
)

func NewPostgresDB(cfg Config) (*sqlx.DB, error) {
	db, err := sqlx.Open("postgres", fmt.Sprintf("host=%s port=%s user=%s dbname=%s password=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.Username, cfg.DBName, cfg.Password, cfg.SSLMode))

	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	return db, nil
}
