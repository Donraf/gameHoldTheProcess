package service

import (
	"math"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/repository"
)

type ChartService struct {
	repo repository.Chart
}

func NewChartService(repo repository.Chart) *ChartService {
	return &ChartService{repo: repo}
}

func (s *ChartService) CreateChart(chart gameServer.CreateChartInput) (int, error) {
	return s.repo.CreateChart(chart)
}

func (s *ChartService) GetOneChart(id int) (gameServer.Chart, error) {
	return s.repo.GetOneChart(id)
}

func (s *ChartService) GetChartsPageCount(input gameServer.GetChartsPageCountInput) (int, error) {
	chartsCount, err := s.repo.GetChartsCount(input)
	if err != nil {
		return 0, nil
	}

	pageCount := int(math.Ceil(float64(chartsCount) / defaultPageLimit))
	return pageCount, nil
}

func (s *ChartService) GetChartsCount(input gameServer.GetChartsCountInput) (int, error) {
	chartsCount, err := s.repo.GetChartsCount(gameServer.GetChartsPageCountInput{
		FilterTag:   input.FilterTag,
		FilterValue: input.FilterValue,
	})
	if err != nil {
		return 0, nil
	}

	return chartsCount, nil
}

func (s *ChartService) GetAllCharts(input gameServer.GetAllChartsInput) ([]gameServer.Chart, error) {
	return s.repo.GetAllCharts(input)
}

func (s *ChartService) DeleteChart(id int) error {
	return s.repo.DeleteChart(id)
}

func (s *ChartService) GetAllParSets(input gameServer.GetAllParSetsInput) ([]gameServer.ParameterSet, error) {
	return s.repo.GetAllParSets(input)
}

func (s *ChartService) GetParSetsPageCount() (int, error) {
	parSetsCount, err := s.repo.GetParSetsCount()
	if err != nil {
		return 0, nil
	}

	pageCount := int(math.Ceil(float64(parSetsCount) / defaultPageLimit))
	return pageCount, nil
}
