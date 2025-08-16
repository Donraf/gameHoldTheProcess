package repository

import (
	"fmt"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/jmoiron/sqlx"
)

type PointPostgres struct {
	db *sqlx.DB
}

func NewPointPostgres(db *sqlx.DB) *PointPostgres {
	return &PointPostgres{db: db}
}

func (p *PointPostgres) CreatePoint(input gameServer.Point) (int, error) {
	var id int
	query := fmt.Sprintf("INSERT INTO %s (x, y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, created_at, chart_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id", pointsTable)

	timeNow := time.Now().UTC().Add(3 * time.Hour)
	row := p.db.QueryRow(query, input.X, input.Y, input.Score, input.IsCrash,
		input.IsUsefulAiSignal, input.IsDeceptiveAiSignal, input.IsStop, input.IsPause,
		input.IsCheck, timeNow, input.ChartId)
	if err := row.Scan(&id); err != nil {
		return 0, err
	}

	return id, nil
}

func (p *PointPostgres) GetOnePoint(id int) (gameServer.Point, error) {
	var point gameServer.Point
	query := fmt.Sprintf("SELECT id, x, y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, created_at, chart_id FROM %s WHERE id=$1", pointsTable)

	err := p.db.Get(&point, query, id)
	return point, err
}

func (p *PointPostgres) GetAllPointsById(id int) ([]gameServer.Point, error) {
	var points []gameServer.Point
	query := fmt.Sprintf("SELECT id, x, y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, created_at, chart_id FROM %s WHERE chart_id=$1", pointsTable)
	err := p.db.Select(&points, query, id)

	return points, err
}

func (p *PointPostgres) DeletePoint(id int) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=$1", pointsTable)
	_, err := p.db.Exec(query, id)

	return err
}

func (p *PointPostgres) GetAllPointsForCSV() ([]gameServer.PointForCSV, error) {
	var points []gameServer.PointForCSV
	query := fmt.Sprintf(`SELECT pt.id, pt.x, pt.y, pt.score, pt.is_crash, pt.is_useful_ai_signal, pt.is_deceptive_ai_signal,
	pt.is_stop, pt.is_pause, pt.is_check, pt.chart_id, ct.user_id, ct.parameter_set_id
	FROM %s AS pt JOIN %s AS ct ON pt.chart_id=ct.id ORDER BY ct.parameter_set_id, ct.user_id, pt.chart_id, pt.id`, pointsTable, chartsTable)
	err := p.db.Select(&points, query)

	return points, err
}
