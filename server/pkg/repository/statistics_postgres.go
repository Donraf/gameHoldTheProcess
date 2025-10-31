package repository

import (
	"fmt"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/jmoiron/sqlx"
)

type StatisticsPostgres struct {
	db *sqlx.DB
}

func NewStatisticsPostgres(db *sqlx.DB) *StatisticsPostgres {
	return &StatisticsPostgres{db: db}
}

func (p *StatisticsPostgres) CountGames(input gameServer.ComputeStatisticsInput) (int, error) {
	var gamesCount int

	query := fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE user_id = $1 AND parameter_set_id = $2 AND NOT is_training`, chartsTable)

	row := p.db.QueryRow(query, input.UserId, input.ParSetId)
	if err := row.Scan(&gamesCount); err != nil {
		return 0, err
	}

	return gamesCount, nil
}

func (p *StatisticsPostgres) CountStops(input gameServer.ComputeStatisticsInput) (int, error) {
	var stopsCount int

	query := fmt.Sprintf(`
				SELECT COUNT(*)
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_stop
			`, pointsTable, chartsTable)

	row := p.db.QueryRow(query, input.UserId, input.ParSetId)
	if err := row.Scan(&stopsCount); err != nil {
		return 0, err
	}

	return stopsCount, nil
}

func (p *StatisticsPostgres) CountCrashes(input gameServer.ComputeStatisticsInput) (int, error) {
	var crashesCount int

	query := fmt.Sprintf(`
				SELECT COUNT(*)
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_crash
			`, pointsTable, chartsTable)

	row := p.db.QueryRow(query, input.UserId, input.ParSetId)
	if err := row.Scan(&crashesCount); err != nil {
		return 0, err
	}

	return crashesCount, nil
}

func (p *StatisticsPostgres) GetYStopsOnSignal(input gameServer.ComputeStatisticsInput) ([]float64, error) {
	ySl := make([]float64, 0)

	query := fmt.Sprintf(`
				SELECT y
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_stop AND (is_useful_ai_signal OR is_deceptive_ai_signal)
			`, pointsTable, chartsTable)

	err := p.db.Select(&ySl, query, input.UserId, input.ParSetId)

	return ySl, err
}

func (p *StatisticsPostgres) GetYStopsWithoutSignal(input gameServer.ComputeStatisticsInput) ([]float64, error) {
	ySl := make([]float64, 0)

	query := fmt.Sprintf(`
				SELECT y
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_stop AND NOT (is_useful_ai_signal OR is_deceptive_ai_signal)
			`, pointsTable, chartsTable)

	err := p.db.Select(&ySl, query, input.UserId, input.ParSetId)

	return ySl, err
}

func (p *StatisticsPostgres) GetYHintsOnSignal(input gameServer.ComputeStatisticsInput) ([]float64, error) {
	ySl := make([]float64, 0)

	query := fmt.Sprintf(`
				SELECT y
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_check AND (is_useful_ai_signal OR is_deceptive_ai_signal)
			`, pointsTable, chartsTable)

	err := p.db.Select(&ySl, query, input.UserId, input.ParSetId)

	return ySl, err
}

func (p *StatisticsPostgres) GetYHintsWithoutSignal(input gameServer.ComputeStatisticsInput) ([]float64, error) {
	ySl := make([]float64, 0)

	query := fmt.Sprintf(`
				SELECT y
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_check AND NOT (is_useful_ai_signal OR is_deceptive_ai_signal)
			`, pointsTable, chartsTable)

	err := p.db.Select(&ySl, query, input.UserId, input.ParSetId)

	return ySl, err
}

func (p *StatisticsPostgres) GetYContinuesAfterSignal(input gameServer.ComputeStatisticsInput) ([]float64, error) {
	ySl := make([]float64, 0)

	query := fmt.Sprintf(`
				SELECT y
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND NOT is_stop AND (is_useful_ai_signal OR is_deceptive_ai_signal)
			`, pointsTable, chartsTable)

	err := p.db.Select(&ySl, query, input.UserId, input.ParSetId)

	return ySl, err
}

func (p *StatisticsPostgres) UpsertStatistics(input gameServer.ComputeStatisticsInput, s gameServer.Statistics) error {
	query := fmt.Sprintf(`INSERT INTO %s (user_id, parameter_set_id, games_num, stops_num, crashes_num, mean_stop_on_signal, stdev_stop_on_signal,
	                     mean_stop_without_signal, stdev_stop_without_signal, mean_hint_on_signal, stdev_hint_on_signal,
						 mean_hint_without_signal, stdev_hint_without_signal, mean_continue_after_signal, stdev_continue_after_signal,
						 stop_on_signal_num, stop_without_signal_num, hint_on_signal_num, hint_without_signal_num, continue_after_signal_num,
						 total_score)
	                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
						ON CONFLICT (user_id, parameter_set_id) DO UPDATE SET
						games_num = $3, stops_num = $4, crashes_num = $5, mean_stop_on_signal = $6, stdev_stop_on_signal = $7, mean_stop_without_signal = $8,
						stdev_stop_without_signal = $9, mean_hint_on_signal = $10, stdev_hint_on_signal = $11, mean_hint_without_signal = $12,
						stdev_hint_without_signal = $13, mean_continue_after_signal = $14, stdev_continue_after_signal = $15,
						stop_on_signal_num = $16, stop_without_signal_num = $17, hint_on_signal_num = $18,
						hint_without_signal_num = $19, continue_after_signal_num = $20, total_score = $21
						`, statisticsTable)

	_, err := p.db.Exec(query, input.UserId, input.ParSetId, s.GamesNum, s.StopsNum, s.CrashesNum, s.MeanStopOnSignal, s.StdevStopOnSignal,
		s.MeanStopWithoutSignal, s.StdevStopWithoutSignal, s.MeanHintOnSignal, s.StdevHintOnSignal,
		s.MeanHintWithoutSignal, s.StdevHintWithoutSignal, s.MeanContinueAfterSignal, s.StdevContinueAfterSignal,
		s.StopOnSignalNum, s.StopWithoutSignalNum, s.HintOnSignalNum, s.HintWithoutSignalNum, s.ContinueAfterSignalNum,
		s.TotalScore)

	return err
}

func (p *StatisticsPostgres) GetStatistics(userId, parSetId int) (gameServer.Statistics, error) {
	var stats gameServer.Statistics
	query := fmt.Sprintf(`SELECT games_num, stops_num, crashes_num, mean_stop_on_signal, stdev_stop_on_signal,
	                     mean_stop_without_signal, stdev_stop_without_signal, mean_hint_on_signal, stdev_hint_on_signal,
						 mean_hint_without_signal, stdev_hint_without_signal, mean_continue_after_signal, stdev_continue_after_signal,
						 stop_on_signal_num, stop_without_signal_num, hint_on_signal_num, hint_without_signal_num, continue_after_signal_num,
						 total_score
						 FROM %s WHERE user_id=$1 AND parameter_set_id=$2`, statisticsTable)

	err := p.db.Get(&stats, query, userId, parSetId)

	return stats, err
}

func (p *StatisticsPostgres) GetTotalScore(input gameServer.ComputeStatisticsInput) (int, error) {
	var totalScore int

	query := fmt.Sprintf(`SELECT score FROM %s WHERE user_id = $1 AND parameter_set_id = $2`, userParameterSetsTable)

	row := p.db.QueryRow(query, input.UserId, input.ParSetId)
	if err := row.Scan(&totalScore); err != nil {
		return 0, err
	}

	return totalScore, nil
}
