package service

import (
	"encoding/json"
	"math"
	"slices"
	"strconv"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/lib"
	"example.com/gameHoldTheProcessServer/pkg/repository"
)

const (
	// Виды решений
	choiceHint     = "hint"
	choiceContinue = "cont"
	choiceStop     = "stop"
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

	points, err := s.repo.GetAllEvents(input)
	if err != nil {
		return gameServer.Statistics{}, err
	}

	var choiceStats []gameServer.ChoiceStats
	for _, point := range points {
		if !(point.IsUsefulAiSignal || point.IsDeceptiveAiSignal) {
			continue
		}
		choiceStat := gameServer.ChoiceStats{Y: math.Round(float64(point.Y * 100))}
		if point.IsCheck {
			choiceStat.ChoiceType = append(choiceStat.ChoiceType, choiceHint)
		}
		if point.IsStop {
			choiceStat.ChoiceType = append(choiceStat.ChoiceType, choiceStop)
		}
		if !point.IsStop {
			choiceStat.ChoiceType = append(choiceStat.ChoiceType, choiceContinue)
		}
		choiceStats = append(choiceStats, choiceStat)
	}

	var minY float64 = 100
	var maxY float64 = 0
	for _, cs := range choiceStats {
		if cs.Y < float64(minY) {
			minY = cs.Y
		}
		if cs.Y > float64(maxY) {
			maxY = cs.Y
		}
	}

	type pointStat struct {
		Hint float64
		Stop float64
		Cont float64
	}

	chunkSize := 20
	numChunks := len(choiceStats) / chunkSize
	curChunk := 0
	chunks := make([]map[string]pointStat, 0)
	for curChunk < numChunks {
		chunk := make(map[string]pointStat, int(maxY-minY)+1)

		for i := minY; i <= maxY; i++ {
			chunk[strconv.FormatFloat(i, 'f', 0, 64)] = pointStat{}
		}

		for j := 0; j < chunkSize; j++ {
			cs := choiceStats[curChunk*numChunks+j]
			if slices.Contains(cs.ChoiceType, choiceHint) {
				c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
				c.Hint++
				chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
			}
			if slices.Contains(cs.ChoiceType, choiceContinue) {
				c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
				c.Cont++
				chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
			}
			if slices.Contains(cs.ChoiceType, choiceStop) {
				c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
				c.Stop++
				chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
			}
		}
		chunks = append(chunks, chunk)
		curChunk++
	}

	chunk := make(map[string]pointStat, int(maxY-minY)+1)
	for i := minY; i <= maxY; i++ {
		chunk[strconv.FormatFloat(i, 'f', 0, 64)] = pointStat{}
	}
	for _, cs := range choiceStats {
		if slices.Contains(cs.ChoiceType, choiceHint) {
			c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
			c.Hint++
			chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
		}
		if slices.Contains(cs.ChoiceType, choiceContinue) {
			c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
			c.Cont++
			chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
		}
		if slices.Contains(cs.ChoiceType, choiceStop) {
			c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
			c.Stop++
			chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
		}
	}
	chunks = append(chunks, chunk)
	curChunk++

	// if len(choiceStats)%chunkSize != 0 {
	// 	chunk := make(map[string]pointStat, int(maxY-minY)+1)

	// 	for i := minY; i <= maxY; i++ {
	// 		chunk[strconv.FormatFloat(i, 'f', 0, 64)] = pointStat{}
	// 	}

	// 	for j := 0; j < len(choiceStats)%chunkSize; j++ {
	// 		cs := choiceStats[curChunk*numChunks+j]
	// 		if slices.Contains(cs.ChoiceType, choiceHint) {
	// 			c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
	// 			c.Hint++
	// 			chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
	// 		}
	// 		if slices.Contains(cs.ChoiceType, choiceContinue) {
	// 			c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
	// 			c.Cont++
	// 			chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
	// 		}
	// 		if slices.Contains(cs.ChoiceType, choiceStop) {
	// 			c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
	// 			c.Stop++
	// 			chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
	// 		}
	// 	}
	// 	chunks = append(chunks, chunk)
	// 	curChunk++
	// }

	for _, chunk := range chunks {
		for y, absStat := range chunk {
			var sum float64 = float64(absStat.Hint + absStat.Cont + absStat.Stop)
			if sum == 0 {
				continue
			}
			absStat.Hint /= sum
			absStat.Cont /= sum
			absStat.Stop /= sum
			chunk[y] = absStat
		}
	}

	jsonChunks, err := json.Marshal(chunks)
	if err != nil {
		return gameServer.Statistics{}, err
	}

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
		ChoiceStats:              string(jsonChunks),
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
