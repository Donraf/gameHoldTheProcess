package service

import (
	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/lib"
	"example.com/gameHoldTheProcessServer/pkg/repository"
)

type StatisticsService struct {
	repo repository.Statistics
}

func NewStatisticsService(repo repository.Statistics) *StatisticsService {
	return &StatisticsService{repo: repo}
}

func (s *StatisticsService) ComputeStatistics(input gameServer.ComputeStatisticsInput) (gameServer.Statistics, error) {
	gamesCount, err := s.repo.CountGames(input)
	if err != nil {
		return gameServer.Statistics{}, err
	}

	stopsCount, err := s.repo.CountStops(input)
	if err != nil {
		return gameServer.Statistics{}, err
	}

	crashesCount, err := s.repo.CountCrashes(input)
	if err != nil {
		return gameServer.Statistics{}, err
	}

	stopsOnSignal, err := s.repo.GetYStopsOnSignal(input)
	if err != nil {
		return gameServer.Statistics{}, err
	}
	meanSOS, stdevSOS := lib.MeanAndStdev(stopsOnSignal)

	stopsWithoutSignal, err := s.repo.GetYStopsWithoutSignal(input)
	if err != nil {
		return gameServer.Statistics{}, err
	}
	meanSWS, stdevSWS := lib.MeanAndStdev(stopsWithoutSignal)

	hintsOnSignal, err := s.repo.GetYHintsOnSignal(input)
	if err != nil {
		return gameServer.Statistics{}, err
	}
	meanHOS, stdevHOS := lib.MeanAndStdev(hintsOnSignal)

	hintsWithoutSignal, err := s.repo.GetYHintsWithoutSignal(input)
	if err != nil {
		return gameServer.Statistics{}, err
	}
	meanHWS, stdevHWS := lib.MeanAndStdev(hintsWithoutSignal)

	continuesAfterSignal, err := s.repo.GetYContinuesAfterSignal(input)
	if err != nil {
		return gameServer.Statistics{}, err
	}
	meanCAS, stdevCAS := lib.MeanAndStdev(continuesAfterSignal)

	totalScore, err := s.repo.GetTotalScore(input)

	stats := gameServer.Statistics{
		GamesNum:                 gamesCount,
		StopsNum:                 stopsCount,
		CrashesNum:               crashesCount,
		MeanStopOnSignal:         meanSOS,
		StdevStopOnSignal:        stdevSOS,
		MeanStopWithoutSignal:    meanSWS,
		StdevStopWithoutSignal:   stdevSWS,
		MeanHintOnSignal:         meanHOS,
		StdevHintOnSignal:        stdevHOS,
		MeanHintWithoutSignal:    meanHWS,
		StdevHintWithoutSignal:   stdevHWS,
		MeanContinueAfterSignal:  meanCAS,
		StdevContinueAfterSignal: stdevCAS,
		TotalScore:               totalScore,
		StopOnSignalNum:          len(stopsOnSignal),
		StopWithoutSignalNum:     len(stopsWithoutSignal),
		HintOnSignalNum:          len(hintsOnSignal),
		HintWithoutSignalNum:     len(hintsWithoutSignal),
		ContinueAfterSignalNum:   len(continuesAfterSignal),
	}

	err = s.repo.UpsertStatistics(input, stats)
	if err != nil {
		return gameServer.Statistics{}, err
	}

	return stats, nil
}

func (s *StatisticsService) GetStatistics(userId, parSetId int) (gameServer.Statistics, error) {
	return s.repo.GetStatistics(userId, parSetId)
}
