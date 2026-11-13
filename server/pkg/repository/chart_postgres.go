package repository

import (
	"database/sql"
	"fmt"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/jmoiron/sqlx"
)

type ChartPostgres struct {
	db *sqlx.DB
}

func NewChartPostgres(db *sqlx.DB) *ChartPostgres {
	return &ChartPostgres{db: db}
}

func (p *ChartPostgres) CreateChart(chart gameServer.CreateChartInput) (int, error) {
	var id int
	query := fmt.Sprintf("INSERT INTO %s (parameter_set_id, user_id, is_training, created_at) VALUES ($1, $2, $3, $4) RETURNING id", chartsTable)

	timeNow := gameServer.Now()
	row := p.db.QueryRow(query, chart.ParameterSetId, chart.UserId, chart.IsTraining, timeNow)
	if err := row.Scan(&id); err != nil {
		return 0, err
	}

	return id, nil
}

func (p *ChartPostgres) GetOneChart(id int) (gameServer.Chart, error) {
	var chart gameServer.Chart
	query := fmt.Sprintf("SELECT id, parameter_set_id, user_id, is_training, created_at FROM %s WHERE id=$1", chartsTable)

	err := p.db.Get(&chart, query, id)
	return chart, err
}

func (p *ChartPostgres) GetChartsCount(input gameServer.GetChartsPageCountInput) (int, error) {
	var chartsCount int
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s AS ct JOIN %s AS ut ON ut.user_id=ct.user_id", chartsTable, usersTable)
	var args []any

	switch input.FilterTag {
	case "chart_id":
		query += " WHERE ct.id=$1"
		args = []any{input.FilterValue}
	case "user_login":
		query += " WHERE ut.login LIKE $1"
		args = []any{likePattern(input.FilterValue)}
	case "user_name":
		query += " WHERE ut.name LIKE $1"
		args = []any{likePattern(input.FilterValue)}
	case "user_id":
		query += " WHERE ct.user_id=$1"
		args = []any{input.FilterValue}
	}

	row := p.db.QueryRow(query, args...)
	if err := row.Scan(&chartsCount); err != nil {
		return 0, err
	}

	return chartsCount, nil
}

func (p *ChartPostgres) GetAllCharts(input gameServer.GetAllChartsInput) ([]gameServer.Chart, error) {
	var charts []gameServer.Chart
	query := fmt.Sprintf(
		"SELECT ct.id, ct.created_at, ct.parameter_set_id, ct.user_id, ct.is_training, ut.login AS user_login, ut.name AS user_name, COALESCE(pst.name, '') AS par_set_name FROM %s AS ct JOIN %s AS ut ON ut.user_id=ct.user_id LEFT JOIN %s AS pst ON pst.id=ct.parameter_set_id",
		chartsTable,
		usersTable,
		parameterSetsTable,
	)
	var args []any

	switch input.FilterTag {
	case "chart_id":
		query += " WHERE ct.id=$1"
		args = []any{input.FilterValue}
	case "user_login":
		query += " WHERE ut.login LIKE $1"
		args = []any{likePattern(input.FilterValue)}
	case "user_name":
		query += " WHERE ut.name LIKE $1"
		args = []any{likePattern(input.FilterValue)}
	case "user_id":
		query += " WHERE ct.user_id=$1"
		args = []any{input.FilterValue}
	}

	order := "ASC"
	if input.SortDesc {
		order = "DESC"
	}
	query += fmt.Sprintf(" ORDER BY ct.id %s OFFSET %v LIMIT %v", order, (input.CurrentPage-1)*gameServer.DefaultPageLimit, gameServer.DefaultPageLimit)

	err := p.db.Select(&charts, query, args...)

	return charts, err
}

func (p *ChartPostgres) DeleteChart(id int) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=$1", chartsTable)
	_, err := p.db.Exec(query, id)

	return err
}

func (p *ChartPostgres) GetAllParSets(input gameServer.GetAllParSetsInput) ([]gameServer.ParameterSet, error) {
	var parSets []gameServer.ParameterSet
	query := ""
	switch input.CurrentPage {
	case -1:
		query = fmt.Sprintf("SELECT %s FROM %s", parSetColumns, parameterSetsTable)
	default:
		query = fmt.Sprintf("SELECT %s FROM %s OFFSET %v LIMIT %v", parSetColumns, parameterSetsTable, (input.CurrentPage-1)*gameServer.DefaultPageLimit, gameServer.DefaultPageLimit)
	}

	err := p.db.Select(&parSets, query)

	return parSets, err
}

func (p *ChartPostgres) GetParSetsCount() (int, error) {
	var parSetsCount int
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", parameterSetsTable)

	row := p.db.QueryRow(query)
	if err := row.Scan(&parSetsCount); err != nil {
		return 0, err
	}

	return parSetsCount, nil
}

func (p *ChartPostgres) CreateParSet(input gameServer.CreateParSetInput) (int, error) {
	var id int
	query := fmt.Sprintf(
		"INSERT INTO %s (name, a, b, noise_mean, noise_stdev, false_warning_prob, missing_danger_prob, scoring_config, hint_cost, false_alarm_threshold, rules_text, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id",
		parameterSetsTable,
	)

	timeNow := gameServer.Now()
	row := p.db.QueryRow(
		query,
		input.Name,
		input.A,
		input.B,
		input.NoiseMean,
		input.NoiseStdev,
		input.FalseWarningProb,
		input.MissingDangerProb,
		input.ScoringConfig,
		input.HintCost,
		input.FalseAlarmThreshold,
		input.RulesText,
		timeNow,
	)
	if err := row.Scan(&id); err != nil {
		return 0, err
	}

	return id, nil
}

func (p *ChartPostgres) UpdateParSet(id int, input gameServer.CreateParSetInput) error {
	query := fmt.Sprintf(
		"UPDATE %s SET name=$1, a=$2, b=$3, noise_mean=$4, noise_stdev=$5, false_warning_prob=$6, missing_danger_prob=$7, scoring_config=$8, hint_cost=$9, false_alarm_threshold=$10, rules_text=$11 WHERE id=$12",
		parameterSetsTable,
	)
	res, err := p.db.Exec(
		query,
		input.Name,
		input.A,
		input.B,
		input.NoiseMean,
		input.NoiseStdev,
		input.FalseWarningProb,
		input.MissingDangerProb,
		input.ScoringConfig,
		input.HintCost,
		input.FalseAlarmThreshold,
		input.RulesText,
		id,
	)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (p *ChartPostgres) DeleteParSet(id int) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=$1", parameterSetsTable)
	_, err := p.db.Exec(query, id)
	if err != nil && isForeignKeyViolation(err) {
		return gameServer.ErrParSetInUse
	}
	return err
}
