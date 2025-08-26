package repository

import (
	"fmt"
	"time"

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
	query := fmt.Sprintf("INSERT INTO %s (parameter_set_id, user_id, created_at) VALUES ($1, $2, $3) RETURNING id", chartsTable)

	timeNow := time.Now().UTC().Add(3 * time.Hour)
	row := p.db.QueryRow(query, chart.ParameterSetId, chart.UserId, timeNow)
	if err := row.Scan(&id); err != nil {
		return 0, err
	}

	return id, nil
}

func (p *ChartPostgres) GetOneChart(id int) (gameServer.Chart, error) {
	var chart gameServer.Chart
	query := fmt.Sprintf("SELECT id, parameter_set_id, user_id, created_at FROM %s WHERE id=$1", chartsTable)

	err := p.db.Get(&chart, query, id)
	return chart, err
}

func (p *ChartPostgres) GetChartsCount(input gameServer.GetChartsPageCountInput) (int, error) {
	var chartsCount int
	var query string

	switch input.FilterTag {
	case "chart_id":
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE id=%s", chartsTable, input.FilterValue)
		}
	case "user_login":
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s AS ut JOIN %s AS ct ON ut.user_id=ct.user_id WHERE ut.login LIKE '%%%s%%'", usersTable, chartsTable, input.FilterValue)
		}
	case "user_id":
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE user_id=%s", chartsTable, input.FilterValue)
		}
	default:
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s", chartsTable)
		}
	}

	row := p.db.QueryRow(query)
	if err := row.Scan(&chartsCount); err != nil {
		return 0, err
	}

	return chartsCount, nil
}

func (p *ChartPostgres) GetAllCharts(input gameServer.GetAllChartsInput) ([]gameServer.Chart, error) {
	var charts []gameServer.Chart
	var query string

	switch input.FilterTag {
	case "chart_id":
		{
			query = fmt.Sprintf("SELECT id, created_at, parameter_set_id, user_id FROM %s WHERE id=%s OFFSET %v LIMIT 9", chartsTable, input.FilterValue, (input.CurrentPage-1)*9)
		}
	case "user_login":
		{
			query = fmt.Sprintf("SELECT id, created_at, parameter_set_id, user_id FROM %s AS ut JOIN %s AS ct ON ut.user_id=ct.user_id WHERE ut.login LIKE '%%%s%%' OFFSET %v LIMIT 9", usersTable, chartsTable, input.FilterValue, (input.CurrentPage-1)*9)
		}
	case "user_id":
		{
			query = fmt.Sprintf("SELECT id, created_at, parameter_set_id, user_id FROM %s WHERE user_id=%s OFFSET %v LIMIT 9", chartsTable, input.FilterValue, (input.CurrentPage-1)*9)
		}
	default:
		{
			query = fmt.Sprintf("SELECT id, created_at, parameter_set_id, user_id FROM %s OFFSET %v LIMIT 9", chartsTable, (input.CurrentPage-1)*9)
		}
	}

	err := p.db.Select(&charts, query)

	return charts, err
}

func (p *ChartPostgres) DeleteChart(id int) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=$1", chartsTable)
	_, err := p.db.Exec(query, id)

	return err
}

func (p *ChartPostgres) GetAllParSets(input gameServer.GetAllParSetsInput) ([]gameServer.ParameterSet, error) {
	var parSets []gameServer.ParameterSet
	query := fmt.Sprintf("SELECT id, gain_coef, time_const, noise_coef, false_warning_prob, missing_danger_prob, created_at FROM %s OFFSET %v LIMIT 9", parameterSetsTable, (input.CurrentPage-1)*9)

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
