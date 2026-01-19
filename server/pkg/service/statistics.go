package service

import (
	"encoding/json"
	"fmt"
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

	jsonChoiceStatsAnikin, err := computeChoiceStatsAnikin(points)
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
		ChoiceStats:              jsonChoiceStatsAnikin,
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

func computeChoiceStatsAnikin(points []gameServer.Point) (jsonChoiceStats string, err error) {
	var pointsWithChoices []gameServer.ChoiceStats
	for _, point := range points {
		if !(point.IsUsefulAiSignal || point.IsDeceptiveAiSignal) {
			continue
		}
		pointWithChoices := gameServer.ChoiceStats{Y: math.Round(float64(point.Y * 100))}
		if point.IsCheck {
			pointWithChoices.ChoiceType = append(pointWithChoices.ChoiceType, choiceHint)
		}
		if point.IsStop {
			pointWithChoices.ChoiceType = append(pointWithChoices.ChoiceType, choiceStop)
		}
		if !point.IsStop {
			pointWithChoices.ChoiceType = append(pointWithChoices.ChoiceType, choiceContinue)
		}
		pointsWithChoices = append(pointsWithChoices, pointWithChoices)
	}

	var minY float64 = 100
	var maxY float64 = 0
	for _, cs := range pointsWithChoices {
		if cs.Y < float64(minY) {
			minY = cs.Y
		}
		if cs.Y > float64(maxY) {
			maxY = cs.Y
		}
	}

	type pointStat struct {
		HintRel float64
		StopRel float64
		ContRel float64
		HintAbs int
		StopAbs int
		ContAbs int
	}

	chunkSize := 1
	if len(pointsWithChoices) <= 60 && len(pointsWithChoices) > 0 {
		chunkSize = len(pointsWithChoices) / 2
	} else if len(pointsWithChoices) > 0 {
		chunkSize = len(pointsWithChoices) / 3
	}
	numOfChunks := len(pointsWithChoices) / chunkSize
	curChunkNum := 0

	type chunkWithTitle struct {
		Title           string
		ChunkChoiceStat map[string]pointStat
	}

	chunks := make([]chunkWithTitle, 0)

	// {
	// 	Title: "",
	// 	ChunkChoiceStat: make([]map[string]pointStat, 0),
	// }

	for curChunkNum < numOfChunks {
		chunk := make(map[string]pointStat, int(maxY-minY)+1)

		for i := minY; i <= maxY; i++ {
			chunk[strconv.FormatFloat(i, 'f', 0, 64)] = pointStat{}
		}

		for j := 0; j < chunkSize; j++ {
			cs := pointsWithChoices[curChunkNum*chunkSize+j]
			if slices.Contains(cs.ChoiceType, choiceHint) {
				c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
				c.HintAbs++
				chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
			}
			if slices.Contains(cs.ChoiceType, choiceContinue) {
				c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
				c.ContAbs++
				chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
			}
			if slices.Contains(cs.ChoiceType, choiceStop) {
				c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
				c.StopAbs++
				chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
			}
		}
		title := fmt.Sprintf("Точки принятия решений %v-%v", curChunkNum*chunkSize+1, (curChunkNum+1)*chunkSize)
		chunks = append(chunks, chunkWithTitle{Title: title, ChunkChoiceStat: chunk})
		curChunkNum++
	}

	chunk := make(map[string]pointStat, int(maxY-minY)+1)
	for i := minY; i <= maxY; i++ {
		chunk[strconv.FormatFloat(i, 'f', 0, 64)] = pointStat{}
	}
	for _, cs := range pointsWithChoices {
		if slices.Contains(cs.ChoiceType, choiceHint) {
			c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
			c.HintAbs++
			chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
		}
		if slices.Contains(cs.ChoiceType, choiceContinue) {
			c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
			c.ContAbs++
			chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
		}
		if slices.Contains(cs.ChoiceType, choiceStop) {
			c := chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)]
			c.StopAbs++
			chunk[strconv.FormatFloat(cs.Y, 'f', 0, 64)] = c
		}
	}
	title := fmt.Sprintf("Все точки принятия решений %v-%v", 1, len(pointsWithChoices))
	chunks = append(chunks, chunkWithTitle{Title: title, ChunkChoiceStat: chunk})
	curChunkNum++

	for _, chunk := range chunks {
		for y, absStat := range chunk.ChunkChoiceStat {
			var sum float64 = float64(absStat.ContAbs + absStat.StopAbs)
			if sum == 0 {
				continue
			}
			absStat.HintRel = float64(absStat.HintAbs) / sum
			absStat.ContRel = float64(absStat.ContAbs) / sum
			absStat.StopRel = float64(absStat.StopAbs) / sum
			chunk.ChunkChoiceStat[y] = absStat
		}
	}

	jsonChunks, err := json.Marshal(chunks)
	if err != nil {
		return "", err
	}

	return string(jsonChunks), nil
}
