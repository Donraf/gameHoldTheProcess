package service

import (
	"fmt"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/repository"
)

type PointService struct {
	repo repository.Point
}

func NewPointService(repo repository.Point) *PointService {
	return &PointService{repo: repo}
}

func (s *PointService) CreatePoint(input gameServer.Point) (int, error) {
	return s.repo.CreatePoint(input)
}

func (s *PointService) GetOnePoint(id int) (gameServer.Point, error) {
	return s.repo.GetOnePoint(id)
}

func (s *PointService) GetAllPointsById(id int) ([]gameServer.Point, error) {
	return s.repo.GetAllPointsById(id)
}

func (s *PointService) DeletePoint(id int) error {
	return s.repo.DeletePoint(id)
}

func (s *PointService) GetCsvOfPoints() (string, error) {
	points, err := s.repo.GetAllPointsForCSV()
	if err != nil {
		return "", err
	}
	csv := "parameter_set_id, user_id, chart_id, point_id, x, y, score, is_end, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check\r\n"
	for _, p := range points {
		csv += fmt.Sprintf("%v, %v, %v, %v, %v, %v, %v, %v, %v, %v, %v, %v, %v, %v\r\n", p.ParameterSetId, p.UserId, p.ChartId, p.Id, p.X, p.Y, p.Score, p.IsEnd,
			p.IsCrash, p.IsUsefulAiSignal, p.IsDeceptiveAiSignal, p.IsStop, p.IsPause, p.IsCheck)
	}
	return csv, nil
}
