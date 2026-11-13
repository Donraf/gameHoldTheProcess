package repository

import (
	"fmt"
	"strings"

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
	query := fmt.Sprintf("INSERT INTO %s (x, y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, created_at, chart_id, check_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id", pointsTable)

	timeNow := gameServer.Now()
	row := p.db.QueryRow(query, input.X, input.Y, input.Score, input.IsCrash,
		input.IsUsefulAiSignal, input.IsDeceptiveAiSignal, input.IsStop, input.IsPause,
		input.IsCheck, timeNow, input.ChartId, input.CheckInfo)
	if err := row.Scan(&id); err != nil {
		return 0, err
	}

	return id, nil
}

// pointsPerBatch ограничивает размер одного INSERT: у Postgres лимит
// 65535 параметров на запрос, у нас 12 параметров на точку.
const pointsPerBatch = 5000

// CreatePoints вставляет пачку точек multi-row INSERT'ами в одной транзакции:
// одна игра — тысячи точек, по одной вставке на точку это тысячи
// round-trip'ов к БД.
func (p *PointPostgres) CreatePoints(points []gameServer.Point) error {
	if len(points) == 0 {
		return nil
	}

	timeNow := gameServer.Now()

	tx, err := p.db.Begin()
	if err != nil {
		return err
	}

	for start := 0; start < len(points); start += pointsPerBatch {
		end := start + pointsPerBatch
		if end > len(points) {
			end = len(points)
		}
		chunk := points[start:end]

		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("INSERT INTO %s (x, y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, created_at, chart_id, check_info) VALUES ", pointsTable))

		args := make([]any, 0, len(chunk)*12)
		for i, pt := range chunk {
			if i > 0 {
				sb.WriteString(", ")
			}
			base := i*12 + 1
			sb.WriteString(fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d)",
				base, base+1, base+2, base+3, base+4, base+5, base+6, base+7, base+8, base+9, base+10, base+11))
			args = append(args, pt.X, pt.Y, pt.Score, pt.IsCrash,
				pt.IsUsefulAiSignal, pt.IsDeceptiveAiSignal, pt.IsStop, pt.IsPause,
				pt.IsCheck, timeNow, pt.ChartId, pt.CheckInfo)
		}

		if _, err := tx.Exec(sb.String(), args...); err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}

func (p *PointPostgres) GetOnePoint(id int) (gameServer.Point, error) {
	var point gameServer.Point
	query := fmt.Sprintf("SELECT id, x, y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, created_at, chart_id, check_info FROM %s WHERE id=$1", pointsTable)

	err := p.db.Get(&point, query, id)
	return point, err
}

func (p *PointPostgres) GetAllPointsById(id int) ([]gameServer.Point, error) {
	var points []gameServer.Point
	query := fmt.Sprintf("SELECT id, x, y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, created_at, chart_id, check_info FROM %s WHERE chart_id=$1 ORDER BY x", pointsTable)
	err := p.db.Select(&points, query, id)

	return points, err
}

func (p *PointPostgres) DeletePoint(id int) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=$1", pointsTable)
	_, err := p.db.Exec(query, id)

	return err
}
