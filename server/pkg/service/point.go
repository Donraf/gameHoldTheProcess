package service

import (
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

func (s *PointService) CreatePoints(points []gameServer.Point) error {
	return s.repo.CreatePoints(points)
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
